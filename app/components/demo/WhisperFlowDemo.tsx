'use client';

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDemoStore } from "@stores";

const GITHUB_URL = "https://github.com/Odysseus707/WhisperFlow-Local";
const TARGET_SAMPLE_RATE = 16000;
const MAX_AUDIO_SECONDS = 25;
const INTERIM_INTERVAL_MS = 1200;
const BAR_COUNT = 14;

type Phase = 'idle' | 'loading' | 'ready' | 'recording' | 'transcribing' | 'error';
type Device = 'webgpu' | 'wasm';

interface WorkerProgress { status?: string; file?: string; loaded?: number; total?: number }
interface WorkerMessage {
  type: 'progress' | 'ready' | 'result' | 'error';
  payload?: WorkerProgress;
  id?: number;
  final?: boolean;
  text?: string;
  during?: 'load' | 'generate';
  message?: string;
}

const WhisperFlowDemo = () => {
  const setDemoOpen = useDemoStore((state) => state.setDemoOpen);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingRef = useRef(false);
  const interimBusyRef = useRef(false);
  const rafRef = useRef(0);
  const interimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestIdRef = useRef(0);
  const finalIdRef = useRef<number | null>(null);
  const retriedWasmRef = useRef(false);
  const progressFilesRef = useRef(new Map<string, { loaded: number; total: number }>());
  const phaseRef = useRef<Phase>('idle');

  const [phase, setPhaseState] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [device, setDevice] = useState<Device>(
    typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const stopBars = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const bars = barsRef.current;
    if (!bars) return;
    for (const bar of Array.from(bars.children)) {
      (bar as HTMLElement).style.height = '4px';
    }
  }, []);

  const startBars = useCallback(() => {
    const analyser = analyserRef.current;
    const bars = barsRef.current;
    if (!analyser || !bars) return;
    const data = new Uint8Array(analyser.fftSize);
    const loop = () => {
      if (!recordingRef.current) return;
      analyser.getByteTimeDomainData(data);
      const segment = Math.floor(data.length / BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < segment; j++) {
          const v = (data[i * segment + j] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / segment);
        const height = 4 + Math.min(20, rms * 260);
        (bars.children[i] as HTMLElement).style.height = `${height}px`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const mergeAndResample = useCallback(() => {
    const chunks = chunksRef.current;
    const inputRate = audioCtxRef.current?.sampleRate ?? TARGET_SAMPLE_RATE;
    const total = chunks.reduce((n, chunk) => n + chunk.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    if (inputRate === TARGET_SAMPLE_RATE || total === 0) return merged;
    const outLength = Math.floor(total * TARGET_SAMPLE_RATE / inputRate);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const pos = i * inputRate / TARGET_SAMPLE_RATE;
      const i0 = Math.floor(pos);
      const frac = pos - i0;
      out[i] = merged[i0] + (merged[Math.min(i0 + 1, total - 1)] - merged[i0]) * frac;
    }
    return out;
  }, []);

  const insertAtCursor = useCallback((raw: string) => {
    const el = textareaRef.current;
    const text = raw.trim();
    if (!el || !text) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const glue = before && !/\s$/.test(before) ? ' ' : '';
    el.value = before + glue + text + after;
    const cursor = (before + glue + text).length;
    el.selectionStart = el.selectionEnd = cursor;
    el.focus();
  }, []);

  const teardown = useCallback(() => {
    recordingRef.current = false;
    if (interimTimerRef.current) clearInterval(interimTimerRef.current);
    cancelAnimationFrame(rafRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  const close = useCallback(() => {
    teardown();
    gsap.to(panelRef.current, { scale: 0.96, opacity: 0, duration: 0.25, ease: 'power2.in' });
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => setDemoOpen(false),
    });
  }, [teardown, setDemoOpen]);

  const fail = useCallback((message: string) => {
    setError(message);
    setPhase('error');
  }, []);

  const setupAudio = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    source.connect(analyser);

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!recordingRef.current) return;
      chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      const maxChunks = Math.ceil((MAX_AUDIO_SECONDS * ctx.sampleRate) / 4096);
      if (chunksRef.current.length > maxChunks) chunksRef.current.shift();
    };
    source.connect(processor);
    // Keep the processor pulling samples without feeding mic audio back out.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    processor.connect(mute);
    mute.connect(ctx.destination);
  }, []);

  const spawnWorker = useCallback((dev: Device) => {
    const worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        const p = msg.payload;
        if (p?.status === 'progress' && p.file && p.total) {
          progressFilesRef.current.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
          let loaded = 0;
          let total = 0;
          progressFilesRef.current.forEach((f) => { loaded += f.loaded; total += f.total; });
          if (total > 0) setProgress(Math.min(100, Math.round((loaded / total) * 100)));
        }
      } else if (msg.type === 'ready') {
        if (phaseRef.current === 'loading') setPhase('ready');
      } else if (msg.type === 'result') {
        if (msg.final && msg.id === finalIdRef.current) {
          insertAtCursor(msg.text ?? '');
          setCaption('');
          setPhase('ready');
        } else if (!msg.final && recordingRef.current) {
          interimBusyRef.current = false;
          if (msg.text?.trim()) setCaption(msg.text.trim());
        } else {
          interimBusyRef.current = false;
        }
      } else if (msg.type === 'error') {
        if (msg.during === 'load') {
          if (dev === 'webgpu' && !retriedWasmRef.current) {
            // WebGPU init can fail on some GPUs/drivers — fall back to WASM once.
            retriedWasmRef.current = true;
            worker.terminate();
            progressFilesRef.current.clear();
            setProgress(0);
            setDevice('wasm');
            spawnWorker('wasm');
          } else {
            fail(`Couldn't load the speech model (${msg.message ?? 'unknown error'}). Your browser may not support it — the native macOS app always will.`);
          }
        } else if (msg.final) {
          setCaption('');
          setPhase('ready');
        } else {
          interimBusyRef.current = false;
        }
      }
    };

    worker.onerror = () => {
      fail("The transcription engine crashed. Try reloading the page — or grab the native macOS app below.");
    };

    worker.postMessage({ type: 'load', device: dev });
  }, [fail, insertAtCursor]);

  const loadDemo = useCallback(async () => {
    setPhase('loading');
    try {
      const micPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      spawnWorker(device);
      const stream = await micPromise;
      streamRef.current = stream;
      setupAudio(stream);
    } catch (err) {
      const denied = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      fail(denied
        ? 'Microphone access was denied. The demo dictates with your voice, so it needs the mic — audio still never leaves this page.'
        : `Couldn't open the microphone (${err instanceof Error ? err.message : String(err)}).`);
    }
  }, [device, spawnWorker, setupAudio, fail]);

  const startRecording = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    chunksRef.current = [];
    setCaption('');
    audioCtxRef.current?.resume().catch(() => {});
    recordingRef.current = true;
    setPhase('recording');
    startBars();
    interimTimerRef.current = setInterval(() => {
      if (interimBusyRef.current || !recordingRef.current || !workerRef.current) return;
      const audio = mergeAndResample();
      if (audio.length < TARGET_SAMPLE_RATE * 0.8) return;
      interimBusyRef.current = true;
      const id = ++requestIdRef.current;
      workerRef.current.postMessage({ type: 'generate', audio, id, final: false }, [audio.buffer]);
    }, INTERIM_INTERVAL_MS);
  }, [startBars, mergeAndResample]);

  const stopRecording = useCallback(() => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    if (interimTimerRef.current) clearInterval(interimTimerRef.current);
    stopBars();
    const audio = mergeAndResample();
    chunksRef.current = [];
    if (audio.length < TARGET_SAMPLE_RATE * 0.35 || !workerRef.current) {
      setCaption('');
      setPhase('ready');
      return;
    }
    setPhase('transcribing');
    const id = ++requestIdRef.current;
    finalIdRef.current = id;
    workerRef.current.postMessage({ type: 'generate', audio, id, final: true }, [audio.buffer]);
  }, [stopBars, mergeAndResample]);

  // Hold SPACE to dictate; ESC closes (or cancels an active recording first).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (recordingRef.current) stopRecording();
        else close();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) startRecording();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopRecording();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [startRecording, stopRecording, close]);

  useEffect(() => teardown, [teardown]);

  useGSAP(() => {
    gsap.to(rootRef.current, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panelRef.current,
      { scale: 0.96, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' });
  }, []);

  const sizeLabel = device === 'webgpu' ? '~75 MB' : '~30 MB';
  const isLive = phase === 'ready' || phase === 'recording' || phase === 'transcribing';

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] flex items-center justify-center" style={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div
        ref={panelRef}
        className="relative w-[92vw] max-w-xl border border-black bg-white/95 p-6 text-black md:p-8"
        style={{ opacity: 0 }}>
        <button
          onClick={close}
          aria-label="Close demo"
          className="absolute right-4 top-3 text-2xl leading-none opacity-40 hover:opacity-100">
          ✕
        </button>

        <h2 className="font-serif text-3xl md:text-4xl">WhisperFlow Local</h2>
        <p className="mt-1 text-xs uppercase tracking-widest opacity-50">
          100% local dictation — running in your browser
        </p>

        {phase === 'idle' && (
          <div className="mt-6">
            <p className="text-sm leading-relaxed">
              The real thing is a macOS menu-bar app. This is its little web twin: the same
              speech model family, running entirely on <em>your</em> device — no audio, no
              transcript, nothing ever leaves this page.
            </p>
            <button
              onClick={loadDemo}
              className="mt-5 border border-black bg-[#222] px-5 py-2.5 text-sm tracking-widest text-white hover:bg-black">
              LOAD DEMO ({sizeLabel})
            </button>
            <p className="mt-3 text-xs opacity-50">
              Downloads the Moonshine speech model once from the Hugging Face CDN, then runs
              {device === 'webgpu' ? ' on your GPU (WebGPU)' : ' on your CPU (WebAssembly)'}.
              Your browser will ask for microphone access.
            </p>
          </div>
        )}

        {phase === 'loading' && (
          <div className="mt-6">
            <p className="text-sm">
              Loading speech model ({device === 'webgpu' ? 'WebGPU' : 'WASM'})…
            </p>
            <div className="mt-3 h-2 w-full border border-black">
              <div className="h-full bg-black transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs opacity-50">{progress}% — cached by your browser for next time.</p>
          </div>
        )}

        {isLive && (
          <div className="mt-5">
            <textarea
              ref={textareaRef}
              spellCheck={false}
              placeholder="Your dictation lands here. Hold SPACE, speak, release — the text is pasted at your cursor, just like the real app."
              className="h-40 w-full resize-none border border-black bg-white p-3 font-sans text-sm leading-relaxed text-black outline-none placeholder:opacity-40"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            />

            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex h-12 min-w-0 max-w-full items-center gap-3 rounded-full bg-[#111] px-5 text-white">
                <div ref={barsRef} className="flex h-6 shrink-0 items-center gap-[3px]">
                  {Array.from({ length: BAR_COUNT }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-white/90"
                      style={{ height: 4, transition: 'height 80ms linear' }}
                    />
                  ))}
                </div>
                <span className={`truncate text-xs ${phase === 'recording' && caption ? '' : 'italic opacity-60'}`}>
                  {phase === 'recording'
                    ? (caption || 'listening…')
                    : phase === 'transcribing'
                      ? 'transcribing…'
                      : 'hold SPACE to dictate'}
                </span>
              </div>
              <button
                onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
                className={`h-12 w-12 shrink-0 rounded-full border border-black text-lg ${phase === 'recording' ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}
                aria-label="Hold to talk">
                ●
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed opacity-50">
              SPACE is reserved for dictation while this window is open — that&apos;s rather the
              point. The native app also polishes transcripts with a local LLM (Ollama); this
              demo shows the raw on-device transcription.
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="mt-6">
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        <div className="mt-5 border-t border-black/20 pt-3 text-xs">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 opacity-70 hover:opacity-100">
            View WhisperFlow Local on GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default WhisperFlowDemo;

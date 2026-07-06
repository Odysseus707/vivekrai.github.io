/**
 * Speech-to-text worker for the WhisperFlow demo overlay.
 *
 * Runs onnx-community/moonshine-tiny-ONNX fully in the browser via
 * transformers.js — WebGPU when available, WASM otherwise. Model weights are
 * streamed from the Hugging Face CDN on first load and cached by the browser.
 */
import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/moonshine-tiny-ONNX';

type Device = 'webgpu' | 'wasm';

interface LoadMessage { type: 'load'; device: Device }
interface GenerateMessage { type: 'generate'; audio: Float32Array; id: number; final: boolean }
type InMessage = LoadMessage | GenerateMessage;

// transformers.js pipelines are callable; keep the type loose to avoid
// depending on the library's internal generics.
type Transcriber = (audio: Float32Array) => Promise<{ text?: string } | { text?: string }[]>;

let transcriber: Transcriber | null = null;
// Serialize all inference: interim and final requests share one ONNX session.
let queue: Promise<void> = Promise.resolve();

const post = (message: unknown) =>
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(message);

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function load(device: Device) {
  try {
    transcriber = (await pipeline('automatic-speech-recognition', MODEL_ID, {
      device,
      dtype: device === 'webgpu'
        ? { encoder_model: 'fp32', decoder_model_merged: 'q4' }
        : { encoder_model: 'q8', decoder_model_merged: 'q8' },
      progress_callback: (payload: unknown) => post({ type: 'progress', payload }),
    })) as unknown as Transcriber;

    // Warm up so the first real dictation doesn't pay compilation cost.
    await transcriber(new Float32Array(16000));
    post({ type: 'ready' });
  } catch (err) {
    transcriber = null;
    post({ type: 'error', during: 'load', message: errorMessage(err) });
  }
}

async function generate(audio: Float32Array, id: number, final: boolean) {
  if (!transcriber) return;
  try {
    const output = await transcriber(audio);
    const text = Array.isArray(output)
      ? output.map((chunk) => chunk.text ?? '').join(' ')
      : output.text ?? '';
    post({ type: 'result', id, final, text });
  } catch (err) {
    post({ type: 'error', during: 'generate', id, final, message: errorMessage(err) });
  }
}

self.addEventListener('message', (event) => {
  const data = (event as MessageEvent<InMessage>).data;
  if (data.type === 'load') {
    queue = queue.then(() => load(data.device));
  } else if (data.type === 'generate') {
    queue = queue.then(() => generate(data.audio, data.id, data.final));
  }
});

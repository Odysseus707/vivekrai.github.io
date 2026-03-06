import { Project } from "../types";

// TODO: Move this to API
export const PROJECTS: Project[] = [
  {
    title: 'EcoCAR CAV Team — Intersection Handling (RL)',
    date: '09/2025–Present',
    subtext: 'Engineered intersection-handling logic for an autonomous vehicle with PPO (RL) + Simulink; collaborated on sensor-fusion pipelines in RTMaps. ~95% success rate in validation.',
    url: '',
  },
  {
    title: 'ML Intern — NLP Sentiment Analysis (Vertex AI)',
    date: '06/2023–08/2023',
    subtext: 'Built an NLP sentiment analysis system on Google Cloud Vertex AI (92% accuracy). Optimized transformer/ML inference for ~40% lower latency to enable real-time analytics.',
    url: '',
  },
  {
    title: 'VR Intern — Unity Safety Training + Blender Assets',
    date: '05/2024–10/2024',
    subtext: 'Built a Unity-based VR fire safety training app, saving 20+ staff hours and $500+ per session by reducing physical drills. Created/optimized 15+ Blender assets for plant-visit modules.',
    url: '',
  },
  {
    title: 'Decentralized Learning for Medical Imaging (Privacy-Preserving)',
    date: '08/2025–12/2025',
    subtext: 'Engineered a custom cross-silo decentralized learning orchestration pipeline to simulate hospital networks. Achieved ~80% accuracy on PathMNIST, retaining 94% of centralized baseline over 100+ experiments.',
    url: '',
  },
  {
    title: 'Football Match Analysis (Real-time Tracking)',
    date: '04/2025–05/2025',
    subtext: 'Built a real-time tracking + visualization pipeline at 30 FPS using YOLOv5 + OpenCV. Labeled 2,000+ frames with Roboflow and debugged tracking failures.',
    url: '',
  },
  {
    title: 'Visual Question Answering (CLIP + LSTM)',
    date: '10/2023–12/2023',
    subtext: 'Built a multimodal VQA system combining CLIP embeddings with LSTM-based language modeling. Implemented attention + token embeddings for stronger visual-text alignment; reached ~85% accuracy.',
    url: '',
  },
];

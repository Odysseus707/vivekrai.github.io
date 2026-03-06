import { Project } from "../types";

// TODO: Move this to API
export const PROJECTS: Project[] = [
  {
    title: 'EcoCAR Intersection RL',
    date: '09/2025–Present',
    subtext: 'Taught an EcoCAR to handle intersections with PPO + Simulink and RTMaps sensor fusion. The car listens better than most humans at a 4‑way stop.',
    url: '',
  },
  {
    title: 'Vertex AI Sentiment',
    date: '06/2023–08/2023',
    subtext: 'Built an NLP sentiment system on Google Cloud Vertex AI (92% accuracy) and trimmed inference latency by ~40% so dashboards update before the meeting ends.',
    url: '',
  },
  {
    title: 'VR Safety Trainer',
    date: '05/2024–10/2024',
    subtext: 'Unity-based VR fire safety training that saved 20+ staff hours and $500+ per session—plus fewer fake fires in the office.',
    url: '',
  },
  {
    title: 'Decentralized Med Imaging',
    date: '08/2025–12/2025',
    subtext: 'Simulated cross-silo decentralized learning over hospital networks, keeping data private while retaining ~94% of centralized accuracy on PathMNIST.',
    url: '',
  },
  {
    title: 'Football Match Tracker',
    date: '04/2025–05/2025',
    subtext: 'YOLOv5 + OpenCV pipeline for live match analytics at 30 FPS. Annotated 2,000+ frames so the model knows the offside line better than the ref.',
    url: '',
  },
  {
    title: 'Visual QA (CLIP + LSTM)',
    date: '10/2023–12/2023',
    subtext: 'Multimodal VQA system with CLIP embeddings and LSTM-based language modeling. Answers image questions at ~85% accuracy—no vision, but decent opinions.',
    url: '',
  },
];

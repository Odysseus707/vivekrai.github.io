import * as THREE from "three";
import { WorkTimelinePoint } from "../types";

export const WORK_TIMELINE: WorkTimelinePoint[] = [
  {
    point: new THREE.Vector3(0, 0, 0),
    year: '2025–2027',
    title: 'Illinois Institute of Technology',
    subtitle: 'M.S. Computer Science (GPA: 4.0)',
    position: 'right',
  },
  {
    point: new THREE.Vector3(-4, -4, -3),
    year: '2021–2025',
    title: 'RGIPT (Rajiv Gandhi Institute of Petroleum Technology)',
    subtitle: 'B.Tech. Computer Science & Engineering',
    position: 'left',
  },
  {
    point: new THREE.Vector3(-3, -1, -6),
    year: 'Now',
    title: 'AI/ML Focus',
    subtitle: 'Multimodal perception • RL • Computer Vision',
    position: 'left',
  },
  {
    point: new THREE.Vector3(0, -1, -10),
    year: '2024',
    title: 'Certificates',
    subtitle: 'DeepLearning.AI Machine Learning Specialization',
    position: 'right',
  },
]

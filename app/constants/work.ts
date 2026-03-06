import * as THREE from "three";
import { WorkTimelinePoint } from "../types";

export const WORK_TIMELINE: WorkTimelinePoint[] = [
  {
    point: new THREE.Vector3(0, 0, 0),
    year: '2021',
    title: 'RGIPT',
    subtitle: 'B.Tech in Computer Science',
    position: 'right',
  },
  {
    point: new THREE.Vector3(-4, -4, -3),
    year: '2023',
    title: 'Saint Gobain INDEC',
    subtitle: 'Machine Learning Intern',
    position: 'left',
  },
  {
    point: new THREE.Vector3(-3, -1, -6),
    year: '2024',
    title: 'Saint Gobain INDEC',
    subtitle: 'VR Intern',
    position: 'left',
  },
  {
    point: new THREE.Vector3(0, -1, -10),
    year: '2025',
    title: 'Illinois Institute of Technology',
    subtitle: 'M.S. Computer Science',
    position: 'right',
  },
  {
    point: new THREE.Vector3(1, 1, -12),
    year: '2026',
    title: '?',
    subtitle: '?',
    position: 'right',
  },
]

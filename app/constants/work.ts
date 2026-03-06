import * as THREE from "three";
import { WorkTimelinePoint } from "../types";

export const WORK_TIMELINE: WorkTimelinePoint[] = [
  {
    point: new THREE.Vector3(0, 0, 0),
    year: '2018',
    title: 'University',
    subtitle: 'Your degree / focus area',
    position: 'right',
  },
  {
    point: new THREE.Vector3(-4, -4, -3),
    year: '2020',
    title: 'Company One',
    subtitle: 'Frontend Engineer',
    position: 'left',
  },
  {
    point: new THREE.Vector3(-3, -1, -6),
    year: '2022',
    title: 'Company Two',
    subtitle: 'Software Engineer',
    position: 'left',
  },
  {
    point: new THREE.Vector3(0, -1, -10),
    year: '2024',
    title: 'Company Three',
    subtitle: 'Senior Engineer',
    position: 'left',
  },
  {
    point: new THREE.Vector3(1, 1, -12),
    year: new Date().toLocaleDateString('default', { year: 'numeric' }),
    title: 'Next',
    subtitle: 'What’s next?',
    position: 'right',
  }
]
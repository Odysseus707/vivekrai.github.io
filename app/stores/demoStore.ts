import { create } from 'zustand';

interface DemoStore {
  isDemoOpen: boolean;
  setDemoOpen: (isDemoOpen: boolean) => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  isDemoOpen: false,
  setDemoOpen: (isDemoOpen) => set(() => ({ isDemoOpen })),
}));

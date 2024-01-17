import { create } from "zustand";

interface PollFilterState {
  filter: string;
  setFilter: (newFilter: string) => void;
}
export const usePollFilterStore = create<PollFilterState>()((set) => ({
  filter: "all",
  setFilter: (newFilter: string) => set({ filter: newFilter }),
}));

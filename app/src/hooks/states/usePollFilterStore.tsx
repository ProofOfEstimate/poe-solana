import { create } from "zustand";

export type FilterState = "all" | "active" | "resolved";

interface PollFilterState {
  filter: FilterState;
  setFilter: (newFilter: string) => void;
}
export const usePollFilterStore = create<PollFilterState>()((set) => ({
  filter: "all",
  setFilter: (newFilter: string) => set({ filter: newFilter as FilterState }),
}));

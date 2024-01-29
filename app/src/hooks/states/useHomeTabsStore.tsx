import { create } from "zustand";

type HomeTabState = "all" | "new" | "trending";

interface TabsState {
  tab: HomeTabState;
  setTab: (newTab: string) => void;
}
export const useHomeTabsStore = create<TabsState>()((set) => ({
  tab: "all",
  setTab: (newTab: string) => set({ tab: newTab as HomeTabState }),
}));

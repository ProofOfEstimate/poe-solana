import { create } from "zustand";

interface TabsState {
  tab: string;
  setTab: (newTab: string) => void;
}
export const useDashboardTabsStore = create<TabsState>()((set) => ({
  tab: "overview",
  setTab: (newTab: string) => set({ tab: newTab }),
}));

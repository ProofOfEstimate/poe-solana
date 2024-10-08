import { create } from "zustand";

type MyPollsTabState = "created" | "joined";

interface TabsState {
  tab: MyPollsTabState;
  setTab: (newTab: string) => void;
}
export const useMyPollsTabsStore = create<TabsState>()((set) => ({
  tab: "created",
  setTab: (newTab: string) => set({ tab: newTab as MyPollsTabState }),
}));

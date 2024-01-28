import { create } from "zustand";

interface FilterState {
  filter: string[];
  addCategories: (category: string[]) => void;
  removeCategory: (category: string) => void;
  removeAll: () => void;
}
export const useCategoryFilterStore = create<FilterState>()((set) => ({
  filter: [],
  addCategories: (category: string[]) =>
    set((state) => {
      const newFilterSet = new Set([...state.filter, ...category]).values();

      return {
        filter: Array.from(new Set(newFilterSet)),
      };
    }),
  removeCategory: (category: string) =>
    set((state) => ({
      filter: state.filter.filter((cat) => cat !== category),
    })),
  removeAll: () => set({ filter: [] }),
}));

import { create } from 'zustand';
import type { ActionCategory } from '../types';
import categoriesData from '../data/categories.json';

interface CategoryState {
  categories: ActionCategory[];
  getCategoryById: (id: string) => ActionCategory | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: categoriesData as ActionCategory[],
  getCategoryById: (id: string) => {
    return get().categories.find(c => c.id === id);
  },
}));

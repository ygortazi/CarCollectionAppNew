import { create } from 'zustand';
import { FilterState } from '../types/models';

const defaultFilters: FilterState['filters'] = {
    years: [],
    series: [],
    colors: [],
    priceRange: null,
    searchQuery: '',
    sortBy: 'recent',
    stores: []
};

type FilterStore = {
    filters: FilterState['filters'];
    setFilters: (newFilters: Partial<FilterState['filters']>) => void;
    resetFilters: () => void;
};

export const useFilterStore = create<FilterStore>((set) => ({
    filters: defaultFilters,
    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),
    resetFilters: () => set({ filters: defaultFilters })
}));
import { create } from 'zustand';

export interface InventoryItem {
    [key: string]: string | number | boolean | null | undefined;
}

interface AppState {
    data: InventoryItem[];
    filteredData: InventoryItem[];
    searchTerm: string;
    isLoading: boolean;
    themeColor: string;
    setData: (data: InventoryItem[]) => void;
    setFilteredData: (data: InventoryItem[]) => void;
    setSearchTerm: (term: string) => void;
    setIsLoading: (loading: boolean) => void;
    setThemeColor: (color: string) => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    data: [],
    filteredData: [],
    searchTerm: '',
    isLoading: false,
    themeColor: '#4f46e5', // Default Indigo 600
    setData: (data) => set({ data }),
    setFilteredData: (filteredData) => set({ filteredData }),
    setSearchTerm: (searchTerm) => set({ searchTerm }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setThemeColor: (themeColor) => set({ themeColor }),
    reset: () => set({ data: [], filteredData: [], searchTerm: '' }),
}));

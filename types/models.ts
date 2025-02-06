export interface CustomField {
    name: string;
    value: string;
}

export interface Car {
    id: string;
    userId: string;
    name: string;
    series: string;
    seriesNumber: string;
    year: string;
    yearNumber: string;
    toyNumber: string;
    color: string;
    tampo: string;
    baseColor: string;
    windowColor: string;
    interiorColor: string;
    wheelType: string;
    purchaseDate: string;
    purchasePrice: string;
    purchaseStore: string;
    notes: string;
    customFields: CustomField[];  // Add this line
    images: Array<{
        uri: string;
        downloadURL: string;
        path: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
    deleted?: boolean;
}

export interface CatalogCar {
    id: string; // This will be the toyNumber
    name: string;
    series: string;
    seriesNumber: string;
    year: string;
    yearNumber: string;
    toyNumber: string;
    color: string;
    tampo: string;
    baseColor: string;
    windowColor: string;
    interiorColor: string;
    wheelType: string;
    images: Array<{
        uri: string;
        downloadURL: string;
        path: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPreferences {
    id: string;
    userId: string;
    defaultView: 'grid' | 'list';
    defaultSort: 'recent' | 'name' | 'series' | 'year';
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
}

export interface StorageImage {
    uri: string;
    downloadURL: string;
    path: string;
}

export interface FilterState {
    filters: {
        years: string[];
        series: string[];
        colors: string[];
        priceRange: { min: number; max: number } | null;
        searchQuery: string;
        sortBy: 'recent' | 'purchase' | 'name' | 'priceHigh' | 'priceLow';
        stores?: string[];
    };
}

export type SortOption = FilterState['filters']['sortBy'];
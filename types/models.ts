import { Timestamp } from 'firebase/firestore';

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
    brand: string;
    manufacturer: string;
    tampo: string;
    baseColor: string;
    windowColor: string;
    interiorColor: string;
    wheelType: string;
    purchaseDate: string;
    purchasePrice: string;
    purchaseStore: string;
    notes: string;
    customFields: CustomField[];
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
    id: string;
    name: string;
    series: string;
    seriesNumber: string;
    year: string;
    yearNumber: string;
    toyNumber: string;
    color: string;
    brand: string;
    manufacturer: string;
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
    id?: string;
    uid: string;
    name: string;
    email: string;
    plan: string;
    collectionCount: number;
    wishlistCount: number;
    deleted: boolean;
    preferences: {
        currency: string;
        defaultCatalogView: 'grid' | 'list';
        defaultCollectionView: 'grid' | 'list';
        emailNotificationsEnabled: boolean;
        notificationsEnabled: boolean;
        language: string;
        showPrices: boolean;
        theme: 'light' | 'dark' | 'system';
        privacy?: {
            dataCollection: boolean;
            activityHistory: boolean;
            biometricAuth: boolean;
            profileVisibility: 'public' | 'private' | 'friends';
            dataSharing: {
                analytics: boolean;
                marketing: boolean;
                thirdParty: boolean;
            };
        };
        notifications?: {
            specialOffers: boolean;
            newFeatures: boolean;
            newArrivals: boolean;
            newsletter: boolean;
            securityAlerts: boolean;
            activitySummary: boolean;
        };
        sync?: {
            autoSync: boolean;
            wifiOnly: boolean;
            frequency: number;
            lastSynced: Date | Timestamp | null;
        };    
    };
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
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

export interface NotificationSettings {
    notificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
}

export type UserPreferencesUpdate = Partial<UserPreferences> & {
    preferences?: Partial<UserPreferences['preferences']>;
}
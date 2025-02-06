// types/storage.ts
export interface StorageImage {
    uri?: string;
    downloadURL?: string | { uri?: string };
    path?: string;
    sizes?: {
        grid?: string;
        thumbnail?: string;
    };
}
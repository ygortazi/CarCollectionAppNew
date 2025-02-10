// types/storage.ts
interface ImageObject {
    contentType: string;
    downloadURL: string;
    path: string;
    timestamp: number;
    uri: string;
}

export interface StorageImage {
    uri?: string | ImageObject;
    downloadURL?: string | ImageObject;
    path?: string | ImageObject;
    sizes?: {
        grid?: string;
        thumbnail?: string;
    };
}
export interface StorageImage {
    uri?: string;
    downloadURL?: string;
    path?: string;
    sizes?: {
        grid?: string;
        thumbnail?: string;
    };
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}
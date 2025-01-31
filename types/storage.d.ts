export interface StorageImage {
  uri: string;
  downloadURL: string;
  path: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}
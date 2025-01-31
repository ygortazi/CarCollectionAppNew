import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FirebaseError } from 'firebase/app';

export async function uploadImage(uri: string, path: string): Promise<string> {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export async function deleteImage(path: string): Promise<void> {
    try {
        // Normalize the path by removing any leading or trailing slashes
        const normalizedPath = path.replace(/^\/+|\/+$/g, '');
        const storageRef = ref(storage, normalizedPath);
        await deleteObject(storageRef);
    } catch (error: unknown) {
        if (error instanceof FirebaseError && error.code === 'storage/object-not-found') {
            console.warn('Image not found in storage:', path);
        }
        throw error;
    }
}

export function generateStoragePath(userId: string, collectionType: string, filename: string): string {
    // Ensure consistent path format: users/{userId}/collections/{collectionType}/{filename}
    return `users/${userId}/collections/${collectionType}/${filename}`;
}
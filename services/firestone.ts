import { db } from 'config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    writeBatch,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    DocumentSnapshot,
    serverTimestamp,
    Timestamp,
    FieldValue,
    FirestoreError,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from 'config/firebase';
import type { Car, UserPreferences, StorageImage } from 'types/models';

const BATCH_SIZE = 500;
const PAGE_SIZE = 20;

function convertTimestampToDate(timestamp: Timestamp | FieldValue): Date {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date();
}

// Update Car type usage for timestamps
interface FirestoreCar extends Omit<Car, 'createdAt' | 'updatedAt'> {
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
    deleted?: boolean;
}


// Error handling wrapper
async function handleFirestoreOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof FirestoreError) {
            console.error(`Firestore error (${error.code}):`, error.message);
            throw new Error(`Database operation failed: ${error.message}`);
        }
        throw error;
    }
}

// Validation
function validateCarData(car: Partial<Car>) {
    if (!car.name?.trim()) throw new Error('Car name is required');
    if (!car.userId?.trim()) throw new Error('User ID is required');
    return true;
}

// Cars Collection
export async function addCar(car: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>) {
    return handleFirestoreOperation(async () => {
        validateCarData(car);

        const carsRef = collection(db, 'cars');
        const newCarRef = doc(carsRef);

        const timestamp = serverTimestamp();
        const carData: FirestoreCar = {
            ...car,
            id: newCarRef.id,
            createdAt: timestamp,
            updatedAt: timestamp,
            deleted: false
        };

        await setDoc(newCarRef, carData);
        return {
            ...car,
            id: newCarRef.id,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Car;
    });
}

export async function updateCar(carId: string, updates: Partial<Car>) {
    return handleFirestoreOperation(async () => {
        const carRef = doc(db, 'cars', carId);
        const updatedData = {
            ...updates,
            updatedAt: serverTimestamp()
        };
        await setDoc(carRef, updatedData, { merge: true });
    });
}

export async function batchUpdateCars(updates: Array<{ id: string, data: Partial<Car> }>) {
    return handleFirestoreOperation(async () => {
        const batches = [];
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            updates.slice(i, i + BATCH_SIZE).forEach(({ id, data }) => {
                const ref = doc(db, 'cars', id);
                batch.update(ref, { ...data, updatedAt: serverTimestamp() });
            });
            batches.push(batch.commit());
        }
        await Promise.all(batches);
    });
}

export async function deleteCar(carId: string) {
    return handleFirestoreOperation(async () => {
        const carRef = doc(db, 'cars', carId);
        await setDoc(carRef, { deleted: true, updatedAt: serverTimestamp() }, { merge: true });
    });
}

export async function getCar(carId: string) {
    return handleFirestoreOperation(async () => {
        const docSnap = await getDoc(doc(db, 'cars', carId));
        if (!docSnap.exists()) return null;

        const data = docSnap.data() as FirestoreCar;
        if (data.deleted) return null;

        return {
            ...data,
            createdAt: convertTimestampToDate(data.createdAt),
            updatedAt: convertTimestampToDate(data.updatedAt)
        } as Car;
    });
}

interface GetUserCarsOptions {
    lastDoc?: DocumentSnapshot;
    pageSize?: number;
}

export async function getUserCars(userId: string, options: GetUserCarsOptions = {}) {
    return handleFirestoreOperation(async () => {
        const { lastDoc, pageSize = PAGE_SIZE } = options;

        try {
            let carsQuery = query(
                collection(db, 'cars'),
                where('userId', '==', userId),
                where('deleted', '==', false),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            if (lastDoc) {
                carsQuery = query(carsQuery, startAfter(lastDoc));
            }

            const snapshot = await getDocs(carsQuery);

            return {
                cars: snapshot.docs.map(doc => {
                    const data = doc.data() as FirestoreCar;
                    return {
                        ...data,
                        createdAt: convertTimestampToDate(data.createdAt),
                        updatedAt: convertTimestampToDate(data.updatedAt)
                    } as Car;
                }),
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === pageSize
            };
        } catch (error: any) {
            // Handle missing index error
            if (error?.code === 'failed-precondition' || error?.message?.includes('requires an index')) {
                console.warn('Index not ready yet. Falling back to basic query...');
                // Fallback to simpler query while index builds
                const basicQuery = query(
                    collection(db, 'cars'),
                    where('userId', '==', userId),
                    limit(pageSize)
                );

                const snapshot = await getDocs(basicQuery);
                return {
                    cars: snapshot.docs
                        .map(doc => {
                            const data = doc.data() as FirestoreCar;
                            return {
                                ...data,
                                createdAt: convertTimestampToDate(data.createdAt),
                                updatedAt: convertTimestampToDate(data.updatedAt)
                            } as Car;
                        })
                        .filter(car => !car.deleted)
                        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                        .slice(0, pageSize),
                    lastDoc: snapshot.docs[snapshot.docs.length - 1],
                    hasMore: snapshot.docs.length === pageSize
                };
            }
            throw error;
        }
    });
}

// User Preferences
export async function getUserPreferences(userId: string) {
    return handleFirestoreOperation(async () => {
        const docSnap = await getDoc(doc(db, 'userPreferences', userId));
        return docSnap.exists() ? docSnap.data() as UserPreferences : null;
    });
}

export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    return handleFirestoreOperation(async () => {
        const prefsRef = doc(db, 'userPreferences', userId);
        await setDoc(prefsRef, {
            ...preferences,
            updatedAt: serverTimestamp()
        }, { merge: true });
    });
}

// Wishlist
export async function getUserWishlist(userId: string, options: GetUserCarsOptions = {}) {
    return handleFirestoreOperation(async () => {
        const { lastDoc, pageSize = PAGE_SIZE } = options;

        let wishlistQuery = query(
            collection(db, 'wishlist'),
            where('userId', '==', userId),
            where('deleted', '==', false),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            wishlistQuery = query(wishlistQuery, startAfter(lastDoc));
        }

        const snapshot = await getDocs(wishlistQuery);
        return {
            items: snapshot.docs.map(doc => doc.data() as Car),
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === pageSize
        };
    });
}

export async function addToCollection(userId: string, car: Car) {
    return handleFirestoreOperation(async () => {
        const { id, ...carData } = car;
        return addCar({
            ...carData,
            userId,
        });
    });
}

export async function addToWishlist(userId: string, car: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>) {
    return handleFirestoreOperation(async () => {
        validateCarData({ ...car, userId });

        const wishlistRef = collection(db, 'wishlist');
        const newWishlistRef = doc(wishlistRef);

        const wishlistData = {
            ...car,
            id: newWishlistRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deleted: false
        };

        await setDoc(newWishlistRef, wishlistData);
        return wishlistData;
    });
}

export async function removeFromWishlist(carId: string) {
    return handleFirestoreOperation(async () => {
        const wishlistRef = doc(db, 'wishlist', carId);
        await setDoc(wishlistRef, {
            deleted: true,
            updatedAt: serverTimestamp()
        }, { merge: true });
    });
}

// Catalog
export async function getCatalog(options: GetUserCarsOptions = {}) {
    return handleFirestoreOperation(async () => {
        const { lastDoc, pageSize = PAGE_SIZE } = options;

        let catalogQuery = query(
            collection(db, 'catalog'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            catalogQuery = query(catalogQuery, startAfter(lastDoc));
        }

        const snapshot = await getDocs(catalogQuery);
        return {
            items: snapshot.docs.map(doc => doc.data() as Car),
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === pageSize
        };
    });
}

// Image handling
export async function updateCarImages(carId: string, newImage: StorageImage) {
    return handleFirestoreOperation(async () => {
        const carRef = doc(db, 'cars', carId);
        const carDoc = await getDoc(carRef);

        if (!carDoc.exists()) {
            throw new Error('Car not found');
        }

        const currentImages = carDoc.data().images || [];
        await setDoc(carRef, {
            images: [...currentImages, newImage],
            updatedAt: serverTimestamp()
        }, { merge: true });
    });
}

export async function uploadImage(uri: string, path: string): Promise<string> {
    return handleFirestoreOperation(async () => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    });
}

export function generateStoragePath(userId: string, carId: string, filename: string): string {
    return `users/${userId}/cars/${carId}/${filename}`;
}
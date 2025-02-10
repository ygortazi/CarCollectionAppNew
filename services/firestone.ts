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
import { db, storage } from 'config/firebase';
import type { Car, CatalogCar, UserPreferences, StorageImage } from 'types/models';

const BATCH_SIZE = 500;
const PAGE_SIZE = 20;

interface FirestoreUserPreferences extends Omit<UserPreferences, 'preferences'> {
    preferences: {
      sync?: {
        autoSync: boolean;
        wifiOnly: boolean;
        frequency: number;
        lastSynced: Timestamp | null;
      };
    };
  }

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

export async function getCar(carId: string, source: 'catalog' | 'collection' = 'collection'): Promise<Car | CatalogCar | null> {
    return handleFirestoreOperation(async () => {
        try {
            if (source === 'catalog') {
                const catalogRef = doc(db, 'catalog', carId);
                const catalogSnap = await getDoc(catalogRef);

                if (catalogSnap.exists()) {
                    const data = catalogSnap.data();
                    const images = Array.isArray(data.photos || data.images) ?
                        (data.photos || data.images).map((image: any) => ({
                            uri: image.downloadURL || image,
                            downloadURL: image.downloadURL || image,
                            path: image.path || ''
                        })) : [];

                    return {
                        id: catalogSnap.id,
                        name: data.name || '',
                        series: data.series || '',
                        seriesNumber: data.seriesNumber || '',
                        year: data.year || '',
                        yearNumber: data.yearNumber || '',
                        toyNumber: data.toyNumber || '',
                        color: data.color || '',
                        brand: data.brand || '',          
                        manufacturer: data.manufacturer || '', 
                        tampo: data.tampo || '',
                        baseColor: data.baseColor || '',
                        windowColor: data.windowColor || '',
                        interiorColor: data.interiorColor || '',
                        wheelType: data.wheelType || '',
                        images: images,
                        createdAt: convertTimestampToDate(data.createdAt || new Date()),
                        updatedAt: convertTimestampToDate(data.updatedAt || new Date())
                    } as CatalogCar;
                }
            } else {
                const carRef = doc(db, 'cars', carId);
                const carSnap = await getDoc(carRef);

                if (carSnap.exists() && !carSnap.data()?.deleted) {
                    const data = carSnap.data();
                    const images = Array.isArray(data.photos || data.images) ?
                        (data.photos || data.images).map((image: any) => ({
                            uri: image.downloadURL || image,
                            downloadURL: image.downloadURL || image,
                            path: image.path || ''
                        })) : [];

                    return {
                        id: carSnap.id,
                        userId: data.userId,
                        name: data.name || '',
                        series: data.series || '',
                        seriesNumber: data.seriesNumber || '',
                        year: data.year || '',
                        yearNumber: data.yearNumber || '',
                        toyNumber: data.toyNumber || '',
                        color: data.color || '',
                        brand: data.brand || '',         
                        manufacturer: data.manufacturer || '', 
                        tampo: data.tampo || '',
                        baseColor: data.baseColor || '',
                        windowColor: data.windowColor || '',
                        interiorColor: data.interiorColor || '',
                        wheelType: data.wheelType || '',
                        purchaseDate: data.purchaseDate || '',
                        purchasePrice: data.purchasePrice || '',
                        purchaseStore: data.purchaseStore || '',
                        notes: data.notes || '',
                        customFields: data.customFields || [],
                        images: images,
                        createdAt: convertTimestampToDate(data.createdAt || new Date()),
                        updatedAt: convertTimestampToDate(data.updatedAt || new Date())
                    } as Car;
                }
            }

            return null;
        } catch (error) {
            console.error('Error in getCar:', error);
            throw error;
        }
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
// In firestone.ts, update the getUserPreferences function:

export async function getUserPreferences(userId: string) {
    return handleFirestoreOperation(async () => {
        const docSnap = await getDoc(doc(db, 'userPreferences', userId));
        if (!docSnap.exists()) return null;
        
        const firestoreData = docSnap.data() as FirestoreUserPreferences;
        
        // Create a new object to avoid modifying the original data
        const convertedData = {
            ...firestoreData,
            preferences: {
                ...firestoreData.preferences,
                sync: firestoreData.preferences.sync ? {
                    ...firestoreData.preferences.sync,
                    // Only convert if it's a Timestamp
                    lastSynced: firestoreData.preferences.sync.lastSynced instanceof Timestamp
                        ? firestoreData.preferences.sync.lastSynced.toDate()
                        : firestoreData.preferences.sync.lastSynced
                } : undefined
            }
        };
        
        return convertedData as unknown as UserPreferences;
    });
}
  
  // Update the updateUserPreferences function to properly store the timestamp:
  
  export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    return handleFirestoreOperation(async () => {
      const prefsRef = doc(db, 'userPreferences', userId);
      
      // Create a deep copy to avoid modifying the original preferences
      const firestorePrefs: Partial<FirestoreUserPreferences> = {
        ...preferences,
        preferences: preferences.preferences ? {
          ...preferences.preferences,
          sync: preferences.preferences.sync ? {
            ...preferences.preferences.sync,
            // Handle the lastSynced conversion
            lastSynced: preferences.preferences.sync.lastSynced instanceof Date
              ? Timestamp.fromDate(preferences.preferences.sync.lastSynced)
              : preferences.preferences.sync.lastSynced instanceof Timestamp
                ? preferences.preferences.sync.lastSynced
                : null
          } : undefined
        } : undefined
      };
      
      await setDoc(prefsRef, {
        ...firestorePrefs,
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
export async function addToCollection(userId: string, catalogCar: CatalogCar) {
    return handleFirestoreOperation(async () => {
        const carData: Omit<Car, 'id' | 'createdAt' | 'updatedAt'> = {
            userId,
            name: catalogCar.name,
            series: catalogCar.series,
            seriesNumber: catalogCar.seriesNumber,
            year: catalogCar.year,
            yearNumber: catalogCar.yearNumber,
            toyNumber: catalogCar.toyNumber,  // Keep the toyNumber as reference
            color: catalogCar.color,
            brand: catalogCar.brand || '',
            manufacturer: catalogCar.manufacturer || '',
            tampo: catalogCar.tampo,
            baseColor: catalogCar.baseColor,
            windowColor: catalogCar.windowColor,
            interiorColor: catalogCar.interiorColor,
            wheelType: catalogCar.wheelType,
            images: catalogCar.images,
            purchaseDate: '',
            purchasePrice: '',
            purchaseStore: '',
            notes: '',
            customFields: []
        };

        // Create a new document with auto-generated ID
        const carsRef = collection(db, 'cars');
        const newCarRef = doc(carsRef);

        const timestamp = serverTimestamp();
        await setDoc(newCarRef, {
            ...carData,
            id: newCarRef.id,
            createdAt: timestamp,
            updatedAt: timestamp,
            deleted: false
        });

        return {
            ...carData,
            id: newCarRef.id,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Car;
    });
}

export async function isInWishlist(userId: string, toyNumber: string): Promise<boolean> {
    return handleFirestoreOperation(async () => {
        const wishlistQuery = query(
            collection(db, 'wishlist'),
            where('userId', '==', userId),
            where('toyNumber', '==', toyNumber),
            where('deleted', '==', false)
        );

        const snapshot = await getDocs(wishlistQuery);
        return !snapshot.empty;
    });
}

export async function addToWishlist(userId: string, catalogCar: CatalogCar) {
    return handleFirestoreOperation(async () => {
        // Check if item already exists in wishlist
        const wishlistQuery = query(
            collection(db, 'wishlist'),
            where('userId', '==', userId),
            where('toyNumber', '==', catalogCar.toyNumber),
            where('deleted', '==', false)
        );

        const existingItems = await getDocs(wishlistQuery);
        if (!existingItems.empty) {
            throw new Error('This item is already in your wishlist');
        }

        // Proceed with adding to wishlist if not found
        const wishlistRef = collection(db, 'wishlist');
        const newWishlistRef = doc(wishlistRef);

        const wishlistData = {
            userId,
            ...catalogCar,
            brand: catalogCar.brand || '',
            manufacturer: catalogCar.manufacturer || '',
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
            orderBy('toyNumber', 'asc'),
            limit(pageSize)
        );

        if (lastDoc) {
            catalogQuery = query(catalogQuery, startAfter(lastDoc));
        }

        const snapshot = await getDocs(catalogQuery);

        return {
            items: snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Raw catalog item data:', data); // Debug log

                // Handle both photos and images fields, and handle different data structures
                let images = [];
                if (Array.isArray(data.photos)) {
                    images = data.photos.map((photo: any) => {
                        if (typeof photo === 'string') {
                            return {
                                uri: photo,
                                downloadURL: photo,
                                path: photo
                            };
                        } else if (typeof photo === 'object') {
                            return {
                                uri: photo.downloadURL || photo.uri || '',
                                downloadURL: photo.downloadURL || photo.uri || '',
                                path: photo.path || ''
                            };
                        }
                        return null;
                    }).filter(Boolean);
                } else if (Array.isArray(data.images)) {
                    images = data.images;
                }

                console.log('Processed images:', images); // Debug log

                return {
                    id: doc.id,
                    name: data.name || '',
                    series: data.series || '',
                    seriesNumber: data.seriesNumber || '',
                    year: data.year || '',
                    yearNumber: data.yearNumber || '',
                    toyNumber: data.toyNumber || '',
                    color: data.color || '',
                    brand: data.brand || '',           
                    manufacturer: data.manufacturer || '', 
                    tampo: data.tampo || '',
                    baseColor: data.baseColor || '',
                    windowColor: data.windowColor || '',
                    interiorColor: data.interiorColor || '',
                    wheelType: data.wheelType || '',
                    images: images,
                    createdAt: convertTimestampToDate(data.createdAt || new Date()),
                    updatedAt: convertTimestampToDate(data.updatedAt || new Date())
                } as CatalogCar;
            }),
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

export async function updateUserProfile(userId: string, updates: {
    updatedAt?: any;
    preferences?: Partial<UserPreferences['preferences']>;
}) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'userPreferences', userId);
        await setDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        }, { merge: true });
    });
}
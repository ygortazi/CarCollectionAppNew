import { db, storage } from '../config/firebase';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment,
    serverTimestamp,
    Timestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { ref, listAll, uploadBytes } from 'firebase/storage';

// Types
export interface UserData {
    uid: string;
    name: string;
    email: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    plan: 'Free' | 'Premium' | 'Lifetime';
    collectionCount: number;
    wishlistCount: number;
    subscriptionExpiresAt?: Timestamp;
    subscriptionInterval?: 'monthly' | 'yearly' | 'lifetime';
    lastSyncDate?: Timestamp;
    preferences?: UserPreferences;
    deleted?: boolean;
    country: string;
    language: string;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    notificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    defaultCollectionView: 'grid' | 'list';
    defaultCatalogView: 'grid' | 'list';
    showPrices: boolean;
    currency: string;
    language: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'system',
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    defaultCollectionView: 'grid',
    defaultCatalogView: 'grid',
    showPrices: true,
    currency: 'USD',
    language: 'en'
};

// Error handling wrapper
async function handleFirestoreOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error('Firestore operation failed:', error);
        throw error;
    }
}

// User Document Operations
export async function createUserDocument(userData: Omit<UserData, 'createdAt' | 'updatedAt' | 'collectionCount' | 'wishlistCount' | 'preferences'>) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', userData.uid);
        const timestamp = serverTimestamp();

        const newUserData = {
            ...userData,
            createdAt: timestamp,
            updatedAt: timestamp,
            collectionCount: 0,
            wishlistCount: 0,
            preferences: DEFAULT_PREFERENCES,
            deleted: false
        };

        await setDoc(userRef, newUserData);

        // Setup storage paths
        await setupUserStorage(userData.uid);

        return newUserData;
    });
}

export async function getUserDocument(uid: string): Promise<UserData | null> {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && !userSnap.data()?.deleted) {
            return userSnap.data() as UserData;
        }
        return null;
    });
}

export async function updateUserDocument(uid: string, updates: Partial<UserData>) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };
        await updateDoc(userRef, updateData);
    });
}

export async function deleteUserDocument(uid: string) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            deleted: true,
            updatedAt: serverTimestamp()
        });
    });
}

// Collection Count Management
export async function incrementCollectionCount(uid: string) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            collectionCount: increment(1),
            updatedAt: serverTimestamp()
        });
    });
}

export async function decrementCollectionCount(uid: string) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            collectionCount: increment(-1),
            updatedAt: serverTimestamp()
        });
    });
}

// Wishlist Count Management
export async function incrementWishlistCount(uid: string) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            wishlistCount: increment(1),
            updatedAt: serverTimestamp()
        });
    });
}

export async function decrementWishlistCount(uid: string) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            wishlistCount: increment(-1),
            updatedAt: serverTimestamp()
        });
    });
}

// User Preferences
export async function updateUserPreference(
    uid: string,
    preferenceKey: string,
    value: any
) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        preferences: {
            [preferenceKey]: value
        },
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// Subscription Management
export async function updateUserSubscription(
    uid: string,
    plan: 'Free' | 'Premium' | 'Lifetime',
    interval?: 'monthly' | 'yearly' | 'lifetime',
    expiresAt?: Date
) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        const updateData: any = {
            plan,
            updatedAt: serverTimestamp()
        };

        if (interval) {
            updateData.subscriptionInterval = interval;
        }

        if (expiresAt) {
            updateData.subscriptionExpiresAt = Timestamp.fromDate(expiresAt);
        }

        await updateDoc(userRef, updateData);
    });
}

// Storage Setup
// In user.ts, update the setupUserStorage function:
export async function setupUserStorage(uid: string) {
  return handleFirestoreOperation(async () => {
      // Define initial storage paths
      const paths = [
          `users/${uid}/cars`,
          `users/${uid}/profile`,
          `users/${uid}/temp`
      ];

      // Create empty placeholder files to ensure folders exist
      for (const path of paths) {
          const placeholderRef = ref(storage, `${path}/.placeholder`);
          try {
              // Create a small empty file
              const emptyBlob = new Blob([''], { type: 'text/plain' });
              await uploadBytes(placeholderRef, emptyBlob);
              console.log(`Created storage path: ${path}`);
          } catch (error) {
              console.error(`Error creating storage path ${path}:`, error);
          }
      }
  });
}

// User Search
export async function searchUsers(searchTerm: string, limit: number = 10) {
    return handleFirestoreOperation(async () => {
        const usersRef = collection(db, 'users');
        const searchQuery = query(
            usersRef,
            where('deleted', '==', false),
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff')
        );

        const querySnapshot = await getDocs(searchQuery);
        return querySnapshot.docs
            .map(doc => doc.data() as UserData)
            .slice(0, limit);
    });
}

// Check Collection Limit
export async function checkCollectionLimit(uid: string): Promise<boolean> {
    return handleFirestoreOperation(async () => {
        const userData = await getUserDocument(uid);
        if (!userData) return false;

        // Free users are limited to 10 items
        if (userData.plan === 'Free' && userData.collectionCount >= 10) {
            return false;
        }

        return true;
    });
}

// Check Wishlist Limit
export async function checkWishlistLimit(uid: string): Promise<boolean> {
    return handleFirestoreOperation(async () => {
        const userData = await getUserDocument(uid);
        if (!userData) return false;

        // Free users are limited to 10 items
        if (userData.plan === 'Free' && userData.wishlistCount >= 10) {
            return false;
        }

        return true;
    });
}

// Update Last Sync Date
export async function updateLastSyncDate(uid: string) {
    return handleFirestoreOperation(async () => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            lastSyncDate: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });
}
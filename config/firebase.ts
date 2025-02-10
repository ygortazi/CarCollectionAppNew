import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
    Auth,
    initializeAuth, 
    getReactNativePersistence, 
    getAuth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBTtTvHtUFARbSjhG50-J9eQV485dCzDCQ",
    authDomain: "car-collection-app.firebaseapp.com",
    projectId: "car-collection-app",
    storageBucket: "car-collection-app.firebasestorage.app",
    messagingSenderId: "370846716399",
    appId: "1:370846716399:android:f29e4b4317c2a97f85661a"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

// Ensure Firebase is initialized only once
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    // Initialize Auth with AsyncStorage persistence
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { auth, db, storage };
export type { Auth, Firestore, FirebaseStorage };
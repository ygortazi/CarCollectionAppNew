// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
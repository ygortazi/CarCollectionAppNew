import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyBTtTvHtUFARbSjhG50-J9eQV485dCzDCQ",
    authDomain: "car-collection-app.firebaseapp.com",
    projectId: "car-collection-app",
    storageBucket: "car-collection-app.appspot.com",
    messagingSenderId: "370846716399",
    appId: "1:370846716399:web:0faa3623d0ff647d85661a"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function initializeNotifications() {
  try {
    const token = await getToken(messaging);
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}
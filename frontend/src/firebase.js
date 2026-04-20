import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Safety check for Environment Variables
if (!firebaseConfig.apiKey) {
    console.warn("DIQQAT: VITE_FIREBASE_API_KEY topilmadi. Vercel Environment Variables sozlamalarini tekshiring!");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);

// Use initializeFirestore instead of getFirestore to force long polling
let firestoreDb;
try {
    firestoreDb = initializeFirestore(app, {
        experimentalForceLongPolling: true
    });
} catch (e) {
    // If it was already initialized, fallback
    firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();


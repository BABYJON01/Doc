import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJ50E-BD5WMr7OCeXShCRQU9bnAQ_M5Gk",
  authDomain: "doc-kvest.firebaseapp.com",
  projectId: "doc-kvest",
  storageBucket: "doc-kvest.firebasestorage.app",
  messagingSenderId: "538880477160",
  appId: "1:538880477160:web:de376b17b0ce84bf37065d"
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


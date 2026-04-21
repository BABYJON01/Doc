import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALlsmIliQqkdBtF2-JWd-sp98PRa4AuUs",
  authDomain: "doc-zukkolive.firebaseapp.com",
  projectId: "doc-zukkolive",
  storageBucket: "doc-zukkolive.firebasestorage.app",
  messagingSenderId: "553006858391",
  appId: "1:553006858391:web:71764f2ee9b1a0b5c6e9d2"
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


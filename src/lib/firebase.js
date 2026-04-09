import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Try env vars first (works in standard Vite); fall back to known config
// Firebase web API keys are public identifiers — security is via Firestore rules + Auth domain restrictions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDV87v-APxrawegKOSZbJPOOZH_n5zhCvc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hello-staff-ed0a1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hello-staff-ed0a1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hello-staff-ed0a1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "558221662269",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:558221662269:web:f8e6be5347a2df70ad3254",
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;
let firebaseInitError = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  if (import.meta.env.DEV) {
    console.info("[Firebase] Initialized. Project:", firebaseConfig.projectId);
  }
} catch (err) {
  firebaseInitError = err;
  console.error("[Firebase] Initialization failed:", err.message);
}

export { auth, db, storage, googleProvider, firebaseInitError };
export default app;
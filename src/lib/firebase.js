/**
 * firebase.js — Firebase initialization using Vite environment variables.
 *
 * SECURITY NOTE: Firebase web API keys are public-facing identifiers.
 * Real security is enforced via Firestore security rules + Auth domain restrictions.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required config fields
const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
const missingKeys = REQUIRED_KEYS.filter((k) => !firebaseConfig[k]);

let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;
let firebaseInitError = null;

if (missingKeys.length > 0) {
  const msg = `Firebase config missing: ${missingKeys.join(", ")}`;
  console.error("[Firebase]", msg);
  firebaseInitError = new Error(msg);
} else {
  try {
    // Prevent duplicate initialization (hot reload safety)
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
}

export { auth, db, storage, googleProvider, firebaseInitError };
export default app;
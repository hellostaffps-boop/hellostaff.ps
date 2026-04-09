/**
 * firebase.js — Firebase initialization
 *
 * SECURITY NOTE:
 * Firebase web API keys are public-facing identifiers, not secrets.
 * Real security is enforced via:
 *   1. Firestore security rules (firestore.rules)
 *   2. Firebase Auth domain restrictions
 *   3. Google Cloud Console → APIs & Services → Credentials:
 *      Restrict this browser key to:
 *        - https://staffps.com/*
 *        - https://staffps.base44.app/*
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDV87v-APxrawegKOSZbJPOOZH_n5zhCvc",
  authDomain: "hello-staff-ed0a1.firebaseapp.com",
  projectId: "hello-staff-ed0a1",
  storageBucket: "hello-staff-ed0a1.firebasestorage.app",
  messagingSenderId: "558221662269",
  appId: "1:558221662269:web:f8e6be5347a2df70ad3254",
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;
let firebaseInitError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  if (import.meta.env.DEV) {
    console.info("[Firebase] Initialized successfully. Project:", firebaseConfig.projectId);
  }
} catch (err) {
  firebaseInitError = err;
  console.error("[Firebase] Initialization failed:", err.message);
}

export { auth, db, storage, googleProvider, firebaseInitError };
export default app;
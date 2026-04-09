/**
 * firebase.js — Firebase initialization
 *
 * Config is read from VITE_* environment variables when available.
 * Fallback values are kept temporarily while env vars are being confirmed.
 *
 * SECURITY NOTE — API Key Restrictions:
 * Enforce HTTP referrer restrictions for this key in:
 * Google Cloud Console → APIs & Services → Credentials → Browser key
 * Allowed referrers:
 *   - https://staffps.com/*
 *   - https://staffps.base44.app/*
 *
 * Once VITE_* secrets are confirmed working, remove the fallback strings below.
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDV87v-APxrawegKOSZbJPOOZH_n5zhCvc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hello-staff-ed0a1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hello-staff-ed0a1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hello-staff-ed0a1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "558221662269",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:558221662269:web:f8e6be5347a2df70ad3254",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;
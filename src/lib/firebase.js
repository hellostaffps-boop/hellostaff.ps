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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;
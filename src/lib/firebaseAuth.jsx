import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { recordLastLogin } from "@/lib/firestoreService";
import { auth, db, googleProvider, firebaseInitError } from "@/lib/firebase";
import FirebaseErrorScreen from "@/components/FirebaseErrorScreen";

const FirebaseAuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);

  // If Firebase failed to initialize, show error screen instead of crashing
  if (firebaseInitError) {
    return <FirebaseErrorScreen error={firebaseInitError} />;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
        setNeedsRoleSetup(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadUserProfile = async (user) => {
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile({ uid: user.uid, ...data });
        setNeedsRoleSetup(false);
        recordLastLogin(user.uid);
      } else {
        setUserProfile(null);
        setNeedsRoleSetup(true);
      }
    } catch (err) {
      console.error("[Auth] loadUserProfile failed:", err.message);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const signInEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const profile = snap.exists() ? { uid: user.uid, ...snap.data() } : null;
    return { user, profile, needsSetup: !profile };
  };

  const signUpEmail = async (email, password, fullName, role) => {
    const ALLOWED_SIGNUP_ROLES = ["candidate", "employer_owner"];
    if (!ALLOWED_SIGNUP_ROLES.includes(role)) throw new Error("Invalid role selection");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await createUserDoc(cred.user, role, fullName);
    return cred.user;
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const isNewUser = !snap.exists();
    const profile = snap.exists() ? { uid: user.uid, ...snap.data() } : null;
    return { user, isNewUser, profile };
  };

  const completeRoleSetup = async (role) => {
    if (!firebaseUser) return;
    const ALLOWED_SETUP_ROLES = ["candidate", "employer_owner"];
    if (!ALLOWED_SETUP_ROLES.includes(role)) throw new Error("Invalid role selection");
    const fullName = firebaseUser.displayName || firebaseUser.email;
    await createUserDoc(firebaseUser, role, fullName);
    await loadUserProfile(firebaseUser);
  };

  const createUserDoc = async (user, role, fullName) => {
    const uid = user.uid;
    await setDoc(doc(db, "users", uid), {
      uid,
      email: user.email,
      full_name: fullName || user.displayName || "",
      role,
      status: "active",
      preferred_language: "ar",
      created_at: serverTimestamp(),
      last_login_at: serverTimestamp(),
    });

    if (role === "candidate") {
      await setDoc(doc(db, "candidate_profiles", uid), {
        user_id: uid,
        headline: "",
        bio: "",
        city: "",
        phone: "",
        skills: [],
        years_experience: 0,
        preferred_roles: [],
        availability: "flexible",
        cv_url: "",
        profile_completion: 0,
        updated_at: serverTimestamp(),
      });
    } else if (role === "employer_owner") {
      const orgRef = doc(db, "organizations", uid + "_org");
      await setDoc(orgRef, {
        name: fullName ? `${fullName}'s Organization` : "My Organization",
        business_type: "",
        city: "",
        address: "",
        logo_url: "",
        owner_user_id: uid,
        status: "active",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      await setDoc(doc(db, "employer_profiles", uid), {
        user_id: uid,
        organization_id: orgRef.id,
        title: "",
        phone: "",
        is_primary_contact: true,
        updated_at: serverTimestamp(),
      });
      await setDoc(doc(db, "organization_members", uid + "_member"), {
        organization_id: orgRef.id,
        user_id: uid,
        role: "owner",
        status: "active",
        created_at: serverTimestamp(),
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const getRole = () => userProfile?.role || null;

  return (
    <FirebaseAuthContext.Provider value={{
      firebaseUser,
      userProfile,
      loading,
      needsRoleSetup,
      signInEmail,
      signUpEmail,
      signInGoogle,
      completeRoleSetup,
      logout,
      resetPassword,
      getRole,
      reload: () => firebaseUser && loadUserProfile(firebaseUser),
    }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
}
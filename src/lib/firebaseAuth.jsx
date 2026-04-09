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
import { auth, db, googleProvider } from "@/lib/firebase";

const FirebaseAuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Firestore users/{uid}
  const [loading, setLoading] = useState(true);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false); // Google new user has no role yet

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
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setUserProfile({ uid: user.uid, ...data });
      setNeedsRoleSetup(false);

      // Update last login
      await setDoc(ref, { last_login_at: serverTimestamp() }, { merge: true });
    } else {
      setUserProfile(null);
      setNeedsRoleSetup(true);
    }
  };

  const signInEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signUpEmail = async (email, password, fullName, role) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await createUserDoc(cred.user, role, fullName);
    return cred.user;
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    // Check if Firestore doc exists (determines new vs returning user)
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    return { user, isNewUser: !snap.exists() };
  };

  const completeRoleSetup = async (role) => {
    if (!firebaseUser) return;
    const fullName = firebaseUser.displayName || firebaseUser.email;
    await createUserDoc(firebaseUser, role, fullName);
    await loadUserProfile(firebaseUser);
  };

  const createUserDoc = async (user, role, fullName) => {
    const uid = user.uid;
    // Create users/{uid}
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
      // Create employer_profiles/{uid}
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
      // Create organization_members
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
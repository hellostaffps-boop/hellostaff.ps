import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

const SupabaseAuthContext = createContext(null);

// Recovery UI shown if user is authenticated but profile row is missing/broken
function ProfileRecoveryScreen({ onRetry, loading }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/30">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-destructive text-xl">⚠</span>
        </div>
        <h2 className="text-lg font-bold mb-1">Profile Not Found</h2>
        <p className="text-sm text-muted-foreground mb-1">لم يتم العثور على الملف الشخصي</p>
        <p className="text-xs text-muted-foreground mb-6">
          Your account exists but profile data is missing. Please retry or contact support.
          <br />
          حسابك موجود لكن بيانات الملف الشخصي غير موجودة. أعد المحاولة أو تواصل مع الدعم.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "..." : "Retry / إعادة المحاولة"}
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
          >
            Sign Out / خروج
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadProfile = useCallback(async (userId, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        setUserProfile(null);
        setNeedsRoleSetup(true);
        setProfileError(false);
      } else {
        setUserProfile(data);
        setNeedsRoleSetup(false);
        setProfileError(false);
      }
    } catch {
      setUserProfile(null);
      setProfileError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstrap on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setNeedsRoleSetup(false);
        setProfileError(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signInEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    return { user: data.user, profile, needsSetup: !profile };
  };

  const signUpEmail = async (email, password, fullName, role, preferredLanguage = "ar") => {
    const ALLOWED = ["candidate", "employer_owner"];
    if (!ALLOWED.includes(role)) throw new Error("Invalid role selection");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("MISSING_CONFIG: Supabase URL or anon key not configured.");
    if (!supabaseKey.startsWith("eyJ")) throw new Error("INVALID_KEY: Supabase anon key appears invalid (must be a JWT starting with 'eyJ').");

    console.log("[signUpEmail] Attempting Supabase signUp for:", email, "role:", role);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, preferred_language: preferredLanguage },
      },
    });

    if (error) {
      console.error("[signUpEmail] Supabase signUp error:", error);
      throw error;
    }

    console.log("[signUpEmail] Supabase signUp success. User ID:", data.user?.id, "Session:", !!data.session);
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setNeedsRoleSetup(false);
    setProfileError(false);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const completeRoleSetup = async (role) => {
    if (!user) return;
    const ALLOWED = ["candidate", "employer_owner"];
    if (!ALLOWED.includes(role)) throw new Error("Invalid role selection");
    await supabase.auth.updateUser({ data: { role } });
    const fullName = user.user_metadata?.full_name || user.email;
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      preferred_language: user.user_metadata?.preferred_language || "ar",
    });
    await loadProfile(user.id);
  };

  const getRole = () => userProfile?.role || null;

  const handleRetry = async () => {
    if (!user) return;
    setRetrying(true);
    await loadProfile(user.id, { silent: true });
    setRetrying(false);
  };

  // Show recovery screen if authenticated but profile is broken (not just missing)
  if (user && !loading && profileError) {
    return <ProfileRecoveryScreen onRetry={handleRetry} loading={retrying} />;
  }

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        firebaseUser: user, // compat alias — components checking firebaseUser still work
        userProfile,
        loading,
        needsRoleSetup,
        signInEmail,
        signUpEmail,
        logout,
        resetPassword,
        completeRoleSetup,
        getRole,
        reload: () => user && loadProfile(user.id, { silent: true }),
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error("useAuth must be used within SupabaseAuthProvider");
  return ctx;
}

// Compatibility alias — existing pages importing useFirebaseAuth will work unchanged
export const useFirebaseAuth = useAuth;
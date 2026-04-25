import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

const SupabaseAuthContext = createContext(null);

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

function PendingApprovalScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/30">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-accent text-3xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
        <p className="text-muted-foreground mb-1">حسابك قيد المراجعة</p>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Your account is registered but requires review by our moderation team. 
          You will receive an email once your account is approved.
          <br />
          حسابك مسجل لكنه يتطلب مراجعة من قبل فريق الإشراف. 
          ستصلك رسالة بريدية فور الموافقة على حسابك.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
        >
          Logout / تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function DeletionScheduledScreen({ onRestore, loading }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/30">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-destructive text-3xl">🗑</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Account Scheduled for Deletion</h2>
        <p className="text-muted-foreground mb-1">حسابك مجدول للحذف</p>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Your account is currently within the 14-day grace period for deletion. 
          Would you like to restore your account and cancel the deletion?
          <br />
          حسابك حالياً ضمن مهلة الـ 14 يوماً الممنوحة للحذف. 
          هل ترغب في استعادة حسابك وإلغاء عملية الحذف؟
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onRestore}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-accent text-primary font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/10 disabled:opacity-50"
          >
            {loading ? "..." : "Restore Account / استعادة الحساب"}
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Sign Out / تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupabaseAuthProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [retrying, setRetrying]         = useState(false);

  const loadProfile = useCallback(async (userId, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      let { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // If profile not found by ID, try finding by email (handle multi-provider accounts)
      if (!profile && userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: profileByEmail } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", user.email)
            .maybeSingle();
          
          if (profileByEmail) {
            profile = profileByEmail;
            // If ID doesn't match, we should eventually link them, 
            // but for now, just use the profile to prevent stuck onboarding.
          }
        }
      }

      if (profile) {
        // Block permanently deleted users if they somehow bypass trigger (rare)
        if (profile.status === 'deleted') {
           await supabase.auth.signOut();
           return;
        }

        setUserProfile(profile);
        setNeedsRoleSetup(!profile.role);
        setProfileError(false);
      } else if (error?.code === "PGRST116" || !profile) {
        // Profile doesn't exist yet — it may not have been created by trigger yet
        setUserProfile(null);
        setNeedsRoleSetup(true);
        setProfileError(false);
      } else {
        setProfileError(true);
      }
    } catch {
      setProfileError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", data.user.id).single();
    return { user: data.user, profile, needsSetup: !profile };
  };

  const signUpEmail = async (email, password, fullName, role, preferredLanguage = "ar") => {
    const ALLOWED = ["candidate", "employer_owner"];
    if (!ALLOWED.includes(role)) throw new Error("Invalid role selection");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, preferred_language: preferredLanguage },
      },
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setNeedsRoleSetup(false);
    setProfileError(false);
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
    return data;
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

    // Prevent escalations if profile already exists with a different role (sanity check)
    if (userProfile && userProfile.role && userProfile.role !== role) {
       throw new Error("Role already assigned and cannot be changed here");
    }

    await supabase.auth.updateUser({ data: { role } });
    
    const fullName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split("@")[0]
      || user.email;
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      avatar_url: avatarUrl,
      preferred_language: user.user_metadata?.preferred_language || "ar",
      status: 'active' // Ensure status is set
    }, { onConflict: 'id' }); // Conflict should be on ID for security

    if (error) throw error;
    await loadProfile(user.id);
  };

  const deleteAccount = async () => {
    if (!user) return;
    const { error } = await supabase.rpc('schedule_account_deletion');
    if (error) throw error;
    await loadProfile(user.id);
  };

  const restoreAccount = async () => {
    if (!user) return;
    const { error } = await supabase.rpc('restore_account_deletion');
    if (error) throw error;
    await loadProfile(user.id);
  };

  const getRole = () => userProfile?.role || null;

  const handleRetry = async () => {
    if (!user) return;
    setRetrying(true);
    await loadProfile(user.id, { silent: true });
    setRetrying(false);
  };

  if (user && !loading && userProfile?.status === 'pending_approval') {
    return <PendingApprovalScreen />;
  }

  if (user && !loading && userProfile?.status === 'scheduled_for_deletion') {
    return <DeletionScheduledScreen onRestore={restoreAccount} loading={loading} />;
  }

  if (user && !loading && profileError) {
    return <ProfileRecoveryScreen onRetry={handleRetry} loading={retrying} />;
  }

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        needsRoleSetup,
        signInEmail,
        signUpEmail,
        signInWithGoogle,
        logout,
        resetPassword,
        completeRoleSetup,
        deleteAccount,
        restoreAccount,
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
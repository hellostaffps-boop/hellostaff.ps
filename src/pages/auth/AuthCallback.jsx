import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

/**
 * AuthCallback — Handles OAuth redirect from Google.
 * After Google auth, Supabase redirects here with tokens in the URL hash.
 * This page exchanges the tokens, checks/creates profile, and routes accordingly.
 * 
 * SECURITY FIX (2026-04-27):
 * - Added manual profile creation if trigger fails
 * - Increased retry attempts from 6 to 12
 * - Added PKCE code exchange fallback
 * - Better error messages in Arabic
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Try to get session (Supabase auto-parses URL hash for OAuth)
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        // If no session, try PKCE code exchange
        if (!session) {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          if (code) {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && exchangeData?.session) {
              session = exchangeData.session;
            }
          }
        }

        // Still no session? Wait and retry
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            session = retrySession;
          }
        }

        if (!session) {
          throw new Error("لم نتمكن من استعادة الجلسة بعد تسجيل الدخول. يرجى المحاولة مرة أخرى.");
        }

        await routeUser(session.user);
      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        setError(err.message);
        setTimeout(() => navigate("/auth/login", { replace: true }), 4000);
      }
    };

    const routeUser = async (user) => {
      // Poll for profile (trigger might take a moment to create it)
      let profile = null;
      let attempts = 0;
      const maxAttempts = 12;

      while (attempts < maxAttempts) {
        attempts++;
        const { data, error: fetchErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          profile = data;
          break;
        }
        
        // Wait progressively longer (500ms, 600ms, 700ms...)
        await new Promise(r => setTimeout(r, 400 + attempts * 100));
      }

      // If profile still not found after all retries, create it manually
      if (!profile) {
        console.warn("[AuthCallback] Profile not found after retries, creating manually...");
        const displayName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split("@")[0] || "";
        
        const { data: newProfile, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: displayName,
            role: null, // Will be set in RoleCompletion
            preferred_language: "ar",
            status: "active",
          })
          .select()
          .single();
        
        if (createErr) {
          console.error("[AuthCallback] Failed to create profile:", createErr);
          throw new Error("فشل في إنشاء الملف الشخصي. يرجى المحاولة مرة أخرى.");
        }
        
        profile = newProfile;
      }

      // No role set? Redirect to role selection
      if (!profile.role) {
        navigate("/auth/complete-profile", { replace: true });
        return;
      }

      // Route based on role
      if (profile.role === "candidate") {
        navigate("/candidate", { replace: true });
      } else if (profile.role === "employer_owner" || profile.role === "employer_manager") {
        navigate("/employer", { replace: true });
      } else if (profile.role === "platform_admin") {
        navigate("/admin", { replace: true });
      } else {
        // Unknown role, force role selection
        navigate("/auth/complete-profile", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="text-center">
        {error ? (
          <div className="bg-white rounded-2xl border border-border p-8 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">✕</span>
            </div>
            <h2 className="font-bold mb-2">خطأ في المصادقة</h2>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">جارٍ التوجيه لصفحة تسجيل الدخول...</p>
          </div>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">جارٍ تسجيل الدخول...</p>
            <p className="text-xs text-muted-foreground mt-1">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}

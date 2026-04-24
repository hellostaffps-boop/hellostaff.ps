import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

/**
 * AuthCallback — Handles OAuth redirect from Google.
 * After Google auth, Supabase redirects here with tokens in the URL hash.
 * This page exchanges the tokens, checks profile, and routes accordingly.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically parses the URL hash and sets the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          // Wait for onAuthStateChange to fire
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession) {
            throw new Error("No session after OAuth callback");
          }
          return routeUser(retrySession.user);
        }

        await routeUser(session.user);
      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        setError(err.message);
        setTimeout(() => navigate("/auth/login", { replace: true }), 3000);
      }
    };

    const routeUser = async (user) => {
      // Poll for profile (trigger might take a moment)
      let profile = null;
      for (let attempt = 1; attempt <= 6; attempt++) {
        await new Promise(r => setTimeout(r, attempt * 500));
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) { profile = data; break; }
      }

      if (!profile || !profile.role) {
        // New Google user — needs to choose a role
        navigate("/auth/complete-profile", { replace: true });
        return;
      }

      // Existing user with role — route to dashboard
      if (profile.role === "candidate") navigate("/candidate", { replace: true });
      else if (profile.role === "employer_owner" || profile.role === "employer_manager") navigate("/employer", { replace: true });
      else if (profile.role === "platform_admin") navigate("/admin", { replace: true });
      else navigate("/auth/complete-profile", { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="text-center">
        {error ? (
          <div className="bg-white rounded-2xl border border-border p-8 max-w-sm">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">✕</span>
            </div>
            <h2 className="font-bold mb-2">Authentication Error</h2>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting to login...</p>
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

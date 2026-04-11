import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";

function getAuthErrorMessage(message, t) {
  if (!message) return t("authErrors", "generic");
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("wrong password")) return t("authErrors", "invalidCredential");
  if (m.includes("user not found") || m.includes("no user")) return t("authErrors", "userNotFound");
  if (m.includes("too many")) return t("authErrors", "tooManyRequests");
  if (m.includes("invalid email")) return t("authErrors", "invalidEmail");
  return t("authErrors", "generic");
}

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signInEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const routeByRole = (profile) => {
    const role = profile?.role;
    if (role === "candidate") navigate("/candidate", { replace: true });
    else if (role === "employer_owner" || role === "employer_manager") navigate("/employer", { replace: true });
    else if (role === "platform_admin") navigate("/admin", { replace: true });
    else navigate("/auth/complete-profile", { replace: true });
  };

  const isFormValid = email.trim() && password.trim();

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setError("");
    setLoading(true);
    try {
      const { profile, needsSetup } = await signInEmail(email, password);
      if (needsSetup) {
        navigate("/auth/complete-profile", { replace: true });
      } else {
        routeByRole(profile);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err.message, t));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Palestinian landscape background */}
        <img
          src="https://images.unsplash.com/photo-1544967919-c4dfd82caf79?w=1200&q=80"
          alt="Palestine"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/70" />

        {/* Content */}
        <Link to="/" className="relative flex items-center gap-2 z-10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-primary font-bold text-sm">H</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Hello Staff</span>
        </Link>

        <div className="relative z-10">
          <blockquote className="text-white/90 text-lg leading-relaxed italic mb-6">
            "{t("auth", "testimonialQuote")}"
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">S</span>
            </div>
            <div>
              <div className="text-white text-sm font-semibold">{t("auth", "testimonialName")}</div>
              <div className="text-white/70 text-xs">{t("auth", "testimonialRole")}</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-xs">© 2026 Hello Staff</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="absolute top-4 end-4"><LanguageSwitcher /></div>

        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Hello Staff</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{t("auth", "welcomeBack")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("auth", "signInSubtext")}</p>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">{t("auth", "email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth", "emailPlaceholder")}
                className="mt-1.5 h-11"
                disabled={loading}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-sm font-medium">{t("auth", "password")}</Label>
                <Link to="/auth/forgot-password" className="text-xs text-accent hover:underline">
                  {t("auth", "forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth", "passwordPlaceholder")}
                  className="h-11 pe-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90"
              disabled={!isFormValid || loading}
            >
              {loading ? t("common", "loading") : t("auth", "signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth", "noAccount")}{" "}
            <Link to="/auth/signup" className="text-accent font-semibold hover:underline">{t("auth", "signUp")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
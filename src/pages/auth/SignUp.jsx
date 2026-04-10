import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Briefcase, Search } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";
import { cn } from "@/lib/utils";

function getAuthErrorMessage(err, t) {
  if (!err) return t("authErrors", "generic");
  const msg = (err.message || "").toLowerCase();
  const code = err.code || "";

  if (msg.includes("missing_config") || msg.includes("invalid_key") || msg.includes("missing config")) {
    return `\u274C Config error: ${err.message}`;
  }
  if (msg.includes("already registered") || msg.includes("user already") || code === "user_already_exists") {
    return t("authErrors", "emailInUse");
  }
  if (msg.includes("invalid email") || msg.includes("invalid_email")) {
    return t("authErrors", "invalidEmail");
  }
  if (msg.includes("password") || msg.includes("weak")) {
    return t("authErrors", "weakPassword");
  }
  if (msg.includes("signup is disabled") || msg.includes("signups not allowed") || msg.includes("email signups are disabled")) {
    return "\u274C Signup is disabled in Supabase — enable Email provider in Authentication > Providers.";
  }
  if (msg.includes("email provider") || msg.includes("provider is disabled")) {
    return "\u274C Email provider is disabled in your Supabase project.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("networkerror")) {
    return "\u274C Network error — cannot reach Supabase. Check VITE_SUPABASE_URL.";
  }
  if (msg.includes("invalid api key") || msg.includes("apikey") || msg.includes("no api key")) {
    return "\u274C Invalid Supabase API key. Check VITE_SUPABASE_PUBLISHABLE_KEY.";
  }
  // Show raw message so nothing is hidden
  return err.message || t("authErrors", "generic");
}

export default function SignUp() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signUpEmail } = useAuth();
  const [role, setRole] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    { id: "candidate", icon: Search, label: t("auth", "lookingForWork"), desc: t("auth", "lookingForWorkDesc") },
    { id: "employer_owner", icon: Briefcase, label: t("auth", "hiring"), desc: t("auth", "hiringDesc") },
  ];

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!role) { setError(t("authErrors", "selectRole")); return; }
    setError("");
    setLoading(true);
    try {
      await signUpEmail(email, password, fullName, role);
      navigate(role === "candidate" ? "/candidate" : "/employer", { replace: true });
    } catch (err) {
      console.error("[SignUp] handleSignUp error:", err);
      setError(getAuthErrorMessage(err, t));
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 bg-primary flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-primary font-bold text-sm">H</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Hello Staff</span>
        </Link>
        <div className="space-y-6">
          {[
            { num: "2,400+", label: t("hero", "activeJobs") },
            { num: "8,500+", label: t("hero", "workers") },
            { num: "1,200+", label: t("hero", "businesses") },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className="text-3xl font-bold text-white">{s.num}</div>
              <div className="text-white/60 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="text-white/40 text-xs">© 2026 Hello Staff</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auth", "signUpTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("auth", "signUpSubtext")}</p>
          </div>

          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">{t("auth", "accountType")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((opt) => (
                <button key={opt.id} onClick={() => setRole(opt.id)}
                  className={cn("flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-start",
                    role === opt.id ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30")}>
                  <opt.icon className={cn("w-5 h-5", role === opt.id ? "text-accent" : "text-muted-foreground")} />
                  <div>
                    <div className="font-semibold text-sm leading-tight">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">{t("auth", "fullName")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth", "namePlaceholder")} className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label className="text-sm font-medium">{t("auth", "email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth", "emailPlaceholder")} className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label className="text-sm font-medium">{t("auth", "password")}</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth", "passwordPlaceholder")} className="h-11 pe-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={loading || !role}>
              {loading ? t("common", "loading") : t("auth", "signUp")}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {t("auth", "termsText")}{" "}
            <Link to="/terms" className="underline hover:text-foreground">{t("auth", "terms")}</Link>
            {" "}{t("auth", "and")}{" "}
            <Link to="/privacy" className="underline hover:text-foreground">{t("auth", "privacy")}</Link>.
          </p>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth", "hasAccount")}{" "}
            <Link to="/auth/login" className="text-accent font-semibold hover:underline">{t("auth", "signIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
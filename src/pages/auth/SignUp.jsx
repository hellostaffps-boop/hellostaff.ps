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

function getSupabaseSignupError(err) {
  if (!err) return "حدث خطأ غير معروف";
  const msg = err.message?.toLowerCase() || "";
  const status = err.status;

  if (msg.includes("signup") && msg.includes("disabled")) return "التسجيل معطّل في Supabase. تحقق من إعدادات Authentication.";
  if (msg.includes("email") && msg.includes("disabled")) return "مزود البريد الإلكتروني معطّل في Supabase. فعّل Email provider في Dashboard.";
  if (msg.includes("already registered") || msg.includes("user already exists") || msg.includes("duplicate")) return "هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.";
  if (msg.includes("invalid email") || msg.includes("unable to validate")) return "البريد الإلكتروني غير صالح.";
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("short") || msg.includes("least"))) return "كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "طلبات كثيرة جداً. انتظر قليلاً وأعد المحاولة.";
  if (status === 0 || msg.includes("fetch") || msg.includes("network")) return "خطأ في الشبكة. تحقق من اتصالك بالإنترنت.";
  if (msg.includes("supabase") || msg.includes("url") || msg.includes("key") || msg.includes("anon")) return "خطأ في إعداد Supabase (URL أو مفتاح anon). تحقق من المتغيرات البيئية.";
  if (status >= 500) return `خطأ في خادم Supabase (${status}). حاول مجدداً لاحقاً.`;
  // Show raw message as last resort so it's never hidden
  return err.message || "حدث خطأ أثناء إنشاء الحساب.";
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
      console.error("[SignUp] caught error:", err);
      setError(getSupabaseSignupError(err));
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
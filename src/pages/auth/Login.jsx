import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";
import { getPlatformTestimonials } from "@/lib/supabaseService";
import { motion, AnimatePresence } from "framer-motion";

function getAuthErrorMessage(message, t) {
  if (!message) return t("authErrors", "generic");
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("wrong password")) return t("authErrors", "invalidCredential");
  if (m.includes("user not found") || m.includes("no user")) return t("authErrors", "userNotFound");
  if (m.includes("too many")) return t("authErrors", "tooManyRequests");
  if (m.includes("invalid email")) return t("authErrors", "invalidEmail");
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) return "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك والضغط على رابط التأكيد.";
  return t("authErrors", "generic");
}

export default function Login() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { signInEmail, signInWithGoogle, user, userProfile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dynamic Testimonial
  const [testimonial, setTestimonial] = useState(null);

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && user && userProfile?.role) {
      const role = userProfile.role;
      if (role === "candidate") navigate("/candidate", { replace: true });
      else if (role === "employer_owner" || role === "employer_manager") navigate("/employer", { replace: true });
      else if (role === "platform_admin") navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, user, userProfile, navigate]);

  useEffect(() => {
    // Fetch live testimonial on load
    getPlatformTestimonials().then(data => {
      if (data && data.length > 0) {
        // Pick top featured or random
        setTestimonial(data[0]);
      }
    });
  }, []);

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
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Decoration - Cinematic Image */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
      >
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1544967919-c4dfd82caf79?w=1200&q=80"
          alt="Palestine"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-[2px]" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20"
            >
              <span className="text-primary font-bold text-lg">H</span>
            </motion.div>
            <span className="text-white font-bold text-2xl tracking-tighter">Hello Staff</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <blockquote className="text-white text-2xl font-medium leading-snug mb-8">
              "{testimonial?.quote || t("auth", "testimonialQuote")}"
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full ring-2 ring-white/20 p-0.5">
                <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <span className="text-white font-bold">
                    {(testimonial?.profiles?.full_name || t("auth", "testimonialName")).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold">{testimonial?.profiles?.full_name || t("auth", "testimonialName")}</div>
                <div className="text-white/60 text-sm">
                  {testimonial?.profiles?.role === 'employer_owner' ? (isRTL ? "صاحب عمل" : "Employer") : 
                   (testimonial?.profiles?.role === 'candidate' ? (isRTL ? "مرشح" : "Candidate") : 
                   t("auth", "testimonialRole"))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-white/40 text-xs font-medium tracking-widest uppercase">
          © 2026 Hello Staff • Palestinian Hospitality Network
        </div>
      </motion.div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-8 inset-x-8 flex items-center justify-between z-20">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {isRTL ? 'الرجوع' : 'Back'}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            <div className="lg:hidden mb-12 flex justify-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-bold text-lg">H</span>
                </div>
                <span className="font-bold text-xl tracking-tighter">Hello Staff</span>
              </Link>
            </div>

            <div className="mb-10 text-center lg:text-start">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("auth", "welcomeBack")}</h1>
              <p className="text-muted-foreground mt-3">{t("auth", "signInSubtext")}</p>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("auth", "email")}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth", "emailPlaceholder")}
                  className="h-12 rounded-xl border-border/60 bg-secondary/30 focus:bg-background transition-all"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{t("auth", "password")}</Label>
                  <Link to="/auth/forgot-password" size="sm" className="text-xs text-accent font-bold hover:underline">
                    {t("auth", "forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth", "passwordPlaceholder")}
                    className="h-12 rounded-xl pe-12 border-border/60 bg-secondary/30 focus:bg-background transition-all"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive font-medium bg-destructive/5 border border-destructive/10 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-base font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={!isFormValid || loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth", "signIn")}
              </Button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-background px-4 text-muted-foreground">
                  {t("auth", "orContinueWith") || (isRTL ? "أو" : "or")}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setGoogleLoading(true);
                setError("");
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError(err.message);
                  setGoogleLoading(false);
                }
              }}
              disabled={loading || googleLoading}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-3 border-border/60 bg-background hover:bg-secondary/50 transition-all font-bold hover:scale-[1.02] active:scale-[0.98]"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {t("auth", "continueWithGoogle") || (isRTL ? "المتابعة بحساب Google" : "Continue with Google")}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-10">
              {t("auth", "noAccount")}{" "}
              <Link to="/auth/signup" className="text-accent font-bold hover:underline decoration-2 underline-offset-4">{t("auth", "signUp")}</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
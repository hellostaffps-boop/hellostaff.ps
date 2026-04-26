import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Briefcase, Search, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { validatePassword, validatePasswordMatch, validateEmail, validateName, getPasswordStrength } from "@/lib/validationSchemas";
import { getPlatformTestimonials } from "@/lib/supabaseService";
import { motion, AnimatePresence } from "framer-motion";

function getAuthErrorMessage(err, t) {
  if (!err) return t("authErrors", "generic");
  const msg = (err.message || "").toLowerCase();
  const code = err.code || "";

  if (msg.includes("already registered") || msg.includes("user already") || code === "user_already_exists") {
    return t("authErrors", "emailInUse");
  }
  if (msg.includes("invalid email") || msg.includes("invalid_email")) {
    return t("authErrors", "invalidEmail");
  }
  if (msg.includes("password") || msg.includes("weak")) {
    return t("authErrors", "weakPassword");
  }
  return err.message || t("authErrors", "generic");
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function SignUp() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get("role");
  
  const { signUpEmail, signInWithGoogle, user, userProfile, loading: authLoading } = useAuth();
  const [role, setRole] = useState(roleParam || null);
  const isRolePreSelected = !!roleParam;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Dynamic Testimonial
  const [testimonial, setTestimonial] = useState(null);

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && user && userProfile?.role) {
      const r = userProfile.role;
      if (r === "candidate") navigate("/candidate", { replace: true });
      else if (r === "employer_owner" || r === "employer_manager") navigate("/employer", { replace: true });
      else if (r === "platform_admin") navigate("/admin/dashboard", { replace: true });
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

  const roleOptions = [
    { id: "candidate", icon: Search, label: t("auth", "lookingForWork"), desc: t("auth", "lookingForWorkDesc") },
    { id: "employer_owner", icon: Briefcase, label: t("auth", "hiring"), desc: t("auth", "hiringDesc") },
  ];

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!role) { setError(t("authErrors", "selectRole")); return; }

    const lang = isRTL ? "ar" : "en";
    const nameCheck = validateName(fullName, lang);
    const emailCheck = validateEmail(email, lang);
    const passCheck = validatePassword(password, lang);
    const matchCheck = validatePasswordMatch(password, confirmPassword, lang);
    
    const errors = {};
    if (!nameCheck.valid) errors.fullName = nameCheck.error;
    if (!emailCheck.valid) errors.email = emailCheck.error;
    if (!passCheck.valid) errors.password = passCheck.errors[0];
    if (!matchCheck.valid) errors.confirmPassword = matchCheck.error;
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      const { user: newUser, session } = await signUpEmail(email, password, fullName, role);
      
      if (!session) {
        setError("✅ " + (isRTL ? "تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتفعيله." : "Account created! Please check your email to confirm your address before signing in."));
        setLoading(false);
        return;
      }

      // Poll for profile
      for (let attempt = 1; attempt <= 5; attempt++) {
        await new Promise((r) => setTimeout(r, attempt * 400));
        const { data } = await supabase.from("profiles").select("*").eq("id", newUser.id).single();
        if (data) {
          // Direct new users straight to the profile completion pages
          const dest = data.role === "candidate" ? "/candidate/profile/edit" : "/employer/company";
          navigate(dest, { replace: true });
          return;
        }
      }

      setError(isRTL ? "⚠️ تم إنشاء الحساب ولكن فشل إعداد الملف الشخصي تلقائياً. يرجى محاولة تسجيل الدخول." : "⚠️ Account created but profile setup failed. Please try signing in — your account exists.");
    } catch (err) {
      setError(getAuthErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Decoration */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-[40%] bg-primary flex-col justify-between p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-primary font-bold text-xl">H</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tighter">Hello Staff</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white leading-tight"
          >
            {isRTL ? "انضم إلى مجتمع الضيافة الأول في فلسطين" : "Join the #1 Hospitality Network in Palestine"}
          </motion.h2>

          <div className="space-y-8">
            {[
              { num: "2,400+", label: t("hero", "activeJobs") },
              { num: "8,500+", label: t("hero", "workers") },
              { num: "1,200+", label: t("hero", "businesses") },
            ].map((s, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-6"
              >
                <div className="text-4xl font-black text-accent tracking-tighter">{s.num}</div>
                <div className="text-white/70 text-sm font-medium uppercase tracking-widest leading-none">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
            <blockquote className="text-white text-xl font-medium leading-snug mb-6 border-l-4 border-accent pl-4 italic">
              "{testimonial?.quote || t("auth", "testimonialQuote")}"
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full ring-2 ring-white/20 p-0.5">
                <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <span className="text-white font-bold text-sm">
                    {(testimonial?.profiles?.full_name || t("auth", "testimonialName")).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{testimonial?.profiles?.full_name || t("auth", "testimonialName")}</div>
                <div className="text-white/60 text-xs">
                  {testimonial?.profiles?.role === 'employer_owner' ? (isRTL ? "صاحب عمل" : "Employer") : 
                   (testimonial?.profiles?.role === 'candidate' ? (isRTL ? "مرشح" : "Candidate") : 
                   t("auth", "testimonialRole"))}
                </div>
              </div>
            </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs font-medium tracking-widest uppercase italic mt-12">
          Empowering the Palestinian workforce since 2026.
        </div>
      </motion.div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
        <div className="absolute top-8 inset-x-8 flex items-center justify-between z-20">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {isRTL ? 'الرجوع' : 'Back'}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:py-24">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
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

            <motion.div variants={itemVariants} className="mb-10 text-center lg:text-start">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("auth", "signUpTitle")}</h1>
              <p className="text-muted-foreground mt-3">{t("auth", "signUpSubtext")}</p>
            </motion.div>

            {!isRolePreSelected && (
              <motion.div variants={itemVariants} className="mb-8">
                <Label className="text-sm font-bold mb-4 block uppercase tracking-widest text-muted-foreground/80">{t("auth", "accountType")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((opt) => (
                    <button key={opt.id} onClick={() => setRole(opt.id)} type="button"
                      className={cn("flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-center group relative overflow-hidden",
                        role === opt.id ? "border-accent bg-accent/5 ring-4 ring-accent/10" : "border-border/60 hover:border-accent/40 bg-secondary/20")}>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", 
                        role === opt.id ? "bg-accent text-primary" : "bg-background text-muted-foreground group-hover:text-accent")}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 leading-tight group-hover:text-muted-foreground/80">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label className="text-sm font-semibold">{t("auth", "fullName")}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth", "namePlaceholder")} className="h-12 rounded-xl bg-secondary/30 border-border/60" required />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label className="text-sm font-semibold">{t("auth", "email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth", "emailPlaceholder")} className="h-12 rounded-xl bg-secondary/30 border-border/60" required />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label className="text-sm font-semibold">{t("auth", "password")}</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: null})); }}
                    placeholder={t("auth", "passwordPlaceholder")} className={cn("h-12 rounded-xl bg-secondary/30 border-border/60 pe-12", fieldErrors.password && "border-destructive")} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="px-1 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5].map(i => {
                        const score = getPasswordStrength(password).score;
                        const color = getPasswordStrength(password).color;
                        return <div key={i} className={cn("h-1 font-bold flex-1 rounded-full transition-all duration-500", i <= score ? color : "bg-black/5")} />
                      })}
                    </div>
                  </div>
                )}
                {fieldErrors.password && <p className="text-[10px] text-destructive font-bold uppercase mt-1 px-1">{fieldErrors.password}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label className="text-sm font-semibold">{t("auth", "confirmPassword") || (isRTL ? "تأكيد كلمة المرور" : "Confirm Password")}</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(f => ({...f, confirmPassword: null})); }}
                    className={cn("h-12 rounded-xl bg-secondary/30 border-border/60", 
                      fieldErrors.confirmPassword ? "border-destructive" : confirmPassword && password === confirmPassword ? "border-green-500/50 bg-green-50/50" : "")} required />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle2 className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {fieldErrors.confirmPassword && <p className="text-[10px] text-destructive font-bold uppercase mt-1 px-1">{fieldErrors.confirmPassword}</p>}
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-sm text-destructive font-medium">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="pt-2">
                <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-base font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading || !role}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth", "signUp")}
                </Button>
              </motion.div>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-background px-4 text-muted-foreground">{t("auth", "orContinueWith") || (isRTL ? "أو" : "or")}</span>
              </div>
            </div>

            <motion.div variants={itemVariants}>
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
                className="w-full h-12 rounded-xl flex items-center justify-center gap-3 border-border/60 hover:bg-secondary/50 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                {t("auth", "continueWithGoogle") || (isRTL ? "المتابعة بحساب Google" : "Continue with Google")}
              </Button>
            </motion.div>

            <p className="text-center text-[11px] text-muted-foreground mt-8 leading-relaxed max-w-[280px] mx-auto">
              {t("auth", "termsText")}{" "}
              <Link to="/terms" className="font-bold text-foreground hover:underline">{t("auth", "terms")}</Link>
              {" "}{t("auth", "and")}{" "}
              <Link to="/privacy" className="font-bold text-foreground hover:underline">{t("auth", "privacy")}</Link>.
            </p>

            <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-10">
              {t("auth", "hasAccount")}{" "}
              <Link to="/auth/login" className="text-accent font-bold hover:underline decoration-2 underline-offset-4">{t("auth", "signIn")}</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";

export default function ForgotPassword() {
  const { t, isRTL } = useLanguage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/30">
      <div className="absolute top-4 end-4"><LanguageSwitcher /></div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border p-8 sm:p-10 shadow-sm">
          <div className="mb-6">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">H</span>
              </div>
              <span className="font-semibold text-base tracking-tight">Hello Staff</span>
            </Link>

            {!sent ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{t("auth", "forgotTitle")}</h1>
                <p className="text-sm text-muted-foreground mt-2">{t("auth", "forgotSubtext")}</p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">{t("auth", "resetEmailSent")}</h1>
                <p className="text-sm text-muted-foreground mt-2">{t("auth", "resetEmailDesc")}</p>
              </div>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-sm font-medium">{t("auth", "email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth", "emailPlaceholder")} className="mt-1.5 h-11" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? t("common", "loading") : t("auth", "sendResetLink")}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isRTL ? null : <ArrowLeft className="w-3.5 h-3.5" />}
              {t("auth", "backToSignIn")}
              {isRTL ? <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> : null}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
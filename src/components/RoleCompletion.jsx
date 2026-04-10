import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { cn } from "@/lib/utils";

export default function RoleCompletion() {
  const { t } = useLanguage();
  const { completeRoleSetup, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const options = [
    { id: "candidate", icon: Search, label: t("auth", "lookingForWork"), desc: t("auth", "lookingForWorkDesc") },
    { id: "employer_owner", icon: Briefcase, label: t("auth", "hiring"), desc: t("auth", "hiringDesc") },
  ];

  const handleContinue = async () => {
    if (!role) return;
    setLoading(true);
    setError("");
    try {
      await completeRoleSetup(role);
      navigate(role === "candidate" ? "/candidate" : "/employer", { replace: true });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/30">
      <div className="w-full max-w-md bg-white rounded-2xl border border-border p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{t("auth", "accountType")}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {user?.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRole(opt.id)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-start",
                role === opt.id ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"
              )}
            >
              <opt.icon className={cn("w-5 h-5", role === opt.id ? "text-accent" : "text-muted-foreground")} />
              <div>
                <div className="font-semibold text-sm leading-tight">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <Button className="w-full h-11 bg-primary hover:bg-primary/90" onClick={handleContinue} disabled={!role || loading}>
          {loading ? t("common", "loading") : t("common", "next")}
        </Button>
      </div>
    </div>
  );
}
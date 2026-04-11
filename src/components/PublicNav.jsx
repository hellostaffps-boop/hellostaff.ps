import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const isEmployer = role === "employer_owner" || role === "employer_manager";
  const isCandidate = role === "candidate";
  const isLoggedIn = !!role;
  const dashboardPath = isEmployer ? "/employer" : isCandidate ? "/candidate" : "/";

  const links = [
    { label: t("nav", "browseJobs"), path: "/jobs" },
    { label: t("nav", "about"), path: "/about" },
    { label: t("nav", "contact"), path: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Hello Staff
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.path
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Link to={dashboardPath}>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t("nav", "dashboard") || "لوحة التحكم"}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm">{t("nav", "signIn")}</Button>
                </Link>
                <Link to="/auth/signup">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("nav", "postJob")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
              {isLoggedIn ? (
                <Link to={dashboardPath} onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("nav", "dashboard") || "لوحة التحكم"}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">{t("nav", "signIn")}</Button>
                  </Link>
                  <Link to="/auth/signup" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      {t("nav", "postJob")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
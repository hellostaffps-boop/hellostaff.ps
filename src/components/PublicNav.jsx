import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabaseClient";
import NotificationDrawer from "@/components/NotificationDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/context/SettingsContext";
import { Moon, Sun } from "lucide-react";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { userProfile, user } = useAuth();
  const role = userProfile?.role;
  const isEmployer = role === "employer_owner" || role === "employer_manager";
  const isCandidate = role === "candidate";
  const isAdmin = role === "platform_admin";
  const isLoggedIn = !!user;
  const dashboardPath = isAdmin ? "/admin/dashboard" : isEmployer ? "/employer" : isCandidate ? "/candidate" : "/";

  // Notification count for logged-in users
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();

  useEffect(() => {
    if (!user?.email) return;

    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_email', user.email)
      .eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0));

    const channel = supabase
      .channel('public-nav-notifs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${user.email}`
      }, () => {
        supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('user_email', user.email)
          .eq('read', false)
          .then(({ count }) => setUnreadCount(count || 0));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.email]);

  const links = [
    { label: t("nav", "browseJobs"), path: "/jobs" },
    { label: t("nav", "companies"), path: "/companies" },
    { label: t("nav", "latestNews"), path: "/news" },
    { label: t("nav", "academy"), path: "/academy" },
    { label: t("nav", "store"), path: "/store" },
    { label: t("nav", "about"), path: "/about" },
    { label: t("nav", "contact"), path: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={settings?.logo_url || "/logo.png"} alt="Hello Staff Logo" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-lg tracking-tight text-foreground" style={{ fontFamily: settings?.font_family ? `"${settings.font_family}", sans-serif` : undefined }}>
              Hello Staff
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              if (link.path === "/jobs") {
                return (
                  <div key={link.path} className="relative group">
                    <Link
                      to={link.path}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        location.pathname === link.path
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {link.label}
                      <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                    </Link>
                    <div className="absolute top-full start-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 translate-y-2 group-hover:translate-y-0">
                      <div className="w-[350px] bg-white dark:bg-card border border-border rounded-xl shadow-xl p-4 grid grid-cols-2 gap-2">
                        <div className="col-span-2 text-xs font-bold text-muted-foreground mb-1 px-2 uppercase">{t("categories", "heading")}</div>
                        <Link to="/jobs?type=barista" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/80 transition-colors">
                          <div className="w-8 h-8 rounded-md bg-primary/5 text-primary flex items-center justify-center font-bold">B</div>
                          <div className="text-sm font-medium">{t("categories", "barista")}</div>
                        </Link>
                        <Link to="/jobs?type=chef" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/80 transition-colors">
                          <div className="w-8 h-8 rounded-md bg-primary/5 text-primary flex items-center justify-center font-bold">C</div>
                          <div className="text-sm font-medium">{t("categories", "chef")}</div>
                        </Link>
                        <Link to="/jobs?type=waiter" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/80 transition-colors">
                          <div className="w-8 h-8 rounded-md bg-primary/5 text-primary flex items-center justify-center font-bold">W</div>
                          <div className="text-sm font-medium">{t("categories", "waiter")}</div>
                        </Link>
                        <Link to="/jobs?type=restaurant_manager" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/80 transition-colors">
                          <div className="w-8 h-8 rounded-md bg-primary/5 text-primary flex items-center justify-center font-bold">M</div>
                          <div className="text-sm font-medium">{t("categories", "manager")}</div>
                        </Link>
                        <div className="col-span-2 mt-2 pt-3 border-t border-border">
                          <Link to="/jobs" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors flex items-center justify-center w-full py-1">
                            {t("dashboard", "browseAll")} &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
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
            )})}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <LanguageSwitcher />
            {isLoggedIn ? (
              <>
                <NotificationDrawer
                  trigger={
                    <Button variant="ghost" size="icon" className="relative group">
                      <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-300">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  }
                />
                <Link to={dashboardPath}>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("nav", "dashboard") || "لوحة التحكم"}
                  </Button>
                </Link>
              </>
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

          {/* Mobile: bell + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            {isLoggedIn && (
              <NotificationDrawer
                trigger={
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                }
              />
            )}
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg hover:bg-secondary"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
              <div className="flex justify-center gap-2 pb-1">
                <Button variant="outline" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <LanguageSwitcher />
              </div>
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
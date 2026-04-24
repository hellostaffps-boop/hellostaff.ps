import { Menu, Bell, Home, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";
import NotificationDrawer from "./NotificationDrawer";


export default function AppTopbar({ onMenuClick, notificationsPath, unreadCount = 0 }) {
  const { logout } = useAuth();
  const { lang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="h-16 border-b border-border/50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 glass-card modern-shadow">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Link to="/" className="hidden sm:block">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            <span className="text-xs font-medium">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </Button>
        </Link>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <LanguageSwitcher compact />
        
        <NotificationDrawer 
          trigger={
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-300">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          }
        />

        <div className="flex items-center gap-2 pl-2 border-l border-border/50 ml-2">
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">{lang === 'ar' ? 'خروج' : 'Logout'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
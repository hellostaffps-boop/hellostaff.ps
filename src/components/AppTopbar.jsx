import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AppTopbar({ onMenuClick, notificationsPath, unreadCount = 0 }) {
  return (
    <header className="h-16 border-b border-border bg-white/80 backdrop-blur-lg flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        {notificationsPath && (
          <Link to={notificationsPath}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        )}
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">U</span>
        </div>
      </div>
    </header>
  );
}
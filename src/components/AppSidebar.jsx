import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/context/SettingsContext";

export default function AppSidebar({ links, title, open, onClose }) {
  const location = useLocation();
  const { isRTL } = useLanguage();
  const { settings } = useSettings();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 start-0 z-50 h-full w-64 bg-background/50 backdrop-blur-xl border-e border-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src={settings?.logo_url || "/logo.png"} alt="Logo" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-sm tracking-tight" style={{ fontFamily: settings?.font_family ? `"${settings.font_family}", sans-serif` : undefined }}>{title}</span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 sm:px-3 sm:py-2.5 text-sm font-medium rounded-xl sm:rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="flex-1">{link.label}</span>
                  {link.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Hello Staff © 2026
          </div>
        </div>
      </aside>
    </>
  );
}
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function MobileBottomNav({ links }) {
  const location = useLocation();

  // Show only the first 5 links in the bottom bar
  const mainLinks = links.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border safe-area-pb">
      <div className="flex items-stretch h-16">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 px-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {link.badge > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight truncate max-w-full px-0.5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {link.label}
              </span>
              {isActive && (
                <span className="absolute top-0 inset-x-2 h-0.5 rounded-b-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
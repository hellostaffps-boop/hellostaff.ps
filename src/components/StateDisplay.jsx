import { AlertCircle, Inbox, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Unified state display component for loading, empty, error, and access-denied states
 */
export default function StateDisplay({ state = "loading", icon: Icon, title, description, actionLabel, onAction, details }) {
  const isArabic = document.documentElement.getAttribute("lang") === "ar";

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-10 h-10 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground mt-4">{isArabic ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        {Icon && <Icon className="w-16 h-16 text-secondary mb-4" />}
        <h3 className="font-semibold text-base mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg border border-destructive/30 bg-destructive/5">
        <AlertCircle className="w-12 h-12 text-destructive mb-3" />
        <h3 className="font-semibold text-base text-destructive mb-2">{title || (isArabic ? "حدث خطأ" : "Error occurred")}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
        {details && <pre className="text-xs text-destructive bg-white/50 rounded p-3 mb-4 max-w-sm text-left whitespace-pre-wrap">{details}</pre>}
        {actionLabel && onAction && (
          <Button size="sm" variant="outline" onClick={onAction} className="gap-2">
            <RefreshCw className="w-3 h-3" />
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  if (state === "access-denied") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Lock className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-base mb-2">{title || (isArabic ? "الوصول مرفوض" : "Access Denied")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description || (isArabic ? "ليس لديك إذن للوصول إلى هذا المحتوى" : "You don't have permission to access this content")}</p>
      </div>
    );
  }

  return null;
}
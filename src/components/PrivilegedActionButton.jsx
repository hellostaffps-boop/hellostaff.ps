/**
 * PrivilegedActionButton — Phase 4.2
 *
 * A safe UI wrapper for admin privileged actions.
 *
 * Behaviors:
 * - Shows loading state while executing.
 * - On BACKEND_NOT_DEPLOYED error: shows a clear "requires backend" message.
 * - On PERMISSION_DENIED: shows access denied.
 * - On success: calls onSuccess callback.
 * - Never optimistically mutates data without backend confirmation.
 * - Never fakes success.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ServerCrash, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  isBackendNotDeployed,
  isPrivilegedSuccess,
  mapPrivilegedErrorToMessage,
} from "@/lib/backend/privilegedActionService";

export default function PrivilegedActionButton({
  label,
  labelAr,
  confirmLabel,
  confirmLabelAr,
  variant = "default",
  size = "sm",
  action,           // async function: () => Promise<result>
  onSuccess,        // called with result.data on success
  onError,          // called with { errorCode, message } on failure
  disabled = false,
  className = "",
}) {
  const { lang } = useLanguage();
  const [state, setState] = useState("idle"); // idle | confirming | loading | success | error | backend_unavailable
  const [errorInfo, setErrorInfo] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const displayLabel = lang === "ar" ? (labelAr || label) : label;
  const displayConfirm = lang === "ar" ? (confirmLabelAr || confirmLabel || "Confirm") : (confirmLabel || "Confirm");

  const handleClick = () => {
    if (confirmLabel) {
      setConfirming(true);
    } else {
      execute();
    }
  };

  const execute = async () => {
    setConfirming(false);
    setState("loading");
    setErrorInfo(null);

    const result = await action();

    if (isPrivilegedSuccess(result)) {
      setState("success");
      if (onSuccess) onSuccess(result.data);
      setTimeout(() => setState("idle"), 2500);
    } else if (isBackendNotDeployed(result)) {
      setState("backend_unavailable");
      setErrorInfo(result);
      if (onError) onError(result);
    } else {
      setState("error");
      setErrorInfo(result);
      if (onError) onError(result);
      setTimeout(() => setState("idle"), 4000);
    }
  };

  if (state === "loading") {
    return (
      <Button size={size} variant={variant} disabled className={className}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {lang === "ar" ? "جارٍ التنفيذ..." : "Executing..."}
      </Button>
    );
  }

  if (state === "success") {
    return (
      <Button size={size} variant="outline" disabled className={`text-green-600 border-green-200 ${className}`}>
        <CheckCircle className="w-3.5 h-3.5" />
        {lang === "ar" ? "تم بنجاح" : "Done"}
      </Button>
    );
  }

  if (state === "backend_unavailable") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <ServerCrash className="w-3.5 h-3.5 shrink-0" />
          <span>{lang === "ar" ? "يتطلب تنفيذًا آمنًا على الخادم" : "Requires secure backend execution"}</span>
        </div>
        <button
          onClick={() => setState("idle")}
          className="text-xs text-muted-foreground hover:underline text-start"
        >
          {lang === "ar" ? "إغلاق" : "Dismiss"}
        </button>
      </div>
    );
  }

  if (state === "error" && errorInfo) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{mapPrivilegedErrorToMessage(errorInfo.errorCode, lang)}</span>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button size={size} variant="destructive" onClick={execute} className={className}>
          {displayConfirm}
        </Button>
        <Button size={size} variant="ghost" onClick={() => setConfirming(false)}>
          {lang === "ar" ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {displayLabel}
    </Button>
  );
}
import { ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";

/**
 * AccessDenied — bilingual, polished forbidden/access-denied state.
 * Use when a user is authenticated but lacks permission for the requested resource.
 */
export default function AccessDenied({ message, variant = "forbidden" }) {
  const { t, lang } = useLanguage();
  const { userProfile } = useFirebaseAuth();
  const navigate = useNavigate();

  const isAr = lang === "ar";

  const copy = {
    forbidden: {
      title: isAr ? "غير مصرح بالدخول" : "Access Denied",
      desc: message || (isAr
        ? "ليس لديك صلاحية للوصول إلى هذه الصفحة."
        : "You don't have permission to access this page."),
    },
    notFound: {
      title: isAr ? "السجل غير موجود" : "Not Found",
      desc: message || (isAr
        ? "السجل الذي تبحث عنه غير موجود أو تم حذفه."
        : "The record you are looking for does not exist or has been removed."),
    },
    privileged: {
      title: isAr ? "إجراء يتطلب صلاحيات خاصة" : "Privileged Action Required",
      desc: message || (isAr
        ? "هذا الإجراء يتطلب تنفيذه من خلال الخادم. سيتم تفعيله قريباً."
        : "This action requires server-side privileges and is not yet available from the client."),
    },
    loading: {
      title: isAr ? "جارٍ التحقق من الصلاحيات" : "Verifying access",
      desc: isAr ? "يرجى الانتظار..." : "Please wait...",
    },
  };

  const { title, desc } = copy[variant] || copy.forbidden;
  const icon = variant === "privileged" ? Lock : ShieldAlert;
  const IconComponent = icon;

  const handleBack = () => {
    const role = userProfile?.role;
    if (role === "candidate") navigate("/candidate");
    else if (role === "employer_owner" || role === "employer_manager") navigate("/employer");
    else if (role === "platform_admin") navigate("/admin");
    else navigate("/");
  };

  if (variant === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconComponent className="w-7 h-7 text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{desc}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleBack}>
        {isAr ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
      </Button>
    </div>
  );
}
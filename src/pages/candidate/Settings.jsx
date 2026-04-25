import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { saveCandidateProfile } from "@/lib/supabaseService";
import { toast } from "sonner";
import TestimonialSubmitBox from "@/components/TestimonialSubmitBox";

export default function Settings() {
  const { t, lang } = useLanguage();
  const { user, userProfile, logout, deleteAccount } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.full_name || userProfile?.candidate_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await saveCandidateProfile(user.id, user.email, { full_name: fullName });
    toast.success(t("common", "save"));
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title={t("settings", "title")} description={t("settings", "subtext")} />

      <div className="max-w-2xl space-y-8">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-base mb-5">{t("settings", "account")}</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{t("settings", "email")}</Label>
              <Input disabled value={user?.email || ""} className="mt-1.5 bg-secondary/50" />
            </div>
            <div>
              <Label className="text-sm">{t("settings", "fullName")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder={t("settings", "fullNamePlaceholder")} className="mt-1.5" />
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t("common", "loading") : t("common", "save")}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-base mb-5">{t("settings", "notificationsSection")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t("settings", "emailNotifications")}</div>
                <div className="text-xs text-muted-foreground">{t("settings", "emailNotificationsDesc")}</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t("settings", "jobAlerts")}</div>
                <div className="text-xs text-muted-foreground">{t("settings", "jobAlertsDesc")}</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t("settings", "marketingEmails")}</div>
                <div className="text-xs text-muted-foreground">{t("settings", "marketingEmailsDesc")}</div>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <TestimonialSubmitBox userProfile={userProfile} isAr={lang === 'ar'} />

        <div className="bg-white rounded-2xl border border-destructive/20 p-6">
          <h2 className="font-semibold text-base mb-2 text-destructive">{t("settings", "dangerZone")}</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {lang === 'ar' 
              ? "حذف حسابك وجميع البيانات المرتبطة به. سيتم منحك مهلة 14 يوماً للتراجع قبل الحذف النهائي." 
              : "Delete your account and all associated data. You will have a 14-day grace period to cancel the deletion."}
          </p>
          <div className="flex gap-3">
             <Button 
                variant="destructive" 
                size="sm" 
                onClick={async () => {
                   if (confirm(lang === 'ar' ? "هل أنت متأكد من رغبتك في حذف الحساب؟" : "Are you sure you want to delete your account?")) {
                      try {
                        await deleteAccount();
                        toast.success(lang === 'ar' ? "تم جدولة حذف الحساب بنجاح." : "Account deletion scheduled successfully.");
                      } catch (err) {
                        toast.error(lang === 'ar' ? "فشل طلب الحذف." : "Failed to schedule deletion.");
                      }
                   }
                }}
             >
                {t("settings", "deleteAccount") || (lang === 'ar' ? "حذف الحساب" : "Delete Account")}
             </Button>
             <Button variant="outline" size="sm" onClick={logout}>{t("auth", "signOut")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
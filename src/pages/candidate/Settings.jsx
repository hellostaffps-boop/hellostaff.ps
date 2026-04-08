import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader title={t("settings", "title")} description={t("settings", "subtext")} />

      <div className="max-w-2xl space-y-8">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-base mb-5">{t("settings", "account")}</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{t("settings", "email")}</Label>
              <Input disabled placeholder={t("settings", "emailPlaceholder")} className="mt-1.5 bg-secondary/50" />
            </div>
            <div>
              <Label className="text-sm">{t("settings", "fullName")}</Label>
              <Input placeholder={t("settings", "fullNamePlaceholder")} className="mt-1.5" />
            </div>
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

        <div className="bg-white rounded-2xl border border-destructive/20 p-6">
          <h2 className="font-semibold text-base mb-2 text-destructive">{t("settings", "dangerZone")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("settings", "dangerZoneDesc")}</p>
          <Button variant="destructive" size="sm">{t("settings", "deleteAccount")}</Button>
        </div>
      </div>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";

export default function Notifications() {
  const { t } = useLanguage();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Notification.filter({ user_email: user.email }, "-created_date");
    },
  });

  return (
    <div>
      <PageHeader title={t("notifications", "title")} description={t("notifications", "subtext")} />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t("notifications", "noNotifications")}
          description={t("notifications", "noNotificationsDesc")}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`bg-white rounded-xl border border-border p-4 ${!n.read ? "border-s-4 border-s-accent" : ""}`}>
              <div className="font-medium text-sm">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(n.created_date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
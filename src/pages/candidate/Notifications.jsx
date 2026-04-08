import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function Notifications() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Notification.filter({ user_email: user.email }, "-created_date");
    },
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Stay updated on your applications and jobs" />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You'll receive notifications when there's activity on your applications."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`bg-white rounded-xl border border-border p-4 ${!n.read ? "border-l-4 border-l-accent" : ""}`}>
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
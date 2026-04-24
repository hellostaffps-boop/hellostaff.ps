import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/supabaseService";


export default function EmployerNotifications() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["my-notifications", user?.email],
    queryFn: () => getNotifications(user.email),
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader title={t("notifications", "title")} description={t("notifications", "subtext")}>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead(user.email).then(() => queryClient.invalidateQueries({ queryKey: ["my-notifications"] }))}
            className="text-xs text-accent font-medium hover:underline">
            Mark all as read
          </button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t("notifications", "noNotifications")}
          description={t("notifications", "noNotificationsDesc")} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id}
              className={`bg-white rounded-xl border border-border p-4 cursor-pointer transition-colors hover:bg-secondary/30 ${
                !n.read ? "border-s-4 border-s-accent" : ""
              }`}
              onClick={() => !n.read && markRead.mutate(n.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm">{n.title}</div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
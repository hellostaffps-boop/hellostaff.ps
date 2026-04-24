import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabaseClient";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import MobileBottomNav from "./MobileBottomNav";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LayoutDashboard,
  User,
  Search,
  Bookmark,
  FileText,
  Bell,
  Settings,
  FilePen,
} from "lucide-react";

export default function CandidateLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    // Initial fetch
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_email', user.email)
      .eq('read', false)
      .then(({ count }) => {
        setUnreadCount(count || 0);
      });

    // Real-time subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_email=eq.${user.email}`
      }, () => {
        supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('user_email', user.email)
          .eq('read', false)
          .then(({ count }) => {
            setUnreadCount(count || 0);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email]);
  const { t } = useLanguage();

  const links = [
    { label: t("dashboard", "candidateTitle"), path: "/candidate", icon: LayoutDashboard },
    { label: t("dashboard", "myProfile"), path: "/candidate/profile", icon: User },
    { label: t("dashboard", "browseJobs"), path: "/candidate/jobs", icon: Search },
    { label: t("dashboard", "savedJobs"), path: "/candidate/saved", icon: Bookmark },
    { label: t("dashboard", "applications"), path: "/candidate/applications", icon: FileText },
    { label: t("dashboard", "notifications"), path: "/candidate/notifications", icon: Bell, badge: unreadCount },
    { label: "CV Builder", path: "/candidate/cv-builder", icon: FilePen },
    { label: t("dashboard", "settings"), path: "/candidate/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar
        links={links}
        title={t("dashboard", "candidateRole")}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationsPath="/candidate/notifications"
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>
        <MobileBottomNav links={links} />
      </div>
    </div>
  );
}
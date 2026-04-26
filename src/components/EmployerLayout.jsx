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
  Building2,
  PlusCircle,
  Briefcase,
  FileText,
  Users,
  Bell,
  Settings,
  CreditCard,
  BarChart3,
} from "lucide-react";

export default function EmployerLayout() {
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
  const { t, lang } = useLanguage();

  const links = [
    { label: t("dashboard", "employerTitle"), path: "/employer", icon: LayoutDashboard },
    { label: t("dashboard", "companyProfile"), path: "/employer/company", icon: Building2 },
    { label: t("dashboard", "postJob"), path: "/employer/post-job", icon: PlusCircle },
    { label: t("dashboard", "manageJobs"), path: "/employer/jobs", icon: Briefcase },
    { label: t("dashboard", "applications"), path: "/employer/applications", icon: FileText },
    { label: lang === "ar" ? "لوحة التوظيف" : "Pipeline", path: "/employer/pipeline", icon: Users },
    { label: t("dashboard", "team"), path: "/employer/team", icon: Users },
    { label: lang === "ar" ? "التحليلات" : "Analytics", path: "/employer/analytics", icon: BarChart3 },
    { label: t("dashboard", "notifications"), path: "/employer/notifications", icon: Bell, badge: unreadCount },
    { label: t("dashboard", "pricing") || (lang === "ar" ? "الاشتراك" : "Pricing"), path: "/employer/pricing", icon: CreditCard },
    { label: t("dashboard", "settings"), path: "/employer/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar
        links={links}
        title={t("dashboard", "employerRole")}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationsPath="/employer/notifications"
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
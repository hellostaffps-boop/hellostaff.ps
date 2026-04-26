import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  FlaskConical,
  CreditCard,
  Wallet,
  MessageSquareQuote,
  ShieldCheck,
  Bell,
  Send,
  Palette,
} from "lucide-react";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  useEffect(() => {
    if (!user?.email) return;

    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_email', user.email)
      .eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0));

    const channel = supabase
      .channel('admin:notifications')
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
          .then(({ count }) => setUnreadCount(count || 0));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.email]);


  const links = [
    { label: t("dashboard", "adminTitle"), path: "/admin", icon: LayoutDashboard },
    { label: t("dashboard", "users"), path: "/admin/users", icon: Users },
    { label: isAr ? "المشرفون" : "Admins", path: "/admin/admins", icon: ShieldCheck },
    { label: t("dashboard", "organizations"), path: "/admin/organizations", icon: Building2 },
    { label: isAr ? "الوظائف والطلبات" : "Jobs & Applications", path: "/admin/jobs", icon: Briefcase },
    { label: isAr ? "آراء المشتركين" : "Testimonials", path: "/admin/testimonials", icon: MessageSquareQuote },
    { label: t("dashboard", "reports"), path: "/admin/reports", icon: BarChart3 },
    { label: isAr ? "الاشتراكات" : "Subscriptions", path: "/admin/subscriptions", icon: CreditCard },
    { label: isAr ? "إعدادات الدفع" : "Payment Settings", path: "/admin/payment-settings", icon: Wallet },
    { label: isAr ? "أدوات تجريبية" : "Demo Tools", path: "/admin/demo", icon: FlaskConical },
    { label: isAr ? "رسالة جماعية" : "Broadcast", path: "/admin/broadcast", icon: Send },
    { label: isAr ? "الأكاديمية" : "Academy", path: "/admin/academy", icon: FileText },
    { label: isAr ? "المتجر" : "Store", path: "/admin/store", icon: Building2 },
    { label: isAr ? "الأخبار" : "News", path: "/admin/news", icon: MessageSquareQuote },
    { label: isAr ? "الهوية البصرية" : "Branding", path: "/admin/branding", icon: Palette },
    { label: isAr ? "إدارة الشارات" : "Badges", path: "/admin/badges", icon: ShieldCheck },
    { label: isAr ? "سجل الحركات" : "Audit Logs", path: "/admin/logs", icon: FileText },
    { label: isAr ? "الإشعارات" : "Notifications", path: "/admin/notifications", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar
        links={links}
        title={t("dashboard", "adminRole")}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationsPath="/admin/notifications"
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
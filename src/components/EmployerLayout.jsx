import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
} from "lucide-react";

export default function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { firebaseUser } = useFirebaseAuth();

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', firebaseUser.uid),
      where('is_read', '==', false)
    );
    return onSnapshot(q, (snap) => setUnreadCount(snap.size));
  }, [firebaseUser?.uid]);
  const { t } = useLanguage();

  const links = [
    { label: t("dashboard", "employerTitle"), path: "/employer", icon: LayoutDashboard },
    { label: t("dashboard", "companyProfile"), path: "/employer/company", icon: Building2 },
    { label: t("dashboard", "postJob"), path: "/employer/post-job", icon: PlusCircle },
    { label: t("dashboard", "manageJobs"), path: "/employer/jobs", icon: Briefcase },
    { label: t("dashboard", "applications"), path: "/employer/applications", icon: FileText },
    { label: t("dashboard", "team"), path: "/employer/team", icon: Users },
    { label: t("dashboard", "notifications"), path: "/employer/notifications", icon: Bell, badge: unreadCount },
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
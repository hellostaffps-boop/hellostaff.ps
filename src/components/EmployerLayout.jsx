import { Outlet } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
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
  const { t } = useLanguage();

  const links = [
    { label: t("dashboard", "employerTitle"), path: "/employer", icon: LayoutDashboard },
    { label: t("dashboard", "companyProfile"), path: "/employer/company", icon: Building2 },
    { label: t("dashboard", "postJob"), path: "/employer/post-job", icon: PlusCircle },
    { label: t("dashboard", "manageJobs"), path: "/employer/jobs", icon: Briefcase },
    { label: t("dashboard", "applications"), path: "/employer/applications", icon: FileText },
    { label: t("dashboard", "team"), path: "/employer/team", icon: Users },
    { label: t("dashboard", "notifications"), path: "/employer/notifications", icon: Bell },
    { label: t("dashboard", "settings"), path: "/employer/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar
        links={links}
        title="Employer"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationsPath="/employer/notifications"
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import { Outlet } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  const links = [
    { label: t("dashboard", "adminTitle"), path: "/admin", icon: LayoutDashboard },
    { label: t("dashboard", "users"), path: "/admin/users", icon: Users },
    { label: t("dashboard", "organizations"), path: "/admin/organizations", icon: Building2 },
    { label: t("dashboard", "jobs"), path: "/admin/jobs", icon: Briefcase },
    { label: t("dashboard", "applications"), path: "/admin/applications", icon: FileText },
    { label: t("dashboard", "reports"), path: "/admin/reports", icon: BarChart3 },
    { label: t("dashboard", "settings"), path: "/admin/settings", icon: Settings },
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
        <AppTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
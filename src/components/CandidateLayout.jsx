import { Outlet } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LayoutDashboard,
  User,
  Search,
  Bookmark,
  FileText,
  Bell,
  Settings,
} from "lucide-react";

export default function CandidateLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  const links = [
    { label: t("dashboard", "candidateTitle"), path: "/candidate", icon: LayoutDashboard },
    { label: t("dashboard", "myProfile"), path: "/candidate/profile", icon: User },
    { label: t("dashboard", "browseJobs"), path: "/candidate/jobs", icon: Search },
    { label: t("dashboard", "savedJobs"), path: "/candidate/saved", icon: Bookmark },
    { label: t("dashboard", "applications"), path: "/candidate/applications", icon: FileText },
    { label: t("dashboard", "notifications"), path: "/candidate/notifications", icon: Bell },
    { label: t("dashboard", "settings"), path: "/candidate/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar
        links={links}
        title="Candidate"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationsPath="/candidate/notifications"
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
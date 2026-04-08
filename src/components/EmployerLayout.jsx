import { Outlet } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
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

const links = [
  { label: "Dashboard", path: "/employer/dashboard", icon: LayoutDashboard },
  { label: "Company Profile", path: "/employer/company", icon: Building2 },
  { label: "Post a Job", path: "/employer/post-job", icon: PlusCircle },
  { label: "Manage Jobs", path: "/employer/jobs", icon: Briefcase },
  { label: "Applications", path: "/employer/applications", icon: FileText },
  { label: "Team Members", path: "/employer/team", icon: Users },
  { label: "Notifications", path: "/employer/notifications", icon: Bell },
  { label: "Settings", path: "/employer/settings", icon: Settings },
];

export default function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
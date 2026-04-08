import { Outlet } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import {
  LayoutDashboard,
  User,
  Search,
  Bookmark,
  FileText,
  Bell,
  Settings,
} from "lucide-react";

const links = [
  { label: "Dashboard", path: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/candidate/profile", icon: User },
  { label: "Browse Jobs", path: "/candidate/jobs", icon: Search },
  { label: "Saved Jobs", path: "/candidate/saved-jobs", icon: Bookmark },
  { label: "Applications", path: "/candidate/applications", icon: FileText },
  { label: "Notifications", path: "/candidate/notifications", icon: Bell },
  { label: "Settings", path: "/candidate/settings", icon: Settings },
];

export default function CandidateLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
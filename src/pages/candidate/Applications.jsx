import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getInterviewsForApplications } from "@/lib/interviewService";
import { getInterviewSlotsForApplications } from "@/lib/interviewSlotService";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ApplicationCard from "../../components/ApplicationCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getApplicationsByCandidate } from "@/lib/supabaseService";
import { supabase } from "@/lib/supabaseClient";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-700 border-gray-200",
};

const FILTER_TABS = ["all", "submitted", "reviewing", "shortlisted", "rejected", "hired"];

export default function Applications() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["my-applications", user?.email],
    queryFn: () => getApplicationsByCandidate(user.email),
    enabled: !!user,
  });

  // Real-time subscription to applications
  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('public:applications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'applications',
        filter: `candidate_email=eq.${user.email}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["my-applications", user.email] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, queryClient]);

  const { data: interviews = {} } = useQuery({
    queryKey: ["my-interviews", applications.map((a) => a.id).join(",")],
    queryFn: () => getInterviewsForApplications(applications.map((a) => a.id)),
    enabled: applications.length > 0,
  });

  const { data: interviewSlots = {}, refetch: refetchSlots } = useQuery({
    queryKey: ["my-interview-slots", applications.map((a) => a.id).join(",")],
    queryFn: () => getInterviewSlotsForApplications(applications.map((a) => a.id)),
    enabled: applications.length > 0,
  });

  const appsList = applications;

  const filtered = useMemo(() =>
    activeTab === "all" ? appsList : appsList.filter((a) => a.status === activeTab),
    [appsList, activeTab]
  );

  if (isLoading && appsList.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 mb-4 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("applications", "title")} description={t("applications", "subtext")} />

      {appsList.length === 0 ? (
        <EmptyState icon={FileText} title={t("applications", "noApplications")}
          description={t("applications", "noApplicationsDesc")}
          actionLabel={t("applications", "browseJobs")} actionPath="/candidate/jobs" />
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-5 overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const count = tab === "all" ? appsList.length : appsList.filter((a) => a.status === tab).length;
              if (tab !== "all" && count === 0) return null;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === tab ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {tab === "all" ? t("appManagement", "allStatuses") : t("status", tab)}
                  <span className="text-[10px] px-1 rounded-full bg-background">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                interview={interviews[app.id]}
                interviewSlot={interviewSlots[app.id]}
                onSlotSelected={refetchSlots}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
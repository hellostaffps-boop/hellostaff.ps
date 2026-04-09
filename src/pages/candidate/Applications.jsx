import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, Clock, MessageCircle, CalendarClock, MapPin } from "lucide-react";
import { getInterviewsForApplications } from "@/lib/interviewService";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationsByCandidate } from "@/lib/firestoreService";

const statusColors = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_COLORS = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

const FILTER_TABS = ["all", "submitted", "reviewing", "shortlisted", "rejected", "hired"];

export default function Applications() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("all");

  const { lang } = useLanguage();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["my-applications", firebaseUser?.uid],
    queryFn: () => getApplicationsByCandidate(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const { data: interviews = {} } = useQuery({
    queryKey: ["my-interviews", applications.map((a) => a.id).join(",")],
    queryFn: () => getInterviewsForApplications(applications.map((a) => a.id)),
    enabled: applications.length > 0,
  });

  const filtered = useMemo(() =>
    activeTab === "all" ? applications : applications.filter((a) => a.status === activeTab),
    [applications, activeTab]
  );

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title={t("applications", "title")} description={t("applications", "subtext")} />

      {applications.length === 0 ? (
        <EmptyState icon={FileText} title={t("applications", "noApplications")}
          description={t("applications", "noApplicationsDesc")}
          actionLabel={t("applications", "browseJobs")} actionPath="/candidate/jobs" />
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-5 overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const count = tab === "all" ? applications.length : applications.filter((a) => a.status === tab).length;
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

          <div className="space-y-3">
            {filtered.map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-sm">{app.job_title || t("applications", "job")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{app.organization_name || t("applications", "company")}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" /> {t("applications", "applied")} {app.applied_at?.toDate ? app.applied_at.toDate().toLocaleDateString() : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${STATUS_COLORS[app.status] || "bg-secondary"}`}>
                      {t("status", app.status) || app.status}
                    </Badge>
                    <Link to={`/application/${app.id}/chat`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("messaging", "message")}</span>
                    </Link>
                  </div>
                  {/* Interview details for candidate */}
                  {interviews[app.id]?.scheduled_at && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs max-w-xs text-end">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-amber-800">
                          {lang === "ar" ? "موعد المقابلة" : "Interview Scheduled"}
                        </div>
                        <div className="text-amber-700 mt-0.5">
                          {new Date(interviews[app.id].scheduled_at).toLocaleString(
                            lang === "ar" ? "ar-SA" : "en-GB",
                            { dateStyle: "medium", timeStyle: "short" }
                          )}
                        </div>
                        {interviews[app.id].location && (
                          <div className="flex items-center gap-1 text-amber-600 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {interviews[app.id].location}
                          </div>
                        )}
                        {interviews[app.id].notes && (
                          <div className="text-amber-600 mt-1 italic">{interviews[app.id].notes}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
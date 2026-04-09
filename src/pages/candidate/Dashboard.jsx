import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Star, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationsByCandidate, getPublishedJobs } from "@/lib/firestoreService";

const STATUS_COLORS = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

export default function Dashboard() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ["my-applications", firebaseUser?.uid],
    queryFn: () => getApplicationsByCandidate(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["published-jobs"],
    queryFn: getPublishedJobs,
  });

  const reviewing = applications.filter((a) => a.status === "reviewing").length;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const hired = applications.filter((a) => a.status === "hired").length;

  const stats = [
    { icon: FileText, label: t("dashboard", "applicationsSent"), value: applications.length },
    { icon: Briefcase, label: t("status", "reviewing"), value: reviewing },
    { icon: Star, label: t("status", "shortlisted"), value: shortlisted },
    { icon: CheckCircle2, label: t("status", "hired"), value: hired },
  ];

  const recentApps = applications.slice(0, 5);
  const recentJobs = jobs.slice(0, 5);

  return (
    <div>
      <PageHeader title={t("dashboard", "candidateTitle")} description={t("dashboard", "candidateSubtext")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recentApplications")}</h2>
          {recentApps.length === 0 ? (
            <EmptyState icon={FileText} title={t("dashboard", "noApplicationsYet")}
              description={t("dashboard", "noApplicationsDesc")}
              actionLabel={t("dashboard", "browseJobs")} actionPath="/candidate/jobs" />
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{app.job_title || t("applications", "job")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{app.organization_name}</div>
                  </div>
                  <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[app.status] || "bg-secondary"}`}>
                    {t("status", app.status) || app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recommendedJobs")}</h2>
          {recentJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={t("dashboard", "noJobsAvailable")}
              description={t("dashboard", "noJobsAvailableDesc")} />
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
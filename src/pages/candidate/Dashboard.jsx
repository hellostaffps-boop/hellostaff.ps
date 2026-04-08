import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Bookmark, Eye } from "lucide-react";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationsByCandidate, getPublishedJobs } from "@/lib/firestoreService";

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

  const stats = [
    { icon: FileText, label: t("dashboard", "applicationsSent"), value: applications.length, trend: 0 },
    { icon: Briefcase, label: t("dashboard", "activeJobs"), value: jobs.length, trend: 0 },
    { icon: Bookmark, label: t("dashboard", "savedJobsCount"), value: 0 },
    { icon: Eye, label: t("dashboard", "profileViews"), value: 0 },
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
                <div key={app.id} className="bg-white rounded-xl border border-border p-4">
                  <div className="font-medium text-sm">{app.job_title || t("applications", "job")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{app.organization_name}</div>
                  <div className="text-xs text-accent font-medium mt-2">{t("status", app.status) || app.status}</div>
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
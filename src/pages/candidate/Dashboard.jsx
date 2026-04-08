import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Briefcase, FileText, Bookmark, Eye } from "lucide-react";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";

export default function Dashboard() {
  const { t } = useLanguage();

  const { data: applications = [] } = useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Application.filter({ candidate_email: user.email }, "-created_date", 5);
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["recent-jobs"],
    queryFn: () => base44.entities.Job.filter({ status: "published" }, "-created_date", 5),
  });

  const stats = [
    { icon: FileText, label: t("dashboard", "applicationsSent"), value: applications.length, trend: 12 },
    { icon: Briefcase, label: t("dashboard", "activeJobs"), value: jobs.length, trend: 8 },
    { icon: Bookmark, label: t("dashboard", "savedJobsCount"), value: 0 },
    { icon: Eye, label: t("dashboard", "profileViews"), value: 0 },
  ];

  return (
    <div>
      <PageHeader title={t("dashboard", "candidateTitle")} description={t("dashboard", "candidateSubtext")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recentApplications")}</h2>
          {applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("dashboard", "noApplicationsYet")}
              description={t("dashboard", "noApplicationsDesc")}
              actionLabel={t("dashboard", "browseJobs")}
              actionPath="/candidate/jobs"
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-border p-4">
                  <div className="font-medium text-sm">{app.job_title || t("applications", "job")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{app.organization_name}</div>
                  <div className="text-xs text-accent font-medium mt-2 capitalize">{app.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recommendedJobs")}</h2>
          {jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t("dashboard", "noJobsAvailable")}
              description={t("dashboard", "noJobsAvailableDesc")}
            />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
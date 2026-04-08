import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Briefcase, FileText, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";

export default function Dashboard() {
  const { t } = useLanguage();

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Job.filter({ posted_by: user.email }, "-created_date", 5);
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["employer-applications"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgMembers = await base44.entities.OrganizationMember.filter({ user_email: user.email });
      if (orgMembers.length === 0) return [];
      return base44.entities.Application.filter({ organization_id: orgMembers[0].organization_id }, "-created_date", 10);
    },
  });

  const stats = [
    { icon: Briefcase, label: t("dashboard", "activeJobs"), value: jobs.filter((j) => j.status === "published").length, trend: 5 },
    { icon: FileText, label: t("dashboard", "totalApplications"), value: applications.length, trend: 18 },
    { icon: Users, label: t("dashboard", "candidatesReviewed"), value: 0 },
    { icon: Eye, label: t("dashboard", "jobViews"), value: 0 },
  ];

  return (
    <div>
      <PageHeader title={t("dashboard", "employerTitle")} description={t("dashboard", "employerSubtext")}>
        <Link to="/employer/post-job">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            {t("dashboard", "postJob")}
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recentJobs")}</h2>
          {jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t("dashboard", "noJobsYet")}
              description={t("dashboard", "noJobsYetDesc")}
              actionLabel={t("dashboard", "postJob")}
              actionPath="/employer/post-job"
            />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{job.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t("status", job.status) || job.status} · {job.applications_count || 0} {t("dashboard", "applicationCount")}</div>
                  </div>
                  <Link to="/employer/jobs" className="text-xs text-accent font-medium hover:underline">{t("common", "view")}</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recentApplications")}</h2>
          {applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("dashboard", "noAppsYet")}
              description={t("dashboard", "noAppsYetDesc")}
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{app.candidate_name || app.candidate_email}</div>
                    <div className="text-xs text-muted-foreground mt-1">{app.job_title} · {t("status", app.status) || app.status}</div>
                  </div>
                  <Link to="/employer/applications" className="text-xs text-accent font-medium hover:underline">{t("dashboard", "review")}</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
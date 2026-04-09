import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getEmployerOrganizationJobs, getApplicationsByOrg, getOrganization } from "@/lib/firestoreService";
import { getOrgCompletion } from "@/lib/profileCompletion";

export default function Dashboard() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", firebaseUser?.uid],
    queryFn: () => getEmployerProfile(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const orgId = employerProfile?.organization_id;

  const { data: org } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  const orgCompletion = getOrgCompletion(org);

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs", firebaseUser?.uid],
    queryFn: () => getEmployerOrganizationJobs(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["employer-applications", orgId],
    queryFn: () => getApplicationsByOrg(orgId),
    enabled: !!orgId,
  });

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const newApps = applications.filter((a) => {
    const ts = a.applied_at?.toDate ? a.applied_at.toDate().getTime() : 0;
    return ts > sevenDaysAgo;
  }).length;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;

  const stats = [
    { icon: Briefcase, label: t("dashboard", "activeJobs"), value: jobs.filter((j) => j.status === "published").length },
    { icon: FileText, label: t("dashboard", "totalApplications"), value: applications.length },
    { icon: Users, label: t("dashboard", "newApplications"), value: newApps },
    { icon: Eye, label: t("status", "shortlisted"), value: shortlisted },
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

      {/* Org completion widget */}
      {orgCompletion.score < 80 && (
        <div className="mb-6">
          <ProfileCompletionCard
            score={orgCompletion.score}
            missing={orgCompletion.missing}
            editPath="/employer/company"
            type="org"
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-base mb-4">{t("dashboard", "recentJobs")}</h2>
          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={t("dashboard", "noJobsYet")}
              description={t("dashboard", "noJobsYetDesc")}
              actionLabel={t("dashboard", "postJob")} actionPath="/employer/post-job" />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{job.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("status", job.status) || job.status} · {job.applications_count || 0} {t("dashboard", "applicationCount")}
                    </div>
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
            <EmptyState icon={FileText} title={t("dashboard", "noAppsYet")} description={t("dashboard", "noAppsYetDesc")} />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{app.candidate_name || app.candidate_email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {app.job_title} · {t("status", app.status) || app.status}
                    </div>
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
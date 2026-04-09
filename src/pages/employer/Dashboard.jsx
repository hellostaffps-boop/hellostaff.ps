import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Users, Eye, UserPlus, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getEmployerOrganizationJobs, getApplicationsByOrg, getOrganization, getApplicationEvaluation, getEmployerHiringReviewSummary } from "@/lib/firestoreService";
import { getOrganizationMemberCount } from "@/lib/teamService";
import { getOrgCompletion } from "@/lib/profileCompletion";

export default function Dashboard() {
  const { t } = useLanguage();
  const { firebaseUser, userProfile } = useFirebaseAuth();

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

  const { data: memberCount = 1 } = useQuery({
    queryKey: ["org-member-count", orgId],
    queryFn: () => getOrganizationMemberCount(orgId),
    enabled: !!orgId,
  });

  const { data: reviewSummary = { reviewingCount: 0, shortlistedCount: 0 } } = useQuery({
    queryKey: ["hiring-review-summary", firebaseUser?.uid],
    queryFn: () => getEmployerHiringReviewSummary(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const newApps = applications.filter((a) => {
    const ts = a.applied_at?.toDate ? a.applied_at.toDate().getTime() : 0;
    return ts > sevenDaysAgo;
  }).length;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;

  const draftJobs = jobs.filter((j) => j.status === "draft").length;
  const pendingApps = applications.filter((a) => a.status === "submitted").length;

  const { lang: language } = useLanguage();

  const stats = [
    { icon: Briefcase, label: t("dashboard", "activeJobs"), value: jobs.filter((j) => j.status === "published").length },
    { icon: FileText, label: t("dashboard", "totalApplications"), value: applications.length },
    { icon: Users, label: language === "ar" ? "قيد المراجعة" : "Under Review", value: reviewSummary?.reviewingCount || 0 },
    { icon: Eye, label: t("status", "shortlisted"), value: reviewSummary?.shortlistedCount || 0 },
  ];

  // Suggested next actions for owner
  const isOwner = userProfile?.role === "employer_owner";
  const nextActions = [
    orgCompletion.score < 80 && { icon: Building2, label: language === "ar" ? "أكمل ملف الشركة" : "Complete company profile", path: "/employer/company" },
    memberCount < 2 && isOwner && { icon: UserPlus, label: language === "ar" ? "أضف عضواً للفريق" : "Add a team member", path: "/employer/team" },
    draftJobs > 0 && { icon: Briefcase, label: language === "ar" ? `انشر ${draftJobs} وظيفة مسودة` : `Publish ${draftJobs} draft job${draftJobs > 1 ? 's' : ''}`, path: "/employer/jobs" },
    pendingApps > 0 && { icon: CheckCircle2, label: language === "ar" ? `راجع ${pendingApps} طلب جديد` : `Review ${pendingApps} new application${pendingApps > 1 ? 's' : ''}`, path: "/employer/applications" },
  ].filter(Boolean);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      {/* Next actions strip */}
      {nextActions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {nextActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer">
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">{t("dashboard", "recentJobs")}</h2>
            {jobs.length > 5 && (
              <Link to="/employer/jobs" className="text-xs text-accent hover:underline">View all</Link>
            )}
          </div>
          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={t("dashboard", "noJobsYet")}
              description={t("dashboard", "noJobsYetDesc")}
              actionLabel={t("dashboard", "postJob")} actionPath="/employer/post-job" />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link key={job.id} to={`/employer/jobs`} className="block bg-white rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{job.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {job.applications_count || 0} {t("dashboard", "applicationCount")} · {t("status", job.status)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">{t("dashboard", "recentApplications")}</h2>
            {applications.length > 5 && (
              <Link to="/employer/applications" className="text-xs text-accent hover:underline">View all</Link>
            )}
          </div>
          {applications.length === 0 ? (
            <EmptyState icon={FileText} title={t("dashboard", "noAppsYet")} description={t("dashboard", "noAppsYetDesc")} />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <Link key={app.id} to={`/employer/applications/${app.id}`} className="block bg-white rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{app.candidate_name || app.candidate_email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {app.job_title} · {t("status", app.status)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team summary */}
      {isOwner && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base">{language === "ar" ? "فريق العمل" : "Team"}</h2>
            <Link to="/employer/team" className="text-xs text-accent font-medium hover:underline">
              {language === "ar" ? "إدارة الفريق" : "Manage team"}
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">{memberCount} {language === "ar" ? "عضو نشط" : `active member${memberCount !== 1 ? 's' : ''}`}</div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "في فريق مؤسستك" : "in your organization"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
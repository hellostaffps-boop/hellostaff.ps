import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Users, Eye, UserPlus, Building2, CheckCircle2, ShieldCheck, Zap, Crown } from "lucide-react";

const JOB_STATUS = {
  published: { color: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500",  label: "Published" },
  draft:     { color: "bg-gray-50 text-gray-500 border-gray-200",    dot: "bg-gray-400",   label: "Draft" },
  closed:    { color: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-400",    label: "Closed" },
  filled:    { color: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-400",   label: "Filled" },
};

const APP_STATUS = {
  pending:     { color: "bg-yellow-50 text-yellow-700 border-yellow-200",  dot: "bg-yellow-400" },
  reviewing:   { color: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-400" },
  shortlisted: { color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  interview:   { color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-400" },
  offered:     { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  rejected:    { color: "bg-red-50 text-red-700 border-red-200",        dot: "bg-red-400" },
  withdrawn:   { color: "bg-gray-50 text-gray-500 border-gray-200",     dot: "bg-gray-400" },
};

function StatusDot({ cfg, label }) {
  const c = cfg || { color: "bg-secondary text-muted-foreground border-border", dot: "bg-gray-300" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getEmployerProfile, getEmployerOrganizationJobs, getApplicationsByOrg, getOrganization, getEmployerHiringReviewSummary } from "@/lib/supabaseService";

import { getOrganizationMemberCount } from "@/lib/teamService";
import { getOrgCompletion } from "@/lib/profileCompletion";
import { useSubscription } from "@/hooks/useSubscription";

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, userProfile } = useAuth();

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", user?.email],
    queryFn: () => getEmployerProfile(user.email),
    enabled: !!user,
  });

  const orgId = employerProfile?.organization_id;

  const { data: org } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  const orgCompletion = getOrgCompletion(org);

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs", user?.email],
    queryFn: () => getEmployerOrganizationJobs(user.email),
    enabled: !!user,
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
    queryKey: ["hiring-review-summary", user?.email],
    queryFn: () => getEmployerHiringReviewSummary(user.email),
    enabled: !!user,
  });

  const { isSubscribed, activeSub, isPremium } = useSubscription();

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const newApps = applications.filter((a) => {
    const ts = new Date(a.created_at || a.applied_at || 0).getTime();
    return ts > sevenDaysAgo;
  }).length;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;

  const draftJobs = jobs.filter((j) => j.status === "draft").length;
  const pendingApps = applications.filter((a) => a.status === "pending").length;

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

      {/* Subscription Status Card */}
      {isOwner && (
        <div className={`mb-8 p-6 rounded-2xl border-2 transition-all ${
          isSubscribed 
            ? "bg-green-50/30 border-green-200 shadow-sm" 
            : "bg-amber-50/30 border-amber-200 shadow-sm"
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isSubscribed ? "bg-green-100" : "bg-amber-100"
            }`}>
              {isPremium ? (
                <Crown className="w-8 h-8 text-amber-600" />
              ) : isSubscribed ? (
                <ShieldCheck className="w-8 h-8 text-green-600" />
              ) : (
                <Zap className="w-8 h-8 text-amber-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1">
                {isSubscribed 
                  ? (language === 'ar' ? `شريك هيلو ستاف - خطة ${activeSub.plan === 'monthly' ? 'شهرية' : activeSub.plan === 'annual' ? 'سنوية' : 'بريميوم'}` : `Hello Staff Partner - ${activeSub.plan.toUpperCase()} Plan`)
                  : (language === 'ar' ? 'قم بترقية حسابك للوصول لأفضل الكفاءات' : 'Upgrade your account to reach top talent')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? (language === 'ar' ? `اشتراكك فعال حتى ${new Date(activeSub.expires_at).toLocaleDateString('ar')}. استمتع بمميزات الوصول الكامل.` : `Your subscription is active until ${new Date(activeSub.expires_at).toLocaleDateString()}. Enjoy full access features.`)
                  : (language === 'ar' ? 'احصل على شارة التوثيق، ميز وظائفك في مقدمة البحث، واطلع على تحليلات متقدمة.' : 'Get a verified badge, feature your jobs at the top of search, and access advanced analytics.')}
              </p>
            </div>

            <div className="shrink-0">
              <Link to="/employer/pricing">
                <Button variant={isSubscribed ? "outline" : "default"} className={!isSubscribed ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}>
                  {isSubscribed 
                    ? (language === 'ar' ? 'إدارة الاشتراك' : 'Manage Plan')
                    : (language === 'ar' ? 'اشترك الآن' : 'Subscribe Now')}
                </Button>
              </Link>
            </div>
          </div>
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
                       {job.applications_count || 0} {t("dashboard", "applicationCount")}
                     </div>
                    </div>
                    <StatusDot cfg={JOB_STATUS[job.status]} label={JOB_STATUS[job.status]?.label || job.status} />
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
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{app.job_title}</div>
                    </div>
                    <StatusDot cfg={APP_STATUS[app.status]} label={t("status", app.status) || app.status} />
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
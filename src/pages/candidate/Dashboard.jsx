import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Star, CheckCircle2, Bookmark, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationsByCandidate, getPublishedJobs, getCandidateProfile } from "@/lib/firestoreService";
import { getSavedJobs } from "@/lib/savedJobsService";
import { getCandidateCompletion } from "@/lib/profileCompletion";
import { useSavedJobs } from "@/hooks/useSavedJobs";

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
    queryKey: ["my-applications", firebaseUser?.email],
    queryFn: () => getApplicationsByCandidate(firebaseUser.email),
    enabled: !!firebaseUser,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["published-jobs"],
    queryFn: getPublishedJobs,
  });

  const { data: candidateProfile } = useQuery({
    queryKey: ["my-candidate-profile", firebaseUser?.email],
    queryFn: () => getCandidateProfile(firebaseUser.email),
    enabled: !!firebaseUser,
  });

  const { data: savedJobDocs = [] } = useQuery({
    queryKey: ["saved-jobs", firebaseUser?.email],
    queryFn: () => getSavedJobs(firebaseUser.email),
    enabled: !!firebaseUser,
  });

  const { savedJobIds, toggleSave } = useSavedJobs();
  const completion = getCandidateCompletion(candidateProfile);

  const reviewing = applications.filter((a) => a.status === "reviewing").length;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const hired = applications.filter((a) => a.status === "hired").length;

  const stats = [
    { icon: FileText, label: t("dashboard", "applicationsSent"), value: applications.length },
    { icon: Briefcase, label: t("status", "reviewing"), value: reviewing },
    { icon: Star, label: t("status", "shortlisted"), value: shortlisted },
    { icon: Bookmark, label: t("dashboard", "savedJobsCount"), value: savedJobDocs.length },
  ];

  const recentApps = applications.slice(0, 3);
  const recentJobs = jobs.slice(0, 5);
  const { lang: language } = useLanguage();

  return (
    <div>
      <PageHeader title={t("dashboard", "candidateTitle")} description={t("dashboard", "candidateSubtext")} />

      {/* Profile completion widget */}
      {completion.score < 100 && (
        <div className="mb-6">
          <ProfileCompletionCard
            score={completion.score}
            missing={completion.missing}
            editPath="/candidate/profile/edit"
            type="candidate"
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">{t("dashboard", "recentApplications")}</h2>
            {applications.length > 3 && (
              <Link to="/candidate/applications" className="text-xs text-accent hover:underline">View all</Link>
            )}
          </div>
          {recentApps.length === 0 ? (
            <EmptyState icon={FileText} title={t("dashboard", "noApplicationsYet")}
              description={t("dashboard", "noApplicationsDesc")}
              actionLabel={t("dashboard", "browseJobs")} actionPath="/candidate/jobs" />
          ) : (
           <div className="space-y-3">
             {recentApps.map((app) => (
               <Link key={app.id} to={`/candidate/applications`} className="block bg-white rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
                 <div className="flex items-start justify-between gap-3">
                   <div className="flex-1 min-w-0">
                     <div className="font-medium text-sm truncate">{app.job_title || t("applications", "job")}</div>
                     <div className="text-xs text-muted-foreground mt-0.5 truncate">{app.organization_name}</div>
                   </div>
                   <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[app.status] || "bg-secondary"}`}>
                     {t("status", app.status) || app.status}
                   </Badge>
                 </div>
               </Link>
             ))}
           </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">{t("dashboard", "recommendedJobs")}</h2>
            <Link to="/candidate/jobs" className="text-xs text-accent hover:underline flex items-center gap-1">
              {t("dashboard", "browseAll")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={t("dashboard", "noJobsAvailable")}
              description={t("dashboard", "noJobsAvailableDesc")} />
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showSave
                  saved={savedJobIds.has(job.id)}
                  onSave={(j) => toggleSave(j)}
                />
              ))}
            </div>
          )}

          {/* Saved jobs widget */}
          {savedJobDocs.length > 0 && (
           <div className="border-t border-border pt-6">
             <div className="flex items-center justify-between mb-3">
               <h2 className="font-semibold text-sm flex items-center gap-2">
                 <Bookmark className="w-4 h-4 text-accent" /> {language === "ar" ? "الوظائف المحفوظة" : "Saved jobs"}
               </h2>
               <Link to="/candidate/saved" className="text-xs text-accent hover:underline">
                 {t("dashboard", "viewAll")}
               </Link>
             </div>
             <div className="space-y-2">
               {savedJobDocs.slice(0, 3).map((saved) => (
                 <Link key={saved.id} to={`/jobs/${saved.job_id}`}
                   className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2.5 hover:bg-secondary/40 transition-colors">
                   <div className="min-w-0">
                     <div className="text-xs font-medium truncate">{saved.job_title}</div>
                     <div className="text-xs text-muted-foreground truncate">{saved.organization_name}</div>
                   </div>
                   <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 ms-2" />
                 </Link>
               ))}
             </div>
           </div>
          )}
        </div>
      </div>
    </div>
  );
}
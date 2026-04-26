import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ChevronDown, MessageCircle, CalendarClock, ClipboardList, Video, Sparkles, Star, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getEmployerProfile, getApplicationsByOrg, getJobsByOrg, updateApplicationStatus } from "@/lib/supabaseService";

import { getInterviewsForApplications } from "@/lib/interviewService";
import InterviewScheduleModal from "@/components/InterviewScheduleModal";
import TrialShiftScheduleModal from "@/components/TrialShiftScheduleModal";
import InterviewNotesModal from "@/components/InterviewNotesModal";
import VideoCallModal from "@/components/VideoCallModal.jsx";
import CandidateRankingModal from "@/components/CandidateRankingModal.jsx";
import { getStatusBadgeClass } from "@/lib/uiHelpers";
import { toast } from "sonner";

const VALID_TRANSITIONS = {
  submitted: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

const STATUS_TABS = ["all", "submitted", "reviewing", "shortlisted", "rejected", "hired"];

export default function EmployerApplications() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [scheduleApp, setScheduleApp] = useState(null);
  const [trialShiftApp, setTrialShiftApp] = useState(null);
  const [notesApp, setNotesApp] = useState(null);
  const [videoApp, setVideoApp] = useState(null);
  const [rankingJob, setRankingJob] = useState(null);

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", user?.email],
    queryFn: () => getEmployerProfile(user.email),
    enabled: !!user,
  });

  const orgId = employerProfile?.organization_id;

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["employer-applications", orgId],
    queryFn: () => getApplicationsByOrg(orgId),
    enabled: !!orgId,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs", orgId],
    queryFn: () => getJobsByOrg(orgId),
    enabled: !!orgId,
  });

  const appIds = applications.map((a) => a.id).join(",");
  const { data: interviews = {} } = useQuery({
    queryKey: ["interviews", orgId, appIds],
    queryFn: () => getInterviewsForApplications(applications.map((a) => a.id)),
    enabled: applications.length > 0,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => updateApplicationStatus(user.email, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications"] });
      toast.success(t("appManagement", "statusUpdated"));
    },
    onError: () => toast.error(t("appManagement", "statusError")),
  });

  const filtered = useMemo(() => {
    let list = [...applications];
    if (statusTab !== "all") list = list.filter((a) => a.status === statusTab);
    if (jobFilter !== "all") list = list.filter((a) => a.job_id === jobFilter);
    return list;
  }, [applications, statusTab, jobFilter]);

  const counts = useMemo(() => {
    const c = {};
    STATUS_TABS.forEach((s) => {
      c[s] = s === "all" ? applications.length : applications.filter((a) => a.status === s).length;
    });
    return c;
  }, [applications]);

  const ar = lang === "ar";

  return (
    <div>
      <PageHeader title={t("dashboard", "applications")} description={t("appManagement", "subtitle")}>
        {applications.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {jobs.length > 0 && (
              <div className="relative">
                <select
                  className="text-xs border border-border rounded-lg h-8 ps-3 pe-8 bg-white text-foreground appearance-none cursor-pointer hover:border-purple-300 transition-colors"
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const job = jobs.find((j) => j.id === e.target.value);
                    const jobApps = applications.filter((a) => a.job_id === e.target.value);
                    if (job && jobApps.length > 0) setRankingJob({ job, applications: jobApps });
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>{ar ? "فرز ذكي للمتقدمين" : "AI Rank Applicants"}</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
                <Sparkles className="w-3.5 h-3.5 text-purple-500 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        )}
      </PageHeader>

      {!isLoading && applications.length > 0 && (
        <>
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-4 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  statusTab === tab ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all" ? t("appManagement", "allStatuses") : t("status", tab)}
                <span className={`text-[10px] px-1 py-0.5 rounded-full ${statusTab === tab ? "bg-secondary text-muted-foreground" : "bg-background"}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Job filter */}
          {jobs.length > 1 && (
            <div className="mb-5">
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-full sm:w-72 h-9 text-sm">
                  <SelectValue placeholder={t("appManagement", "filterByJob")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("appManagement", "allJobs")}</SelectItem>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState icon={FileText} title={t("dashboard", "noAppsYet")} description={t("dashboard", "noAppsYetDesc")} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">{t("common", "noResults")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const nextStates = VALID_TRANSITIONS[app.status] || [];
            const interview = interviews[app.id];
            return (
              <div key={app.id} className="bg-white rounded-xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/employer/applications/${app.id}`)}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: candidate info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">
                        {app.candidate_name || app.candidate_email}
                      </span>
                      <Badge className={`text-xs border ${getStatusBadgeClass(app.status)}`}>
                        {t("status", app.status) || app.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{app.job_title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("applications", "applied")} {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ""}
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-secondary/40 rounded-lg px-3 py-2">
                        {app.cover_letter}
                      </p>
                    )}

                    {/* Interview badge */}
                    {interview?.scheduled_at && (
                      <div className="mt-3 flex items-center gap-2 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-amber-800 font-medium">
                          {new Date(interview.scheduled_at).toLocaleString(
                            ar ? "ar-SA" : "en-GB",
                            { dateStyle: "medium", timeStyle: "short" }
                          )}
                          {interview.location ? ` · ${interview.location}` : ""}
                        </span>
                        {interview.rating > 0 && (
                          <span className="ms-auto flex items-center gap-0.5 text-amber-500">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= interview.rating ? "fill-amber-400 text-amber-400" : "text-amber-200"}`} />
                            ))}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Private evaluation summary */}
                    {interview?.recommendation && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        {{
                          strong_hire: <span className="font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">{ar ? "توظيف بقوة" : "Strong Hire"}</span>,
                          hire: <span className="font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">{ar ? "توظيف" : "Hire"}</span>,
                          maybe: <span className="font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">{ar ? "غير محدد" : "Maybe"}</span>,
                          no_hire: <span className="font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">{ar ? "عدم التوظيف" : "No Hire"}</span>,
                        }[interview.recommendation] || null}
                        {interview.strengths && (
                          <span className="text-muted-foreground truncate max-w-[200px]">{interview.strengths}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                    {/* Chat */}
                    <Link
                      to={`/application/${app.id}/chat`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors h-8 px-2 rounded-md border border-border hover:border-accent/30"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("messaging", "message")}</span>
                    </Link>

                    {/* Schedule interview */}
                    <button
                      onClick={() => setScheduleApp(app)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors h-8 px-2 rounded-md border border-border hover:border-accent/30"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {interview?.scheduled_at
                          ? (ar ? "إعادة جدولة المقابلة" : "Reschedule")
                          : (ar ? "جدولة مقابلة" : "Schedule Interview")}
                      </span>
                    </button>

                    {/* Schedule Trial Shift */}
                    <button
                      onClick={() => setTrialShiftApp(app)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-600 transition-colors h-8 px-2 rounded-md border border-border hover:border-amber-600/30"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {ar ? "تجربة عمل" : "Trial Shift"}
                      </span>
                    </button>

                    {/* Video call — show once interview is scheduled */}
                    {interview?.scheduled_at && (
                      <button
                        onClick={() => setVideoApp(app)}
                        className="flex items-center gap-1 text-xs text-white bg-accent hover:bg-accent/90 transition-colors h-8 px-2 rounded-md"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {ar ? "مكالمة فيديو" : "Video call"}
                        </span>
                      </button>
                    )}

                    {/* Evaluation button — show once scheduled */}
                    {interview?.scheduled_at && (
                      <button
                        onClick={() => setNotesApp(app)}
                        className={`flex items-center gap-1 text-xs transition-colors h-8 px-2 rounded-md border ${
                          interview?.recommendation
                            ? "text-white bg-primary border-primary hover:bg-primary/90"
                            : "text-muted-foreground hover:text-accent border-border hover:border-accent/30"
                        }`}
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {interview?.recommendation
                            ? (ar ? "تعديل التقييم" : "Edit Evaluation")
                            : (ar ? "تقييم المقابلة" : "Evaluate")}
                        </span>
                      </button>
                    )}

                    {/* Status transition */}
                    {nextStates.length > 0 ? (
                      <Select value="" onValueChange={(s) => updateStatus.mutate({ id: app.id, status: s })}>
                        <SelectTrigger className="w-40 h-8 text-xs gap-1">
                          <span className="text-muted-foreground">{t("appManagement", "moveToStatus")}</span>
                          <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
                        </SelectTrigger>
                        <SelectContent>
                          {nextStates.map((s) => (
                            <SelectItem key={s} value={s}>{t("status", s)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {t("appManagement", "finalStatus")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {scheduleApp && (
        <InterviewScheduleModal
          application={scheduleApp}
          existingInterview={interviews[scheduleApp.id] || null}
          onClose={() => setScheduleApp(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["interviews"] })}
        />
      )}
      {trialShiftApp && (
        <TrialShiftScheduleModal
          application={trialShiftApp}
          onClose={() => setTrialShiftApp(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["employer-applications"] })}
        />
      )}
      {notesApp && (
        <InterviewNotesModal
          application={notesApp}
          interview={interviews[notesApp.id] || null}
          onClose={() => setNotesApp(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["interviews"] })}
        />
      )}
      {videoApp && (
        <VideoCallModal
          application={videoApp}
          onClose={() => setVideoApp(null)}
        />
      )}
      {rankingJob && (
        <CandidateRankingModal
          job={rankingJob.job}
          applications={rankingJob.applications}
          onClose={() => setRankingJob(null)}
        />
      )}
    </div>
  );
}
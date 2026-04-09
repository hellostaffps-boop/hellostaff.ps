import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getApplicationsByOrg, getJobsByOrg, updateApplicationStatus } from "@/lib/firestoreService";
import { toast } from "sonner";

const STATUS_COLORS = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

// Valid next states from each current state
const VALID_TRANSITIONS = {
  submitted: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

const STATUS_TABS = ["all", "submitted", "reviewing", "shortlisted", "rejected", "hired"];

export default function EmployerApplications() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", firebaseUser?.uid],
    queryFn: () => getEmployerProfile(firebaseUser.uid),
    enabled: !!firebaseUser,
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

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => updateApplicationStatus(firebaseUser.uid, id, status),
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

  return (
    <div>
      <PageHeader title={t("dashboard", "applications")} description={t("appManagement", "subtitle")} />

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
                <SelectTrigger className="w-full sm:w-72 h-9 text-sm"><SelectValue placeholder={t("appManagement", "filterByJob")} /></SelectTrigger>
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
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>
      ) : applications.length === 0 ? (
        <EmptyState icon={FileText} title={t("dashboard", "noAppsYet")} description={t("dashboard", "noAppsYetDesc")} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">{t("common", "noResults")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const nextStates = VALID_TRANSITIONS[app.status] || [];
            return (
              <div key={app.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">
                        {app.candidate_name || app.candidate_email}
                      </span>
                      <Badge className={`text-xs border ${STATUS_COLORS[app.status] || "bg-secondary"}`}>
                        {t("status", app.status) || app.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{app.job_title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("applications", "applied")} {app.applied_at?.toDate ? app.applied_at.toDate().toLocaleDateString() : ""}
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-secondary/40 rounded-lg px-3 py-2">
                        {app.cover_letter}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {nextStates.length > 0 ? (
                      <Select
                        value=""
                        onValueChange={(s) => updateStatus.mutate({ id: app.id, status: s })}
                      >
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
    </div>
  );
}
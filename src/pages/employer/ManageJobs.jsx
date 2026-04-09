import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PlusCircle, Search, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getJobsByOrg, updateJob } from "@/lib/firestoreService";
import { toast } from "sonner";

const STATUS_COLORS = {
  draft: "bg-secondary text-secondary-foreground border-border",
  published: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_TABS = ["all", "published", "draft", "closed"];

export default function ManageJobs() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", firebaseUser?.uid],
    queryFn: () => getEmployerProfile(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const orgId = employerProfile?.organization_id;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["employer-jobs", orgId],
    queryFn: () => getJobsByOrg(orgId),
    enabled: !!orgId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => updateJob(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      toast.success(t("manageJobs", "statusUpdated"));
    },
  });

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (statusTab !== "all") list = list.filter((j) => j.status === statusTab);
    if (search) list = list.filter((j) => j.title?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [jobs, statusTab, search]);

  const stats = {
    total: jobs.length,
    published: jobs.filter((j) => j.status === "published").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    closed: jobs.filter((j) => j.status === "closed").length,
  };

  return (
    <div>
      <PageHeader title={t("dashboard", "manageJobs")}>
        <Link to="/employer/post-job">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            <PlusCircle className="w-4 h-4" /> {t("dashboard", "postJob")}
          </Button>
        </Link>
      </PageHeader>

      {/* Stats bar */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t("manageJobs", "total"), value: stats.total },
            { label: t("status", "published"), value: stats.published, color: "text-green-600" },
            { label: t("status", "draft"), value: stats.draft, color: "text-muted-foreground" },
            { label: t("status", "closed"), value: stats.closed, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4">
              <div className={`text-2xl font-bold ${s.color || ""}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search & status tabs */}
      {jobs.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("manageJobs", "searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusTab === tab ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all" ? t("manageJobs", "allStatuses") : t("status", tab)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title={t("dashboard", "noJobsYet")} description={t("dashboard", "noJobsYetDesc")}
          actionLabel={t("dashboard", "postJob")} actionPath="/employer/post-job" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">{t("common", "noResults")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{job.title}</span>
                    <Badge className={`text-xs border ${STATUS_COLORS[job.status] || "bg-secondary"}`}>
                      {t("status", job.status) || job.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    {job.location && <span>{job.location}</span>}
                    {job.employment_type && <span>· {t("jobCard", `emp${job.employment_type.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join("")}`)}</span>}
                    <span>· {job.created_at?.toDate ? job.created_at.toDate().toLocaleDateString() : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/jobs/${job.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 text-xs">{t("common", "view")}</Button>
                  </Link>
                  {job.status === "draft" && (
                    <Button size="sm" variant="outline" className="h-8 text-xs text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => updateStatus.mutate({ id: job.id, status: "published" })}
                      disabled={updateStatus.isPending}>
                      {t("manageJobs", "publish")}
                    </Button>
                  )}
                  {job.status === "published" && (
                    <Button size="sm" variant="outline" className="h-8 text-xs text-muted-foreground"
                      onClick={() => updateStatus.mutate({ id: job.id, status: "closed" })}
                      disabled={updateStatus.isPending}>
                      {t("manageJobs", "close")}
                    </Button>
                  )}
                  {job.status === "closed" && (
                    <Button size="sm" variant="outline" className="h-8 text-xs text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => updateStatus.mutate({ id: job.id, status: "published" })}
                      disabled={updateStatus.isPending}>
                      {t("manageJobs", "reopen")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
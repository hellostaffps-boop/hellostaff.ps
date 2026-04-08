import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getJobsByOrg, deleteJob, updateJob } from "@/lib/firestoreService";
import { Briefcase } from "lucide-react";

export default function ManageJobs() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();

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

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employer-jobs"] }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => updateJob(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employer-jobs"] }),
  });

  const statusColors = {
    draft: "bg-secondary text-secondary-foreground",
    published: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-red-50 text-red-700 border-red-200",
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

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title={t("dashboard", "noJobsYet")} description={t("dashboard", "noJobsYetDesc")}
          actionLabel={t("dashboard", "postJob")} actionPath="/employer/post-job" />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm">{job.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{job.location}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[job.status] || "bg-secondary"}>
                  {t("status", job.status) || job.status}
                </Badge>
                <Button size="sm" variant="outline"
                  onClick={() => toggleStatus.mutate({ id: job.id, status: job.status === "published" ? "closed" : "published" })}>
                  {job.status === "published" ? t("status", "closed") : t("status", "published")}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(job.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getSavedJobs, unsaveJob } from "@/lib/savedJobsService";
import { toast } from "sonner";

export default function SavedJobs() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedJobs = [], isLoading } = useQuery({
    queryKey: ["saved-jobs", user?.email],
    queryFn: () => getSavedJobs(user.email),
    enabled: !!user,
  });

  const handleUnsave = async (userEmail, jobId, jobTitle) => {
    await unsaveJob(userEmail, jobId);
    queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    toast.success(t("savedJobs", "unsaved"));
  };

  const jobTypeLabels = {
    barista: t("jobCard", "typeBarista"),
    chef: t("jobCard", "typeChef"),
    waiter: t("jobCard", "typeWaiter"),
    cashier: t("jobCard", "typeCashier"),
    host: t("jobCard", "typeHost"),
    cleaner: t("jobCard", "typeCleaner"),
    kitchen_helper: t("jobCard", "typeKitchenHelper"),
    restaurant_manager: t("jobCard", "typeManager"),
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("savedJobs", "title")}
        description={t("savedJobs", "subtext")}
      />

      {savedJobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t("savedJobs", "noSaved")}
          description={t("savedJobs", "noSavedDesc")}
          actionLabel={t("savedJobs", "browseJobs")}
          actionPath="/candidate/jobs"
        />
      ) : (
        <div className="space-y-3">
          {savedJobs.map((saved) => (
            <div
              key={saved.id}
              className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {saved.job_type && (
                    <Badge variant="secondary" className="text-xs">
                      {jobTypeLabels[saved.job_type] || saved.job_type}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm truncate">{saved.job_title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{saved.organization_name}</p>
                {saved.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">{saved.location}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t("savedJobs", "savedOn")}{" "}
                  {saved.created_at ? new Date(saved.created_at).toLocaleDateString() : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/jobs/${saved.job_id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("common", "view")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleUnsave(user.email, saved.job_id, saved.job_title)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
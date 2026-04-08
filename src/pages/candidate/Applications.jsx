import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";

const statusColors = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function Applications() {
  const { t } = useLanguage();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["my-applications-list"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Application.filter({ candidate_email: user.email }, "-created_date");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("applications", "title")} description={t("applications", "subtext")} />

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("applications", "noApplications")}
          description={t("applications", "noApplicationsDesc")}
          actionLabel={t("applications", "browseJobs")}
          actionPath="/candidate/jobs"
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm">{app.job_title || t("applications", "job")}</h3>
                <p className="text-xs text-muted-foreground mt-1">{app.organization_name || t("applications", "company")}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" /> {t("applications", "applied")} {new Date(app.created_date).toLocaleDateString()}
                </div>
              </div>
              <Badge className={statusColors[app.status] || "bg-secondary"}>
                {t("status", app.status) || app.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
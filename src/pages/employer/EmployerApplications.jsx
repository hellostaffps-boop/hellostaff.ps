import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getApplicationsByOrg, updateApplication } from "@/lib/firestoreService";

const statusColors = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

const appStatuses = ["submitted", "reviewing", "shortlisted", "rejected", "hired"];

export default function EmployerApplications() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();

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

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => updateApplication(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employer-applications"] }),
  });

  return (
    <div>
      <PageHeader title={t("dashboard", "applications")} />

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>
      ) : applications.length === 0 ? (
        <EmptyState icon={FileText} title={t("dashboard", "noAppsYet")} description={t("dashboard", "noAppsYetDesc")} />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm">{app.candidate_name || app.candidate_email}</div>
                <div className="text-xs text-muted-foreground mt-1">{app.job_title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {app.applied_at?.toDate ? app.applied_at.toDate().toLocaleDateString() : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[app.status] || "bg-secondary"}>
                  {t("status", app.status) || app.status}
                </Badge>
                <Select value={app.status} onValueChange={(s) => updateStatus.mutate({ id: app.id, status: s })}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {appStatuses.map((s) => <SelectItem key={s} value={s}>{t("status", s) || s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
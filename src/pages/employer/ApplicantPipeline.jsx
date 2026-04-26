import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getApplicationsByOrg, updateApplicationStatus, getEmployerProfile } from "@/lib/supabaseService";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";
import PageHeader from "@/components/PageHeader";
import { Loader2, Plus, Users, CalendarClock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getStatusBadgeClass } from "@/lib/uiHelpers";
import { sendPipelineStatusNotification } from "@/lib/services/pipelineNotifications";

const PIPELINE_STAGES = [
  { id: "submitted", label: "New", icon: Users, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "reviewing", label: "Reviewing", icon: Loader2, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "shortlisted", label: "Interview/Trial", icon: CalendarClock, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { id: "hired", label: "Hired", icon: CheckCircle, color: "bg-green-50 border-green-200 text-green-700" },
  { id: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-50 border-red-200 text-red-700" }
];

export default function ApplicantPipeline() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [jobFilter, setJobFilter] = useState("all");

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

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => updateApplicationStatus(user.email, id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications"] });
      toast.success(t("appManagement", "statusUpdated") || "Status updated");
      // Auto-notify the candidate about the stage change
      const app = applications.find(a => a.id === variables.id);
      if (app) {
        sendPipelineStatusNotification({
          candidateEmail: app.candidate_email,
          candidateName: app.candidate_name,
          jobTitle: app.job_title,
          newStatus: variables.status,
          applicationId: variables.id,
        });
      }
    },
    onError: () => toast.error(t("appManagement", "statusError") || "Error updating status"),
  });

  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData("appId", appId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    const appId = e.dataTransfer.getData("appId");
    if (!appId) return;
    
    const app = applications.find(a => a.id === appId);
    if (app && app.status !== targetStatus) {
      updateStatus.mutate({ id: appId, status: targetStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title={lang === "ar" ? "لوحة التوظيف (Pipeline)" : "Hiring Pipeline"} 
        description={lang === "ar" ? "اسحب وإفلت المتقدمين لتحديث حالتهم بسرعة" : "Drag and drop applicants to quickly update their status"}
      />

      <div className="flex-1 overflow-x-auto pb-8">
        <div className="flex gap-4 min-w-max h-full items-start">
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage.id);
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id}
                className="w-80 flex flex-col bg-secondary/30 rounded-xl border border-border/50 h-full max-h-[calc(100vh-200px)] overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-border/50 flex items-center justify-between ${stage.color.split(' ')[0]}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${stage.color.split(' ')[2]}`} />
                    <span className={`font-semibold text-sm ${stage.color.split(' ')[2]}`}>
                      {t("status", stage.id) || stage.label}
                    </span>
                  </div>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium">
                    {stageApps.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageApps.map((app) => (
                    <div 
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="bg-white p-3 rounded-lg border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-accent/40 transition-colors"
                      onClick={() => navigate(`/employer/applications/${app.id}`)}
                    >
                      <div className="font-semibold text-sm mb-1">{app.candidate_name || app.candidate_email}</div>
                      <div className="text-xs text-muted-foreground mb-2">{app.job_title}</div>
                      
                      {app.match_score > 0 && (
                        <div className="mb-3 flex items-center gap-1">
                          <span className="text-[10px] font-semibold tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            {lang === "ar" ? "نسبة التوافق:" : "Match Score:"} {app.match_score}%
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                        
                        {app.whatsapp_number && (
                          <WhatsAppButton 
                            phoneNumber={app.whatsapp_number} 
                            message={`مرحباً ${app.candidate_name}، نتواصل معك بخصوص تقديمك لوظيفة ${app.job_title}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {stageApps.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-border/60 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                      {lang === "ar" ? "اسحب بطاقة إلى هنا" : "Drop card here"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

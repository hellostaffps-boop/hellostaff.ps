import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, FileText, Calendar, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationById, updateApplicationStatus, getApplicationEvaluation } from "@/lib/firestoreService";
import InternalNotesSection from "@/components/InternalNotesSection";
import EvaluationCard from "@/components/EvaluationCard";

const STATUS_COLORS = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-700 border-gray-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

export default function EmployerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ["application-detail", id],
    queryFn: () => getApplicationById(id),
  });

  useEffect(() => {
    if (app) setNewStatus(app.status);
  }, [app]);

  const { data: evals = [] } = useQuery({
    queryKey: ["application-evaluations", id],
    queryFn: () => getApplicationEvaluation(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (status) => {
      await updateApplicationStatus(firebaseUser.uid, id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  if (!app) return <div className="p-4">{lang === "ar" ? "لم يتم العثور على الطلب" : "Application not found"}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/employer/applications" className="flex items-center gap-2 text-sm text-accent hover:underline mb-4">
          <ChevronLeft className="w-4 h-4" />
          {lang === "ar" ? "العودة إلى الطلبات" : "Back to Applications"}
        </Link>
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{app.candidate_name}</h1>
              <p className="text-muted-foreground mt-1">{app.job_title} · {app.organization_name}</p>
            </div>
            <Badge className={`text-sm border ${STATUS_COLORS[app.status]}`}>
              {t("status", app.status) || app.status}
            </Badge>
          </div>

          {/* Candidate Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-muted-foreground">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</p>
              <p className="font-medium">{app.candidate_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{lang === "ar" ? "تاريخ التقديم" : "Applied"}</p>
              <p className="font-medium">{new Date(app.applied_at?.toDate?.() || app.applied_at).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB")}</p>
            </div>
          </div>

          {/* Resume & Cover Letter */}
          <div className="flex gap-3">
            {app.resume_url && (
              <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {lang === "ar" ? "السيرة الذاتية" : "Resume"}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Status Management */}
      <div className="bg-white rounded-lg border border-border p-4 mb-6">
        <h3 className="font-semibold text-sm mb-3">{lang === "ar" ? "تحديث الحالة" : "Update Status"}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["reviewing", "shortlisted", "interview", "offered", "rejected", "hired"].map(status => (
            <button
              key={status}
              onClick={() => {
                setNewStatus(status);
                statusMutation.mutate(status);
              }}
              disabled={statusMutation.isPending}
              className={`p-2 rounded text-xs font-medium transition-all ${
                app.status === status
                  ? STATUS_COLORS[status] + " ring-2 ring-accent"
                  : STATUS_COLORS[status]
              }`}
            >
              {t("status", status) || status}
            </button>
          ))}
        </div>
      </div>

      {/* Evaluation */}
      <div className="mb-6">
        <EvaluationCard
          applicationId={id}
          organizationId={app.organization_id}
          existingEval={evals[0]}
        />
      </div>

      {/* Internal Notes */}
      <div className="mb-6">
        <InternalNotesSection
          applicationId={id}
          organizationId={app.organization_id}
        />
      </div>

      {/* Evaluations Summary */}
      {evals.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-4">
          <h4 className="font-semibold text-sm mb-4">{lang === "ar" ? "التقييمات" : "Evaluations"}</h4>
          <div className="space-y-3">
            {evals.map(evaluation => (
              <div key={evaluation.id} className="border-l-4 border-accent pl-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{evaluation.reviewer_name}</span>
                  <span className="text-xs text-muted-foreground">{evaluation.overall_score}/5</span>
                </div>
                {evaluation.tags?.length > 0 && (
                                   <div className="flex flex-wrap gap-1 mb-2">
                                     {evaluation.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                {evaluation.recommendation && (
                                   <Badge className="text-xs">{evaluation.recommendation}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
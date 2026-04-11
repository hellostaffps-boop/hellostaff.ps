import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, FileText, Mail, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationById, getApplicationEvaluation } from "@/lib/firestoreService";
import InternalNotesSection from "@/components/InternalNotesSection";
import EvaluationCard from "@/components/EvaluationCard";
import ProposeInterviewSlotsModal from "@/components/ProposeInterviewSlotsModal";
import { getInterviewSlot } from "@/lib/interviewSlotService";

const STATUS_COLORS = {
  submitted: "bg-slate-100 text-slate-800 border-slate-300",
  reviewing: "bg-blue-100 text-blue-800 border-blue-300",
  shortlisted: "bg-green-100 text-green-800 border-green-300",
  interview: "bg-purple-100 text-purple-800 border-purple-300",
  offered: "bg-yellow-100 text-yellow-800 border-yellow-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  withdrawn: "bg-gray-100 text-gray-800 border-gray-300",
  hired: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function EmployerApplicationDetail() {
  const { id: applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { lang } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const isArabic = lang === "ar";

  const { data: application } = useQuery({
    queryKey: ["application-detail", applicationId],
    queryFn: () => getApplicationById(applicationId),
    enabled: !!applicationId,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["app-evaluation", applicationId],
    queryFn: () => getApplicationEvaluation(applicationId),
    enabled: !!applicationId,
  });

  const { data: interviewSlot } = useQuery({
    queryKey: ["interview-slot", applicationId],
    queryFn: () => getInterviewSlot(applicationId),
    enabled: !!applicationId,
  });

  if (!application) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{isArabic ? "جارٍ التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  const recommendationBadges = {
    strong_yes: { color: "bg-green-100 text-green-800 border-green-300", label: isArabic ? "نعم بقوة" : "Strong Yes" },
    yes: { color: "bg-blue-100 text-blue-800 border-blue-300", label: isArabic ? "نعم" : "Yes" },
    maybe: { color: "bg-amber-100 text-amber-800 border-amber-300", label: isArabic ? "ربما" : "Maybe" },
    no: { color: "bg-red-100 text-red-800 border-red-300", label: isArabic ? "لا" : "No" },
  };

  const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/employer/applications")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{application.candidate_name || application.candidate_email}</h1>
          <p className="text-sm text-muted-foreground mt-1">{application.job_title}</p>
        </div>
        <button
          onClick={() => setShowSlotsModal(true)}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          {isArabic ? "جدولة مقابلة" : "Schedule Interview"}
        </button>
      </div>

      {/* Interview Slot Status */}
      {interviewSlot && (
        <div className={`mb-4 p-4 rounded-xl border text-sm ${
          interviewSlot.status === "confirmed"
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <div className="font-semibold mb-1">
            {interviewSlot.status === "confirmed"
              ? (isArabic ? "✅ تم تأكيد موعد المقابلة" : "✅ Interview Confirmed")
              : (isArabic ? "⏳ في انتظار اختيار المرشح للموعد" : "⏳ Waiting for candidate to select a slot")}
          </div>
          {interviewSlot.selected_slot && (
            <div className="text-muted-foreground">
              {new Date(interviewSlot.selected_slot).toLocaleString(isArabic ? "ar-SA" : "en-GB", { dateStyle: "full", timeStyle: "short" })}
            </div>
          )}
          {interviewSlot.status === "pending_selection" && (
            <div className="text-xs text-muted-foreground mt-1">
              {isArabic ? `${interviewSlot.proposed_slots?.length} مواعيد مقترحة` : `${interviewSlot.proposed_slots?.length} slots proposed`}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application card */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-sm text-muted-foreground">
                  {isArabic ? "حالة التقديم" : "Application Status"}
                </h2>
                <Badge className={`mt-2 ${STATUS_COLORS[application.status] || STATUS_COLORS.submitted}`}>
                  {t("status", application.status) || application.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {application.applied_at?.toDate
                  ? new Date(application.applied_at.toDate()).toLocaleDateString(
                      isArabic ? "ar-SA" : "en-GB",
                      { dateStyle: "medium" }
                    )
                  : ""}
              </span>
            </div>

            {/* Contact info */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${application.candidate_email}`} className="text-accent hover:underline">
                  {application.candidate_email}
                </a>
              </div>
            </div>

            {/* Resume */}
            {application.resume_url && (
              <div className="border-t border-border mt-4 pt-4">
                <a
                  href={application.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  {isArabic ? "عرض السيرة الذاتية" : "View Resume"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Cover letter */}
            {application.cover_letter && (
              <div className="border-t border-border mt-4 pt-4">
                <h3 className="text-xs font-semibold mb-2">{isArabic ? "خطاب الغلاف" : "Cover Letter"}</h3>
                <p className="text-xs text-foreground whitespace-pre-wrap break-words bg-secondary/30 rounded-lg p-3">
                  {application.cover_letter}
                </p>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <InternalNotesSection applicationId={applicationId} organizationId={application.organization_id} />

          {/* Evaluation */}
          <EvaluationCard applicationId={applicationId} organizationId={application.organization_id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            {latestEvaluation && (
              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="font-semibold text-sm mb-3">{isArabic ? "ملخص التقييم" : "Evaluation Summary"}</h3>
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-1">{isArabic ? "التقييم" : "Score"}</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`w-2 h-2 rounded-full ${s <= latestEvaluation.overall_score ? "bg-accent" : "bg-muted"}`} />
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-1">{isArabic ? "التوصية" : "Recommendation"}</div>
                  <Badge className={`${recommendationBadges[latestEvaluation.recommendation]?.color}`}>
                    {recommendationBadges[latestEvaluation.recommendation]?.label}
                  </Badge>
                </div>
                {latestEvaluation.tags?.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">{isArabic ? "الوسوم" : "Tags"}</div>
                    <div className="flex flex-wrap gap-1">
                      {latestEvaluation.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground border-t border-border pt-3">
                  {isArabic ? "من قبل: " : "By: "} {latestEvaluation.reviewer_name}
                </div>
              </div>
            )}
            <div className="bg-secondary/30 rounded-xl p-4 text-xs space-y-2">
              <div>
                <span className="text-muted-foreground">{isArabic ? "المنظمة:" : "Organization:"}</span>
                <div className="font-medium">{application.organization_name}</div>
              </div>
              {application.applied_at && (
                <div>
                  <span className="text-muted-foreground">{isArabic ? "تاريخ التقديم:" : "Applied:"}</span>
                  <div className="font-medium">
                    {new Date(application.applied_at.toDate()).toLocaleDateString(isArabic ? "ar-SA" : "en-GB", { dateStyle: "medium" })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSlotsModal && application && (
          <ProposeInterviewSlotsModal
            application={application}
            employerEmail={firebaseUser?.email}
            organizationId={application.organization_id}
            organizationName={application.organization_name}
            onClose={() => setShowSlotsModal(false)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["interview-slot", applicationId] })}
          />
        )}
        </div>
        );
        }
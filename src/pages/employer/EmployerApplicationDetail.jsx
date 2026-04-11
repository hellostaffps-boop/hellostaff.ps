import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, FileText, Mail, CalendarPlus, MessageCircle, ClipboardList } from "lucide-react";
import MessageThread from "@/components/MessageThread";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationById, getApplicationEvaluation } from "@/lib/firestoreService";
import InternalNotesSection from "@/components/InternalNotesSection";
import EvaluationCard from "@/components/EvaluationCard";
import ProposeInterviewSlotsModal from "@/components/ProposeInterviewSlotsModal";
import { getInterviewSlot } from "@/lib/interviewSlotService";

const STATUS_COLORS = {
  submitted:   "bg-slate-100 text-slate-800 border-slate-300",
  reviewing:   "bg-blue-100 text-blue-800 border-blue-300",
  shortlisted: "bg-green-100 text-green-800 border-green-300",
  interview:   "bg-purple-100 text-purple-800 border-purple-300",
  offered:     "bg-yellow-100 text-yellow-800 border-yellow-300",
  rejected:    "bg-red-100 text-red-800 border-red-300",
  withdrawn:   "bg-gray-100 text-gray-800 border-gray-300",
  hired:       "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function EmployerApplicationDetail() {
  const { id: applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
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
          <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{isArabic ? "جارٍ التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  const recommendationBadges = {
    strong_yes: { color: "bg-green-100 text-green-800 border-green-300", label: isArabic ? "نعم بقوة" : "Strong Yes" },
    yes:        { color: "bg-blue-100 text-blue-800 border-blue-300",  label: isArabic ? "نعم" : "Yes" },
    maybe:      { color: "bg-amber-100 text-amber-800 border-amber-300", label: isArabic ? "ربما" : "Maybe" },
    no:         { color: "bg-red-100 text-red-800 border-red-300",    label: isArabic ? "لا" : "No" },
  };

  const latestEvaluation = evaluations[0] || null;

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
          className="flex items-center gap-2 bg-secondary text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          <span className="hidden sm:inline">{isArabic ? "جدولة مقابلة" : "Schedule Interview"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/40 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "details" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {isArabic ? "تفاصيل الطلب" : "Application Details"}
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "chat" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          {isArabic ? "الدردشة مع المرشح" : "Chat with Candidate"}
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="bg-white rounded-xl border border-border p-5" style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="font-semibold text-sm">{application.candidate_name || application.candidate_email}</div>
              <div className="text-xs text-muted-foreground">{application.job_title}</div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {firebaseUser ? (
              <MessageThread
                applicationId={applicationId}
                currentUser={firebaseUser}
                senderRole="employer_owner"
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isArabic ? "يجب تسجيل الدخول للدردشة" : "Please log in to chat"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <div>
          {interviewSlot && (
            <div className={`mb-4 p-4 rounded-xl border text-sm ${
              interviewSlot.status === "confirmed" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
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
            <div className="lg:col-span-2 space-y-6">
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
                      ? new Date(application.applied_at.toDate()).toLocaleDateString(isArabic ? "ar-SA" : "en-GB", { dateStyle: "medium" })
                      : ""}
                  </span>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${application.candidate_email}`} className="text-accent hover:underline">
                      {application.candidate_email}
                    </a>
                  </div>
                </div>
                {application.resume_url && (
                  <div className="border-t border-border mt-4 pt-4">
                    <a href={application.resume_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-accent hover:underline">
                      <FileText className="w-4 h-4" />
                      {isArabic ? "عرض السيرة الذاتية" : "View Resume"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {application.cover_letter && (
                  <div className="border-t border-border mt-4 pt-4">
                    <h3 className="text-xs font-semibold mb-2">{isArabic ? "خطاب الغلاف" : "Cover Letter"}</h3>
                    <p className="text-xs text-foreground whitespace-pre-wrap break-words bg-secondary/30 rounded-lg p-3">
                      {application.cover_letter}
                    </p>
                  </div>
                )}
              </div>

              <InternalNotesSection applicationId={applicationId} organizationId={application.organization_id} />
              <EvaluationCard applicationId={applicationId} organizationId={application.organization_id} />
            </div>

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
                    {isArabic ? "من قبل: " : "By: "}{latestEvaluation.reviewer_name}
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
        </div>
      )}

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
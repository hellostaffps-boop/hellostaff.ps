import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star, X, Lock, ThumbsUp, ThumbsDown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveInterviewEvaluation } from "@/lib/interviewService";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";

const RECOMMENDATIONS = {
  ar: [
    { value: "strong_hire", label: "توظيف بقوة", color: "text-green-700 bg-green-50 border-green-200" },
    { value: "hire", label: "توظيف", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { value: "maybe", label: "غير محدد", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { value: "no_hire", label: "عدم التوظيف", color: "text-red-700 bg-red-50 border-red-200" },
  ],
  en: [
    { value: "strong_hire", label: "Strong Hire", color: "text-green-700 bg-green-50 border-green-200" },
    { value: "hire", label: "Hire", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { value: "maybe", label: "Maybe", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { value: "no_hire", label: "No Hire", color: "text-red-700 bg-red-50 border-red-200" },
  ],
};

const RATING_LABELS = {
  ar: ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"],
  en: ["", "Poor", "Fair", "Good", "Very Good", "Excellent"],
};

export default function InterviewNotesModal({ application, interview, onClose, onSuccess }) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [notes, setNotes] = useState(interview?.evaluation_notes || "");
  const [strengths, setStrengths] = useState(interview?.strengths || "");
  const [weaknesses, setWeaknesses] = useState(interview?.weaknesses || "");
  const [recommendation, setRecommendation] = useState(interview?.recommendation || "");
  const [rating, setRating] = useState(interview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setNotes(interview?.evaluation_notes || "");
    setStrengths(interview?.strengths || "");
    setWeaknesses(interview?.weaknesses || "");
    setRecommendation(interview?.recommendation || "");
    setRating(interview?.rating || 0);
  }, [interview]);

  const mutation = useMutation({
    mutationFn: () => saveInterviewEvaluation(user.email, application.id, {
      evaluation_notes: notes,
      strengths,
      weaknesses,
      recommendation,
      rating,
    }),
    onSuccess: () => {
      toast.success(ar ? "تم حفظ التقييم السري" : "Private evaluation saved");
      onSuccess?.();
      onClose();
    },
    onError: () => toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Failed to save evaluation"),
  });

  const displayRating = hoverRating || rating;
  const ratingLabel = RATING_LABELS[ar ? "ar" : "en"][displayRating];
  const recs = RECOMMENDATIONS[ar ? "ar" : "en"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" dir={ar ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-semibold text-base">
                {ar ? "تقييم ما بعد المقابلة" : "Post-Interview Evaluation"}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 border border-slate-200">
                <Lock className="w-2.5 h-2.5" />
                {ar ? "سري" : "Private"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {application.candidate_name || application.candidate_email} · {application.job_title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confidential notice */}
        <div className="mx-6 mt-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          {ar
            ? "هذا التقييم سري ولن يراه المرشح — مخصص لمساعدتك في اتخاذ قرار التوظيف."
            : "This evaluation is private and will never be visible to the candidate."}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Star Rating */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {ar ? "التقييم العام" : "Overall Rating"}
            </Label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= displayRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="text-sm font-medium text-amber-600 ms-2">{ratingLabel}</span>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {ar ? "التوصية النهائية" : "Hiring Recommendation"}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {recs.map((rec) => (
                <button
                  key={rec.value}
                  onClick={() => setRecommendation(rec.value === recommendation ? "" : rec.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-all ${
                    recommendation === rec.value
                      ? rec.color + " ring-2 ring-offset-1 ring-current"
                      : "bg-secondary text-muted-foreground border-border hover:border-current"
                  }`}
                >
                  {rec.value === "strong_hire" && <Award className="w-3.5 h-3.5" />}
                  {rec.value === "hire" && <ThumbsUp className="w-3.5 h-3.5" />}
                  {rec.value === "no_hire" && <ThumbsDown className="w-3.5 h-3.5" />}
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 text-green-500" />
              {ar ? "نقاط القوة" : "Strengths"}
            </Label>
            <textarea
              rows={2}
              placeholder={ar ? "ما الذي أعجبك في هذا المرشح؟" : "What impressed you about this candidate?"}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Weaknesses */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
              <ThumbsDown className="w-3 h-3 text-red-400" />
              {ar ? "نقاط الضعف أو المخاوف" : "Weaknesses / Concerns"}
            </Label>
            <textarea
              rows={2}
              placeholder={ar ? "ما هي المخاوف أو الجوانب التي تحتاج إلى تطوير؟" : "Any concerns or areas for development?"}
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* General Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {ar ? "ملاحظات إضافية" : "Additional Notes"}
            </Label>
            <textarea
              rows={3}
              placeholder={ar ? "أي ملاحظات إضافية تريد تدوينها..." : "Any other notes you'd like to record..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5 border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? (ar ? "جارٍ الحفظ..." : "Saving...")
              : (ar ? "حفظ التقييم السري" : "Save Private Evaluation")}
          </Button>
        </div>
      </div>
    </div>
  );
}
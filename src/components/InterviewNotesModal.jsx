import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveInterviewEvaluation } from "@/lib/interviewService";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { useLanguage } from "@/hooks/useLanguage";

export default function InterviewNotesModal({ application, interview, onClose, onSuccess }) {
  const { firebaseUser } = useFirebaseAuth();
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [notes, setNotes] = useState(interview?.evaluation_notes || "");
  const [rating, setRating] = useState(interview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setNotes(interview?.evaluation_notes || "");
    setRating(interview?.rating || 0);
  }, [interview]);

  const mutation = useMutation({
    mutationFn: () => saveInterviewEvaluation(firebaseUser.uid, application.id, {
      evaluation_notes: notes,
      rating,
    }),
    onSuccess: () => {
      toast.success(ar ? "تم حفظ ملاحظات التقييم" : "Evaluation notes saved");
      onSuccess?.();
      onClose();
    },
    onError: () => toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Failed to save notes"),
  });

  const RATING_LABELS_AR = ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"];
  const RATING_LABELS_EN = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const displayRating = hoverRating || rating;
  const ratingLabel = ar ? RATING_LABELS_AR[displayRating] : RATING_LABELS_EN[displayRating];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">
              {ar ? "ملاحظات التقييم" : "Evaluation Notes"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {application.candidate_name || application.candidate_email}
              {" · "}
              {application.job_title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Rating */}
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
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="text-sm font-medium text-muted-foreground ms-2">
                  {ratingLabel}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {ar ? "ملاحظات المقابلة" : "Interview Notes"}
            </Label>
            <textarea
              rows={5}
              placeholder={
                ar
                  ? "اكتب ملاحظاتك حول أداء المرشح، نقاط قوته وضعفه، وتوصيتك..."
                  : "Note candidate's performance, strengths, weaknesses, and your recommendation..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? (ar ? "جارٍ الحفظ..." : "Saving...")
              : (ar ? "حفظ التقييم" : "Save Evaluation")}
          </Button>
        </div>
      </div>
    </div>
  );
}
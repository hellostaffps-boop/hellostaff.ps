import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { StarRating } from "@/components/ReviewCard";
import { submitCompanyReview, submitEmployeeReview, hasReviewedCompany } from "@/lib/reviewService";
import { useEffect } from "react";

/**
 * ReviewForm — Form to submit a company or employee review.
 * @param {string} type - "company" or "employee"
 * @param {string} targetId - organization_id or candidate_email
 * @param {object} reviewer - { email, name }
 * @param {string} orgId - (for employee reviews) the org id
 * @param {function} onSuccess - callback after successful submit
 */
export default function ReviewForm({ type = "company", targetId, reviewer, orgId, onSuccess, isAr }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [sub1, setSub1] = useState(0);
  const [sub2, setSub2] = useState(0);
  const [sub3, setSub3] = useState(0);
  const [text, setText] = useState("");
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(!!reviewer?.email);

  useEffect(() => {
    if (reviewer?.email && targetId && type === "company") {
      hasReviewedCompany(targetId, reviewer.email)
        .then(res => setHasAlreadyReviewed(res))
        .finally(() => setCheckingStatus(false));
    } else {
      setCheckingStatus(false);
    }
  }, [reviewer?.email, targetId, type]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error(isAr ? "يرجى إضافة تقييم" : "Please add a rating");
      if (type === "company") {
        return submitCompanyReview({
          orgId: targetId,
          reviewerEmail: reviewer.email,
          reviewerName: reviewer.name,
          rating,
          environment_rating: sub1 || rating,
          management_rating: sub2 || rating,
          salary_rating: sub3 || rating,
          review_text: text.trim(),
        });
      } else {
        return submitEmployeeReview({
          candidateEmail: targetId,
          orgId,
          reviewerEmail: reviewer.email,
          reviewerName: reviewer.name,
          rating,
          professionalism: sub1 || rating,
          punctuality: sub2 || rating,
          skills_rating: sub3 || rating,
          review_text: text.trim(),
        });
      }
    },
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال التقييم بنجاح!" : "Review submitted!");
      queryClient.invalidateQueries(["company-reviews"]);
      queryClient.invalidateQueries(["employee-reviews"]);
      queryClient.invalidateQueries(["company-avg-rating"]);
      queryClient.invalidateQueries(["employee-avg-rating"]);
      setRating(0); setSub1(0); setSub2(0); setSub3(0); setText("");
      setHasAlreadyReviewed(true);
      onSuccess?.();
    },
    onError: (err) => {
      if (err.message === "ALREADY_REVIEWED") {
        setHasAlreadyReviewed(true);
        toast.error(isAr ? "لقد قمت بالتقييم مسبقاً" : "You have already reviewed");
      } else {
        toast.error(err.message);
      }
    },
  });

  const subLabels = type === "company"
    ? [isAr ? "بيئة العمل" : "Environment", isAr ? "الإدارة" : "Management", isAr ? "الراتب" : "Salary"]
    : [isAr ? "الاحترافية" : "Professionalism", isAr ? "الالتزام" : "Punctuality", isAr ? "المهارات" : "Skills"];

  if (checkingStatus) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{isAr ? "جاري التحقق..." : "Checking status..."}</p>
      </div>
    );
  }

  if (hasAlreadyReviewed) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Star className="w-8 h-8 text-primary fill-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">{isAr ? "شكراً لك!" : "Thank You!"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "لقد قمت بإضافة تقييم لهذه المنشأة مسبقاً." : "You have already submitted a review for this entity."}
            <br />
            {isAr ? "التقييمات مسموحة لمرة واحدة فقط لضمان المصداقية." : "Reviews are limited to one per user to ensure authenticity."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-sm">
        {type === "company" ? (isAr ? "أضف تقييمك" : "Add Your Review") : (isAr ? "قيّم هذا الموظف" : "Rate This Employee")}
      </h3>

      {/* Overall Rating */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          {isAr ? "التقييم العام" : "Overall Rating"}
        </Label>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      {/* Sub-ratings */}
      <div className="space-y-3">
        {[sub1, sub2, sub3].map((val, i) => (
          <div key={i} className="flex items-center justify-between bg-secondary/20 p-2.5 rounded-xl border border-border/40">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{subLabels[i]}</Label>
            <StarRating value={val} onChange={[setSub1, setSub2, setSub3][i]} size={16} />
          </div>
        ))}
      </div>

      {/* Text */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          {isAr ? "اكتب تقييمك (سيكون مرئياً للمشرفين فقط)" : "Write your review (visible to admins only)"}
        </Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAr ? "شاركنا تجربتك..." : "Share your experience..."}
          rows={3}
          className="resize-none"
          disabled={mutation.isPending}
        />
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || rating === 0}
        className="h-10 text-sm w-full sm:w-auto px-8"
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        {isAr ? "إرسال التقييم" : "Submit Review"}
      </Button>
    </div>
  );
}

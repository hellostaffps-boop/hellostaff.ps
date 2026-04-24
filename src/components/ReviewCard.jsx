import { Star } from "lucide-react";

/**
 * StarRating — Interactive or display star rating component.
 */
export function StarRating({ value = 0, onChange, size = 16, readonly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1 flex-nowrap">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          style={{ width: size, height: size }}
          className={`flex items-center justify-center flex-shrink-0 transition-transform ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
        >
          <Star
            size={size}
            className={`${s <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-300"} transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

import { useAuth } from "@/lib/supabaseAuth";

/**
 * ReviewCard — Displays a single review with ratings.
 */
export function ReviewCard({ review, isAr, type = "company" }) {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "platform_admin";
  const date = new Date(review.created_at).toLocaleDateString(isAr ? "ar" : "en", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium">
            {isAdmin 
              ? (review.reviewer_name || (isAr ? "مجهول" : "Anonymous"))
              : (review.reviewer_title || (isAr ? "موظف مجهول" : "Anonymous Employee"))
            }
          </p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <div className="flex items-center gap-1">
          <StarRating value={review.rating} readonly size={14} />
          <span className="text-sm font-semibold text-amber-600 ml-1">{review.rating}</span>
        </div>
      </div>

      {/* Sub-ratings */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {type === "company" ? (
          <>
            <SubRating label={isAr ? "البيئة" : "Environment"} value={review.environment_rating} />
            <SubRating label={isAr ? "الإدارة" : "Management"} value={review.management_rating} />
            <SubRating label={isAr ? "الراتب" : "Salary"} value={review.salary_rating} />
          </>
        ) : (
          <>
            <SubRating label={isAr ? "الاحترافية" : "Professional"} value={review.professionalism} />
            <SubRating label={isAr ? "اللتزام" : "Punctuality"} value={review.punctuality} />
            <SubRating label={isAr ? "المهارات" : "Skills"} value={review.skills_rating} />
          </>
        )}
      </div>

      {review.review_text && isAdmin && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            "{review.review_text}"
          </p>
          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded mt-2 inline-block">
            {isAr ? "مرئي للمشرفين فقط" : "Visible to admins only"}
          </span>
        </div>
      )}
    </div>
  );
}

function SubRating({ label, value }) {
  return (
    <div className="text-center bg-secondary/30 rounded-lg px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center justify-center gap-1">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span className="text-xs font-semibold">{value || "—"}</span>
      </div>
    </div>
  );
}

/**
 * AverageRatingBadge — A compact rating badge for cards.
 */
export function AverageRatingBadge({ rating, count, size = "sm" }) {
  if (!rating) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${size === "sm" ? "text-xs" : "text-sm"}`}>
      <Star className={`fill-amber-400 text-amber-400 ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />
      <span className="font-semibold">{rating}</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}

export default ReviewCard;

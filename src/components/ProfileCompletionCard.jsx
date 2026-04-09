/**
 * ProfileCompletionCard — Phase 5.1
 * Shows a profile completion progress bar with missing-field prompts.
 * Used in dashboards and profile pages for both candidates and employers.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { completionColor, completionTextColor } from "@/lib/profileCompletion";

export default function ProfileCompletionCard({ score, missing, editPath, type = "candidate" }) {
  const { t } = useLanguage();

  const missingLabels = {
    // candidate
    headline:        t("completion", "headline"),
    bio:             t("completion", "bio"),
    city:            t("completion", "city"),
    phone:           t("completion", "phone"),
    preferred_roles: t("completion", "preferredRoles"),
    skills:          t("completion", "skills"),
    availability:    t("completion", "availability"),
    years_experience:t("completion", "yearsExp"),
    work_experience: t("completion", "workExp"),
    cv_url:          t("completion", "cv"),
    // org
    name:            t("completion", "orgName"),
    business_type:   t("completion", "businessType"),
    description:     t("completion", "orgDescription"),
    website:         t("completion", "website"),
    address:         t("completion", "address"),
    email:           t("completion", "orgEmail"),
  };

  const topMissing = missing.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">
          {type === "candidate" ? t("completion", "profileTitle") : t("completion", "orgTitle")}
        </h3>
        <span className={`text-sm font-bold ${completionTextColor(score)}`}>{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${completionColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {score >= 100 ? (
        <p className="text-xs text-green-600 font-medium">{t("completion", "complete")}</p>
      ) : (
        <>
          {topMissing.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">{t("completion", "stillMissing")}</p>
              <div className="flex flex-wrap gap-1.5">
                {topMissing.map((key) => (
                  <span key={key} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-foreground/70">
                    {missingLabels[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Link
            to={editPath}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            {t("completion", "completeProfile")} <ArrowRight className="w-3 h-3" />
          </Link>
        </>
      )}
    </div>
  );
}
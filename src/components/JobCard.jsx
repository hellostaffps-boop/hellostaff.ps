import { Link } from "react-router-dom";
import { MapPin, Clock, Bookmark, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

export default function JobCard({ job, showSave, onSave, saved, applied }) {
  const { t } = useLanguage();

  const typeLabels = {
    barista: t("jobCard", "typeBarista"),
    chef: t("jobCard", "typeChef"),
    waiter: t("jobCard", "typeWaiter"),
    cashier: t("jobCard", "typeCashier"),
    host: t("jobCard", "typeHost"),
    cleaner: t("jobCard", "typeCleaner"),
    kitchen_helper: t("jobCard", "typeKitchenHelper"),
    restaurant_manager: t("jobCard", "typeManager"),
  };

  const employmentLabels = {
    full_time: t("jobCard", "empFullTime"),
    part_time: t("jobCard", "empPartTime"),
    contract: t("jobCard", "empContract"),
    temporary: t("jobCard", "empTemporary"),
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:shadow-black/5 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {typeLabels[job.job_type] || job.job_type}
            </Badge>
            {job.employment_type && (
              <Badge variant="outline" className="text-xs">
                {employmentLabels[job.employment_type] || job.employment_type}
              </Badge>
            )}
          </div>

          <Link to={`/jobs/${job.id}`}>
            <h3 className="font-semibold text-base group-hover:text-accent transition-colors truncate">
              {job.title}
            </h3>
          </Link>

          <p className="text-sm text-muted-foreground mt-1">
            {job.organization_name || t("jobCard", "company")}
          </p>
          {job.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {job.location}
              </span>
            )}
            {job.salary_min && (
              <span className="flex items-center gap-1">
                <span className="text-xs font-medium">₪</span>
                {job.salary_min}{job.salary_max ? `–${job.salary_max}` : ""} / {job.salary_period || t("jobCard", "month")}
              </span>
            )}
            {job.created_at?.toDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {job.created_at.toDate().toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {applied && (
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> {useLanguage ? null : null}
            </span>
          )}
          {showSave && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 transition-colors ${saved ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
              onClick={(e) => { e.preventDefault(); onSave && onSave(job); }}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-accent" : ""}`} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
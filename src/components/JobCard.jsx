import { Link } from "react-router-dom";
import { MapPin, Clock, DollarSign, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeLabels = {
  barista: "Barista", chef: "Chef", waiter: "Waiter", cashier: "Cashier",
  host: "Host", cleaner: "Cleaner", kitchen_helper: "Kitchen Helper", restaurant_manager: "Manager",
};

const employmentLabels = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", temporary: "Temporary",
};

export default function JobCard({ job, showSave, onSave, saved }) {
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
            {job.organization_name || "Company"}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {job.location}
              </span>
            )}
            {job.salary_min && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {job.salary_min}{job.salary_max ? `–${job.salary_max}` : ""} / {job.salary_period || "month"}
              </span>
            )}
            {job.created_date && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {new Date(job.created_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {showSave && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => onSave && onSave(job.id)}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-accent text-accent" : ""}`} />
          </Button>
        )}
      </div>
    </div>
  );
}
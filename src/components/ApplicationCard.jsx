import { Link } from "react-router-dom";
import { Clock, MessageCircle, CalendarClock, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-700 border-gray-200",
};

const STATUS_ICONS = {
  rejected: AlertCircle,
  offered: CheckCircle2,
};

export default function ApplicationCard({ app, interview }) {
  const { t, lang } = useLanguage();
  const StatusIcon = STATUS_ICONS[app.status];

  const appliedDate = app.applied_at?.toDate ? app.applied_at.toDate() : new Date(app.applied_at);

  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            {StatusIcon && <StatusIcon className={`w-5 h-5 mt-0.5 ${app.status === 'rejected' ? 'text-red-600' : 'text-green-600'}`} />}
            <div>
              <h3 className="font-semibold text-base">{app.job_title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{app.organization_name}</p>
            </div>
          </div>
        </div>
        <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[app.status] || "bg-secondary"}`}>
          {t("status", app.status) || app.status}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Clock className="w-3.5 h-3.5" />
        {lang === "ar" ? "تم التقديم: " : "Applied: "}
        {appliedDate.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB")}
      </div>

      {/* Interview Info */}
      {interview?.scheduled_at && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <CalendarClock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-amber-900">
                {lang === "ar" ? "موعد المقابلة" : "Interview Scheduled"}
              </div>
              <div className="text-amber-800 mt-1">
                {new Date(interview.scheduled_at).toLocaleString(
                  lang === "ar" ? "ar-SA" : "en-GB",
                  { dateStyle: "medium", timeStyle: "short" }
                )}
              </div>
              {interview.location && (
                <div className="flex items-center gap-1 text-amber-700 mt-1">
                  <MapPin className="w-3 h-3" />
                  {interview.location}
                </div>
              )}
              {interview.notes && (
                <div className="text-amber-700 mt-1 italic">{interview.notes}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {app.notes && (
        <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200">
          <p className="text-xs text-slate-700">{app.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link to={`/application/${app.id}/chat`}
          className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
          <MessageCircle className="w-3.5 h-3.5" />
          {lang === "ar" ? "رسائل" : "Messages"}
        </Link>
        {app.resume_url && (
          <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-accent hover:underline font-medium">
            {lang === "ar" ? "عرض السيرة الذاتية" : "View Resume"}
          </a>
        )}
      </div>
    </div>
  );
}
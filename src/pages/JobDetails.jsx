import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Clock, DollarSign, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

export default function JobDetails() {
  const { id } = useParams();
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

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ id });
      return jobs[0];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">{t("jobDetails", "notFound")}</h2>
        <p className="text-muted-foreground mb-6">{t("jobDetails", "notFoundDesc")}</p>
        <Link to="/jobs"><Button variant="outline">{t("jobDetails", "browseJobs")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /> {t("jobDetails", "backToJobs")}
      </Link>

      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{typeLabels[job.job_type] || job.job_type}</Badge>
              {job.employment_type && <Badge variant="outline">{job.employment_type}</Badge>}
              <Badge className="bg-green-50 text-green-700 border-green-200">{job.status}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <p className="text-muted-foreground mt-1">{job.organization_name || t("common", "company")}</p>
          </div>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
            {t("jobDetails", "applyNow")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-6 py-6 border-y border-border text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</span>
          )}
          {job.salary_min && (
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> {job.salary_min}{job.salary_max ? `–${job.salary_max}` : ""} / {job.salary_period || t("common", "month")}
            </span>
          )}
          {job.experience_required && (
            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {job.experience_required.replace(/_/g, " ")}</span>
          )}
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t("jobDetails", "posted")} {new Date(job.created_date).toLocaleDateString()}</span>
        </div>

        <div className="mt-8 space-y-8">
          {job.description && (
            <div>
              <h2 className="font-semibold text-base mb-3">{t("jobDetails", "jobDescription")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div>
              <h2 className="font-semibold text-base mb-3">{t("jobDetails", "requirements")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          {job.benefits && (
            <div>
              <h2 className="font-semibold text-base mb-3">{t("jobDetails", "benefits")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.benefits}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
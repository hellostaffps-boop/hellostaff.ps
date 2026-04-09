import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, DollarSign, Briefcase, ArrowLeft, CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getJob, createApplicationForCurrentCandidate, checkExistingApplication } from "@/lib/firestoreService";
import { useState } from "react";

export default function JobDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { firebaseUser, userProfile } = useFirebaseAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

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
    queryFn: () => getJob(id),
    enabled: !!id,
  });

  const { data: alreadyApplied = false } = useQuery({
    queryKey: ["already-applied", id, firebaseUser?.uid],
    queryFn: () => checkExistingApplication(id, firebaseUser.uid),
    enabled: !!firebaseUser && !!id,
  });

  const isCandidate = userProfile?.role === "candidate";
  const isLoggedIn = !!firebaseUser;

  const handleApplySubmit = async () => {
    setApplying(true);
    await createApplicationForCurrentCandidate(firebaseUser.uid, id, {
      job_title: job.title,
      organization_id: job.organization_id,
      organization_name: job.organization_name || "",
      candidate_name: userProfile?.full_name || firebaseUser.email,
      cover_letter: coverLetter,
    });
    toast.success(t("jobDetails", "applySuccess") || "Application submitted!");
    setApplying(false);
    setShowModal(false);
    setCoverLetter("");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Apply button logic
  let applyButton;
  if (alreadyApplied) {
    applyButton = (
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" /> {t("jobDetails", "alreadyApplied")}
      </div>
    );
  } else if (!isLoggedIn) {
    applyButton = (
      <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/auth/login")}>
        <LogIn className="w-4 h-4" /> {t("jobDetails", "loginToApply")}
      </Button>
    );
  } else if (!isCandidate) {
    applyButton = (
      <div className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm">
        {t("jobDetails", "notEligible")}
      </div>
    );
  } else {
    applyButton = (
      <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowModal(true)}>
        {t("jobDetails", "applyNow")}
      </Button>
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
              <Badge className="bg-green-50 text-green-700 border-green-200">{t("status", job.status) || job.status}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <p className="text-muted-foreground mt-1">{job.organization_name || t("common", "company")}</p>
          </div>
          {applyButton}
        </div>

        <div className="flex flex-wrap gap-6 py-6 border-y border-border text-sm text-muted-foreground">
          {job.location && <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</span>}
          {job.salary_min && (
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> {job.salary_min}{job.salary_max ? `–${job.salary_max}` : ""} / {t("common", "month")}
            </span>
          )}
          {job.experience_required && (
            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {job.experience_required}</span>
          )}
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> {t("jobDetails", "posted")} {job.created_at?.toDate ? job.created_at.toDate().toLocaleDateString() : ""}
          </span>
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

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg p-6">
            <h2 className="font-bold text-lg mb-1">{t("jobDetails", "applyModalTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-5">{job.title} · {job.organization_name}</p>
            <div className="mb-5">
              <label className="text-sm font-medium block mb-1.5">{t("jobDetails", "coverLetter")}</label>
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                className="resize-none"
                placeholder={t("jobDetails", "coverLetterPlaceholder")}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleApplySubmit} disabled={applying}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                {applying ? t("common", "loading") : t("jobDetails", "submitApplication")}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={applying}>
                {t("common", "cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
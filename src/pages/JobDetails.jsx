import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  MapPin, Clock, DollarSign, Briefcase, ArrowLeft, CheckCircle2,
  LogIn, Bookmark, Building2, Users, ChevronRight, Upload, FileText,
  Loader2, X, Star, Award, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getJob, createApplicationForCurrentCandidate, checkExistingApplication, getCandidateProfile } from "@/lib/firestoreService";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { base44 } from "@/api/base44Client";

const JOB_TYPE_LABELS = {
  barista: "Barista", chef: "Chef", waiter: "Waiter / Waitress",
  cashier: "Cashier", host: "Host / Hostess", cleaner: "Cleaner",
  kitchen_helper: "Kitchen Helper", restaurant_manager: "Restaurant Manager",
};

const EMP_TYPE_LABELS = {
  full_time: "Full-time", part_time: "Part-time",
  contract: "Contract", temporary: "Temporary",
};

const EXP_LABELS = {
  none: "No experience required", "1_year": "1 year experience",
  "2_years": "2 years experience", "3_plus_years": "3+ years experience",
};

// ── Application Modal ─────────────────────────────────────────────────────────
function ApplyModal({ job, profile, onClose, onSuccess, firebaseUser, userProfile }) {
  const [step, setStep] = useState(1); // 1: review, 2: cover letter, 3: done
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(profile?.resume_url || "");
  const [applying, setApplying] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setResumeUrl(file_url);
    setResumeUploading(false);
    toast.success("Resume uploaded!");
  };

  const handleSubmit = async () => {
    setApplying(true);
    await createApplicationForCurrentCandidate(firebaseUser.uid, job.id, {
      job_title: job.title,
      organization_id: job.organization_id,
      organization_name: job.organization_name || "",
      candidate_name: userProfile?.full_name || firebaseUser.email,
      cover_letter: coverLetter,
      resume_url: resumeUrl,
    });
    setStep(3);
    setApplying(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-bold text-lg leading-tight">Apply for Position</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{job.title} · {job.organization_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex gap-0 px-6 pt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors
                  ${step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {s}
                </div>
                <div className="text-xs ms-2 font-medium text-muted-foreground">
                  {s === 1 ? "Review Profile" : "Cover Letter"}
                </div>
                {s < 2 && <div className={`flex-1 h-px mx-3 ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="p-6">
          {/* Step 1: Review profile */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Review the information that will be sent with your application.</p>

              <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(userProfile?.full_name || firebaseUser?.email)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{userProfile?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{firebaseUser?.email}</div>
                  </div>
                </div>
                {profile?.headline && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 shrink-0" /> {profile.headline}
                  </div>
                )}
                {profile?.location && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {profile.location}
                  </div>
                )}
                {profile?.experience_years != null && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" /> {profile.experience_years} years experience
                  </div>
                )}
                {profile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.slice(0, 5).map((s) => (
                      <span key={s} className="text-xs bg-white border border-border px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Resume / CV</label>
                  {resumeUrl && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>}
                </div>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 cursor-pointer hover:border-primary hover:bg-secondary/30 transition-colors">
                  {resumeUploading
                    ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    : resumeUrl
                      ? <><FileText className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-primary">Change Resume</span></>
                      : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload Resume (PDF)</span></>
                  }
                  <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleResumeUpload} disabled={resumeUploading} />
                </label>
              </div>

              {!profile?.headline && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Your profile is incomplete. <Link to="/candidate/profile/edit" className="font-semibold underline">Complete it</Link> to stand out.</span>
                </div>
              )}

              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setStep(2)}>
                Next: Write Cover Letter <ChevronRight className="w-4 h-4 ms-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Cover letter */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Cover Letter <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="resize-none text-sm"
                  placeholder={`Hi, I'm excited to apply for the ${job.title} role at ${job.organization_name}. I believe my experience in...`}
                />
                <p className="text-xs text-muted-foreground mt-1">{coverLetter.length} characters</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={applying} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  {applying ? <><Loader2 className="w-4 h-4 animate-spin me-2" /> Submitting...</> : "Submit Application"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Application Submitted!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your application for <span className="font-medium text-foreground">{job.title}</span> has been sent to {job.organization_name}.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
                <Link to="/candidate/applications" className="flex-1">
                  <Button className="w-full">View My Applications</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function JobDetails() {
  const { id } = useParams();
  const { firebaseUser, userProfile } = useFirebaseAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { savedJobIds, toggleSave } = useSavedJobs();

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

  const { data: profile } = useQuery({
    queryKey: ["my-candidate-profile", firebaseUser?.email],
    queryFn: () => getCandidateProfile(firebaseUser.email),
    enabled: !!firebaseUser && userProfile?.role === "candidate",
  });

  const isCandidate = userProfile?.role === "candidate";
  const isSaved = savedJobIds?.has(id);

  const onApplicationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["already-applied", id] });
    queryClient.invalidateQueries({ queryKey: ["my-applications"] });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
        <p className="text-muted-foreground mb-6">This job posting may have been removed or is no longer available.</p>
        <Link to="/jobs"><Button variant="outline">Browse Jobs</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Left: Main content ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Job Header Card */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-start gap-4">
              {/* Company Logo Placeholder */}
              <div className="w-14 h-14 rounded-xl bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                  {job.employment_type && <Badge variant="outline">{EMP_TYPE_LABELS[job.employment_type] || job.employment_type}</Badge>}
                  {job.status === "published" && <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge>}
                </div>
                <h1 className="text-xl font-bold tracking-tight">{job.title}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{job.organization_name}</p>
              </div>
              {isCandidate && (
                <button
                  onClick={() => toggleSave(job)}
                  className={`p-2 rounded-lg border transition-colors ${isSaved ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent hover:text-accent"}`}
                  title={isSaved ? "Remove from saved" : "Save job"}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-accent" : ""}`} />
                </button>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 text-accent" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4 shrink-0 text-accent" />
                  <span>{job.salary_min || ""}{job.salary_max ? `–${job.salary_max}` : ""} / {job.salary_period || "month"}</span>
                </div>
              )}
              {job.experience_required && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4 shrink-0 text-accent" />
                  <span>{EXP_LABELS[job.experience_required] || job.experience_required}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0 text-accent" />
                <span>{new Date(job.created_date || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-base mb-3">Job Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-base mb-3">Requirements</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-base mb-3">Benefits & Perks</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.benefits}</p>
            </div>
          )}
        </div>

        {/* ── Right: Apply Sidebar ── */}
        <div className="space-y-4">
          {/* Apply Card */}
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-6">
            <div className="text-center mb-4">
              {alreadyApplied ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-green-700">Already Applied</p>
                    <p className="text-xs text-muted-foreground">Your application is under review</p>
                  </div>
                  <Link to="/candidate/applications" className="w-full">
                    <Button variant="outline" size="sm" className="w-full mt-1">Track Application</Button>
                  </Link>
                </div>
              ) : !firebaseUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Sign in to apply for this position</p>
                  <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/auth/login")}>
                    <LogIn className="w-4 h-4" /> Sign In to Apply
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    No account? <Link to="/auth/signup" className="text-primary hover:underline">Register free</Link>
                  </p>
                </div>
              ) : !isCandidate ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Only candidates can apply for jobs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 font-semibold" onClick={() => setShowModal(true)}>
                    Apply Now
                  </Button>
                  <p className="text-xs text-muted-foreground">Takes less than 2 minutes</p>
                </div>
              )}
            </div>

            {/* Profile match hint for candidates */}
            {isCandidate && !alreadyApplied && profile && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Profile completeness</span>
                  <span className="text-xs font-semibold">{profile.headline ? "Good" : "Incomplete"}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, (profile.headline ? 30 : 0) + (profile.resume_url ? 30 : 0) + (profile.skills?.length > 0 ? 20 : 0) + (profile.bio ? 20 : 0))}%` }}
                  />
                </div>
                {!profile.resume_url && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No resume uploaded yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Company card */}
          {job.organization_id && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">About the Employer</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{job.organization_name}</p>
                  <p className="text-xs text-muted-foreground">{job.location}</p>
                </div>
              </div>
              <Link to={`/company/${job.organization_id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  View Company Profile <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && (
        <ApplyModal
          job={job}
          profile={profile}
          firebaseUser={firebaseUser}
          userProfile={userProfile}
          onClose={() => setShowModal(false)}
          onSuccess={onApplicationSuccess}
        />
      )}
    </div>
  );
}
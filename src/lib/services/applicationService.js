/**
 * applicationService.js — Application CRUD, messaging, notes, evaluations.
 * Fixes the N+1 query in getEmployerHiringReviewSummary using aggregate SQL.
 */
import { supabase } from "@/lib/supabaseClient";
import { getEmployerProfile } from "@/lib/services/profileService";
import { getOrganization } from "@/lib/services/organizationService";
import { createNotification } from "@/lib/services/notificationService";
import { withRateLimit } from "@/lib/rateLimiter";

// ─── Applications ─────────────────────────────────────────────────────────────

export const getCurrentCandidateApplications = async (userEmail) => {
  if (!userEmail) return [];
  const { data, error } = await supabase
    .from("applications").select("*").eq("candidate_email", userEmail)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getApplicationsByCandidate = getCurrentCandidateApplications;

export const getApplicationsForCurrentEmployerOrganization = async (userEmail) => {
  const profile = await getEmployerProfile(userEmail);
  if (!profile?.organization_id) return [];
  const { data, error } = await supabase
    .from("applications").select("*").eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getApplicationsByOrg = async (orgId) => {
  if (!orgId) return [];
  const { data, error } = await supabase
    .from("applications").select("*").eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const checkExistingApplication = async (jobId, userEmail) => {
  const { data, error } = await supabase
    .from("applications").select("id").eq("job_id", jobId).eq("candidate_email", userEmail);
  if (error) throw error;
  return (data?.length || 0) > 0;
};

export const createApplicationForCurrentCandidate = async (userEmail, jobId, data) => {
  // Rate limit: 1 application per 5 seconds per user
  return withRateLimit(`apply:${userEmail}`, async () => {
    const alreadyApplied = await checkExistingApplication(jobId, userEmail);
    if (alreadyApplied) throw new Error("DUPLICATE: already applied to this job");

  const ALLOWED = ["job_title", "organization_id", "organization_name", "cover_letter", "resume_url", "candidate_name"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  const { data: app, error } = await supabase
    .from("applications")
    .insert({ ...safe, job_id: jobId, candidate_email: userEmail, status: "pending" })
    .select().single();
  if (error) throw error;

  try {
    if (safe.organization_id) {
      const org = await getOrganization(safe.organization_id);
      if (org?.owner_email) {
        await createNotification({
          userEmail: org.owner_email,
          title: "New Application Received",
          message: `${safe.candidate_name || "A candidate"} applied for "${safe.job_title || "your job"}"`,
          type: "application",
          link: "/employer/applications",
        });
      }
    }
  } catch (_) {}

  return app;
  }, 5000); // 5-second cooldown
};

export const createApplication = async (data) => {
  const { data: app, error } = await supabase
    .from("applications").insert({ ...data, status: "pending" }).select().single();
  if (error) throw error;
  return app;
};

export const updateApplicationStatus = async (userEmail, applicationId, newStatus) => {
  const VALID = ["pending", "reviewing", "shortlisted", "interview", "offered", "rejected", "withdrawn", "hired"];
  if (!VALID.includes(newStatus)) throw new Error("Invalid status value");

  const profile = await getEmployerProfile(userEmail);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const { data: app, error: appErr } = await supabase
    .from("applications").select("*").eq("id", applicationId).single();
  if (appErr || !app) throw new Error("Application not found");
  if (app.organization_id !== profile.organization_id) throw new Error("FORBIDDEN");

  const { error } = await supabase
    .from("applications")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (error) throw error;

  const statusMessages = {
    reviewing: "Your application is under review",
    shortlisted: "Great news! You have been shortlisted",
    interview: "Interview scheduled — check your application for details",
    offered: "🎉 You have received a job offer!",
    rejected: "Your application was not selected at this time",
    hired: "🎊 Congratulations! You have been hired",
  };

  try {
    if (app.candidate_email && statusMessages[newStatus]) {
      await createNotification({
        userEmail: app.candidate_email,
        title: statusMessages[newStatus],
        message: `Application for "${app.job_title || "a job"}" — status: ${newStatus}`,
        type: "application",
        link: "/candidate/applications",
      });
    }
  } catch (_) {}
};

export const updateApplication = async (appId, data) => {
  const { data: updated, error } = await supabase
    .from("applications")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", appId).select().single();
  if (error) throw error;
  return updated;
};

export const getApplicationById = async (applicationId) => {
  if (!applicationId) return null;
  const { data, error } = await supabase
    .from("applications").select("*").eq("id", applicationId).single();
  if (error && error.code !== "PGRST116") console.error("[getApplicationById]", error);
  return data || null;
};

// ─── Hiring Review Summary — Fixed N+1 with single aggregate query ─────────────

export const getEmployerHiringReviewSummary = async (userEmail) => {
  const profile = await getEmployerProfile(userEmail);
  if (!profile?.organization_id) {
    return { reviewingCount: 0, shortlistedCount: 0, strongEvaluationCount: 0 };
  }

  // Single query: count statuses in one pass (replaces N+1 loop)
  const { data: statusData } = await supabase
    .from("applications")
    .select("status")
    .eq("organization_id", profile.organization_id);

  let reviewingCount = 0;
  let shortlistedCount = 0;

  (statusData || []).forEach((a) => {
    if (a.status === "reviewing") reviewingCount++;
    if (a.status === "shortlisted") shortlistedCount++;
  });

  // Strong evaluations: aggregate via RPC to avoid N sub-queries
  let strongEvaluationCount = 0;
  try {
    const { data: evalData } = await supabase
      .from("application_evaluations")
      .select("id")
      .eq("recommendation", "strong_yes")
      .in(
        "application_id",
        (statusData || []).map((a) => a.id).filter(Boolean)
      );
    strongEvaluationCount = evalData?.length || 0;
  } catch (_) {}

  return { reviewingCount, shortlistedCount, strongEvaluationCount };
};

// ─── Application Messaging ────────────────────────────────────────────────────

export const getApplicationMessages = async (applicationId) => {
  if (!applicationId) return [];
  const { data, error } = await supabase
    .from("application_messages").select("*").eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const subscribeToApplicationMessages = (applicationId, callback) => {
  getApplicationMessages(applicationId).then(callback);
  const channel = supabase
    .channel(`messages:${applicationId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "application_messages",
      filter: `application_id=eq.${applicationId}`,
    }, () => {
      getApplicationMessages(applicationId).then(callback);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const sendApplicationMessage = async (applicationId, { sender_uid, sender_name, sender_role, message }) => {
  const { data, error } = await supabase.from("application_messages").insert({
    application_id: applicationId,
    sender_email: sender_uid,
    sender_name: sender_name || "",
    sender_role: sender_role || "",
    message,
  }).select().single();
  if (error) throw error;
  return data;
};

// ─── Application Internal Notes ───────────────────────────────────────────────

export const getApplicationInternalNotes = async (applicationId) => {
  const { data, error } = await supabase
    .from("application_notes").select("*").eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createApplicationInternalNote = async (applicationId, organizationId, { author_email, author_name, body }) => {
  const { data, error } = await supabase.from("application_notes").insert({
    application_id: applicationId,
    organization_id: organizationId,
    author_email,
    author_name,
    body,
    visibility: "internal",
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateApplicationInternalNote = async (noteId, { body }) => {
  const { data, error } = await supabase
    .from("application_notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId).select().single();
  if (error) throw error;
  return data;
};

// ─── Application Evaluation ───────────────────────────────────────────────────

export const getApplicationEvaluation = async (applicationId) => {
  const { data, error } = await supabase
    .from("application_evaluations").select("*").eq("application_id", applicationId);
  if (error) throw error;
  return data || [];
};

export const saveApplicationEvaluation = async (
  applicationId, organizationId,
  { reviewer_email, reviewer_name, overall_score, strengths, concerns, tags, recommendation }
) => {
  const payload = {
    overall_score,
    strengths: strengths || [],
    concerns: concerns || [],
    tags: tags || [],
    recommendation,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("application_evaluations").select("id")
    .eq("application_id", applicationId).eq("reviewer_email", reviewer_email).single();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("application_evaluations").update(payload).eq("id", existing.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from("application_evaluations").insert({
    application_id: applicationId,
    organization_id: organizationId,
    reviewer_email, reviewer_name, ...payload,
  }).select().single();
  if (error) throw error;
  return data;
};

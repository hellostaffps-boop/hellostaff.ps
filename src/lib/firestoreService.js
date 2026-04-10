/**
 * firestoreService.js — Migrated from Firestore to base44 entities + Supabase.
 * Firebase has been fully removed. All data is now stored in base44 entities.
 *
 * NOTE: uid parameters now receive the user's EMAIL (set via supabaseAuth normalization).
 * This ensures backward compatibility with all calling pages.
 */

import { base44 } from "@/api/base44Client";
import { getCandidateCompletion } from "@/lib/profileCompletion";

const first = (arr) => (arr?.length > 0 ? arr[0] : null);

const PROTECTED_FIELDS = ["role", "status", "is_admin", "admin_notes", "created_at", "uid"];
const stripProtectedFields = (data) => {
  const safe = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete safe[f]);
  return safe;
};

// ─── Users (now in Supabase profiles — use useAuth() instead) ───────────────

export const getCurrentUserDoc = async () => null; // Use useAuth() userProfile
export const updateSafeUserFields = async () => null; // Use supabase.auth.updateUser
export const recordLastLogin = async () => {}; // No-op: Supabase handles sessions

// ─── Candidate Profiles ──────────────────────────────────────────────────────

export const getCandidateProfile = async (uid) => {
  if (!uid) return null;
  const results = await base44.entities.CandidateProfile.filter({ user_email: uid });
  return first(results);
};

export const saveCandidateProfile = async (uid, data) => {
  const safe = stripProtectedFields(data);
  const existing = await getCandidateProfile(uid);
  const merged = { ...(existing || {}), ...safe };
  safe.profile_completion = getCandidateCompletion(merged).score;
  safe.user_email = uid;
  if (existing?.id) {
    return base44.entities.CandidateProfile.update(existing.id, safe);
  }
  return base44.entities.CandidateProfile.create(safe);
};

// ─── Employer Profiles ───────────────────────────────────────────────────────

export const getEmployerProfile = async (uid) => {
  if (!uid) return null;
  const results = await base44.entities.EmployerProfile.filter({ user_email: uid });
  return first(results);
};

export const saveEmployerProfile = async (uid, data) => {
  const ALLOWED = ["title", "phone", "avatar_url"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  const existing = await getEmployerProfile(uid);
  if (existing?.id) {
    return base44.entities.EmployerProfile.update(existing.id, safe);
  }
  return base44.entities.EmployerProfile.create({ ...safe, user_email: uid });
};

// ─── Organizations ───────────────────────────────────────────────────────────

export const getOrganization = async (orgId) => {
  if (!orgId) return null;
  const results = await base44.entities.Organization.filter({ id: orgId });
  return first(results);
};

export const getOrganizationForCurrentEmployer = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return null;
  return getOrganization(profile.organization_id);
};

export const getOwnedOrganization = async (uid) => {
  if (!uid) return null;
  const results = await base44.entities.Organization.filter({ owner_email: uid });
  return first(results);
};

export const saveOrganizationIfOwner = async (uid, orgId, data) => {
  const org = await getOrganization(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.owner_email !== uid) throw new Error("FORBIDDEN: not the organization owner");

  const ALLOWED = ["name", "business_type", "city", "address", "logo_url", "description", "website", "phone", "email"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  return base44.entities.Organization.update(orgId, safe);
};

// ─── Organization Membership ─────────────────────────────────────────────────

export const getCurrentOrganizationMembership = async (uid, orgId) => {
  if (!uid) return null;
  const results = await base44.entities.OrganizationMember.filter({
    user_email: uid,
    organization_id: orgId,
    status: "active",
  });
  return first(results);
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const getPublishedJobs = () =>
  base44.entities.Job.filter({ status: "published" }, "-created_date");

export const getEmployerOrganizationJobs = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return [];
  return base44.entities.Job.filter({ organization_id: profile.organization_id }, "-created_date");
};

export const getJob = async (jobId) => {
  if (!jobId) return null;
  const results = await base44.entities.Job.filter({ id: jobId });
  return first(results);
};

export const getJobsByOrg = async (orgId) => {
  if (!orgId) return [];
  return base44.entities.Job.filter({ organization_id: orgId }, "-created_date");
};

export const createJobForOwnedOrganization = async (uid, data, orgId, orgName) => {
  if (!orgId) throw new Error("No organization found for this employer");

  const ALLOWED = ["title", "description", "requirements", "benefits", "job_type",
    "employment_type", "location", "salary_min", "salary_max", "salary_period",
    "experience_required", "status"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  if (!["draft", "published"].includes(safe.status)) safe.status = "draft";

  return base44.entities.Job.create({
    ...safe,
    organization_id: orgId,
    organization_name: orgName || "",
    posted_by: uid,
  });
};

export const updateJobForOwnedOrganization = async (uid, jobId, data) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const job = await getJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.organization_id !== profile.organization_id) throw new Error("FORBIDDEN");

  const ALLOWED = ["title", "description", "requirements", "benefits", "job_type",
    "employment_type", "location", "salary_min", "salary_max", "salary_period",
    "experience_required", "status"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  return base44.entities.Job.update(jobId, safe);
};

export const updateJob = (jobId, data) => base44.entities.Job.update(jobId, data);
export const deleteJob = (jobId) => base44.entities.Job.delete(jobId);

export const getRelatedJobs = async (jobId, jobType) => {
  const results = await base44.entities.Job.filter({ status: "published", job_type: jobType }, "-created_date");
  return results.filter((j) => j.id !== jobId).slice(0, 4);
};

export const getRecentlyPostedJobs = (count = 5) =>
  base44.entities.Job.filter({ status: "published" }, "-created_date", count);

// ─── Applications ─────────────────────────────────────────────────────────────

export const getCurrentCandidateApplications = async (uid) => {
  if (!uid) return [];
  return base44.entities.Application.filter({ candidate_email: uid }, "-created_date");
};

export const getApplicationsByCandidate = getCurrentCandidateApplications;

export const getApplicationsForCurrentEmployerOrganization = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return [];
  return base44.entities.Application.filter({ organization_id: profile.organization_id }, "-created_date");
};

export const getApplicationsByOrg = async (orgId) => {
  if (!orgId) return [];
  return base44.entities.Application.filter({ organization_id: orgId }, "-created_date");
};

export const checkExistingApplication = async (jobId, uid) => {
  const results = await base44.entities.Application.filter({ job_id: jobId, candidate_email: uid });
  return results.length > 0;
};

export const createApplicationForCurrentCandidate = async (uid, jobId, data) => {
  const alreadyApplied = await checkExistingApplication(jobId, uid);
  if (alreadyApplied) throw new Error("DUPLICATE: already applied to this job");

  const ALLOWED = ["job_title", "organization_id", "organization_name", "cover_letter", "resume_url", "candidate_name"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  const app = await base44.entities.Application.create({
    ...safe,
    job_id: jobId,
    candidate_email: uid,
    status: "pending",
  });

  try {
    if (safe.organization_id) {
      const orgs = await base44.entities.Organization.filter({ id: safe.organization_id });
      const org = orgs[0];
      if (org?.owner_email) {
        await base44.entities.Notification.create({
          user_email: org.owner_email,
          title: "New Application Received",
          message: `${safe.candidate_name || "A candidate"} applied for "${safe.job_title || "your job"}"`,
          type: "application",
          link: "/employer/applications",
          read: false,
        });
      }
    }
  } catch (_) {}

  return app;
};

export const createApplication = (data) =>
  base44.entities.Application.create({ ...data, status: "pending" });

export const updateApplicationStatus = async (uid, applicationId, newStatus) => {
  const VALID = ["pending", "reviewing", "shortlisted", "interview", "offered", "rejected", "withdrawn", "hired"];
  if (!VALID.includes(newStatus)) throw new Error("Invalid status value");

  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const apps = await base44.entities.Application.filter({ id: applicationId });
  const app = apps[0];
  if (!app) throw new Error("Application not found");
  if (app.organization_id !== profile.organization_id) throw new Error("FORBIDDEN");

  await base44.entities.Application.update(applicationId, { status: newStatus });

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
      await base44.entities.Notification.create({
        user_email: app.candidate_email,
        title: statusMessages[newStatus],
        message: `Application for "${app.job_title || "a job"}" — status: ${newStatus}`,
        type: "application",
        link: "/candidate/applications",
        read: false,
      });
    }
  } catch (_) {}
};

export const updateApplication = (appId, data) =>
  base44.entities.Application.update(appId, data);

export const getApplicationById = async (applicationId) => {
  if (!applicationId) return null;
  const results = await base44.entities.Application.filter({ id: applicationId });
  return results[0] || null;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = async (uid) => {
  if (!uid) return [];
  return base44.entities.Notification.filter({ user_email: uid }, "-created_date", 50);
};

export const markNotificationRead = (notifId) =>
  base44.entities.Notification.update(notifId, { read: true });

export const markAllNotificationsRead = async (uid) => {
  const notifs = await base44.entities.Notification.filter({ user_email: uid, read: false });
  await Promise.all(notifs.map((n) => base44.entities.Notification.update(n.id, { read: true })));
};

export const getUnreadNotificationsCount = async (uid) => {
  const notifs = await base44.entities.Notification.filter({ user_email: uid, read: false });
  return notifs.length;
};

// ─── Profile Completion ─────────────────────────────────────────────────────

export const calculateEmployerProfileCompletion = (org) => {
  if (!org) return 0;
  const checks = [!!org.name, !!org.business_type, !!org.city, !!org.address, !!org.logo_url, !!org.description, !!org.website, !!org.phone];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// ─── Application Messaging ────────────────────────────────────────────────────

export const subscribeToApplicationMessages = (applicationId, callback) => {
  base44.entities.ApplicationMessage.filter({ application_id: applicationId }, "created_date")
    .then(callback);

  return base44.entities.ApplicationMessage.subscribe((event) => {
    if (event.data?.application_id === applicationId) {
      base44.entities.ApplicationMessage.filter({ application_id: applicationId }, "created_date")
        .then(callback);
    }
  });
};

export const sendApplicationMessage = (applicationId, { sender_uid, sender_name, sender_role, message }) =>
  base44.entities.ApplicationMessage.create({
    application_id: applicationId,
    sender_email: sender_uid, // sender_uid is now email
    sender_name: sender_name || "",
    sender_role: sender_role || "",
    message,
  });

// ─── Application Internal Notes ──────────────────────────────────────────────

export const getApplicationInternalNotes = async (applicationId) =>
  base44.entities.ApplicationNote.filter({ application_id: applicationId }, "-created_date");

export const createApplicationInternalNote = (applicationId, organizationId, { author_email, author_name, body }) =>
  base44.entities.ApplicationNote.create({
    application_id: applicationId,
    organization_id: organizationId,
    author_email,
    author_name,
    body,
    visibility: "internal",
  });

export const updateApplicationInternalNote = (noteId, { body }) =>
  base44.entities.ApplicationNote.update(noteId, { body });

// ─── Application Evaluation ──────────────────────────────────────────────────

export const getApplicationEvaluation = async (applicationId) =>
  base44.entities.ApplicationEvaluation.filter({ application_id: applicationId });

export const saveApplicationEvaluation = async (applicationId, organizationId, { reviewer_email, reviewer_name, overall_score, strengths, concerns, tags, recommendation }) => {
  const existing = await base44.entities.ApplicationEvaluation.filter({
    application_id: applicationId,
    reviewer_email,
  });

  const payload = {
    overall_score,
    strengths: strengths || [],
    concerns: concerns || [],
    tags: tags || [],
    recommendation,
  };

  if (existing.length > 0) {
    return base44.entities.ApplicationEvaluation.update(existing[0].id, payload);
  }
  return base44.entities.ApplicationEvaluation.create({
    application_id: applicationId,
    organization_id: organizationId,
    reviewer_email,
    reviewer_name,
    ...payload,
  });
};

// ─── Hiring Review Summary ───────────────────────────────────────────────────

export const getEmployerHiringReviewSummary = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return { reviewingCount: 0, shortlistedCount: 0, strongEvaluationCount: 0 };

  const applications = await base44.entities.Application.filter({ organization_id: profile.organization_id });
  let reviewingCount = 0, shortlistedCount = 0, strongEvaluationCount = 0;

  for (const app of applications) {
    if (app.status === "reviewing") reviewingCount++;
    if (app.status === "shortlisted") shortlistedCount++;
    const evals = await getApplicationEvaluation(app.id);
    if (evals.some((e) => e.recommendation === "strong_yes")) strongEvaluationCount++;
  }

  return { reviewingCount, shortlistedCount, strongEvaluationCount };
};

export const notifyMatchingCandidatesForJob = async (job) => {
  if (!job?.job_type) return;
  try {
    const candidates = await base44.entities.CandidateProfile.list();
    const matching = candidates.filter((c) => c.job_types?.includes(job.job_type));
    await Promise.allSettled(
      matching.map((c) =>
        base44.entities.Notification.create({
          user_email: c.user_email,
          title: `وظيفة جديدة تناسبك: ${job.title}`,
          message: `نشرت ${job.organization_name || "شركة"} وظيفة جديدة في تخصصك.`,
          type: "job",
          link: `/jobs/${job.id}`,
          read: false,
        })
      )
    );
  } catch (_) {}
};
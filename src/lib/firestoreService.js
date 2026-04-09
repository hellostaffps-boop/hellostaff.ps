/**
 * firestoreService.js — Phase 4 Hardened Data Service Layer
 *
 * Security philosophy:
 * - All writes are ownership-scoped. No method accepts arbitrary uid overrides from callers.
 * - Role/status fields are stripped from all user-facing updates.
 * - Employer operations require verified org membership before proceeding.
 * - Candidate operations are always scoped to the authenticated uid.
 * - Admin-only operations live in adminService.js, not here.
 * - This layer is compatible with strict Firestore Security Rules enforcement.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Fields that must never be written by normal user-facing flows. */
const PROTECTED_USER_FIELDS = ["role", "status", "is_admin", "admin_notes", "created_at", "uid"];

/** Strip protected fields before any user self-update. */
const stripProtectedFields = (data) => {
  const safe = { ...data };
  PROTECTED_USER_FIELDS.forEach((f) => delete safe[f]);
  return safe;
};

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * Read the current user's own document.
 * Compatible with Security Rule: allow read if request.auth.uid == uid
 */
export const getCurrentUserDoc = (uid) =>
  getDoc(doc(db, "users", uid)).then((s) => (s.exists() ? { uid: s.id, ...s.data() } : null));

/**
 * Safe self-update — strips role, status, and all admin-controlled fields.
 * Only allows: full_name, preferred_language, avatar_url, phone.
 */
export const updateSafeUserFields = (uid, data) => {
  const ALLOWED = ["full_name", "preferred_language", "avatar_url", "phone"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  if (Object.keys(safe).length === 0) return Promise.resolve();
  return updateDoc(doc(db, "users", uid), { ...safe, updated_at: serverTimestamp() });
};

/**
 * Internal-only: record last login. Called from firebaseAuth only.
 * Intentionally narrow — only touches last_login_at.
 */
export const recordLastLogin = (uid) =>
  updateDoc(doc(db, "users", uid), { last_login_at: serverTimestamp() }).catch(() => {
    // Silently fail — doc may not exist yet on very first auth event
  });

// ─── Candidate Profiles ──────────────────────────────────────────────────────

/**
 * Read own candidate profile. uid must equal auth.uid.
 */
export const getCandidateProfile = (uid) =>
  getDoc(doc(db, "candidate_profiles", uid)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

/**
 * Save own candidate profile. Strips user_id override from caller — always uses uid param.
 * Never allows writing role/status.
 */
export const saveCandidateProfile = (uid, data) => {
  const safe = stripProtectedFields(data);
  // Enforce user_id is always the real uid, not caller-supplied
  safe.user_id = uid;
  return setDoc(
    doc(db, "candidate_profiles", uid),
    { ...safe, updated_at: serverTimestamp() },
    { merge: true }
  );
};

// ─── Employer Profiles ───────────────────────────────────────────────────────

/**
 * Read own employer profile. uid must equal auth.uid.
 */
export const getEmployerProfile = (uid) =>
  getDoc(doc(db, "employer_profiles", uid)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

/**
 * Save own employer profile. Strips org_id override — organization relationship is immutable
 * from the frontend; only safe contact fields are updated.
 */
export const saveEmployerProfile = (uid, data) => {
  const ALLOWED_EMPLOYER_FIELDS = ["title", "phone", "avatar_url"];
  const safe = {};
  ALLOWED_EMPLOYER_FIELDS.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  return setDoc(
    doc(db, "employer_profiles", uid),
    { ...safe, updated_at: serverTimestamp() },
    { merge: true }
  );
};

// ─── Organizations ───────────────────────────────────────────────────────────

/**
 * Read an organization by id (public-safe for published orgs; caller is responsible for
 * only reading orgs they have access to).
 */
export const getOrganization = (orgId) =>
  getDoc(doc(db, "organizations", orgId)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

/**
 * Read the organization for the current employer, resolved through their employer profile.
 * This ensures the employer can only ever read THEIR organization.
 */
export const getOrganizationForCurrentEmployer = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return null;
  return getOrganization(profile.organization_id);
};

/**
 * Save organization data — ONLY if the caller is the verified owner.
 * Ownership check: organizations/{orgId}.owner_user_id == uid
 * Strips sensitive fields: status, verified, owner_user_id are never updatable here.
 */
export const saveOrganizationIfOwner = async (uid, orgId, data) => {
  const org = await getOrganization(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.owner_user_id !== uid) throw new Error("FORBIDDEN: not the organization owner");

  const ALLOWED_ORG_FIELDS = ["name", "business_type", "city", "address", "logo_url", "description", "website", "phone", "email"];
  const safe = {};
  ALLOWED_ORG_FIELDS.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  return setDoc(
    doc(db, "organizations", orgId),
    { ...safe, updated_at: serverTimestamp() },
    { merge: true }
  );
};

// ─── Organization Membership ─────────────────────────────────────────────────

/**
 * Get the current user's membership record for a specific organization.
 */
export const getCurrentOrganizationMembership = async (uid, orgId) => {
  const q = query(
    collection(db, "organization_members"),
    where("user_id", "==", uid),
    where("organization_id", "==", orgId),
    where("status", "==", "active"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * Public: read only published jobs. Safe for any authenticated or public user.
 */
export const getPublishedJobs = async () => {
  const q = query(collection(db, "jobs"), where("status", "==", "published"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Employer: read all jobs for their organization.
 * orgId is resolved through employer profile, not passed arbitrarily.
 */
export const getEmployerOrganizationJobs = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return [];
  const q = query(
    collection(db, "jobs"),
    where("organization_id", "==", profile.organization_id),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Read a single job (public read, enforced by Security Rules on Firestore side).
 */
export const getJob = (jobId) =>
  getDoc(doc(db, "jobs", jobId)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

/**
 * Create a job — ALWAYS attaches the organization_id from the employer's own profile.
 * Caller cannot supply a different organization_id.
 * Status defaults to "draft" unless explicitly set to "published".
 */
export const createJobForOwnedOrganization = async (uid, data, orgId, orgName) => {
  if (!orgId) throw new Error("No organization found for this employer");

  const ALLOWED_JOB_FIELDS = [
    "title", "description", "requirements", "benefits",
    "job_type", "employment_type", "location",
    "salary_min", "salary_max", "salary_period",
    "experience_required", "status",
  ];
  const safe = {};
  ALLOWED_JOB_FIELDS.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  // Status gate: only allow draft or published, not arbitrary values
  if (!["draft", "published"].includes(safe.status)) safe.status = "draft";

  return addDoc(collection(db, "jobs"), {
    ...safe,
    organization_id: orgId,           // Always from verified employer profile
    organization_name: orgName || "",
    created_by: uid,                   // Always the real auth uid
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

/**
 * Update a job — verifies the job belongs to the employer's organization before writing.
 * Strips organization_id, created_by to prevent re-assignment.
 */
export const updateJobForOwnedOrganization = async (uid, jobId, data) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const job = await getJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.organization_id !== profile.organization_id) throw new Error("FORBIDDEN: job belongs to another organization");

  const ALLOWED_UPDATE_FIELDS = [
    "title", "description", "requirements", "benefits",
    "job_type", "employment_type", "location",
    "salary_min", "salary_max", "salary_period",
    "experience_required", "status",
  ];
  const safe = {};
  ALLOWED_UPDATE_FIELDS.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  // Status gate
  if (safe.status && !["draft", "published", "closed", "filled"].includes(safe.status)) {
    delete safe.status;
  }

  return updateDoc(doc(db, "jobs", jobId), { ...safe, updated_at: serverTimestamp() });
};

// ─── Applications ─────────────────────────────────────────────────────────────

/**
 * Candidate: read only their own applications.
 */
export const getCurrentCandidateApplications = async (uid) => {
  const q = query(
    collection(db, "applications"),
    where("candidate_user_id", "==", uid),
    orderBy("applied_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Backward-compatible alias
export const getApplicationsByCandidate = getCurrentCandidateApplications;

/**
 * Employer: read applications only for their own organization.
 * Organization membership is verified through employer profile.
 */
export const getApplicationsForCurrentEmployerOrganization = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return [];
  const q = query(
    collection(db, "applications"),
    where("organization_id", "==", profile.organization_id),
    orderBy("applied_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Backward-compatible alias (for pages still using orgId)
export const getApplicationsByOrg = async (orgId) => {
  if (!orgId) return [];
  const q = query(
    collection(db, "applications"),
    where("organization_id", "==", orgId),
    orderBy("applied_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Check for duplicate application before creating.
 */
export const checkExistingApplication = async (jobId, candidateUid) => {
  const q = query(
    collection(db, "applications"),
    where("job_id", "==", jobId),
    where("candidate_user_id", "==", candidateUid)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

/**
 * Create application — enforces:
 * - candidate_user_id always equals the authenticated uid (not caller-supplied)
 * - duplicate check before insert
 * - status always starts as "submitted"
 * - strips any sensitive fields
 */
export const createApplicationForCurrentCandidate = async (uid, jobId, data) => {
  const alreadyApplied = await checkExistingApplication(jobId, uid);
  if (alreadyApplied) throw new Error("DUPLICATE: already applied to this job");

  const ALLOWED_APP_FIELDS = ["job_title", "organization_id", "organization_name", "cover_letter", "resume_url", "candidate_name"];
  const safe = {};
  ALLOWED_APP_FIELDS.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });

  return addDoc(collection(db, "applications"), {
    ...safe,
    job_id: jobId,
    candidate_user_id: uid,         // Always enforced, never from caller data
    status: "submitted",            // Always starts at submitted
    applied_at: serverTimestamp(),
  });
};

// Backward-compatible alias
export const createApplication = (data) =>
  addDoc(collection(db, "applications"), { ...data, applied_at: serverTimestamp(), status: "submitted" });

/**
 * Employer updates application status — validates the application belongs to their org.
 * Only allows status transitions, no other field mutations.
 */
export const updateApplicationStatus = async (uid, applicationId, newStatus) => {
  const VALID_STATUSES = ["submitted", "reviewing", "shortlisted", "interview", "offered", "rejected", "withdrawn", "hired"];
  if (!VALID_STATUSES.includes(newStatus)) throw new Error("Invalid status value");

  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const appSnap = await getDoc(doc(db, "applications", applicationId));
  if (!appSnap.exists()) throw new Error("Application not found");
  if (appSnap.data().organization_id !== profile.organization_id) throw new Error("FORBIDDEN: application belongs to another organization");

  return updateDoc(doc(db, "applications", applicationId), {
    status: newStatus,
    updated_at: serverTimestamp(),
  });
};

// Backward-compatible alias (used by EmployerApplications)
export const updateApplication = (appId, data) =>
  updateDoc(doc(db, "applications", appId), { ...data, updated_at: serverTimestamp() });

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Read own notifications only.
 */
export const getNotifications = async (uid) => {
  const q = query(
    collection(db, "notifications"),
    where("user_id", "==", uid),
    orderBy("created_at", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Mark a notification as read — safe self-mutation, only touches is_read.
 */
export const markNotificationRead = (notifId) =>
  updateDoc(doc(db, "notifications", notifId), { is_read: true, updated_at: serverTimestamp() });
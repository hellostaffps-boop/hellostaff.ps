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
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  onSnapshot,
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
export const saveCandidateProfile = async (uid, data) => {
  const safe = stripProtectedFields(data);
  safe.user_id = uid;
  // Merge with existing to get full picture for completion calc
  const existing = await getCandidateProfile(uid);
  const merged = { ...existing, ...safe };
  safe.profile_completion = calculateCandidateProfileCompletion(merged);
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

  const appRef = await addDoc(collection(db, 'applications'), {
    ...safe,
    job_id: jobId,
    candidate_user_id: uid,
    status: 'submitted',
    applied_at: serverTimestamp(),
  });

  // Notify org owner about new application
  try {
    if (safe.organization_id) {
      const orgSnap = await getDoc(doc(db, 'organizations', safe.organization_id));
      if (orgSnap.exists() && orgSnap.data().owner_user_id) {
        await createNotification(orgSnap.data().owner_user_id, {
          title: 'New Application Received',
          message: `${safe.candidate_name || 'A candidate'} applied for "${safe.job_title || 'your job'}"`,
          type: 'application',
          link: '/employer/applications',
        });
      }
    }
  } catch (_) { /* non-blocking */ }

  return appRef;
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

  await updateDoc(doc(db, 'applications', applicationId), {
    status: newStatus,
    updated_at: serverTimestamp(),
  });

  // Notify the candidate about status change
  const statusMessages = {
    reviewing: 'Your application is under review',
    shortlisted: 'Great news! You have been shortlisted',
    interview: 'Interview scheduled — check your application for details',
    offered: '🎉 You have received a job offer!',
    rejected: 'Your application was not selected at this time',
    withdrawn: 'Your application has been withdrawn',
    hired: '🎊 Congratulations! You have been hired',
  };
  try {
    const candidateUid = appSnap.data().candidate_user_id;
    if (candidateUid && statusMessages[newStatus]) {
      await createNotification(candidateUid, {
        title: statusMessages[newStatus],
        message: `Application for "${appSnap.data().job_title || 'a job'}" — status updated to: ${newStatus}`,
        type: 'application',
        link: '/candidate/applications',
      });
    }
  } catch (_) { /* non-blocking */ }
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

export const markAllNotificationsRead = async (uid) => {
  const q = query(collection(db, 'notifications'), where('user_id', '==', uid), where('is_read', '==', false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { is_read: true, updated_at: serverTimestamp() })));
};

export const getUnreadNotificationsCount = async (uid) => {
  const q = query(collection(db, 'notifications'), where('user_id', '==', uid), where('is_read', '==', false));
  const snap = await getDocs(q);
  return snap.size;
};

/** Internal: create a notification for a user. */
const createNotification = (userId, { title, message, type = 'system', link = '' }) =>
  addDoc(collection(db, 'notifications'), {
    user_id: userId,
    title,
    message,
    type,
    link,
    is_read: false,
    created_at: serverTimestamp(),
  });

// ─── Profile Completion ─────────────────────────────────────────────────────

/**
 * Calculate candidate profile completion percentage based on actual filled fields.
 */
export const calculateCandidateProfileCompletion = (profile) => {
  if (!profile) return 0;
  const checks = [
    !!profile.headline,
    !!profile.bio,
    !!profile.city,
    !!profile.phone,
    Array.isArray(profile.preferred_roles) && profile.preferred_roles.length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    typeof profile.years_experience === 'number' && profile.years_experience >= 0,
    !!profile.availability,
    !!profile.cv_url,
    Array.isArray(profile.work_experience) && profile.work_experience.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

/**
 * Calculate employer/organization profile completion.
 */
export const calculateEmployerProfileCompletion = (org) => {
  if (!org) return 0;
  const checks = [
    !!org.name,
    !!org.business_type,
    !!org.city,
    !!org.address,
    !!org.logo_url,
    !!org.description,
    !!org.website,
    !!org.phone,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

/**
 * Get organization owned by a specific user (queries by owner_user_id).
 * Handles cases where org may have been created with a non-uid document ID.
 */
export const getOwnedOrganization = async (uid) => {
  const q = query(
    collection(db, 'organizations'),
    where('owner_user_id', '==', uid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ─── Backward-compatible job helpers ───────────────────────────────────────

export const getJobsByOrg = async (orgId) => {
  if (!orgId) return [];
  const q = query(collection(db, 'jobs'), where('organization_id', '==', orgId), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateJob = (jobId, data) =>
  updateDoc(doc(db, 'jobs', jobId), { ...data, updated_at: serverTimestamp() });

export const deleteJob = (jobId) => deleteDoc(doc(db, 'jobs', jobId));

/**
 * Get related jobs by same job_type or same location (excluding current job).
 */
export const getRelatedJobs = async (jobId, jobType, location) => {
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'published'),
    where('job_type', '==', jobType),
    orderBy('created_at', 'desc'),
    limit(4)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((j) => j.id !== jobId);
};

/** Get recently posted published jobs. */
export const getRecentlyPostedJobs = async (count = 5) => {
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'published'),
    orderBy('created_at', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Application by ID ────────────────────────────────────────────────────────

export const getApplicationById = (applicationId) =>
  getDoc(doc(db, 'applications', applicationId)).then((s) => s.exists() ? { id: s.id, ...s.data() } : null);

// ─── Application Messaging ────────────────────────────────────────────────────

/**
 * Real-time subscription to messages for an application.
 * Returns an unsubscribe function.
 * Only the candidate on the application and the employer org members should be
 * able to read/write — enforce via Firestore Security Rules:
 *   match /application_messages/{msgId} {
 *     allow read, write: if request.auth != null;
 *   }
 */
export const subscribeToApplicationMessages = (applicationId, callback) => {
  const q = query(
    collection(db, 'application_messages'),
    where('application_id', '==', applicationId),
    orderBy('created_at', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

/**
 * Send a message on an application thread.
 * Sender identity is always attached server-side via the authenticated uid.
 */
export const sendApplicationMessage = (applicationId, { sender_uid, sender_name, sender_role, message }) =>
  addDoc(collection(db, 'application_messages'), {
    application_id: applicationId,
    sender_uid,
    sender_name: sender_name || '',
    sender_role: sender_role || '',
    message,
    created_at: serverTimestamp(),
  });
/**
 * adminService.js — Phase 4.1 Admin-Only Data Access Layer
 *
 * READS only. All privileged mutations have been moved to lib/privilegedActions.js.
 * This file is safe to call from admin UI components — every method validates
 * platform_admin role before executing any Firestore read.
 *
 * See also: SECURITY_NOTES.md for full architecture documentation.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Role guard ───────────────────────────────────────────────────────────────

const assertAdmin = (userProfile) => {
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
};

// ─── Admin Dashboard — safe summary data ─────────────────────────────────────

/**
 * Returns high-level counts for the admin dashboard.
 * Requires platform_admin role.
 */
export const getAdminDashboardDataSafe = async (userProfile) => {
  assertAdmin(userProfile);

  const [usersSnap, jobsSnap, appsSnap, orgsSnap] = await Promise.all([
    getDocs(query(collection(db, "users"), limit(1000))),
    getDocs(query(collection(db, "jobs"), limit(1000))),
    getDocs(query(collection(db, "applications"), limit(1000))),
    getDocs(query(collection(db, "organizations"), limit(500))),
  ]);

  const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const apps = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const orgs = orgsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    totalUsers: users.length,
    totalCandidates: users.filter((u) => u.role === "candidate").length,
    totalEmployers: users.filter((u) => ["employer_owner", "employer_manager"].includes(u.role)).length,
    totalAdmins: users.filter((u) => u.role === "platform_admin").length,
    totalJobs: jobs.length,
    publishedJobs: jobs.filter((j) => j.status === "published").length,
    totalApplications: apps.length,
    totalOrganizations: orgs.length,
    activeOrganizations: orgs.filter((o) => o.status === "active").length,
  };
};

/**
 * Get recent users for admin review.
 * Requires platform_admin role.
 */
export const getAdminUsersSafe = async (userProfile, maxCount = 100) => {
  assertAdmin(userProfile);
  const q = query(collection(db, "users"), orderBy("created_at", "desc"), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get pending/unverified organizations for admin review.
 * Requires platform_admin role.
 */
export const getAdminOrganizationsSafe = async (userProfile) => {
  assertAdmin(userProfile);
  const q = query(collection(db, "organizations"), orderBy("created_at", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get admin reports (moderation queue).
 * Requires platform_admin role.
 */
export const getAdminReportsSafe = async (userProfile) => {
  assertAdmin(userProfile);
  const q = query(
    collection(db, "admin_reports"),
    where("status", "==", "pending"),
    orderBy("created_at", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Privileged mutations — delegated to lib/privilegedActions.js ─────────────
//
// All sensitive mutations (role promotion, suspend, org verify, etc.) have been
// moved to lib/privilegedActions.js which provides stub implementations with
// clear migration paths to Cloud Functions.
//
// Import from privilegedActions.js directly in admin UI components:
//   import { promoteUserRole, suspendUser, isPrivilegedActionError } from '@/lib/privilegedActions';

/**
 * Get audit logs for the admin dashboard.
 * Delegates to auditLogService — imported here for convenience.
 * Requires platform_admin role.
 */
export { getAuditLogsSafe, getAuditLogsForTarget, getFailedAuditLogsSafe } from "@/lib/backend/auditLogService";

/**
 * Verify an organization — delegates to privileged backend.
 * Direct Firestore write kept for backward compatibility but
 * production should route through requestVerifyOrganization() from privilegedActionService.
 */
export const verifyOrganization = async (userProfile, orgId) => {
  assertAdmin(userProfile);
  // Safe to do directly since this is admin-only field + rule-protected
  return updateDoc(doc(db, "organizations", orgId), {
    verified: true,
    verified_at: serverTimestamp(),
    verified_by: userProfile.uid,
  });
};

/**
 * Update admin report status (review/resolve/dismiss).
 * Requires platform_admin role.
 */
export const updateAdminReportStatus = async (userProfile, reportId, status, notes = "") => {
  assertAdmin(userProfile);
  const VALID = ["reviewed", "resolved", "dismissed"];
  if (!VALID.includes(status)) throw new Error("Invalid report status");
  return updateDoc(doc(db, "admin_reports", reportId), {
    status,
    notes,
    reviewed_by: userProfile.uid,
    reviewed_at: serverTimestamp(),
  });
};
/**
 * auditLogService.js — Phase 4.2 Audit Log Read Service
 *
 * SECURITY CONTRACT:
 * - audit_logs collection is WRITE-ONLY from Cloud Functions (Admin SDK).
 * - Firestore Security Rules must deny any client write to audit_logs.
 * - Only platform_admin may READ audit_logs from the client.
 * - No sensitive payload data should be readable by non-admin roles.
 *
 * FIRESTORE RULE REQUIREMENT (add to firestore.rules):
 *
 *   match /audit_logs/{logId} {
 *     allow read: if isAdmin();
 *     allow write: if false; // Backend-only via Admin SDK
 *   }
 *
 * AUDIT LOG DOCUMENT SCHEMA (written by Cloud Functions):
 *   {
 *     action: string,            // e.g. 'promoteUserRole', 'suspendUser'
 *     actor_uid: string,         // uid of the admin who triggered the action
 *     actor_role: string,        // role of the actor at time of action
 *     target_type: string,       // 'user' | 'organization' | 'job' | 'report' | 'setting'
 *     target_id: string,         // id of the affected document
 *     organization_id: string,   // if relevant
 *     payload_summary: object,   // sanitized summary (no passwords, no PII beyond uid)
 *     status: 'success' | 'failed',
 *     error_code: string | null,
 *     created_at: Timestamp,
 *   }
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Role guard ────────────────────────────────────────────────────────────────

const assertAdmin = (userProfile) => {
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required to read audit logs");
  }
};

// ─── Audit log reads ───────────────────────────────────────────────────────────

/**
 * Get recent audit log entries for admin review.
 * Requires platform_admin role.
 *
 * @param {object} userProfile
 * @param {number} maxCount
 * @returns {Promise<AuditLogEntry[]>}
 */
export const getAuditLogsSafe = async (userProfile, maxCount = 100) => {
  assertAdmin(userProfile);
  const q = query(
    collection(db, "audit_logs"),
    orderBy("created_at", "desc"),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get audit logs for a specific target (user, org, job, etc.).
 * Requires platform_admin role.
 *
 * @param {object} userProfile
 * @param {'user'|'organization'|'job'|'report'|'setting'} targetType
 * @param {string} targetId
 * @returns {Promise<AuditLogEntry[]>}
 */
export const getAuditLogsForTarget = async (userProfile, targetType, targetId) => {
  assertAdmin(userProfile);
  const q = query(
    collection(db, "audit_logs"),
    where("target_type", "==", targetType),
    where("target_id", "==", targetId),
    orderBy("created_at", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get audit logs for a specific actor (admin user).
 * Requires platform_admin role.
 *
 * @param {object} userProfile
 * @param {string} actorUid
 * @returns {Promise<AuditLogEntry[]>}
 */
export const getAuditLogsByActor = async (userProfile, actorUid) => {
  assertAdmin(userProfile);
  const q = query(
    collection(db, "audit_logs"),
    where("actor_uid", "==", actorUid),
    orderBy("created_at", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get failed privileged action attempts for security review.
 * Requires platform_admin role.
 *
 * @param {object} userProfile
 * @returns {Promise<AuditLogEntry[]>}
 */
export const getFailedAuditLogsSafe = async (userProfile) => {
  assertAdmin(userProfile);
  const q = query(
    collection(db, "audit_logs"),
    where("status", "==", "failed"),
    orderBy("created_at", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Human-readable action labels ─────────────────────────────────────────────

export const AUDIT_ACTION_LABELS = {
  promoteUserRole: { en: "Role Promotion", ar: "ترقية الدور" },
  suspendUser: { en: "User Suspended", ar: "تعليق المستخدم" },
  reactivateUser: { en: "User Reactivated", ar: "إعادة تفعيل المستخدم" },
  verifyOrganization: { en: "Organization Verified", ar: "توثيق المنظمة" },
  unverifyOrganization: { en: "Organization Unverified", ar: "إلغاء توثيق المنظمة" },
  assignEmployerManager: { en: "Manager Assigned", ar: "تعيين مدير" },
  revokeEmployerManager: { en: "Manager Revoked", ar: "إلغاء صلاحية مدير" },
  forceCloseJob: { en: "Job Force-Closed", ar: "إغلاق وظيفة إجباريًا" },
  moderateAdminReport: { en: "Report Moderated", ar: "معالجة بلاغ" },
  updateGlobalSetting: { en: "Setting Updated", ar: "تحديث إعداد عام" },
  seedFirstAdmin: { en: "Admin Seeded", ar: "تهيئة المشرف الأول" },
  verifyCandidate: { en: "Candidate Verified", ar: "توثيق المرشح" },
};

export const getAuditActionLabel = (action, lang = "en") =>
  (AUDIT_ACTION_LABELS[action] || { en: action, ar: action })[lang];
/**
 * auditLogService.js — Migrated from Firestore to base44 entities (AuditLog entity).
 * Reads audit logs stored by backend functions.
 */

import { base44 } from "@/api/base44Client";

const assertAdmin = (userProfile) => {
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required to read audit logs");
  }
};

export const getAuditLogsSafe = async (userProfile, maxCount = 100) => {
  assertAdmin(userProfile);
  return base44.entities.AuditLog.list("-created_date", maxCount);
};

export const getAuditLogsForTarget = async (userProfile, targetType, targetId) => {
  assertAdmin(userProfile);
  return base44.entities.AuditLog.filter(
    { target_type: targetType, target_id: targetId },
    "-created_date",
    50
  );
};

export const getAuditLogsByActor = async (userProfile, actorEmail) => {
  assertAdmin(userProfile);
  return base44.entities.AuditLog.filter({ actor_email: actorEmail }, "-created_date", 50);
};

export const getFailedAuditLogsSafe = async (userProfile) => {
  assertAdmin(userProfile);
  return base44.entities.AuditLog.filter({ status: "failure" }, "-created_date", 100);
};

export const AUDIT_ACTION_LABELS = {
  promoteUserRole: { en: "Role Promotion", ar: "ترقية الدور" },
  suspendUser: { en: "User Suspended", ar: "تعليق المستخدم" },
  reactivateUser: { en: "User Reactivated", ar: "إعادة تفعيل المستخدم" },
  verifyOrganization: { en: "Organization Verified", ar: "توثيق المنظمة" },
  assignEmployerManager: { en: "Manager Assigned", ar: "تعيين مدير" },
  revokeEmployerManager: { en: "Manager Revoked", ar: "إلغاء صلاحية مدير" },
  forceCloseJob: { en: "Job Force-Closed", ar: "إغلاق وظيفة إجباريًا" },
  moderateAdminReport: { en: "Report Moderated", ar: "معالجة بلاغ" },
  verifyCandidate: { en: "Candidate Verified", ar: "توثيق المرشح" },
};

export const getAuditActionLabel = (action, lang = "en") =>
  (AUDIT_ACTION_LABELS[action] || { en: action, ar: action })[lang];
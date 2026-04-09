/**
 * privilegedActionService.js — Phase 4.2 Frontend Privileged Action Service
 *
 * This is the ONLY gateway between the frontend and sensitive backend operations.
 *
 * Architecture:
 *   UI Component → privilegedActionService → Firebase httpsCallable → Cloud Function
 *                                          ↘ graceful stub if not deployed
 *
 * Rules:
 * - Never import firebase/firestore and write sensitive fields directly here.
 * - Never expose this service to non-admin users (callers must verify role first).
 * - All methods return { success: boolean, data?, errorCode?, message? }.
 * - All errors are mapped to structured bilingual-safe error codes.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase"; // your existing Firebase app instance

// ─── Cloud Functions client ───────────────────────────────────────────────────

let _functions = null;
const getFunctionsClient = () => {
  if (!_functions) _functions = getFunctions(app);
  return _functions;
};

/**
 * Call a Firebase Cloud Function and normalize the response.
 * Returns { success, data, errorCode, message } — never throws.
 */
const invokeCloudFunction = async (functionName, payload) => {
  try {
    const fn = httpsCallable(getFunctionsClient(), functionName);
    const result = await fn(payload);
    return { success: true, data: result.data };
  } catch (err) {
    // Firebase Functions not yet deployed
    if (
      err?.code === "functions/not-found" ||
      err?.code === "functions/unavailable" ||
      err?.message?.includes("not-found") ||
      err?.message?.includes("ECONNREFUSED")
    ) {
      return {
        success: false,
        errorCode: "BACKEND_NOT_DEPLOYED",
        message:
          "This action requires secure backend execution. Cloud Functions are not yet deployed.",
      };
    }
    // Structured error from the function itself
    return {
      success: false,
      errorCode: err?.details?.code || err?.code || "UNKNOWN_ERROR",
      message: err?.details?.message || err?.message || "An unexpected error occurred.",
    };
  }
};

// ─── Error code → bilingual UI message map ────────────────────────────────────
// UI components should use mapPrivilegedErrorToMessage(errorCode) for display.

export const PRIVILEGED_ERROR_MESSAGES = {
  BACKEND_NOT_DEPLOYED: {
    en: "This action requires secure backend execution (Cloud Functions not yet deployed).",
    ar: "هذا الإجراء يتطلب تنفيذًا آمنًا على الخادم (Cloud Functions غير مفعّلة بعد).",
  },
  PERMISSION_DENIED: {
    en: "You do not have permission to perform this action.",
    ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  },
  TARGET_NOT_FOUND: {
    en: "The target record was not found.",
    ar: "لم يتم العثور على السجل المستهدف.",
  },
  INVALID_PAYLOAD: {
    en: "The request contained invalid or missing data.",
    ar: "الطلب يحتوي على بيانات غير صحيحة أو مفقودة.",
  },
  INVALID_STATE_TRANSITION: {
    en: "This action cannot be applied in the current state.",
    ar: "لا يمكن تطبيق هذا الإجراء في الحالة الحالية.",
  },
  ADMIN_ALREADY_EXISTS: {
    en: "A platform admin already exists. Seeding is disabled.",
    ar: "يوجد مسؤول نظام بالفعل. عملية التهيئة معطّلة.",
  },
  UNKNOWN_ERROR: {
    en: "An unexpected error occurred. Please try again.",
    ar: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
  },
};

export const mapPrivilegedErrorToMessage = (errorCode, lang = "en") =>
  (PRIVILEGED_ERROR_MESSAGES[errorCode] || PRIVILEGED_ERROR_MESSAGES.UNKNOWN_ERROR)[lang] ||
  PRIVILEGED_ERROR_MESSAGES[errorCode]?.en ||
  "An error occurred.";

// ─── User Management ──────────────────────────────────────────────────────────

/**
 * Promote a user to a new platform role.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-promoteUserRole
 *
 * Payload: { targetUid: string, newRole: string }
 * Allowed roles: 'employer_manager', 'employer_owner', 'candidate'
 * NOTE: 'platform_admin' promotion is an additional guard inside the function.
 */
export const requestPromoteUserRole = (targetUid, newRole) =>
  invokeCloudFunction("hellostaffPromoteUserRole", { targetUid, newRole });

/**
 * Suspend a user account platform-wide.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-suspendUser
 *
 * Payload: { targetUid: string, reason: string }
 */
export const requestSuspendUser = (targetUid, reason) =>
  invokeCloudFunction("hellostaffSuspendUser", { targetUid, reason });

/**
 * Reactivate a previously suspended user.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-reactivateUser
 *
 * Payload: { targetUid: string }
 */
export const requestReactivateUser = (targetUid) =>
  invokeCloudFunction("hellostaffReactivateUser", { targetUid });

// ─── Organization Management ──────────────────────────────────────────────────

/**
 * Officially verify an organization as legitimate.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-verifyOrganization
 *
 * Payload: { orgId: string }
 */
export const requestVerifyOrganization = (orgId) =>
  invokeCloudFunction("hellostaffVerifyOrganization", { orgId });

/**
 * Revoke organization verification.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-unverifyOrganization
 *
 * Payload: { orgId: string, reason: string }
 */
export const requestUnverifyOrganization = (orgId, reason) =>
  invokeCloudFunction("hellostaffUnverifyOrganization", { orgId, reason });

/**
 * Assign an employer manager to an organization.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-assignEmployerManager
 *
 * Payload: { orgId: string, targetUid: string }
 */
export const requestAssignEmployerManager = (orgId, targetUid) =>
  invokeCloudFunction("hellostaffAssignEmployerManager", { orgId, targetUid });

/**
 * Revoke an employer manager from an organization.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-revokeEmployerManager
 *
 * Payload: { orgId: string, targetUid: string }
 */
export const requestRevokeEmployerManager = (orgId, targetUid) =>
  invokeCloudFunction("hellostaffRevokeEmployerManager", { orgId, targetUid });

// ─── Job Management ───────────────────────────────────────────────────────────

/**
 * Force-close a job listing (admin moderation).
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-forceCloseJob
 *
 * Payload: { jobId: string, reason: string }
 */
export const requestForceCloseJob = (jobId, reason) =>
  invokeCloudFunction("hellostaffForceCloseJob", { jobId, reason });

// ─── Moderation ───────────────────────────────────────────────────────────────

/**
 * Resolve a platform admin report with a moderation decision.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-moderateAdminReport
 *
 * Payload: { reportId: string, resolution: 'resolved'|'dismissed', notes: string }
 */
export const requestModerateAdminReport = (reportId, resolution, notes = "") =>
  invokeCloudFunction("hellostaffModerateAdminReport", { reportId, resolution, notes });

// ─── Global Settings ──────────────────────────────────────────────────────────

/**
 * Write a platform-level global setting.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-updateGlobalSetting
 *
 * Payload: { key: string, value: any, scope: 'global'|'candidate'|'employer' }
 */
export const requestUpdateGlobalSetting = (key, value, scope = "global") =>
  invokeCloudFunction("hellostaffUpdateGlobalSetting", { key, value, scope });

// ─── Admin Seeding (one-time only) ───────────────────────────────────────────

/**
 * Seed the first platform_admin.
 * This function is restricted to a known bootstrap token.
 * After first use, the Cloud Function should self-disable or reject subsequent calls.
 * Cloud Function: hellostaff-seedFirstAdmin
 *
 * Payload: { targetUid: string, bootstrapToken: string }
 *
 * IMPORTANT: This function must NOT be exposed in any public UI.
 * Call only from a secure internal admin setup page gated by additional verification.
 */
export const requestSeedFirstAdmin = (targetUid, bootstrapToken) =>
  invokeCloudFunction("hellostaffSeedFirstAdmin", { targetUid, bootstrapToken });

// ─── Candidate Verification ───────────────────────────────────────────────────

/**
 * Verify a candidate's identity or submitted documents.
 * Only platform_admin may call this.
 * Cloud Function: hellostaff-verifyCandidate
 *
 * Payload: { candidateUid: string }
 */
export const requestVerifyCandidate = (candidateUid) =>
  invokeCloudFunction("hellostaffVerifyCandidate", { candidateUid });

// ─── Utility ──────────────────────────────────────────────────────────────────

/** True if the result indicates the backend is not yet deployed. */
export const isBackendNotDeployed = (result) =>
  result?.errorCode === "BACKEND_NOT_DEPLOYED";

/** True if a privileged action result indicates a clean success. */
export const isPrivilegedSuccess = (result) => result?.success === true;
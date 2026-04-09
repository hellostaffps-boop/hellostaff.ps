/**
 * privilegedActions.js — Phase 4.1 Privileged Actions Architecture Layer
 *
 * PURPOSE:
 *   This module is the SINGLE source of truth for operations that require
 *   elevated privileges beyond normal authenticated user access.
 *
 *   These actions CANNOT be safely executed from the frontend client under strict
 *   Firestore Security Rules. They are designed to migrate cleanly to Firebase
 *   Cloud Functions or Firebase Admin SDK when the backend is ready.
 *
 * ARCHITECTURE:
 *   Frontend → privilegedActions.js stub → [HTTP Call to Cloud Function | PENDING]
 *   Cloud Function → Firebase Admin SDK → Firestore write (bypasses Security Rules)
 *
 * CURRENT STATE:
 *   All actions are STUBS. They throw a descriptive error with migration guidance.
 *   The UI must handle these errors gracefully and show a safe placeholder state.
 *   Do NOT add client-side Firestore writes here as workarounds.
 *
 * HOW TO MIGRATE AN ACTION:
 *   1. Create a Cloud Function with admin SDK access
 *   2. Replace the stub body with: return callCloudFunction('functionName', payload)
 *   3. Add proper auth token verification inside the Cloud Function
 *   4. Remove the stub error throw
 *
 * ADMIN SEEDING STRATEGY:
 *   The first platform_admin user CANNOT be created through the public UI.
 *   Safe options:
 *     A) Firebase Console → Firestore → users/{uid} → manually set role: "platform_admin"
 *     B) One-time admin seeding script using Firebase Admin SDK (server-side only)
 *     C) Cloud Function with a secret bootstrap token (disable after first use)
 *   The uid must correspond to a real Firebase Auth user.
 *   Never expose admin-seeding in any client-side flow.
 */

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Consistent error for privileged actions not yet backed by Cloud Functions.
 */
const privilegedError = (actionName) => {
  const err = new Error(
    `PRIVILEGED_ACTION_REQUIRED: "${actionName}" cannot be executed from the client. ` +
    `This action requires Cloud Functions / Firebase Admin SDK. ` +
    `Contact your backend engineer to implement this as a privileged backend endpoint.`
  );
  err.code = "PRIVILEGED_ACTION_REQUIRED";
  err.action = actionName;
  return err;
};

/**
 * Delegates to privilegedActionService.js which uses Firebase httpsCallable.
 * If Cloud Functions are not deployed, the service returns { success: false, errorCode: 'BACKEND_NOT_DEPLOYED' }.
 * This wrapper converts that back into a thrown error for backward compatibility with Phase 4.1 callers.
 */
import {
  requestPromoteUserRole,
  requestSuspendUser,
  requestReactivateUser,
  requestVerifyOrganization,
  requestAssignEmployerManager,
  requestRevokeEmployerManager,
  requestForceCloseJob,
  requestModerateAdminReport,
  requestVerifyCandidate,
} from "@/lib/backend/privilegedActionService";

const wrapServiceCall = async (serviceCall) => {
  const result = await serviceCall;
  if (!result.success) {
    const err = new Error(result.message || "Privileged action failed");
    err.code = result.errorCode || "PRIVILEGED_ACTION_REQUIRED";
    throw err;
  }
  return result.data;
};

// ─── User Management (Admin-Only) ────────────────────────────────────────────

/**
 * Promote a user to a new role.
 * MUST be handled by Cloud Functions — client cannot write users/{uid}.role safely.
 *
 * @param {string} targetUid - The uid of the user to promote
 * @param {string} newRole - The target role (e.g. 'employer_manager', 'platform_admin')
 */
export const promoteUserRole = async (targetUid, newRole) =>
  wrapServiceCall(requestPromoteUserRole(targetUid, newRole));

/**
 * Suspend a user account.
 * Sets users/{uid}.status = 'suspended' via Admin SDK only.
 *
 * @param {string} targetUid
 * @param {string} reason
 */
export const suspendUser = async (targetUid, reason) =>
  wrapServiceCall(requestSuspendUser(targetUid, reason));

/**
 * Reactivate a suspended user.
 *
 * @param {string} targetUid
 */
export const reactivateUser = async (targetUid) =>
  wrapServiceCall(requestReactivateUser(targetUid));

// ─── Organization Management (Admin-Only) ────────────────────────────────────

/**
 * Verify an organization as legitimate.
 * Sets organizations/{orgId}.verified = true via Admin SDK.
 *
 * @param {string} orgId
 */
export const verifyOrganization = async (orgId) =>
  wrapServiceCall(requestVerifyOrganization(orgId));

/**
 * Assign an employer_manager to an organization.
 * Creates organization_members entry + sets user role via Admin SDK.
 *
 * @param {string} orgId
 * @param {string} targetUid
 */
export const assignEmployerManager = async (orgId, targetUid) =>
  wrapServiceCall(requestAssignEmployerManager(orgId, targetUid));

/**
 * Remove a manager from an organization.
 *
 * @param {string} orgId
 * @param {string} memberUid
 */
export const removeOrganizationMember = async (orgId, memberUid) =>
  wrapServiceCall(requestRevokeEmployerManager(orgId, memberUid));

/**
 * Transfer organization ownership.
 * Must update organization.owner_user_id and membership records atomically.
 * Client cannot do this safely — owner_user_id is write-protected.
 *
 * @param {string} orgId
 * @param {string} newOwnerUid
 */
export const transferOrganizationOwnership = async (orgId, newOwnerUid) => {
  throw privilegedError("transferOrganizationOwnership");
};

// ─── Job Management (Admin-Only) ─────────────────────────────────────────────

/**
 * Force-close a job listing regardless of organization ownership.
 * Used for moderation/admin enforcement.
 *
 * @param {string} jobId
 * @param {string} reason
 */
export const forceCloseJob = async (jobId, reason) =>
  wrapServiceCall(requestForceCloseJob(jobId, reason));

// ─── Moderation (Admin-Only) ─────────────────────────────────────────────────

/**
 * Resolve an admin report with a moderation action.
 *
 * @param {string} reportId
 * @param {'resolved'|'dismissed'} resolution
 * @param {string} [notes]
 */
export const resolveAdminReport = async (reportId, resolution, notes = "") =>
  wrapServiceCall(requestModerateAdminReport(reportId, resolution, notes));

// ─── Global Settings (Admin-Only) ────────────────────────────────────────────

/**
 * Write a platform-level global setting.
 * settings documents with scope='global' are admin-only.
 *
 * @param {string} key
 * @param {*} value
 */
export const setGlobalSetting = async (key, value) => {
  throw privilegedError("setGlobalSetting");
};

// ─── Candidate Verification (Admin-Only) ─────────────────────────────────────

/**
 * Verify a candidate's identity/documents.
 * Sets candidate_profiles/{uid}.verified = true via Admin SDK.
 *
 * @param {string} candidateUid
 */
export const verifyCandidate = async (candidateUid) =>
  wrapServiceCall(requestVerifyCandidate(candidateUid));

// ─── Generic stub for unknown privileged actions ──────────────────────────────

/**
 * Generic privileged action placeholder.
 * Use this when the UI needs to call a privileged action not yet defined above.
 * Import this when you want to show a safe "admin action unavailable" state.
 *
 * @param {string} actionName - Human-readable action name for error/logging
 * @param {object} [payload] - Action data (not sent anywhere in stub mode)
 */
export const privilegedActionPlaceholder = async (actionName, payload = {}) => {
  console.warn(`[Hello Staff] Privileged action attempted from client: "${actionName}"`, payload);
  throw privilegedError(actionName);
};

// ─── Error type guard ─────────────────────────────────────────────────────────

/**
 * Check if an error is a privileged-action-required error.
 * Use in UI components to show the appropriate "admin action unavailable" state.
 *
 * @param {Error} err
 * @returns {boolean}
 */
export const isPrivilegedActionError = (err) =>
  err?.code === "PRIVILEGED_ACTION_REQUIRED" ||
  err?.code === "BACKEND_NOT_DEPLOYED" ||
  err?.code === "PERMISSION_DENIED";
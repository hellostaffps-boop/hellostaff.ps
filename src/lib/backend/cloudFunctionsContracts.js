/**
 * cloudFunctionsContracts.js — Phase 4.2 Cloud Functions Reference Architecture
 *
 * This file documents the implementation contracts for all privileged Cloud Functions.
 * Deploy these in your Firebase Cloud Functions project (functions/ directory).
 *
 * Each function follows this pattern:
 *   1. Verify caller is authenticated (context.auth)
 *   2. Verify caller role from Firestore (trusted server-side read)
 *   3. Validate payload schema
 *   4. Verify target records exist
 *   5. Validate state transitions / ownership
 *   6. Execute Firestore writes via Admin SDK
 *   7. Write audit log
 *   8. Return structured success or error response
 *
 * Function naming convention: hellostaff{ActionName}
 * All functions are HTTPS Callable (onCall) for automatic auth token forwarding.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SHARED HELPERS (implement in functions/src/helpers/)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // authorization.js
 * const getCallerProfile = async (uid) => {
 *   const doc = await admin.firestore().doc(`users/${uid}`).get();
 *   if (!doc.exists) throw new HttpsError('not-found', 'Caller user not found');
 *   return doc.data();
 * };
 *
 * const requireAdmin = async (uid) => {
 *   const profile = await getCallerProfile(uid);
 *   if (profile.role !== 'platform_admin') {
 *     throw new HttpsError('permission-denied', 'PERMISSION_DENIED', { code: 'PERMISSION_DENIED' });
 *   }
 *   return profile;
 * };
 *
 * // auditLogger.js
 * const writeAuditLog = (action, actorUid, actorRole, targetType, targetId, payloadSummary, status, orgId = null, errorCode = null) =>
 *   admin.firestore().collection('audit_logs').add({
 *     action, actor_uid: actorUid, actor_role: actorRole,
 *     target_type: targetType, target_id: targetId,
 *     organization_id: orgId, payload_summary: payloadSummary,
 *     status, error_code: errorCode,
 *     created_at: admin.firestore.FieldValue.serverTimestamp(),
 *   });
 *
 * // validation.js
 * const requireFields = (data, fields) => {
 *   for (const f of fields) {
 *     if (!data[f]) throw new HttpsError('invalid-argument', `Missing field: ${f}`, { code: 'INVALID_PAYLOAD' });
 *   }
 * };
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNCTION CONTRACTS
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const FUNCTION_CONTRACTS = {

  hellostaffPromoteUserRole: {
    callerRole: "platform_admin",
    payload: { targetUid: "string", newRole: "string" },
    allowedNewRoles: ["candidate", "employer_owner", "employer_manager"],
    forbiddenNewRoles: ["platform_admin"], // secondary guard inside function
    validations: [
      "targetUid must be a real Firebase Auth user",
      "newRole must be in allowedNewRoles",
      "caller must be platform_admin",
    ],
    firestoreWrites: [
      "users/{targetUid}: { role: newRole, updated_at: now }",
    ],
    auditLog: {
      action: "promoteUserRole",
      target_type: "user",
      payload_summary: ["targetUid", "newRole"],
    },
    successResponse: { success: true, message: "Role updated." },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_PAYLOAD", "INVALID_STATE_TRANSITION"],
  },

  hellostaffSuspendUser: {
    callerRole: "platform_admin",
    payload: { targetUid: "string", reason: "string" },
    validations: [
      "targetUid must exist in users collection",
      "target must not be platform_admin (cannot self-lock admins)",
      "reason must be non-empty",
    ],
    firestoreWrites: [
      "users/{targetUid}: { status: 'suspended', suspension_reason: reason, suspended_at: now }",
    ],
    auditLog: {
      action: "suspendUser",
      target_type: "user",
      payload_summary: ["targetUid", "reason"],
    },
    successResponse: { success: true },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_PAYLOAD"],
  },

  hellostaffReactivateUser: {
    callerRole: "platform_admin",
    payload: { targetUid: "string" },
    validations: [
      "targetUid must exist and status must be 'suspended'",
    ],
    firestoreWrites: [
      "users/{targetUid}: { status: 'active', reactivated_at: now }",
    ],
    auditLog: {
      action: "reactivateUser",
      target_type: "user",
      payload_summary: ["targetUid"],
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_STATE_TRANSITION"],
  },

  hellostaffVerifyOrganization: {
    callerRole: "platform_admin",
    payload: { orgId: "string" },
    validations: [
      "orgId must exist in organizations collection",
      "organization must not already be verified",
    ],
    firestoreWrites: [
      "organizations/{orgId}: { verified: true, verified_at: now, verified_by: actorUid }",
    ],
    auditLog: {
      action: "verifyOrganization",
      target_type: "organization",
      payload_summary: ["orgId"],
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_STATE_TRANSITION"],
  },

  hellostaffUnverifyOrganization: {
    callerRole: "platform_admin",
    payload: { orgId: "string", reason: "string" },
    firestoreWrites: [
      "organizations/{orgId}: { verified: false, unverified_at: now, unverified_reason: reason }",
    ],
    auditLog: {
      action: "unverifyOrganization",
      target_type: "organization",
      payload_summary: ["orgId", "reason"],
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND"],
  },

  hellostaffAssignEmployerManager: {
    callerRole: "platform_admin",
    payload: { orgId: "string", targetUid: "string" },
    validations: [
      "orgId must exist in organizations collection",
      "targetUid must be a real Firebase Auth user",
      "target user must not already be a member of this org",
    ],
    firestoreWrites: [
      "users/{targetUid}: { role: 'employer_manager' }",
      "organization_members/{newId}: { organization_id, user_id: targetUid, role: 'manager', status: 'active', created_at: now }",
      "employer_profiles/{targetUid}: { organization_id, updated_at: now }",
    ],
    auditLog: {
      action: "assignEmployerManager",
      target_type: "user",
      payload_summary: ["orgId", "targetUid"],
      organization_id: "orgId",
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_PAYLOAD"],
  },

  hellostaffRevokeEmployerManager: {
    callerRole: "platform_admin",
    payload: { orgId: "string", targetUid: "string" },
    validations: [
      "targetUid must be a member of orgId with role 'manager'",
    ],
    firestoreWrites: [
      "organization_members/{memberId}: { status: 'removed', removed_at: now }",
      "users/{targetUid}: { role: 'candidate' }",
    ],
    auditLog: {
      action: "revokeEmployerManager",
      target_type: "user",
      payload_summary: ["orgId", "targetUid"],
      organization_id: "orgId",
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_STATE_TRANSITION"],
  },

  hellostaffForceCloseJob: {
    callerRole: "platform_admin",
    payload: { jobId: "string", reason: "string" },
    validations: [
      "jobId must exist in jobs collection",
      "job must not already be closed or filled",
      "reason must be non-empty",
    ],
    firestoreWrites: [
      "jobs/{jobId}: { status: 'closed', force_closed: true, force_closed_reason: reason, closed_at: now, closed_by: actorUid }",
    ],
    auditLog: {
      action: "forceCloseJob",
      target_type: "job",
      payload_summary: ["jobId", "reason"],
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_STATE_TRANSITION"],
  },

  hellostaffModerateAdminReport: {
    callerRole: "platform_admin",
    payload: { reportId: "string", resolution: "'resolved'|'dismissed'", notes: "string" },
    validations: [
      "reportId must exist in admin_reports collection",
      "status must be 'pending' or 'reviewed'",
      "resolution must be 'resolved' or 'dismissed'",
    ],
    firestoreWrites: [
      "admin_reports/{reportId}: { status: resolution, notes, reviewed_by: actorUid, reviewed_at: now }",
    ],
    auditLog: {
      action: "moderateAdminReport",
      target_type: "report",
      payload_summary: ["reportId", "resolution"],
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND", "INVALID_PAYLOAD"],
  },

  hellostaffUpdateGlobalSetting: {
    callerRole: "platform_admin",
    payload: { key: "string", value: "any", scope: "'global'|'candidate'|'employer'" },
    validations: [
      "key must be non-empty",
      "scope must be valid enum value",
    ],
    firestoreWrites: [
      "settings/{key}: { key, value, scope, updated_by: actorUid, updated_at: now }",
    ],
    auditLog: {
      action: "updateGlobalSetting",
      target_type: "setting",
      payload_summary: ["key", "scope"],
    },
    errorCodes: ["PERMISSION_DENIED", "INVALID_PAYLOAD"],
  },

  hellostaffVerifyCandidate: {
    callerRole: "platform_admin",
    payload: { candidateUid: "string" },
    validations: [
      "candidateUid must exist in candidate_profiles collection",
    ],
    firestoreWrites: [
      "candidate_profiles/{candidateUid}: { verified: true, verified_at: now, verified_by: actorUid }",
    ],
    auditLog: {
      action: "verifyCandidate",
      target_type: "user",
      payload_summary: ["candidateUid"],
    },
    errorCodes: ["PERMISSION_DENIED", "TARGET_NOT_FOUND"],
  },
};

/**
 * Get the contract for a given Cloud Function name.
 * @param {string} functionName
 * @returns {object|undefined}
 */
export const getFunctionContract = (functionName) => FUNCTION_CONTRACTS[functionName];
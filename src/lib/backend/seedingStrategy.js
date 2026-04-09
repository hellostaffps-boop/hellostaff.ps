/**
 * seedingStrategy.js — Phase 4.2 First Admin Seeding Architecture
 *
 * PURPOSE:
 *   Define and document the only safe method for creating the first platform_admin.
 *   This file contains frontend validation helpers and the seeding request wrapper.
 *   The ACTUAL seeding write must be performed by a privileged Cloud Function.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SECURITY CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * RULE 1: platform_admin CANNOT be self-assigned from public signup.
 *         - The signUpEmail function in firebaseAuth.jsx restricts to:
 *           ALLOWED_SIGNUP_ROLES = ['candidate', 'employer_owner']
 *         - The completeRoleSetup function has the same guard.
 *
 * RULE 2: No public UI should contain a "make admin" path.
 *         - The seeding trigger is only accessible from /admin/seed-setup,
 *           which is itself unreachable without an existing session check.
 *
 * RULE 3: No client-side Firestore write ever sets role = 'platform_admin'.
 *         - All writes to users.role for admin promotion go through Cloud Functions.
 *         - Firestore security rule: allow write to users.role ONLY from backend.
 *
 * RULE 4: The seeding Cloud Function MUST:
 *         a) Verify no platform_admin already exists in the users collection.
 *         b) Verify the bootstrapToken matches a server-side secret (env var).
 *         c) Verify the targetUid is a real Firebase Auth user.
 *         d) Write role = 'platform_admin' using Firebase Admin SDK.
 *         e) Write an audit_log entry documenting the seeding.
 *         f) Self-invalidate or log to prevent second use.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEEDING EXECUTION PLAN
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Option A — Firebase Console Manual (Simplest, Zero-Code):
 *   1. Create the user via Firebase Auth (email/password in the console or app).
 *   2. Copy the user's UID from Firebase Auth console.
 *   3. Open Firestore → users → {uid} document.
 *   4. Set field: role = "platform_admin"
 *   5. Set field: status = "active"
 *   6. Done. The app's role guard reads from this document.
 *
 * Option B — Cloud Function Bootstrap (Recommended for Production):
 *   1. Deploy the Cloud Function: hellostaffSeedFirstAdmin
 *   2. Set env var: HELLOSTAFF_SEED_TOKEN = <random-256-bit-secret>
 *   3. Call the function with the target UID + secret token.
 *   4. The function checks: no existing platform_admin → writes role → logs → disables.
 *   5. Remove or disable the function after first successful seeding.
 *
 * Option C — Admin SDK Script (Offline / CI/CD):
 *   Run the reference script from lib/backend/scripts/seedAdmin.js
 *   Requires GOOGLE_APPLICATION_CREDENTIALS set to a service account JSON.
 *   The script checks for existing admins before writing.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CUSTOM CLAIMS STRATEGY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Decision: Firestore users.role is the primary source of truth.
 *
 * Rationale:
 * - Firestore role is readable in real-time without token refresh.
 * - Custom claims require a Firebase token refresh to take effect.
 * - Dual-source sync adds complexity and divergence risk.
 *
 * If custom claims are added in the future:
 * - Treat them as a CACHE only, not a source of truth.
 * - Always sync from Firestore → Custom Claim in Cloud Functions.
 * - Never read custom claims in the frontend as the role authority.
 * - Use custom claims only for Firestore Security Rules that need to avoid
 *   extra Firestore reads at the rules engine level.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requestSeedFirstAdmin } from "@/lib/backend/privilegedActionService";

// ─── Frontend seeding helpers ─────────────────────────────────────────────────

/**
 * Check whether a platform_admin already exists in Firestore.
 * SAFE READ — this is a legitimate admin-scoped check.
 * Returns true if at least one platform_admin exists.
 *
 * @returns {Promise<boolean>}
 */
export const platformAdminExists = async () => {
  const q = query(
    collection(db, "users"),
    where("role", "==", "platform_admin"),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

/**
 * Validate the seeding payload before sending to backend.
 * Returns { valid: boolean, error?: string }
 *
 * @param {string} targetUid
 * @param {string} bootstrapToken
 */
export const validateSeedingPayload = (targetUid, bootstrapToken) => {
  if (!targetUid || typeof targetUid !== "string" || targetUid.trim().length < 10) {
    return { valid: false, error: "INVALID_PAYLOAD: targetUid must be a valid Firebase Auth UID." };
  }
  if (!bootstrapToken || typeof bootstrapToken !== "string" || bootstrapToken.trim().length < 16) {
    return { valid: false, error: "INVALID_PAYLOAD: bootstrapToken must be at least 16 characters." };
  }
  return { valid: true };
};

/**
 * Execute the first admin seeding flow safely.
 *
 * Pre-checks (client-side):
 *   1. Verify no admin already exists in Firestore.
 *   2. Validate payload shape.
 * Then delegates to the Cloud Function via privilegedActionService.
 *
 * @param {string} targetUid - Firebase Auth UID of the user to promote.
 * @param {string} bootstrapToken - Server-side secret to authorize the operation.
 * @returns {Promise<{ success: boolean, errorCode?, message? }>}
 */
export const executeSeedFirstAdmin = async (targetUid, bootstrapToken) => {
  // Pre-check 1: no admin should already exist
  const adminExists = await platformAdminExists();
  if (adminExists) {
    return {
      success: false,
      errorCode: "ADMIN_ALREADY_EXISTS",
      message: "A platform admin already exists. Seeding is disabled.",
    };
  }

  // Pre-check 2: validate payload
  const validation = validateSeedingPayload(targetUid, bootstrapToken);
  if (!validation.valid) {
    return { success: false, errorCode: "INVALID_PAYLOAD", message: validation.error };
  }

  // Delegate to privileged backend
  return requestSeedFirstAdmin(targetUid.trim(), bootstrapToken.trim());
};

/**
 * REFERENCE: Cloud Function design contract for hellostaffSeedFirstAdmin.
 *
 * This is DOCUMENTATION ONLY. Implement this logic in your Cloud Functions project.
 *
 * exports.hellostaffSeedFirstAdmin = functions.https.onCall(async (data, context) => {
 *   // 1. Verify bootstrapToken against process.env.HELLOSTAFF_SEED_TOKEN
 *   if (data.bootstrapToken !== process.env.HELLOSTAFF_SEED_TOKEN) {
 *     throw new functions.https.HttpsError('permission-denied', 'Invalid bootstrap token');
 *   }
 *
 *   // 2. Check no platform_admin exists
 *   const existing = await admin.firestore()
 *     .collection('users').where('role', '==', 'platform_admin').limit(1).get();
 *   if (!existing.empty) {
 *     throw new functions.https.HttpsError('already-exists', 'Admin already seeded', { code: 'ADMIN_ALREADY_EXISTS' });
 *   }
 *
 *   // 3. Verify target uid is a real Auth user
 *   const userRecord = await admin.auth().getUser(data.targetUid);
 *
 *   // 4. Write the role
 *   await admin.firestore().doc(`users/${data.targetUid}`).update({
 *     role: 'platform_admin',
 *     status: 'active',
 *     promoted_at: admin.firestore.FieldValue.serverTimestamp(),
 *   });
 *
 *   // 5. Write audit log
 *   await admin.firestore().collection('audit_logs').add({
 *     action: 'seedFirstAdmin',
 *     actor_uid: 'system',
 *     actor_role: 'system',
 *     target_type: 'user',
 *     target_id: data.targetUid,
 *     payload_summary: { email: userRecord.email },
 *     status: 'success',
 *     error_code: null,
 *     created_at: admin.firestore.FieldValue.serverTimestamp(),
 *   });
 *
 *   return { success: true, message: 'platform_admin seeded successfully.' };
 * });
 */
# Hello Staff — Phase 4.2 Privileged Backend Architecture

## Overview

Phase 4.2 establishes a secure, production-grade privileged backend execution path for all sensitive platform operations. This document covers the architecture decisions, security contracts, deployment strategy, and audit requirements.

---

## Architecture Diagram

```
Admin UI Component
       │
       ▼
PrivilegedActionButton (components/PrivilegedActionButton.jsx)
       │
       ▼
privilegedActionService.js (lib/backend/privilegedActionService.js)
       │
       ▼
Firebase Cloud Function (hellostaffActionName) — httpsCallable
       │ verifies auth token automatically
       ▼
Cloud Function Logic:
  1. Verify caller auth
  2. Read caller role from Firestore (trusted)
  3. Validate payload
  4. Check target record
  5. Validate state transition
  6. Write via Firebase Admin SDK (bypasses Security Rules)
  7. Write audit log
  8. Return structured response
       │
       ▼
Firestore (Admin SDK write — no Security Rules bypass risk)
       │
       ▼
audit_logs collection (backend-written, client read-only for admins)
```

---

## Files Introduced in Phase 4.2

| File | Purpose |
|------|---------|
| `lib/backend/privilegedActionService.js` | Frontend service wrapper — all privileged requests route through here |
| `lib/backend/auditLogService.js` | Admin-only audit log reads from Firestore |
| `lib/backend/seedingStrategy.js` | First admin seeding architecture + helpers |
| `lib/backend/cloudFunctionsContracts.js` | Complete Cloud Functions design contracts |
| `components/PrivilegedActionButton.jsx` | Safe UI component for admin actions |
| `lib/privilegedActions.js` | Phase 4.1 stubs — kept as fallback interface |

---

## First Admin Seeding Strategy

**Option A — Firebase Console (Immediate / Manual)**
1. Create user in Firebase Auth (email/password).
2. Copy UID from Auth console.
3. Firestore → `users/{uid}` → set `role: "platform_admin"`.
4. Done. The app reads role from Firestore.

**Option B — Cloud Function Bootstrap (Recommended)**
1. Deploy `hellostaffSeedFirstAdmin` Cloud Function.
2. Set `HELLOSTAFF_SEED_TOKEN` environment variable (random 256-bit secret).
3. Call the function with `{ targetUid, bootstrapToken }`.
4. Function verifies: no existing admin → writes role → logs → rejects future calls.
5. Disable or delete the function after seeding.

**Option C — Admin SDK Script (CI/CD)**
- Run the reference script in `lib/backend/seedingStrategy.js` comments.
- Requires `GOOGLE_APPLICATION_CREDENTIALS` service account.

**Security Rules for first admin seeding:**
- `public signup` — role list restricted to `['candidate', 'employer_owner']` ✅
- `completeRoleSetup` — same guard ✅
- `users.role` — Firestore rules deny client writes to role field ✅
- `seedFirstAdmin` Cloud Function — token-gated + admin-exists check ✅

---

## Privileged Functions (to deploy in Firebase Cloud Functions project)

All functions: `functions.https.onCall`, require `context.auth`.

| Function | Caller Role | Key Validations |
|----------|------------|-----------------|
| `hellostaffSeedFirstAdmin` | system + bootstrap token | no admin exists, valid uid, valid token |
| `hellostaffPromoteUserRole` | platform_admin | role in allowed list, no self-admin grant |
| `hellostaffSuspendUser` | platform_admin | target exists, not an admin |
| `hellostaffReactivateUser` | platform_admin | target is suspended |
| `hellostaffVerifyOrganization` | platform_admin | org exists, not already verified |
| `hellostaffUnverifyOrganization` | platform_admin | org exists |
| `hellostaffAssignEmployerManager` | platform_admin | org exists, user not already member |
| `hellostaffRevokeEmployerManager` | platform_admin | member exists in org |
| `hellostaffForceCloseJob` | platform_admin | job exists, not already closed |
| `hellostaffModerateAdminReport` | platform_admin | report exists, valid resolution |
| `hellostaffUpdateGlobalSetting` | platform_admin | valid key and scope |
| `hellostaffVerifyCandidate` | platform_admin | candidate profile exists |

Full payload + Firestore write contracts: see `lib/backend/cloudFunctionsContracts.js`.

---

## Audit Log Schema

Collection: `audit_logs`

```json
{
  "action": "promoteUserRole",
  "actor_uid": "uid-of-admin",
  "actor_role": "platform_admin",
  "target_type": "user",
  "target_id": "uid-of-target",
  "organization_id": null,
  "payload_summary": { "newRole": "employer_manager" },
  "status": "success",
  "error_code": null,
  "created_at": "Timestamp"
}
```

**Firestore Security Rules for audit_logs:**
```js
match /audit_logs/{logId} {
  allow read: if isAdmin();   // platform_admin only
  allow write: if false;      // Cloud Functions Admin SDK only
}
```

---

## Sensitive Fields — Client Write Restrictions

The following fields must NEVER be written directly by the client:

| Collection | Protected Fields |
|-----------|-----------------|
| `users` | `role`, `status`, `suspension_reason`, `promoted_at` |
| `organizations` | `verified`, `verified_by`, `status` (if admin-controlled) |
| `organization_members` | `role` (owner/manager via admin function only) |
| `jobs` | `force_closed`, `force_closed_reason`, `closed_by` |
| `admin_reports` | `status`, `reviewed_by`, `notes` (moderation) |
| `settings` | All global scope settings |
| `audit_logs` | All fields (backend-write only) |
| `candidate_profiles` | `verified`, `verified_by` |

---

## Frontend Error Handling

All privileged action results follow this shape:
```js
{ success: boolean, data?, errorCode?, message? }
```

Error code → bilingual message mapping: `mapPrivilegedErrorToMessage(code, lang)` in `privilegedActionService.js`.

The `PrivilegedActionButton` component handles all states:
- Loading spinner
- Success confirmation (auto-dismiss)
- `BACKEND_NOT_DEPLOYED` — amber banner "requires secure backend execution"
- `PERMISSION_DENIED` — red alert
- Other errors — red alert with bilingual message

---

## Deployment Checklist

- [ ] Deploy Firebase Cloud Functions (Node 18+, firebase-admin SDK)
- [ ] Set `HELLOSTAFF_SEED_TOKEN` environment variable in Cloud Functions config
- [ ] Update Firestore Security Rules to deny client writes on protected fields
- [ ] Add `audit_logs` collection rules (read: admin only, write: false)
- [ ] Seed first admin (Option A, B, or C above)
- [ ] Disable `hellostaffSeedFirstAdmin` after first use
- [ ] Test all privileged functions with a non-admin user (should get PERMISSION_DENIED)
- [ ] Test audit log creation for each action
- [ ] Verify UI shows "backend not deployed" state gracefully when functions are not live

---

## Custom Claims Decision

**Decision: Firestore `users.role` is the primary role source of truth.**

Rationale:
- Real-time readable without token refresh.
- Simpler mental model.
- Avoids dual-source divergence risk.

If custom claims are added:
- Treat as a cache/optimization only.
- Sync direction: Firestore role → Custom Claim (in Cloud Function).
- Never use custom claims as the role authority in the frontend.
- Use only for Firestore Security Rules optimization if needed.
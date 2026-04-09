# Hello Staff — Internal Security Notes
## Phase 4.1 — Security Architecture Documentation

> **INTERNAL USE ONLY. Do not expose this file in any public-facing UI or API.**

---

## 1. Role Model

| Role | Description | Creatable via public signup |
|---|---|---|
| `candidate` | Job seeker | ✅ Yes |
| `employer_owner` | Organization owner | ✅ Yes |
| `employer_manager` | Team member assigned by owner | ❌ No — privileged action |
| `platform_admin` | Platform superuser | ❌ No — manual Firestore seed only |

### Role source of truth
- Role is stored in `users/{uid}.role` in Firestore.
- The frontend reads role from the user's Firestore document via `firebaseAuth.jsx → loadUserProfile`.
- The frontend NEVER trusts client-supplied role claims.
- Firestore Security Rules call `get(/databases/.../users/{uid}).data.role` to verify role server-side.

---

## 2. Admin Bootstrap Strategy

### How to create the first `platform_admin`:

**Option A — Firebase Console (recommended for initial setup):**
1. Create a Firebase Auth user for the admin (email + password or Google).
2. Note the Firebase Auth `uid`.
3. In Firebase Console → Firestore → `users/{uid}`:
   - Set `role: "platform_admin"`
   - Set `status: "active"`
   - Set `email`, `full_name`, `created_at`, `uid`
4. Log in through the app — the auth layer reads Firestore and routes to `/admin`.

**Option B — Firebase Admin SDK script (for automation):**
```js
// server-side only, never in client bundle
const admin = require('firebase-admin');
admin.firestore().doc(`users/${uid}`).set({
  uid, email, full_name, role: 'platform_admin',
  status: 'active', created_at: admin.firestore.FieldValue.serverTimestamp()
});
```

**Option C — Bootstrap Cloud Function with secret token:**
- Deploy a Cloud Function that checks a one-time secret env var.
- After first admin is created, disable or delete the function.

### What NEVER to do:
- Do NOT add `platform_admin` to any dropdown in the public signup form.
- Do NOT allow `completeRoleSetup` to accept `platform_admin` as a role.
- Do NOT create a "Make me admin" button anywhere in the client.

---

## 3. Collection-by-Collection Access Strategy

### `users`
- **Safe on client:** read own doc, update `full_name`, `preferred_language`, `last_login_at`
- **Must move to backend:** role promotion, status change, suspension, admin_notes

### `candidate_profiles`
- **Safe on client:** CRUD own profile at `candidate_profiles/{own_uid}`
- **Must move to backend:** cross-employer access to candidate profiles (if ever needed)

### `employer_profiles`
- **Safe on client:** read/update own profile
- **Must move to backend:** manager profile creation, org transfer

### `organizations`
- **Safe on client:** owner creates org at signup, owner updates safe fields
- **Must move to backend:** verified status, status changes, ownership transfer, forced suspension

### `organization_members`
- **Safe on client:** owner creates own owner membership at signup
- **Must move to backend:** assigning managers, removing members, any role changes

### `jobs`
- **Safe on client:** employer creates/updates jobs for own org (validated via service layer)
- **Must move to backend:** force-close by admin, status override

### `applications`
- **Safe on client:** candidate creates own application, reads own applications; employer reads/updates status for own org
- **Must move to backend:** duplicate enforcement at scale, bulk status changes

### `notifications`
- **Safe on client:** read own, mark own as read
- **Must move to backend:** creation (should be server-side, triggered by events)

### `admin_reports`
- **Safe on client:** create a report (with own uid attached)
- **Must move to backend:** all review/resolution/moderation actions

### `settings`
- **Safe on client:** user-scoped settings with `scope: 'user'`
- **Must move to backend:** global/platform settings (`scope: 'global'`)

---

## 4. Privileged Actions Architecture

All privileged actions are defined in `lib/privilegedActions.js`.

These actions CANNOT be safely executed from the client under strict Firestore Security Rules:

| Action | Reason | Target file |
|---|---|---|
| `promoteUserRole` | Cannot write `users/{uid}.role` from client | Cloud Function |
| `suspendUser` | Cannot write `users/{uid}.status` safely | Cloud Function |
| `assignEmployerManager` | Creates org_members entry + role change | Cloud Function |
| `verifyOrganization` | Cannot write `organizations/{id}.verified` | Cloud Function |
| `forceCloseJob` | Cross-org admin action | Cloud Function |
| `resolveAdminReport` | Admin moderation, cross-user | Cloud Function |
| `setGlobalSetting` | Platform-level settings | Cloud Function |
| `verifyCandidate` | Cannot write `candidate_profiles/{uid}.verified` | Cloud Function |
| `transferOrganizationOwnership` | Atomic cross-doc write | Cloud Function |

All stubs throw `PRIVILEGED_ACTION_REQUIRED` errors.
Use `isPrivilegedActionError(err)` in UI components to show a safe placeholder state.

---

## 5. Frontend Security Assumptions

The frontend is built under these assumptions that align with strict Security Rules:

- **Queries are ownership-scoped:** no broad collection reads without `where` on `uid` or `organization_id`
- **Writes go through service methods:** no raw Firestore writes in page components
- **Role is never client-supplied:** role reads come from Firestore, not from client state
- **Protected fields are stripped:** `updateSafeUserFields` strips `role`, `status`, `verified`, etc. before writing
- **Organization creation is owner-anchored:** `owner_user_id` is always set to `auth.uid` at signup
- **Job creation is org-verified:** `createJobForOwnedOrganization` resolves `organization_id` from the server-read employer profile
- **Application creation is uid-enforced:** `createApplicationForCurrentCandidate` always sets `candidate_user_id = auth.uid`

---

## 6. What Strict Firestore Rules Break (and How We've Fixed It)

| Unsafe pattern (before Phase 4) | Safe pattern (after Phase 4.1) |
|---|---|
| `getDocs(collection(db, 'jobs'))` — all jobs | `where('status', '==', 'published')` query only |
| `setDoc(users/{uid}, {role: ...})` from client | `updateSafeUserFields` strips role before write |
| `createJob({organization_id: formValue})` | `createJobForOwnedOrganization` resolves org from profile |
| `updateApplication(appId, {status})` unrestricted | `updateApplicationStatus` verifies org ownership first |
| `saveOrganization(orgId, data)` unconditional | `saveOrganizationIfOwner` checks `org.owner_user_id == uid` |
| Admin routes accessible if URL is known | `ProtectedRoute` + `assertAdmin` + Firestore rules guard |

---

## 7. Cloud Functions Migration Path

When Cloud Functions are deployed, migrate in this order:

1. **Priority 1 — Notifications:** move notification creation from client to event-triggered functions
2. **Priority 2 — Role promotion:** implement `promoteUserRole` function with Admin SDK
3. **Priority 3 — Organization management:** `assignEmployerManager`, `verifyOrganization`
4. **Priority 4 — Moderation:** `resolveAdminReport`, `forceCloseJob`, `suspendUser`
5. **Priority 5 — Settings:** `setGlobalSetting` with admin verification

Each migration: update `lib/privilegedActions.js` to call `callCloudFunction('name', payload)` instead of throwing.

---

## 8. Firestore Security Rules Deployment

Rules file: `firestore.rules` in project root.

Deploy command:
```bash
firebase deploy --only firestore:rules
```

Test rules locally:
```bash
firebase emulators:start --only firestore
```

Rules must be re-deployed whenever collection structures or access patterns change.

---

*Last updated: Phase 4.1 — Hello Staff Security Hardening*
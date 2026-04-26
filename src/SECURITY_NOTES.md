# Security Notes — Hello Staff (Supabase)
**Last updated:** 2026-04-27  
**Platform:** Supabase (PostgreSQL + Auth + Edge Functions)

---

## Authentication

- **Supabase Auth** handles email/password, Google OAuth, and magic links.
- **Role claim** is stored in the `profiles` table, NOT in auth metadata (to avoid JWT bloat).
- **Admin access** is verified via server-side RPC (`assert_platform_admin()`) in addition to client-side checks.

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

| Table | Read | Write | Admin |
|-------|------|-------|-------|
| profiles | Own profile | Own profile | Full access |
| candidate_profiles | Own / org applicants | Own | Full access |
| employer_profiles | Own | Own | Full access |
| jobs | Published only | Own org | Full access |
| organizations | Active only | Own / Owner | Full access |
| applications | Own / Own org | Own / Own org | Full access |
| notifications | Own | Own | Full access |
| audit_logs | Admin only | Admin only | Full access |
| store_orders | Own | Own | Full access |
| trial_shifts | Own / Own org | Own org | Full access |
| interviews | Own / Own org | Own org | Full access |

## Admin Security

- `assertAdmin()` is now **async** and performs **dual verification**:
  1. Client-side check (fast fail)
  2. Server-side `profiles.role` verification via Supabase query
- **Admin RPC functions** (`broadcast_notification_secure`, `seed_demo_data`, `clear_demo_data`) are restricted to `service_role` or require `platform_admin` check inside the function.

## Edge Functions

| Function | Status | Fix |
|----------|--------|-----|
| `send-push` | Secured | Auth verification + CORS restriction |
| `bootstrapAdminAccess` | Secured | SUPER_ADMIN_EMAIL check |
| `getAdminAccessState` | Secured | Timing-safe comparison |

## Audit Logging

- Audit logs are **immutable** — no UPDATE/DELETE policies.
- Only `platform_admin` can insert audit logs.
- All admin operations in `adminService.js` create audit log entries.

## Storage

- **MIME type whitelist** enforced in `storageService.js`.
- Upload paths include user ID folder to prevent cross-user access.
- Bucket policies restrict read/write to own files.

## Rate Limiting

- Client-side rate limiting exists for UX but is **not security-critical**.
- Sensitive operations are protected by RLS + authorization checks.

## XSS Prevention

- `dangerouslySetInnerHTML` in Terms/Privacy pages is now sanitized via `sanitizeMarkdownHtml()`.
- A whitelist-based HTML sanitizer removes scripts, event handlers, and dangerous tags.

## Environment Variables Required

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPER_ADMIN_EMAIL=          # For bootstrapAdminAccess
VAPID_PUBLIC_KEY=             # For push notifications
VAPID_PRIVATE_KEY=            # For push notifications
VAPID_SUBJECT=                # For push notifications
ALLOWED_ORIGIN=               # CORS restriction
```

## Deprecated / Removed

- **base44** integration removed. All Edge Functions are now Supabase native.
- **Firebase** references removed from documentation.
- **localStorage demo mode** removed.

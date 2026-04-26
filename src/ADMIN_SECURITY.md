# Admin Security — Hello Staff
**Last updated:** 2026-04-27  
**Applies to:** `platform_admin` role users

---

## Admin Access Model

Hello Staff uses a **dual-layer admin verification** system:

1. **Client-side** (`assertAdminSync`): Fast fail for UI rendering
2. **Server-side** (`assertAdmin` async): Truth verification against Supabase DB

## How Admin Verification Works

```javascript
// In adminService.js
const assertAdmin = async (userProfile) => {
  // Layer 1: Client-side sanity check
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
  
  // Layer 2: Server-side truth check
  const { data: serverProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userProfile.id)
    .single();
    
  if (serverProfile?.role !== "platform_admin") {
    throw new Error("FORBIDDEN: Server-side role verification failed");
  }
};
```

## Admin Operations & Audit Trail

Every admin action creates an **audit log entry**:

| Action | Audit Target | Details |
|--------|--------------|---------|
| `verify_organization` | organization | orgId |
| `set_job_status_*` | job | jobId, status |
| `update_user_role` | user | targetUserId, newRole |
| `set_user_status_*` | user | targetUserId, status |
| `set_org_status_*` | organization | targetOrgId, status |
| `seed_demo_data` | system | batch stats |
| `clear_demo_data` | system | - |
| `admin_broadcast` | system | title, targetRole, count |
| `create/update/delete_course` | academy | courseId |
| `create/update/delete_product` | store | productId |
| `create/update/delete_news` | news | articleId |

## Admin Login Flow

1. User signs in via `/admin` with email/password
2. `AdminLogin.jsx` calls `signInEmail()`
3. On success, checks `profile.role === 'platform_admin'`
4. Redirects to `/admin/dashboard` or shows access denied

**Security note:** Even if a user bypasses step 3 via DevTools, all admin API calls will fail at `assertAdmin` Layer 2.

## RPC Functions (Admin Only)

| Function | Type | Purpose | Access |
|----------|------|---------|--------|
| `broadcast_notification_secure` | SECURITY DEFINER | Mass notifications | `service_role` only |
| `seed_demo_data` | SECURITY DEFINER | Create demo data | `service_role` only |
| `clear_demo_data` | SECURITY DEFINER | Remove demo data | `service_role` only |
| `assert_platform_admin` | SECURITY DEFINER | Admin check utility | Internal use |

## Admin Permissions (Granular RBAC)

`admin_permissions` table supports granular control:

- `can_manage_users`
- `can_manage_organizations`
- `can_manage_payments`
- `can_manage_admins`
- `can_manage_testimonials`

**Note:** Granular permissions are checked at the application layer. RLS policies use the broader `platform_admin` role check.

## Bootstrapping the First Admin

1. Set `SUPER_ADMIN_EMAIL` in Edge Function secrets
2. Sign up with that email via regular registration
3. Call `bootstrapAdminAccess` Edge Function (checks SUPER_ADMIN_EMAIL)
4. The account is promoted to `platform_admin`
5. Use `/admin` to log in

**Never** manually set `role = 'platform_admin'` in the database without audit logging.

## Emergency Admin Lockout

If all admin accounts are locked:
1. Access Supabase Dashboard directly
2. Update `profiles.role` for a trusted user
3. Create an audit log entry manually
4. Consider rotating `SUPER_ADMIN_EMAIL`

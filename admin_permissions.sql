-- ============================================================
-- SQL for Admin Permissions (Platform Admins RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_permissions (
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    can_manage_users BOOLEAN DEFAULT false,
    can_manage_organizations BOOLEAN DEFAULT false,
    can_manage_payments BOOLEAN DEFAULT false,
    can_manage_admins BOOLEAN DEFAULT false,
    can_manage_testimonials BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view admin permissions" ON public.admin_permissions;
CREATE POLICY "Platform admins can view admin permissions"
ON public.admin_permissions FOR SELECT
USING (public.get_user_role() = 'platform_admin');

DROP POLICY IF EXISTS "Platform admins can insert admin permissions" ON public.admin_permissions;
CREATE POLICY "Platform admins can insert admin permissions"
ON public.admin_permissions FOR INSERT
WITH CHECK (public.get_user_role() = 'platform_admin');

DROP POLICY IF EXISTS "Platform admins can update admin permissions" ON public.admin_permissions;
CREATE POLICY "Platform admins can update admin permissions"
ON public.admin_permissions FOR UPDATE
USING (public.get_user_role() = 'platform_admin');

DROP POLICY IF EXISTS "Platform admins can delete admin permissions" ON public.admin_permissions;
CREATE POLICY "Platform admins can delete admin permissions"
ON public.admin_permissions FOR DELETE
USING (public.get_user_role() = 'platform_admin');

-- Also, drop and recreate profiles policy just to be sure we allow platform admins to UPDATE profiles (to add/remove roles)
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

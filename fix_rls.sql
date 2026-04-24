
-- 1. Create a SECURITY DEFINER function to read roles without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func
  SELECT role FROM public.profiles WHERE id = auth.uid();
$func;

-- 2. Fix PROFILES policy
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT USING (
  public.get_user_role() = 'platform_admin'
);

-- 3. Fix ORGANIZATIONS policy
DROP POLICY IF EXISTS "Admin can manage all organizations" ON public.organizations;
CREATE POLICY "Admin can manage all organizations" ON public.organizations
  USING (public.get_user_role() = 'platform_admin');

-- 4. Fix JOBS policy
DROP POLICY IF EXISTS "Admin can manage all jobs" ON public.jobs;
CREATE POLICY "Admin can manage all jobs" ON public.jobs
  USING (public.get_user_role() = 'platform_admin');

-- 5. Fix APPLICATIONS policy
DROP POLICY IF EXISTS "Admin can manage all applications" ON public.applications;
CREATE POLICY "Admin can manage all applications" ON public.applications
  USING (public.get_user_role() = 'platform_admin');

-- 6. Fix AUDIT LOGS policy
DROP POLICY IF EXISTS "Admin can read audit logs" ON public.audit_logs;
CREATE POLICY "Admin can read audit logs" ON public.audit_logs FOR SELECT
  USING (public.get_user_role() = 'platform_admin');


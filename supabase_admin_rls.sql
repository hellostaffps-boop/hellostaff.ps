-- ============================================================
-- SQL RLS Fix and Schema adjustments for Platform Admins
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Add missing columns to profiles for Admin Moderation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'suspended', 'scheduled_for_deletion', 'deleted'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='deletion_scheduled_at') THEN
        ALTER TABLE public.profiles ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;
    END IF;
END $$;

-- 1. Fix PROFILES policy to allow UPDATE and DELETE by platform admins
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

-- 2. Fix ORGANIZATIONS policy to allow UPDATE and DELETE by platform admins
DROP POLICY IF EXISTS "Admin can manage all organizations" ON public.organizations;
CREATE POLICY "Admin can manage all organizations" ON public.organizations 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

-- 3. Fix CANDIDATE PROFILES policy
DROP POLICY IF EXISTS "Admin can manage candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Admin can manage candidate profiles" ON public.candidate_profiles 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

-- 4. Fix EMPLOYER PROFILES policy
DROP POLICY IF EXISTS "Admin can manage employer profiles" ON public.employer_profiles;
CREATE POLICY "Admin can manage employer profiles" ON public.employer_profiles 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);
-- 2. Fix ORGANIZATIONS policy to allow UPDATE and DELETE by platform admins
DROP POLICY IF EXISTS "Admin can manage all organizations" ON public.organizations;
CREATE POLICY "Admin can manage all organizations" ON public.organizations 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

-- 3. Fix CANDIDATE PROFILES policy
DROP POLICY IF EXISTS "Admin can manage candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Admin can manage candidate profiles" ON public.candidate_profiles 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

-- 4. Fix EMPLOYER PROFILES policy
DROP POLICY IF EXISTS "Admin can manage employer profiles" ON public.employer_profiles;
CREATE POLICY "Admin can manage employer profiles" ON public.employer_profiles 
FOR ALL USING (
  public.get_user_role() = 'platform_admin'
);

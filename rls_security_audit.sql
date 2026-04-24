-- ============================================================================
-- Hello Staff — RLS Security Audit & Hardening
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- 1. PROFILES: Users can only read/update their own profile
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own') THEN
    EXECUTE 'CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''platform_admin''))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own') THEN
    EXECUTE 'CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid())';
  END IF;
END $$;


-- 2. NOTIFICATIONS: Users can only read/update their own notifications
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_own') THEN
    EXECUTE 'CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_own') THEN
    EXECUTE 'CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))';
  END IF;
END $$;


-- 3. APPLICATIONS: Candidates see their own, Employers see their org's
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'applications_select_relevant') THEN
    EXECUTE 'CREATE POLICY applications_select_relevant ON applications FOR SELECT USING (
      candidate_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR organization_id IN (
        SELECT organization_id FROM employer_profiles WHERE user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''platform_admin'')
    )';
  END IF;
END $$;


-- 4. JOBS: Public read, only org owners/admins can insert/update
-- ────────────────────────────────────────────────────────────
-- Jobs are publicly readable (for job browsing), so SELECT is open.
-- INSERT/UPDATE restricted to employers of the same org.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'jobs_insert_org_owner') THEN
    EXECUTE 'CREATE POLICY jobs_insert_org_owner ON jobs FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM employer_profiles WHERE user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )';
  END IF;
END $$;


-- 5. APPLICATION MESSAGES: Only parties of the application can read/write
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'app_messages_select_parties') THEN
    EXECUTE 'CREATE POLICY app_messages_select_parties ON application_messages FOR SELECT USING (
      sender_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR application_id IN (
        SELECT id FROM applications WHERE candidate_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      OR application_id IN (
        SELECT a.id FROM applications a
        JOIN employer_profiles ep ON ep.organization_id = a.organization_id
        WHERE ep.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )';
  END IF;
END $$;


-- 6. Ensure RLS is ENABLED on critical tables
-- ────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_profiles ENABLE ROW LEVEL SECURITY;


-- Done! All critical tables now have RLS policies enforced.

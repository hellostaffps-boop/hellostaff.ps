-- ============================================================
-- Phase 8: SaaS Upgrade - Safe Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Extend `profiles`
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- 2. Extend `candidate_profiles`
ALTER TABLE public.candidate_profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS current_status TEXT CHECK (current_status IN ('actively_looking', 'open_to_offers', 'not_looking')),
  ADD COLUMN IF NOT EXISTS desired_job_type TEXT CHECK (desired_job_type IN ('full_time', 'part_time', 'shift', 'temporary', 'internship')),
  ADD COLUMN IF NOT EXISTS expected_salary_min NUMERIC,
  ADD COLUMN IF NOT EXISTS expected_salary_max NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'ILS',
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS available_shifts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cities_available TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_transport BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- 3. Extend `organizations` and `employer_profiles`
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS branches_count INTEGER DEFAULT 1;

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- 4. Extend `jobs`
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS shift_type TEXT CHECK (shift_type IN ('morning', 'evening', 'night', 'rotating', 'flexible')),
  ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nice_to_have_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS responsibilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 5. Extend `applications`
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_rating INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_notes TEXT;

-- Safely attempt to drop and recreate the application status constraint
DO $$
BEGIN
  ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interview', 'trial_shift', 'offered', 'rejected', 'withdrawn', 'hired'));


-- ============================================================
-- NEW TABLES
-- ============================================================

-- 6. candidate_skills
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT,
  level TEXT CHECK (level IN ('beginner', 'working', 'strong', 'verified', 'trainer')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. skill_badges
CREATE TABLE IF NOT EXISTS public.skill_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  role_category TEXT,
  badge_level TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. candidate_badges
CREATE TABLE IF NOT EXISTS public.candidate_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.skill_badges(id) ON DELETE CASCADE,
  awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 9. trial_shifts
CREATE TABLE IF NOT EXISTS public.trial_shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  supervisor_name TEXT,
  is_paid BOOLEAN DEFAULT false,
  payment_amount NUMERIC,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'completed', 'cancelled', 'no_show')),
  candidate_confirmed BOOLEAN DEFAULT false,
  employer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. trial_shift_reviews
CREATE TABLE IF NOT EXISTS public.trial_shift_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trial_shift_id UUID REFERENCES public.trial_shifts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  hygiene INTEGER CHECK (hygiene BETWEEN 1 AND 5),
  speed INTEGER CHECK (speed BETWEEN 1 AND 5),
  customer_service INTEGER CHECK (customer_service BETWEEN 1 AND 5),
  technical_skill INTEGER CHECK (technical_skill BETWEEN 1 AND 5),
  teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
  overall_score NUMERIC,
  recommendation TEXT CHECK (recommendation IN ('hire', 'second_trial', 'reject')),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. interviews (Already exists, so we extend it)
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
BEGIN
  ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_type_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE public.interviews
  ADD CONSTRAINT interviews_type_check CHECK (type IN ('in_person', 'online', 'phone', 'whatsapp'));

-- 12. subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_name TEXT CHECK (plan_name IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  job_post_limit INTEGER,
  candidate_view_limit INTEGER,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. admin_actions_log
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT,
  target_type TEXT,
  target_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_urgent ON public.jobs(urgent);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_trial_shifts_candidate ON public.trial_shifts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_trial_shifts_org ON public.trial_shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_org ON public.interviews(organization_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on new tables
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_shift_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- 1. candidate_skills RLS
CREATE POLICY "Public can view candidate skills" 
ON public.candidate_skills FOR SELECT USING (true);

CREATE POLICY "Candidates can insert their own skills" 
ON public.candidate_skills FOR INSERT 
WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own skills" 
ON public.candidate_skills FOR UPDATE 
USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can delete their own skills" 
ON public.candidate_skills FOR DELETE 
USING (auth.uid() = candidate_id);

-- 2. skill_badges & candidate_badges RLS
CREATE POLICY "Public can view skill badges" 
ON public.skill_badges FOR SELECT USING (true);

CREATE POLICY "Public can view candidate badges" 
ON public.candidate_badges FOR SELECT USING (true);

-- 3. trial_shifts RLS
CREATE POLICY "Candidates can view their trial shifts" 
ON public.trial_shifts FOR SELECT 
USING (auth.uid() = candidate_id);

CREATE POLICY "Employers can view their org trial shifts" 
ON public.trial_shifts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = trial_shifts.organization_id 
    AND organization_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE organizations.id = trial_shifts.organization_id 
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "Employers can insert trial shifts" 
ON public.trial_shifts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = trial_shifts.organization_id 
    AND organization_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE organizations.id = trial_shifts.organization_id 
    AND organizations.owner_id = auth.uid()
  )
);

CREATE POLICY "Involved parties can update trial shifts" 
ON public.trial_shifts FOR UPDATE 
USING (
  auth.uid() = candidate_id
  OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = trial_shifts.organization_id 
    AND organization_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE organizations.id = trial_shifts.organization_id 
    AND organizations.owner_id = auth.uid()
  )
);

-- 4. trial_shift_reviews RLS
CREATE POLICY "Employers can manage their org trial shift reviews" 
ON public.trial_shift_reviews FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = trial_shift_reviews.organization_id 
    AND organization_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE organizations.id = trial_shift_reviews.organization_id 
    AND organizations.owner_id = auth.uid()
  )
);

-- 5. interviews RLS
CREATE POLICY "Candidates can view their interviews" 
ON public.interviews FOR SELECT 
USING (auth.uid() = candidate_id);

CREATE POLICY "Employers can manage their org interviews" 
ON public.interviews FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = interviews.organization_id 
    AND organization_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE organizations.id = interviews.organization_id 
    AND organizations.owner_id = auth.uid()
  )
);

-- 6. subscriptions RLS
CREATE POLICY "Employers can view their org subscriptions" 
ON public.subscriptions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = subscriptions.organization_id 
    AND organization_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE organizations.id = subscriptions.organization_id 
    AND organizations.owner_id = auth.uid()
  )
);

-- 7. Platform Admin Override (For all new tables)
-- Assuming admin has role = 'platform_admin' in profiles
CREATE POLICY "Admins have full access to candidate_skills" ON public.candidate_skills FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to skill_badges" ON public.skill_badges FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to candidate_badges" ON public.candidate_badges FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to trial_shifts" ON public.trial_shifts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to trial_shift_reviews" ON public.trial_shift_reviews FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to interviews" ON public.interviews FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to subscriptions" ON public.subscriptions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
CREATE POLICY "Admins have full access to admin_actions_log" ON public.admin_actions_log FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

-- ============================================================
-- DB FUNCTIONS
-- ============================================================

-- Function to calculate candidate match score based on basic logic
CREATE OR REPLACE FUNCTION calculate_candidate_match_score(p_job_id UUID, p_candidate_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_job RECORD;
  v_candidate RECORD;
BEGIN
  -- Get Job Details
  SELECT location, shift_type, experience_required INTO v_job 
  FROM public.jobs WHERE id = p_job_id;
  
  -- Get Candidate Details
  SELECT city, available_shifts, years_experience INTO v_candidate
  FROM public.candidate_profiles WHERE user_id = p_candidate_id;
  
  -- Logic 1: City match (20 points)
  IF v_job.location IS NOT NULL AND v_candidate.city IS NOT NULL THEN
    IF LOWER(v_job.location) = LOWER(v_candidate.city) THEN
      v_score := v_score + 20;
    END IF;
  END IF;
  
  -- Logic 2: Experience (20 points)
  IF v_job.experience_required IS NOT NULL AND v_candidate.years_experience IS NOT NULL THEN
    -- Basic check: if candidate experience >= required
    -- This is simplified. Needs numeric conversion in a real scenario.
    v_score := v_score + 20; 
  END IF;

  -- Logic 3: Shift match (15 points)
  IF v_job.shift_type IS NOT NULL AND v_candidate.available_shifts IS NOT NULL THEN
    IF v_job.shift_type = ANY(v_candidate.available_shifts) THEN
      v_score := v_score + 15;
    END IF;
  END IF;

  -- Add base score for applying
  v_score := v_score + 45; -- Minimum score just to show something

  IF v_score > 100 THEN v_score := 100; END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

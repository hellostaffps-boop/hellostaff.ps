-- ============================================================
-- Hello Staff Pro — Supabase Full Database Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. PROFILES (linked to auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('candidate', 'employer_owner', 'employer_manager', 'platform_admin')),
  preferred_language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', NULL),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. CANDIDATE PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  title TEXT,
  bio TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  resume_url TEXT,
  years_experience INTEGER,
  job_types TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  profile_completion INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. ORGANIZATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  business_type TEXT,
  industry TEXT,
  city TEXT,
  address TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  video_url TEXT,
  culture_values JSONB DEFAULT '[]',
  perks JSONB DEFAULT '[]',
  team_photos JSONB DEFAULT '[]',
  founded_year TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. EMPLOYER PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. ORGANIZATION MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'manager')),
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_email)
);

-- ─────────────────────────────────────────────
-- 6. JOBS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  job_type TEXT,
  employment_type TEXT,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_period TEXT CHECK (salary_period IN ('monthly', 'daily', 'hourly')),
  experience_required TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_name TEXT,
  posted_by TEXT,
  posted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. APPLICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title TEXT,
  candidate_email TEXT NOT NULL,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_name TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn', 'hired'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_email)
);

-- ─────────────────────────────────────────────
-- 8. APPLICATION MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  sender_role TEXT CHECK (sender_role IN ('candidate', 'employer_owner', 'employer_manager')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. APPLICATION INTERNAL NOTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  visibility TEXT DEFAULT 'internal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 10. APPLICATION EVALUATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT,
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 5),
  strengths JSONB DEFAULT '[]',
  concerns JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, reviewer_email)
);

-- ─────────────────────────────────────────────
-- 11. INTERVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE NOT NULL,
  job_title TEXT,
  candidate_email TEXT,
  candidate_name TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  location TEXT,
  type TEXT DEFAULT 'in_person' CHECK (type IN ('in_person', 'online', 'phone')),
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  evaluation_notes TEXT,
  strengths TEXT,
  weaknesses TEXT,
  recommendation TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 12. INTERVIEW SLOTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  candidate_email TEXT,
  candidate_name TEXT,
  employer_email TEXT,
  job_title TEXT,
  organization_name TEXT,
  proposed_slots JSONB DEFAULT '[]',
  selected_slot TIMESTAMPTZ,
  location TEXT,
  interview_type TEXT DEFAULT 'in_person',
  notes TEXT,
  status TEXT DEFAULT 'pending_selection' CHECK (status IN ('pending_selection', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 13. SAVED JOBS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title TEXT,
  organization_name TEXT,
  job_type TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, job_id)
);

-- ─────────────────────────────────────────────
-- 14. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('application', 'job', 'interview', 'system', 'general')),
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 15. AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create a SECURITY DEFINER function to read roles without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT USING (
  public.get_user_role() = 'platform_admin'
);

-- CANDIDATE_PROFILES policies
CREATE POLICY "Candidates can manage own profile" ON public.candidate_profiles
  USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Anyone can read candidate profiles" ON public.candidate_profiles FOR SELECT USING (true);

-- ORGANIZATIONS policies
CREATE POLICY "Anyone can read active organizations" ON public.organizations FOR SELECT USING (status = 'active');
CREATE POLICY "Owner can manage their organization" ON public.organizations
  USING (owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin can manage all organizations" ON public.organizations
  USING (public.get_user_role() = 'platform_admin');

-- EMPLOYER_PROFILES policies
CREATE POLICY "Employer can manage own profile" ON public.employer_profiles
  USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- ORGANIZATION_MEMBERS policies
CREATE POLICY "Members can read their org members" ON public.organization_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    AND om.status = 'active'
  ));
CREATE POLICY "Owner can manage members" ON public.organization_members
  USING (EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND o.owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));

-- JOBS policies
CREATE POLICY "Anyone can read published jobs" ON public.jobs FOR SELECT USING (status = 'published');
CREATE POLICY "Employers can manage org jobs" ON public.jobs
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));
CREATE POLICY "Admin can manage all jobs" ON public.jobs
  USING (public.get_user_role() = 'platform_admin');

-- APPLICATIONS policies
CREATE POLICY "Candidates can see own applications" ON public.applications FOR SELECT
  USING (candidate_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Candidates can create applications" ON public.applications FOR INSERT
  WITH CHECK (candidate_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Employers can see org applications" ON public.applications FOR SELECT
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));
CREATE POLICY "Employers can update application status" ON public.applications FOR UPDATE
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));
CREATE POLICY "Admin can manage all applications" ON public.applications
  USING (public.get_user_role() = 'platform_admin');

-- APPLICATION_MESSAGES policies
CREATE POLICY "Application parties can read messages" ON public.application_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.applications a WHERE a.id = application_messages.application_id
    AND (
      a.candidate_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      OR a.organization_id IN (
        SELECT ep.organization_id FROM public.employer_profiles ep
        WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      )
    )
  ));
CREATE POLICY "Application parties can send messages" ON public.application_messages FOR INSERT
  WITH CHECK (sender_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- APPLICATION_NOTES policies (internal — employers only)
CREATE POLICY "Employers can manage org notes" ON public.application_notes
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));

-- APPLICATION_EVALUATIONS policies
CREATE POLICY "Employers can manage org evaluations" ON public.application_evaluations
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));

-- INTERVIEWS policies
CREATE POLICY "Candidates can see own interviews" ON public.interviews FOR SELECT
  USING (candidate_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Employers can manage org interviews" ON public.interviews
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));

-- INTERVIEW_SLOTS policies
CREATE POLICY "Candidates can see own slots" ON public.interview_slots FOR SELECT
  USING (candidate_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Candidates can select slots" ON public.interview_slots FOR UPDATE
  USING (candidate_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Employers can manage org slots" ON public.interview_slots
  USING (organization_id IN (
    SELECT ep.organization_id FROM public.employer_profiles ep
    WHERE ep.user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ));

-- SAVED_JOBS policies
CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs
  USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- NOTIFICATIONS policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
  USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- AUDIT_LOGS policies (admin only)
CREATE POLICY "Admin can read audit logs" ON public.audit_logs FOR SELECT
  USING (public.get_user_role() = 'platform_admin');
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email ON public.candidate_profiles(user_email);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_email ON public.employer_profiles(user_email);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_org ON public.employer_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON public.organization_members(user_email);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON public.applications(candidate_email);
CREATE INDEX IF NOT EXISTS idx_applications_org ON public.applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON public.notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_email, read);
CREATE INDEX IF NOT EXISTS idx_messages_app ON public.application_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_email ON public.saved_jobs(user_email);

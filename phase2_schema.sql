-- ============================================================
-- Hello Staff — Phase 2 SQL: Reviews, Analytics, RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── COMPANY REVIEWS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  environment_rating INTEGER CHECK (environment_rating BETWEEN 1 AND 5),
  management_rating INTEGER CHECK (management_rating BETWEEN 1 AND 5),
  salary_rating INTEGER CHECK (salary_rating BETWEEN 1 AND 5),
  review_text TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, reviewer_email)
);

-- ─── EMPLOYEE REVIEWS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  professionalism INTEGER CHECK (professionalism BETWEEN 1 AND 5),
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  skills_rating INTEGER CHECK (skills_rating BETWEEN 1 AND 5),
  review_text TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_email, organization_id)
);

-- ─── JOB VIEWS (Analytics) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  viewer_email TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROFILE VIEWS (Analytics) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_email TEXT NOT NULL,
  viewer_email TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Company Reviews: anyone can read, authenticated users can write their own
CREATE POLICY "Anyone can read company reviews" ON public.company_reviews FOR SELECT USING (true);
CREATE POLICY "Users can write own reviews" ON public.company_reviews FOR INSERT
  WITH CHECK (reviewer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update own reviews" ON public.company_reviews FOR UPDATE
  USING (reviewer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Employee Reviews: anyone can read, employers can write
CREATE POLICY "Anyone can read employee reviews" ON public.employee_reviews FOR SELECT USING (true);
CREATE POLICY "Employers can write employee reviews" ON public.employee_reviews FOR INSERT
  WITH CHECK (reviewer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Employers can update employee reviews" ON public.employee_reviews FOR UPDATE
  USING (reviewer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Job Views: anyone can insert, org owners can read
CREATE POLICY "Anyone can track job views" ON public.job_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read job views" ON public.job_views FOR SELECT USING (true);

-- Profile Views: anyone can insert, profile owner can read
CREATE POLICY "Anyone can track profile views" ON public.profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read profile views" ON public.profile_views FOR SELECT USING (true);

-- ─── SUBSCRIPTIONS RLS ──────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT
  USING (owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT
  WITH CHECK (owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin can manage all subscriptions" ON public.subscriptions
  USING (public.get_user_role() = 'platform_admin');

CREATE POLICY "Anyone can read payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage payment settings" ON public.payment_settings
  USING (public.get_user_role() = 'platform_admin');

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_reviews_org ON public.company_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_reviews_email ON public.employee_reviews(candidate_email);
CREATE INDEX IF NOT EXISTS idx_job_views_job ON public.job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_date ON public.job_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_email ON public.profile_views(profile_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

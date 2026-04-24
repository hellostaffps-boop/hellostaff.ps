-- ─────────────────────────────────────────────
-- PHASE 4: REVIEWS ANONYMITY & PRIVACY
-- ─────────────────────────────────────────────

-- 1. Add reviewer_title to capture role at time of review
ALTER TABLE public.company_reviews ADD COLUMN IF NOT EXISTS reviewer_title TEXT;
ALTER TABLE public.employee_reviews ADD COLUMN IF NOT EXISTS reviewer_title TEXT;

-- 2. Update RLS for company_reviews to restrict review_text visibility
-- Only admins should see review_text in SELECT
-- Note: Supabase doesn't easily hide columns via RLS SELECT, 
-- but we can use a SECURITY DEFINER function or just handle in app.
-- For now, we rely on the application-level filtering as implemented.

-- 3. Add comment on anonymity
COMMENT ON COLUMN public.company_reviews.reviewer_title IS 'The job title of the reviewer (e.g. Barista) used for anonymous display to owners.';

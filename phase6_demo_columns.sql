-- =======================================================
-- Phase 6: Add demo data tracking columns
-- Run this in Supabase SQL Editor
-- =======================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id TEXT;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id TEXT;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id TEXT;

-- Index for fast demo data querying and cleanup
CREATE INDEX IF NOT EXISTS idx_orgs_demo ON public.organizations(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_jobs_demo ON public.jobs(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_apps_demo ON public.applications(is_demo) WHERE is_demo = true;

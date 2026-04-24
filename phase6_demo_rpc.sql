-- =======================================================
-- Phase 6: Demo Data RPC Functions (SECURITY DEFINER)
-- These bypass RLS and run server-side as superuser.
-- Run this in Supabase SQL Editor AFTER phase6_demo_columns.sql
-- =======================================================

-- Add demo columns if not already added
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id TEXT;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id TEXT;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id TEXT;

-- ────────────────────────────────────────────────────────
-- Function: seed_demo_data()
-- Creates demo organizations, jobs, and applications
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org1_id UUID;
  org2_id UUID;
  org3_id UUID;
  org4_id UUID;
  job_ids UUID[];
  demo_job_id UUID;
  org_id_var UUID;
  org_name_var TEXT;
  candidate_email TEXT;
  candidate_name_var TEXT;
  job_count INT := 0;
  app_count INT := 0;
  batch_id TEXT := 'admin-demo-batch-v1';
  statuses TEXT[] := ARRAY['pending','reviewing','shortlisted','interview','offered','rejected'];
  candidates jsonb[] := ARRAY[
    '{"email":"demo.yousuf@hellostafftest.com","name":"يوسف نصر"}'::jsonb,
    '{"email":"demo.maryam@hellostafftest.com","name":"مريم أبو علي"}'::jsonb,
    '{"email":"demo.ahmad@hellostafftest.com","name":"أحمد سلامة"}'::jsonb,
    '{"email":"demo.sara@hellostafftest.com","name":"سارة الحمدان"}'::jsonb,
    '{"email":"demo.khaled@hellostafftest.com","name":"خالد عوض"}'::jsonb
  ];
  i INT;
BEGIN
  -- Check if demo data already exists
  IF EXISTS (SELECT 1 FROM public.organizations WHERE is_demo = true AND demo_batch_id = batch_id LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demo data already exists');
  END IF;

  -- 1. Insert Organizations
  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org1@hellostafftest.com', 'محمصة القهوة العربية', 'cafe', 'رام الله', 'المصيون، رام الله', 'أول محمصة قهوة مختصة في رام الله تقدم تجربة فريدة لعشاق القهوة.', 'حيث تبدأ كل فنجان', 'demo.org1@hellostafftest.com', 'https://images.unsplash.com/photo-1559925393-8be0a33e2a14?w=200&q=80', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80', true, 'active', true, batch_id)
  RETURNING id INTO org1_id;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org2@hellostafftest.com', 'مطعم الشاميات', 'restaurant', 'نابلس', 'وسط البلد، نابلس', 'مطعم يقدم أصالة المطبخ الشامي بنكهة عصرية.', 'طعام الأصالة بلمسة حديثة', 'demo.org2@hellostafftest.com', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', true, 'active', true, batch_id)
  RETURNING id INTO org2_id;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org3@hellostafftest.com', 'فندق النخيل', 'hotel', 'أريحا', 'شارع الملك حسين، أريحا', 'فندق فاخر بمرافق عالمية وخدمة مميزة في أجمل مدن فلسطين.', 'ضيافة بلا حدود', 'demo.org3@hellostafftest.com', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=200&q=80', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', false, 'active', true, batch_id)
  RETURNING id INTO org3_id;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org4@hellostafftest.com', 'مخبز البركة', 'bakery', 'الخليل', 'حي البلدة القديمة، الخليل', 'مخبز تقليدي يصنع أجود أنواع الخبز والمعجنات يومياً.', 'خبز طازج كل صباح', 'demo.org4@hellostafftest.com', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', false, 'pending', true, batch_id)
  RETURNING id INTO org4_id;

  -- 2. Insert Jobs for each organization
  FOR org_id_var, org_name_var IN
    SELECT id, name FROM public.organizations WHERE id IN (org1_id, org2_id, org3_id, org4_id)
  LOOP
    INSERT INTO public.jobs (organization_id, organization_name, posted_by, title, description, employment_type, location, salary_min, salary_max, salary_period, status, is_demo, demo_batch_id)
    VALUES
      (org_id_var, org_name_var, 'demo.org1@hellostafftest.com', 'باريستا محترف', 'فرصة عمل رائعة في ' || org_name_var || '. نبحث عن باريستا ذوي خبرة وشغف بالعمل.', 'full_time', (SELECT city FROM public.organizations WHERE id = org_id_var), 2500, 3500, 'monthly', 'published', true, batch_id),
      (org_id_var, org_name_var, 'demo.org1@hellostafftest.com', 'مدير مقهى', 'فرصة عمل رائعة في ' || org_name_var || '. نبحث عن مدير مقهى ذوي خبرة وشغف بالعمل.', 'full_time', (SELECT city FROM public.organizations WHERE id = org_id_var), 4000, 6000, 'monthly', 'published', true, batch_id),
      (org_id_var, org_name_var, 'demo.org1@hellostafftest.com', 'نادل / خادم طاولة', 'فرصة عمل رائعة في ' || org_name_var || '. نبحث عن نادل ذوي خبرة وشغف بالعمل.', 'part_time', (SELECT city FROM public.organizations WHERE id = org_id_var), 1800, 2500, 'monthly', 'published', true, batch_id),
      (org_id_var, org_name_var, 'demo.org1@hellostafftest.com', 'طاهي متخصص', 'فرصة عمل رائعة في ' || org_name_var || '. نبحث عن طاهي ذوي خبرة وشغف بالعمل.', 'full_time', (SELECT city FROM public.organizations WHERE id = org_id_var), 3500, 5000, 'monthly', 'published', true, batch_id);

    job_count := job_count + 4;
  END LOOP;

  -- Collect all demo job IDs
  SELECT ARRAY_AGG(id) INTO job_ids FROM public.jobs WHERE is_demo = true AND demo_batch_id = batch_id;

  -- 3. Insert Applications
  i := 0;
  FOREACH demo_job_id IN ARRAY job_ids LOOP
    EXIT WHEN i >= 20;
    
    candidate_email := (candidates[i % 5 + 1]->>'email');
    candidate_name_var  := (candidates[i % 5 + 1]->>'name');
    
    SELECT organization_name, organization_id INTO org_name_var, org_id_var
    FROM public.jobs WHERE id = demo_job_id;

    BEGIN
      INSERT INTO public.applications (job_id, organization_id, organization_name, candidate_email, candidate_name, job_title, status, cover_letter, is_demo, demo_batch_id)
      SELECT
        demo_job_id,
        organization_id,
        organization_name,
        candidate_email,
        candidate_name_var,
        title,
        statuses[i % 6 + 1],
        'أنا مهتم جداً بهذا الموقع وأعتقد أن مهاراتي مناسبة تماماً لما تبحث عنه ' || org_name_var || '.',
        true,
        batch_id
      FROM public.jobs WHERE id = demo_job_id;

      app_count := app_count + 1;
    EXCEPTION WHEN unique_violation THEN
      -- Skip duplicate (same job + candidate)
      NULL;
    END;
    
    i := i + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'orgs', 4,
    'jobs', job_count,
    'applications', app_count
  );
END;
$$;

-- ────────────────────────────────────────────────────────
-- Function: clear_demo_data()
-- Removes all demo-tagged records
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  batch_id TEXT := 'admin-demo-batch-v1';
BEGIN
  DELETE FROM public.applications WHERE is_demo = true AND demo_batch_id = batch_id;
  DELETE FROM public.jobs         WHERE is_demo = true AND demo_batch_id = batch_id;
  DELETE FROM public.organizations WHERE is_demo = true AND demo_batch_id = batch_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute to authenticated users (RLS on the functions themselves)
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;

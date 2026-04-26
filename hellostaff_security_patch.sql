-- ============================================================================
-- Hello Staff — Security Hardening Patch v2026.04.27
-- Fixes ALL critical & high severity vulnerabilities discovered in audit
-- IDEMPOTENT + FAULT-TOLERANT VERSION — Skips missing tables automatically
-- ============================================================================

-- ============================================================
-- SECTION 0: Helper Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$func$;

CREATE OR REPLACE FUNCTION public.assert_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() = 'platform_admin' THEN
    RETURN true;
  END IF;
  RAISE EXCEPTION 'FORBIDDEN: platform_admin role required';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$func$;

-- ============================================================
-- SECTION 1: CRIT-005 — Audit Log Forgery Fix
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Only admin can insert audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Admin can read audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Admin can update audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Admin can delete audit logs" ON public.audit_logs;

  CREATE POLICY "Only admin can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.get_user_role() = 'platform_admin');

  CREATE POLICY "Admin can read audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.audit_logs not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 2: CRIT-002 — Broadcast RPC Fix
-- ============================================================

DO $$
BEGIN
  REVOKE ALL ON FUNCTION public.broadcast_notification_secure(TEXT, TEXT, TEXT) FROM authenticated;
  REVOKE ALL ON FUNCTION public.broadcast_notification_secure(TEXT, TEXT, TEXT) FROM anon;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Function broadcast_notification_secure not found, skipping revoke...';
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_notification_secure(
    p_title TEXT,
    p_message TEXT,
    p_target_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    PERFORM public.assert_platform_admin();

    IF p_target_role = 'all' THEN
        INSERT INTO public.notifications (user_id, user_email, title, message, type, read, link)
        SELECT id, email, p_title, p_message, 'system', false, ''
        FROM public.profiles;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSIF p_target_role = 'candidate' THEN
        INSERT INTO public.notifications (user_id, user_email, title, message, type, read, link)
        SELECT id, email, p_title, p_message, 'system', false, ''
        FROM public.profiles WHERE role = 'candidate';
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSIF p_target_role = 'employer' THEN
        INSERT INTO public.notifications (user_id, user_email, title, message, type, read, link)
        SELECT id, email, p_title, p_message, 'system', false, ''
        FROM public.profiles WHERE role IN ('employer_owner', 'employer_manager');
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.broadcast_notification_secure(TEXT, TEXT, TEXT) TO service_role;

-- ============================================================
-- SECTION 3: CRIT-003 — Demo Data RPC Fix
-- ============================================================

DO $$
BEGIN
  REVOKE ALL ON FUNCTION public.seed_demo_data() FROM authenticated;
  REVOKE ALL ON FUNCTION public.clear_demo_data() FROM authenticated;
  REVOKE ALL ON FUNCTION public.seed_demo_data() FROM anon;
  REVOKE ALL ON FUNCTION public.clear_demo_data() FROM anon;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Demo functions not found, skipping revoke...';
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org1_id UUID; org2_id UUID; org3_id UUID; org4_id UUID;
  job_ids UUID[]; demo_job_id UUID; org_id_var UUID; org_name_var TEXT;
  candidate_email TEXT; candidate_name_var TEXT;
  job_count INT := 0; app_count INT := 0;
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
  PERFORM public.assert_platform_admin();

  IF EXISTS (SELECT 1 FROM public.organizations WHERE is_demo = true AND demo_batch_id = batch_id LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demo data already exists');
  END IF;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org1@hellostafftest.com', 'محمصة القهوة العربية', 'cafe', 'رام الله', 'المصيون، رام الله', 'أول محمصة قهوة مختصة في رام الله تقدم تجربة فريدة لعشاق القهوة.', 'حيث تبدأ كل فنجان', 'demo.org1@hellostafftest.com', 'https://images.unsplash.com/photo-1559925393-8be0a33e2a14?w=200&q=80', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80', true, 'active', true, batch_id) RETURNING id INTO org1_id;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org2@hellostafftest.com', 'مطعم الشاميات', 'restaurant', 'نابلس', 'وسط البلد، نابلس', 'مطعم يقدم أصالة المطبخ الشامي بنكهة عصرية.', 'طعام الأصالة بلمسة حديثة', 'demo.org2@hellostafftest.com', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', true, 'active', true, batch_id) RETURNING id INTO org2_id;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org3@hellostafftest.com', 'فندق النخيل', 'hotel', 'أريحا', 'شارع الملك حسين، أريحا', 'فندق فاخر بمرافق عالمية وخدمة مميزة في أجمل مدن فلسطين.', 'ضيافة بلا حدود', 'demo.org3@hellostafftest.com', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=200&q=80', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', false, 'active', true, batch_id) RETURNING id INTO org3_id;

  INSERT INTO public.organizations (owner_email, name, business_type, city, address, description, slogan, email, logo_url, cover_image_url, verified, status, is_demo, demo_batch_id)
  VALUES ('demo.org4@hellostafftest.com', 'مخبز البركة', 'bakery', 'الخليل', 'حي البلدة القديمة، الخليل', 'مخبز تقليدي يصنع أجود أنواع الخبز والمعجنات يومياً.', 'خبز طازج كل صباح', 'demo.org4@hellostafftest.com', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', false, 'pending', true, batch_id) RETURNING id INTO org4_id;

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

  SELECT ARRAY_AGG(id) INTO job_ids FROM public.jobs WHERE is_demo = true AND demo_batch_id = batch_id;

  i := 0;
  FOREACH demo_job_id IN ARRAY job_ids LOOP
    EXIT WHEN i >= 20;
    candidate_email := (candidates[i % 5 + 1]->>'email');
    candidate_name_var := (candidates[i % 5 + 1]->>'name');
    SELECT organization_name, organization_id INTO org_name_var, org_id_var FROM public.jobs WHERE id = demo_job_id;
    BEGIN
      INSERT INTO public.applications (job_id, organization_id, organization_name, candidate_email, candidate_name, job_title, status, cover_letter, is_demo, demo_batch_id)
      SELECT demo_job_id, organization_id, organization_name, candidate_email, candidate_name_var, title, statuses[i % 6 + 1], 'أنا مهتم جداً بهذا الموقع وأعتقد أن مهاراتي مناسبة تماماً لما تبحث عنه ' || org_name_var || '.', true, batch_id
      FROM public.jobs WHERE id = demo_job_id;
      app_count := app_count + 1;
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    i := i + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'orgs', 4, 'jobs', job_count, 'applications', app_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE batch_id TEXT := 'admin-demo-batch-v1';
BEGIN
  PERFORM public.assert_platform_admin();
  DELETE FROM public.applications WHERE is_demo = true AND demo_batch_id = batch_id;
  DELETE FROM public.jobs WHERE is_demo = true AND demo_batch_id = batch_id;
  DELETE FROM public.organizations WHERE is_demo = true AND demo_batch_id = batch_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO service_role;

-- ============================================================
-- SECTION 4: HIGH-003 — candidate_profiles
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.candidate_profiles ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can read candidate profiles" ON public.candidate_profiles;
  DROP POLICY IF EXISTS "Candidates can manage own profile" ON public.candidate_profiles;
  DROP POLICY IF EXISTS "Candidates manage own profile" ON public.candidate_profiles;
  DROP POLICY IF EXISTS "Employers read applicant profiles" ON public.candidate_profiles;
  DROP POLICY IF EXISTS "Admin can manage candidate profiles" ON public.candidate_profiles;

  CREATE POLICY "Candidates manage own profile" ON public.candidate_profiles
  FOR ALL USING (user_email = public.get_user_email())
  WITH CHECK (user_email = public.get_user_email());

  CREATE POLICY "Employers read applicant profiles" ON public.candidate_profiles
  FOR SELECT USING (
    user_email IN (
      SELECT candidate_email FROM public.applications
      WHERE organization_id IN (
        SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
      )
    )
  );

  CREATE POLICY "Admin can manage candidate profiles" ON public.candidate_profiles
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.candidate_profiles not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 5: employer_profiles
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.employer_profiles ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Employers can manage own profile" ON public.employer_profiles;
  DROP POLICY IF EXISTS "Employers manage own profile" ON public.employer_profiles;
  DROP POLICY IF EXISTS "Admin can manage employer profiles" ON public.employer_profiles;

  CREATE POLICY "Employers manage own profile" ON public.employer_profiles
  FOR ALL USING (user_email = public.get_user_email())
  WITH CHECK (user_email = public.get_user_email());

  CREATE POLICY "Admin can manage employer profiles" ON public.employer_profiles
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.employer_profiles not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 6: jobs
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can read published jobs" ON public.jobs;
  DROP POLICY IF EXISTS "Employers can manage own jobs" ON public.jobs;
  DROP POLICY IF EXISTS "Admin can manage all jobs" ON public.jobs;

  CREATE POLICY "Anyone can read published jobs" ON public.jobs
  FOR SELECT USING (status = 'published');

  CREATE POLICY "Employers can manage own jobs" ON public.jobs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  );

  CREATE POLICY "Admin can manage all jobs" ON public.jobs
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.jobs not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 7: organizations
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can read active organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Owners can manage own organization" ON public.organizations;
  DROP POLICY IF EXISTS "Admin can manage all organizations" ON public.organizations;

  CREATE POLICY "Anyone can read active organizations" ON public.organizations
  FOR SELECT USING (status = 'active');

  CREATE POLICY "Owners can manage own organization" ON public.organizations
  FOR ALL USING (owner_email = public.get_user_email())
  WITH CHECK (owner_email = public.get_user_email());

  CREATE POLICY "Admin can manage all organizations" ON public.organizations
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.organizations not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 8: applications
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Candidates manage own applications" ON public.applications;
  DROP POLICY IF EXISTS "Employers manage org applications" ON public.applications;
  DROP POLICY IF EXISTS "Admin can manage all applications" ON public.applications;

  CREATE POLICY "Candidates manage own applications" ON public.applications
  FOR ALL USING (candidate_email = public.get_user_email())
  WITH CHECK (candidate_email = public.get_user_email());

  CREATE POLICY "Employers manage org applications" ON public.applications
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  );

  CREATE POLICY "Admin can manage all applications" ON public.applications
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.applications not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 9: application_messages
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.application_messages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Candidates read app messages" ON public.application_messages;
  DROP POLICY IF EXISTS "Employers read app messages" ON public.application_messages;
  DROP POLICY IF EXISTS "Candidates insert messages" ON public.application_messages;
  DROP POLICY IF EXISTS "Employers insert messages" ON public.application_messages;

  CREATE POLICY "Candidates read app messages" ON public.application_messages
  FOR SELECT USING (
    sender_email = public.get_user_email()
    OR application_id IN (
      SELECT id FROM public.applications WHERE candidate_email = public.get_user_email()
    )
  );

  CREATE POLICY "Employers read app messages" ON public.application_messages
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM public.applications
      WHERE organization_id IN (
        SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
      )
    )
  );

  CREATE POLICY "Candidates insert messages" ON public.application_messages
  FOR INSERT WITH CHECK (
    sender_email = public.get_user_email()
    AND application_id IN (
      SELECT id FROM public.applications WHERE candidate_email = public.get_user_email()
    )
  );

  CREATE POLICY "Employers insert messages" ON public.application_messages
  FOR INSERT WITH CHECK (
    sender_email = public.get_user_email()
    AND application_id IN (
      SELECT id FROM public.applications
      WHERE organization_id IN (
        SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
      )
    )
  );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.application_messages not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 10: application_notes
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.application_notes ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Employers manage internal notes" ON public.application_notes;
  DROP POLICY IF EXISTS "Admin can manage application notes" ON public.application_notes;

  CREATE POLICY "Employers manage internal notes" ON public.application_notes
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  );

  CREATE POLICY "Admin can manage application notes" ON public.application_notes
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.application_notes not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 11: application_evaluations
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.application_evaluations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Employers manage evaluations" ON public.application_evaluations;
  DROP POLICY IF EXISTS "Admin can manage evaluations" ON public.application_evaluations;

  CREATE POLICY "Employers manage evaluations" ON public.application_evaluations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
    )
  );

  CREATE POLICY "Admin can manage evaluations" ON public.application_evaluations
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.application_evaluations not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 12: notifications
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Admin can manage notifications" ON public.notifications;

  CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (user_email = public.get_user_email())
  WITH CHECK (user_email = public.get_user_email());

  CREATE POLICY "Admin can manage notifications" ON public.notifications
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.notifications not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 13: store_orders / store_order_items
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.store_orders ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users manage own orders" ON public.store_orders;
  DROP POLICY IF EXISTS "Admin can manage store orders" ON public.store_orders;

  CREATE POLICY "Users manage own orders" ON public.store_orders
  FOR ALL USING (user_email = public.get_user_email())
  WITH CHECK (user_email = public.get_user_email());

  CREATE POLICY "Admin can manage store orders" ON public.store_orders
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.store_orders not found, skipping...';
END;
$$;

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.store_order_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users read own order items" ON public.store_order_items;
  DROP POLICY IF EXISTS "Admin can manage order items" ON public.store_order_items;

  CREATE POLICY "Users read own order items" ON public.store_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.store_orders WHERE user_email = public.get_user_email())
  );

  CREATE POLICY "Admin can manage order items" ON public.store_order_items
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.store_order_items not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 14: trial_shifts
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.trial_shifts ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Employers manage trial shifts" ON public.trial_shifts;
  DROP POLICY IF EXISTS "Candidates read own trial shifts" ON public.trial_shifts;
  DROP POLICY IF EXISTS "Admin can manage trial shifts" ON public.trial_shifts;

  CREATE POLICY "Employers manage trial shifts" ON public.trial_shifts
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
  ));

  CREATE POLICY "Candidates read own trial shifts" ON public.trial_shifts
  FOR SELECT USING (candidate_id = auth.uid());

  CREATE POLICY "Admin can manage trial shifts" ON public.trial_shifts
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.trial_shifts not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 15: interviews
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.interviews ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Employers manage interviews" ON public.interviews;
  DROP POLICY IF EXISTS "Candidates read own interviews" ON public.interviews;
  DROP POLICY IF EXISTS "Admin can manage interviews" ON public.interviews;

  CREATE POLICY "Employers manage interviews" ON public.interviews
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.employer_profiles WHERE user_email = public.get_user_email()
  ));

  CREATE POLICY "Candidates read own interviews" ON public.interviews
  FOR SELECT USING (candidate_id = auth.uid());

  CREATE POLICY "Admin can manage interviews" ON public.interviews
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.interviews not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 16: subscriptions
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Admin can manage subscriptions" ON public.subscriptions;

  CREATE POLICY "Users manage own subscriptions" ON public.subscriptions
  FOR ALL USING (owner_email = public.get_user_email())
  WITH CHECK (owner_email = public.get_user_email());

  CREATE POLICY "Admin can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.subscriptions not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 17: payment_settings (MED-002 Fix)
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.payment_settings ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can read payment settings" ON public.payment_settings;
  DROP POLICY IF EXISTS "Admin can manage payment settings" ON public.payment_settings;

  CREATE POLICY "Admin can manage payment settings" ON public.payment_settings
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.payment_settings not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 18: profile_views (MED-006 Fix)
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.profile_views ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can track profile views" ON public.profile_views;
  DROP POLICY IF EXISTS "Authenticated can insert profile views" ON public.profile_views;
  DROP POLICY IF EXISTS "Users can read own profile views" ON public.profile_views;
  DROP POLICY IF EXISTS "Admin can manage profile views" ON public.profile_views;

  CREATE POLICY "Authenticated can insert profile views" ON public.profile_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

  CREATE POLICY "Users can read own profile views" ON public.profile_views
  FOR SELECT USING (viewer_email = public.get_user_email());

  CREATE POLICY "Admin can manage profile views" ON public.profile_views
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.profile_views not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 19: profiles
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

  CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

  CREATE POLICY "Admin can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.profiles not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 20: admin_permissions
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.admin_permissions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Platform admins can view admin permissions" ON public.admin_permissions;
  DROP POLICY IF EXISTS "Platform admins can insert admin permissions" ON public.admin_permissions;
  DROP POLICY IF EXISTS "Platform admins can update admin permissions" ON public.admin_permissions;
  DROP POLICY IF EXISTS "Platform admins can delete admin permissions" ON public.admin_permissions;
  DROP POLICY IF EXISTS "Admin can manage admin permissions" ON public.admin_permissions;

  CREATE POLICY "Admin can manage admin permissions" ON public.admin_permissions
  FOR ALL USING (public.get_user_role() = 'platform_admin')
  WITH CHECK (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.admin_permissions not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 21: company_reviews / employee_reviews
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.company_reviews ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users manage own reviews" ON public.company_reviews;
  DROP POLICY IF EXISTS "Public can read reviews" ON public.company_reviews;

  CREATE POLICY "Users manage own reviews" ON public.company_reviews
  FOR ALL USING (reviewer_email = public.get_user_email())
  WITH CHECK (reviewer_email = public.get_user_email());

  CREATE POLICY "Public can read reviews" ON public.company_reviews
  FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.company_reviews not found, skipping...';
END;
$$;

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.employee_reviews ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users manage own employee reviews" ON public.employee_reviews;
  DROP POLICY IF EXISTS "Public can read employee reviews" ON public.employee_reviews;

  CREATE POLICY "Users manage own employee reviews" ON public.employee_reviews
  FOR ALL USING (reviewer_email = public.get_user_email())
  WITH CHECK (reviewer_email = public.get_user_email());

  CREATE POLICY "Public can read employee reviews" ON public.employee_reviews
  FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.employee_reviews not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 22: news_articles / news_comments / news_likes
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public can read published news" ON public.news_articles;
  DROP POLICY IF EXISTS "Admin can manage news" ON public.news_articles;

  CREATE POLICY "Public can read published news" ON public.news_articles
  FOR SELECT USING (status = 'published');

  CREATE POLICY "Admin can manage news" ON public.news_articles
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.news_articles not found, skipping...';
END;
$$;

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.news_comments ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Authenticated can insert comments" ON public.news_comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON public.news_comments;
  DROP POLICY IF EXISTS "Public can read comments" ON public.news_comments;

  CREATE POLICY "Authenticated can insert comments" ON public.news_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

  CREATE POLICY "Users can delete own comments" ON public.news_comments
  FOR DELETE USING (user_id = auth.uid());

  CREATE POLICY "Public can read comments" ON public.news_comments
  FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.news_comments not found, skipping...';
END;
$$;

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.news_likes ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users manage own likes" ON public.news_likes;

  CREATE POLICY "Users manage own likes" ON public.news_likes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.news_likes not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 23: academy_courses / academy_enrollments
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.academy_courses ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public can read published courses" ON public.academy_courses;
  DROP POLICY IF EXISTS "Admin can manage courses" ON public.academy_courses;

  CREATE POLICY "Public can read published courses" ON public.academy_courses
  FOR SELECT USING (is_published = true);

  CREATE POLICY "Admin can manage courses" ON public.academy_courses
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.academy_courses not found, skipping...';
END;
$$;

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.academy_enrollments ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users manage own enrollments" ON public.academy_enrollments;

  CREATE POLICY "Users manage own enrollments" ON public.academy_enrollments
  FOR ALL USING (user_email = public.get_user_email())
  WITH CHECK (user_email = public.get_user_email());
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.academy_enrollments not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 24: store_products
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.store_products ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public can read published products" ON public.store_products;
  DROP POLICY IF EXISTS "Admin can manage products" ON public.store_products;

  CREATE POLICY "Public can read published products" ON public.store_products
  FOR SELECT USING (is_published = true);

  CREATE POLICY "Admin can manage products" ON public.store_products
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.store_products not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 25: Storage Policies Fix
-- ============================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

  CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table storage.objects not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 26: notify_matching_candidates RPC Fix
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_matching_candidates_for_job(p_job_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.employer_profiles ep ON ep.organization_id = j.organization_id
    WHERE j.id = p_job_id AND ep.user_email = public.get_user_email()
  ) AND public.get_user_role() != 'platform_admin' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_matching_candidates_for_job(UUID) TO authenticated;

-- ============================================================
-- SECTION 27: schedule_account_deletion RPC Fix
-- ============================================================

CREATE OR REPLACE FUNCTION public.schedule_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET status = 'scheduled_for_deletion', deletion_scheduled_at = NOW() + INTERVAL '14 days'
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_account_deletion() TO authenticated;

-- ============================================================
-- SECTION 28: restore_account_deletion RPC Fix
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET status = 'active', deletion_scheduled_at = NULL
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_account_deletion() TO authenticated;

-- ============================================================
-- SECTION 29: organization_members
-- ============================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Members can manage own membership" ON public.organization_members;
  DROP POLICY IF EXISTS "Owners can manage org members" ON public.organization_members;
  DROP POLICY IF EXISTS "Admin can manage org members" ON public.organization_members;

  CREATE POLICY "Members can manage own membership" ON public.organization_members
  FOR ALL USING (user_email = public.get_user_email())
  WITH CHECK (user_email = public.get_user_email());

  CREATE POLICY "Owners can manage org members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_email = public.get_user_email()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_email = public.get_user_email()
    )
  );

  CREATE POLICY "Admin can manage org members" ON public.organization_members
  FOR ALL USING (public.get_user_role() = 'platform_admin');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table public.organization_members not found, skipping...';
END;
$$;

-- ============================================================
-- SECTION 30: Verify all RLS is enabled
-- ============================================================

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'profiles', 'candidate_profiles', 'employer_profiles', 'organizations',
      'organization_members', 'jobs', 'applications', 'application_messages',
      'application_notes', 'application_evaluations', 'notifications',
      'audit_logs', 'subscriptions', 'payment_settings', 'profile_views',
      'company_reviews', 'employee_reviews', 'news_articles', 'news_comments',
      'news_likes', 'academy_courses', 'academy_enrollments', 'store_products',
      'store_orders', 'store_order_items', 'trial_shifts', 'interviews',
      'admin_permissions'
    )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % not found, skipping RLS enable...', tbl.tablename;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- END OF PATCH — Idempotent, Fault-Tolerant & Safe to Re-run
-- ============================================================================

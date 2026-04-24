-- دالة ذكية لإرسال إشعارات للمرشحين المطابقين للوظيفة الجديدة
-- تحسن الأداء عبر المعالجة داخل قاعدة البيانات (Set-based operations)
CREATE OR REPLACE FUNCTION notify_matching_candidates_for_job(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- لتجاوز قيود RLS عند إرسال الإشعارات
AS $$
DECLARE
    v_job_type TEXT;
    v_job_title TEXT;
    v_org_name TEXT;
    v_matching_types TEXT[];
BEGIN
    -- 1. جلب تفاصيل الوظيفة
    SELECT job_type, title, organization_name 
    INTO v_job_type, v_job_title, v_org_name
    FROM jobs 
    WHERE id = p_job_id;

    -- إذا لم توجد الوظيفة، اخرج
    IF NOT FOUND THEN RETURN; END IF;

    -- 2. تحديد الأنواع المطابقة (Logic مماثل لما كان في الـ JS)
    CASE v_job_type
        WHEN 'barista' THEN v_matching_types := ARRAY['barista', 'waiter', 'cashier'];
        WHEN 'chef' THEN v_matching_types := ARRAY['chef', 'kitchen_helper', 'pastry_chef', 'bakery'];
        WHEN 'cashier' THEN v_matching_types := ARRAY['cashier', 'barista', 'waiter'];
        WHEN 'waiter' THEN v_matching_types := ARRAY['waiter', 'host', 'barista', 'cashier'];
        WHEN 'host' THEN v_matching_types := ARRAY['host', 'waiter', 'cashier'];
        WHEN 'kitchen_helper' THEN v_matching_types := ARRAY['kitchen_helper', 'chef', 'cleaner'];
        WHEN 'restaurant_manager' THEN v_matching_types := ARRAY['restaurant_manager'];
        ELSE v_matching_types := ARRAY[v_job_type];
    END CASE;

    -- 3. إرسال الإشعارات دفعة واحدة للمرشحين المطابقين
    -- نستخدم INSERT INTO ... SELECT لتحقيق أقصى سرعة
    INSERT INTO notifications (user_email, title, message, type, link, read)
    SELECT 
        cp.user_email,
        'تم نشر وظيفة جديدة من قبل ' || COALESCE(v_org_name, 'شركة'),
        'وظيفة جديدة تناسبك: ' || v_job_title,
        'job',
        '/jobs/' || p_job_id,
        false
    FROM candidate_profiles cp
    WHERE cp.job_types && v_matching_types -- عامل && للتحقق من التداخل بين المصفوفات
    AND cp.user_email IS NOT NULL;

END;
$$;

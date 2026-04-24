-- ====================================================================
-- PHASE 6: Employer Branding, Interview Scheduling & Reminders system
-- ====================================================================

-- 1. Updates to Organizations (Employer Branding)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS map_url TEXT;


-- 2. Updates to Interview Slots table (Tracking Reminders)
ALTER TABLE public.interview_slots
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;


-- 3. The 2-Hour Reminder Function targeting interview_slots
CREATE OR REPLACE FUNCTION public.cron_send_interview_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slot_record record;
  interview_time TEXT;
BEGIN
  -- Loop through confirmed interview_slots that are exactly entering the 2-hour window 
  -- (e.g., between now and exactly 2 hours 15 minutes from now)
  -- that haven't been reminded yet.
  FOR slot_record IN
    SELECT i.id, i.selected_slot, i.candidate_email, i.application_id, i.employer_email, i.organization_name
    FROM public.interview_slots i
    WHERE i.status = 'confirmed'
      AND i.reminder_sent = false
      AND i.selected_slot > NOW() 
      AND i.selected_slot <= (NOW() + interval '2 hours' + interval '15 minutes')
  LOOP
    
    interview_time := to_char(slot_record.selected_slot AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI');

    -- Insert in-app notification for candidate
    INSERT INTO public.notifications (user_email, title, message, type, metadata)
    VALUES (
      slot_record.candidate_email,
      'تذكير بموعد المقابلة ⏰',
      'لديك مقابلة مجدولة مع ' || slot_record.organization_name || ' تبدأ خلال أقل من ساعتين (' || interview_time || ' UTC).',
      'interview',
      jsonb_build_object('interview_id', slot_record.id, 'application_id', slot_record.application_id)
    );

    -- Insert in-app notification for employer
    INSERT INTO public.notifications (user_email, title, message, type, metadata)
    VALUES (
      slot_record.employer_email,
      'تذكير بموعد المقابلة ⏰',
      'لديك مقابلة مجدولة تبدأ خلال أقل من ساعتين مع أحد المرشحين (' || interview_time || ' UTC).',
      'interview',
      jsonb_build_object('interview_id', slot_record.id, 'application_id', slot_record.application_id)
    );

    -- Update reminder_sent to true
    UPDATE public.interview_slots SET reminder_sent = true WHERE id = slot_record.id;

  END LOOP;
END;
$$;

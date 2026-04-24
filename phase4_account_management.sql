-- ============================================================
-- Hello Staff Pro — Phase 4 Account Management
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Extend profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'scheduled_for_deletion', 'deleted')),
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- 2. Create deleted accounts history for tracking
CREATE TABLE IF NOT EXISTS public.deleted_accounts_history (
  email TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  original_id UUID
);

-- Enable RLS for history
ALTER TABLE public.deleted_accounts_history ENABLE ROW LEVEL SECURITY;
-- Internal table, no public access policies needed usually, but admin can view
CREATE POLICY "Admins can view deleted history" ON public.deleted_accounts_history 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

-- 3. Update the handle_new_user trigger to handle re-registration 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT := 'active';
  is_previously_deleted BOOLEAN;
BEGIN
  -- Check if user exists in deleted history
  SELECT EXISTS(SELECT 1 FROM public.deleted_accounts_history WHERE email = NEW.email) INTO is_previously_deleted;
  
  -- If previously deleted, mark as pending_approval instead of active
  IF is_previously_deleted THEN
    v_status := 'pending_approval';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, preferred_language, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', NULL),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar'),
    v_status
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provide a function for users to schedule deletion
CREATE OR REPLACE FUNCTION schedule_account_deletion()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    status = 'scheduled_for_deletion',
    deletion_scheduled_at = NOW() + INTERVAL '14 days'
  WHERE id = auth.uid();
  
  -- Record event in history (if they re-register immediately via another method, it's blocked/pending)
  -- Actually, let's insert into history NOW so they can't instantly bypass.
  -- Or just leave it to trigger when it officially deletes. Let's do it now.
  INSERT INTO public.deleted_accounts_history (email, original_id)
  SELECT email, id FROM public.profiles WHERE id = auth.uid()
  ON CONFLICT (email) DO UPDATE SET deleted_at = NOW(), original_id = EXCLUDED.original_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore account
CREATE OR REPLACE FUNCTION restore_account_deletion()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    status = 'active',
    deletion_scheduled_at = NULL
  WHERE id = auth.uid();
  
  -- Remove from history to allow clean slate
  DELETE FROM public.deleted_accounts_history 
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

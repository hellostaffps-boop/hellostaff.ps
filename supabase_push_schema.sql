-- Run this in your Supabase SQL Editor to add push subscription support

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_subscription jsonb DEFAULT NULL;

-- Keep it secure
COMMENT ON COLUMN public.profiles.push_subscription IS 'Stores Web Push subscription credentials for sending notifications directly to VAPID';

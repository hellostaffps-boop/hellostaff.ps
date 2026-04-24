-- =======================================================
-- Admin Broadcast RPC Function (SECURITY DEFINER) - v2
-- Corrected to match notifications table constraints and required columns.
-- =======================================================

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
    -- 1. Insert notifications based on target role
    -- Using type 'system' to satisfy the CHECK constraint in the notifications table.
    -- Joining with profiles to get the user_id (UUID) which is required by the table.
    
    IF p_target_role = 'all' THEN
        INSERT INTO public.notifications (user_id, user_email, title, message, type, read, link)
        SELECT id, email, p_title, p_message, 'system', false, ''
        FROM public.profiles;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    ELSIF p_target_role = 'candidate' THEN
        INSERT INTO public.notifications (user_id, user_email, title, message, type, read, link)
        SELECT id, email, p_title, p_message, 'system', false, ''
        FROM public.profiles
        WHERE role = 'candidate';
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    ELSIF p_target_role = 'employer' THEN
        INSERT INTO public.notifications (user_id, user_email, title, message, type, read, link)
        SELECT id, email, p_title, p_message, 'system', false, ''
        FROM public.profiles
        WHERE role IN ('employer_owner', 'employer_manager');
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_count
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.broadcast_notification_secure(TEXT, TEXT, TEXT) TO authenticated;

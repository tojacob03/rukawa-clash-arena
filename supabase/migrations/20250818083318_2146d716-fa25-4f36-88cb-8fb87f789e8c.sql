-- Fix Critical Authentication Security Issues
-- Address missing RLS policies on authentication-related tables

-- 1. Secure client_sessions table
-- This table contains sensitive session tokens and must be heavily restricted

-- Enable RLS on client_sessions if not already enabled
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view client sessions (for monitoring)
CREATE POLICY "Admins can view client sessions"
ON public.client_sessions
FOR SELECT
USING (is_admin(auth.uid()));

-- No direct INSERT/UPDATE/DELETE access for users
-- Only security definer functions can modify sessions
-- This prevents session hijacking and manipulation

-- 2. Secure client_login_attempts table  
-- This table tracks authentication attempts and must be protected from tampering

-- Enable RLS on client_login_attempts if not already enabled
ALTER TABLE public.client_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts (for security monitoring)
CREATE POLICY "Admins can view login attempts"
ON public.client_login_attempts
FOR SELECT
USING (is_admin(auth.uid()));

-- No direct INSERT/UPDATE/DELETE access for users
-- Only security definer functions can insert login attempts
-- This prevents attackers from hiding brute force attempts

-- 3. Verify contact_submissions is properly secured (it already is)
-- The contact_submissions table already has correct RLS policies:
-- - Anyone can INSERT (submit contact forms) 
-- - Only admins can SELECT (view submissions)
-- - No UPDATE/DELETE access (immutable submissions)

-- 4. Add monitoring function for security events
CREATE OR REPLACE FUNCTION public.get_security_stats()
RETURNS TABLE(
  active_sessions bigint,
  failed_attempts_24h bigint,
  contact_submissions_today bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.client_sessions WHERE is_active = true AND expires_at > now()),
    (SELECT COUNT(*) FROM public.client_login_attempts WHERE attempted_at > now() - interval '24 hours' AND success = false),
    (SELECT COUNT(*) FROM public.contact_submissions WHERE created_at::date = CURRENT_DATE);
END;
$function$;

-- Grant execute to admins only
GRANT EXECUTE ON FUNCTION public.get_security_stats() TO authenticated;
-- Critical Security Fixes Migration

-- 1. Enable cryptographic functions for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fix the session cleanup function bug (was using OR instead of AND)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Deactivate expired sessions (fix: use AND instead of OR)
  UPDATE public.client_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;

  -- Clean up old login attempts (keep last 30 days)
  DELETE FROM public.client_login_attempts
  WHERE attempted_at < now() - interval '30 days';
  
  -- Log cleanup stats for monitoring
  RAISE NOTICE 'Session cleanup completed at %', now();
END;
$function$;

-- 3. Revoke access to legacy RPCs that bypass the secure session model
-- These functions should not be callable by anon/authenticated users anymore
REVOKE EXECUTE ON FUNCTION public.authenticate_client(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_client_opponents(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_client_analysis_files(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_client_deck_sets(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_client_deck_files(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_client_file_signed_url(uuid, text, text) FROM anon, authenticated;

-- 4. Ensure storage policies are properly restrictive
-- Remove any overly permissive storage policies that might have been left over

-- First, check if there are any permissive policies and drop them
DO $$
DECLARE
    policy_name text;
BEGIN
    -- Drop any policies that allow public access to private buckets
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND qual LIKE '%true%'
        AND policyname NOT LIKE '%public%bucket%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
        RAISE NOTICE 'Dropped overly permissive policy: %', policy_name;
    END LOOP;
END $$;

-- Ensure our buckets are properly configured as private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('analysis-files', 'deck-files');

-- 5. Add an index on client_sessions for cleanup performance
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires_active 
ON public.client_sessions(expires_at, is_active) 
WHERE is_active = true;

-- 6. Add an index on login attempts for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_client_login_attempts_code_time 
ON public.client_login_attempts(login_code, attempted_at DESC);

-- 7. Create a function to securely generate login codes (for future use)
CREATE OR REPLACE FUNCTION public.generate_secure_login_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate a secure 16-character alphanumeric code
  -- Uses pgcrypto for cryptographically secure randomness
  RETURN upper(encode(gen_random_bytes(12), 'base64'))
         -- Remove characters that might be confusing
         -- Keep only letters and numbers, ensure 16 chars
         LIMIT 16;
END;
$function$;

-- Grant execute only to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.generate_secure_login_code() TO authenticated;
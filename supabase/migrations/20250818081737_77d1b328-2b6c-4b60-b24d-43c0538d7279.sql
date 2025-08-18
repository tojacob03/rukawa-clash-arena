-- Security Fixes Migration
-- This migration addresses critical security vulnerabilities

-- 1. Fix Storage Policies - Secure file access
-- Drop existing permissive policies and create secure ones

-- Remove any existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Files are publicly accessible" ON storage.objects;

-- Create secure storage policies for analysis-files bucket
CREATE POLICY "Admins can view analysis files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'analysis-files' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can upload analysis files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'analysis-files' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can update analysis files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'analysis-files' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can delete analysis files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'analysis-files' 
  AND is_admin(auth.uid())
);

-- Create secure storage policies for deck-files bucket
CREATE POLICY "Admins can view deck files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'deck-files' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can upload deck files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'deck-files' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can update deck files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'deck-files' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can delete deck files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'deck-files' 
  AND is_admin(auth.uid())
);

-- 2. Enhance client security
-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.client_login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  login_code text NOT NULL,
  ip_address inet,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Enable RLS on login attempts
ALTER TABLE public.client_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts" 
ON public.client_login_attempts 
FOR SELECT 
USING (is_admin(auth.uid()));

-- 3. Secure client session management
-- Add proper session tracking with security features
ALTER TABLE public.client_sessions 
ADD COLUMN IF NOT EXISTS session_token text UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON public.client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires ON public.client_sessions(expires_at);

-- 4. Create secure file access function for clients
-- This allows authenticated clients to access their files via signed URLs
CREATE OR REPLACE FUNCTION public.get_client_file_signed_url(
  client_id_param uuid,
  file_path_param text,
  bucket_name text DEFAULT 'analysis-files'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_active boolean;
  file_exists boolean;
BEGIN
  -- Verify client exists and is active
  SELECT is_active INTO client_active
  FROM public.clients 
  WHERE id = client_id_param;
  
  IF client_active IS NULL OR client_active = false THEN
    RAISE EXCEPTION 'Invalid or inactive client';
  END IF;

  -- For analysis files, verify the file belongs to this client
  IF bucket_name = 'analysis-files' THEN
    SELECT EXISTS(
      SELECT 1 
      FROM public.analysis_files af
      JOIN public.opponents o ON af.opponent_id = o.id
      WHERE o.client_id = client_id_param 
      AND af.file_path = file_path_param
    ) INTO file_exists;
  ELSE
    -- For deck files, verify through deck_sets
    SELECT EXISTS(
      SELECT 1 
      FROM public.deck_files df
      JOIN public.deck_sets ds ON df.deck_set_id = ds.id
      WHERE ds.client_id = client_id_param 
      AND df.deck_link = file_path_param
    ) INTO file_exists;
  END IF;

  IF NOT file_exists THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;

  -- Return a placeholder for signed URL (actual signing will be done in the application)
  RETURN file_path_param;
END;
$$;

-- 5. Update RPC functions to require authentication
-- Replace the existing authenticate_client function with a secure version
CREATE OR REPLACE FUNCTION public.authenticate_client_secure(
  login_code_param text,
  ip_address_param inet DEFAULT NULL,
  user_agent_param text DEFAULT NULL
)
RETURNS TABLE(
  client_id uuid, 
  client_name text, 
  client_type client_type, 
  is_active boolean,
  session_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_record record;
  new_session_token text;
  recent_attempts integer;
BEGIN
  -- Rate limiting: Check for too many recent failed attempts
  SELECT COUNT(*) INTO recent_attempts
  FROM public.client_login_attempts
  WHERE login_code = login_code_param
    AND attempted_at > now() - interval '1 hour'
    AND success = false;

  IF recent_attempts >= 5 THEN
    -- Log the blocked attempt
    INSERT INTO public.client_login_attempts (login_code, ip_address, attempted_at, success)
    VALUES (login_code_param, ip_address_param, now(), false);
    
    RAISE EXCEPTION 'Too many failed login attempts. Please try again later.';
  END IF;

  -- Find the client
  SELECT c.id, c.name, c.type, c.is_active
  INTO client_record
  FROM public.clients c
  WHERE c.login_code = login_code_param;

  -- Log the attempt
  INSERT INTO public.client_login_attempts (login_code, ip_address, attempted_at, success)
  VALUES (login_code_param, ip_address_param, now(), client_record.id IS NOT NULL AND client_record.is_active);

  -- Check if client exists and is active
  IF client_record.id IS NULL OR client_record.is_active = false THEN
    RAISE EXCEPTION 'Invalid login code or inactive client';
  END IF;

  -- Generate secure session token
  new_session_token := encode(gen_random_bytes(32), 'base64');

  -- Create or update session
  INSERT INTO public.client_sessions (
    client_id, 
    session_token, 
    ip_address, 
    user_agent, 
    login_code,
    expires_at,
    is_active
  ) VALUES (
    client_record.id, 
    new_session_token, 
    ip_address_param, 
    user_agent_param, 
    login_code_param,
    now() + interval '24 hours',
    true
  )
  ON CONFLICT (session_token) DO UPDATE SET
    last_active = now(),
    expires_at = now() + interval '24 hours',
    is_active = true;

  -- Return client info with session token
  RETURN QUERY
  SELECT 
    client_record.id,
    client_record.name,
    client_record.type,
    client_record.is_active,
    new_session_token;
END;
$$;

-- 6. Create function to validate session tokens
CREATE OR REPLACE FUNCTION public.validate_client_session(session_token_param text)
RETURNS TABLE(client_id uuid, client_name text, client_type client_type)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record record;
BEGIN
  -- Find and validate session
  SELECT cs.client_id, c.name, c.type, cs.expires_at, cs.is_active
  INTO session_record
  FROM public.client_sessions cs
  JOIN public.clients c ON cs.client_id = c.id
  WHERE cs.session_token = session_token_param
    AND cs.is_active = true
    AND cs.expires_at > now()
    AND c.is_active = true;

  IF session_record.client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  -- Update last active time
  UPDATE public.client_sessions
  SET last_active = now()
  WHERE session_token = session_token_param;

  -- Return client info
  RETURN QUERY
  SELECT 
    session_record.client_id,
    session_record.name,
    session_record.client_type;
END;
$$;

-- 7. Update existing RPC functions to use session validation
-- Replace get_client_opponents to require valid session
CREATE OR REPLACE FUNCTION public.get_client_opponents_secure(session_token_param text)
RETURNS TABLE(id uuid, name text, description text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_client_id uuid;
BEGIN
  -- Validate session and get client_id
  SELECT client_id INTO validated_client_id
  FROM public.validate_client_session(session_token_param);

  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.description,
    o.created_at,
    o.updated_at
  FROM public.opponents o
  WHERE o.client_id = validated_client_id;
END;
$$;

-- Replace get_client_analysis_files to require valid session  
CREATE OR REPLACE FUNCTION public.get_client_analysis_files_secure(session_token_param text)
RETURNS TABLE(id uuid, file_name text, file_path text, file_type text, file_size bigint, opponent_id uuid, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_client_id uuid;
BEGIN
  -- Validate session and get client_id
  SELECT client_id INTO validated_client_id
  FROM public.validate_client_session(session_token_param);

  RETURN QUERY
  SELECT 
    af.id,
    af.file_name,
    af.file_path,
    af.file_type,
    af.file_size,
    af.opponent_id,
    af.created_at
  FROM public.analysis_files af
  JOIN public.opponents o ON af.opponent_id = o.id
  WHERE o.client_id = validated_client_id;
END;
$$;

-- Replace get_client_deck_sets to require valid session
CREATE OR REPLACE FUNCTION public.get_client_deck_sets_secure(session_token_param text)
RETURNS TABLE(id uuid, name text, description text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_client_id uuid;
BEGIN
  -- Validate session and get client_id
  SELECT client_id INTO validated_client_id
  FROM public.validate_client_session(session_token_param);

  RETURN QUERY
  SELECT 
    ds.id,
    ds.name,
    ds.description,
    ds.created_at,
    ds.updated_at
  FROM public.deck_sets ds
  WHERE ds.client_id = validated_client_id;
END;
$$;

-- Replace get_client_deck_files to require valid session
CREATE OR REPLACE FUNCTION public.get_client_deck_files_secure(session_token_param text)
RETURNS TABLE(id uuid, deck_name text, deck_link text, deck_number integer, card_ids integer[], deck_set_id uuid, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_client_id uuid;
BEGIN
  -- Validate session and get client_id
  SELECT client_id INTO validated_client_id
  FROM public.validate_client_session(session_token_param);

  RETURN QUERY
  SELECT 
    df.id,
    df.deck_name,
    df.deck_link,
    df.deck_number,
    df.card_ids,
    df.deck_set_id,
    df.created_at
  FROM public.deck_files df
  JOIN public.deck_sets ds ON df.deck_set_id = ds.id
  WHERE ds.client_id = validated_client_id;
END;
$$;

-- 8. Create session cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate expired sessions
  UPDATE public.client_sessions
  SET is_active = false
  WHERE expires_at < now() OR is_active = true;

  -- Clean up old login attempts (keep last 30 days)
  DELETE FROM public.client_login_attempts
  WHERE attempted_at < now() - interval '30 days';
END;
$$;
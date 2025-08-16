-- Remove dangerous anonymous SELECT policy from clients table
DROP POLICY IF EXISTS "Allow client login code verification" ON public.clients;

-- Remove anonymous SELECT policies from portal data tables
DROP POLICY IF EXISTS "Allow anonymous access to deck sets" ON public.deck_sets;
DROP POLICY IF EXISTS "Allow anonymous access to deck files" ON public.deck_files;
DROP POLICY IF EXISTS "Allow anonymous access to opponents" ON public.opponents;
DROP POLICY IF EXISTS "Allow anonymous access to analysis files" ON public.analysis_files;

-- Fix client_sessions visibility - only allow admins to view sessions
DROP POLICY IF EXISTS "Admin can view all sessions" ON public.client_sessions;
CREATE POLICY "Only admins can view client sessions" ON public.client_sessions
FOR SELECT USING (is_admin(auth.uid()));

-- Update contact_submissions to only allow admins to view
DROP POLICY IF EXISTS "Only authenticated users can view submissions" ON public.contact_submissions;
CREATE POLICY "Only admins can view contact submissions" ON public.contact_submissions
FOR SELECT USING (is_admin(auth.uid()));

-- Create secure RPC for client login that only returns necessary data
CREATE OR REPLACE FUNCTION public.authenticate_client(login_code_param text)
RETURNS TABLE(
  client_id uuid,
  client_name text,
  client_type client_type,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.type,
    c.is_active
  FROM public.clients c
  WHERE c.login_code = login_code_param
    AND c.is_active = true;
END;
$$;

-- Create secure RPC for fetching client deck sets
CREATE OR REPLACE FUNCTION public.get_client_deck_sets(client_id_param uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify client exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id_param AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive client';
  END IF;

  RETURN QUERY
  SELECT 
    ds.id,
    ds.name,
    ds.description,
    ds.created_at,
    ds.updated_at
  FROM public.deck_sets ds
  WHERE ds.client_id = client_id_param;
END;
$$;

-- Create secure RPC for fetching deck files for a client
CREATE OR REPLACE FUNCTION public.get_client_deck_files(client_id_param uuid)
RETURNS TABLE(
  id uuid,
  deck_name text,
  deck_link text,
  deck_number integer,
  card_ids integer[],
  deck_set_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify client exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id_param AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive client';
  END IF;

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
  WHERE ds.client_id = client_id_param;
END;
$$;

-- Create secure RPC for fetching client opponents
CREATE OR REPLACE FUNCTION public.get_client_opponents(client_id_param uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify client exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id_param AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive client';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.description,
    o.created_at,
    o.updated_at
  FROM public.opponents o
  WHERE o.client_id = client_id_param;
END;
$$;

-- Create secure RPC for fetching analysis files for a client
CREATE OR REPLACE FUNCTION public.get_client_analysis_files(client_id_param uuid)
RETURNS TABLE(
  id uuid,
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  opponent_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify client exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_id_param AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive client';
  END IF;

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
  WHERE o.client_id = client_id_param;
END;
$$;
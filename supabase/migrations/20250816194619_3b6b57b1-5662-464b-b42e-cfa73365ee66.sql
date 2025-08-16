-- Fix the ambiguous column reference in get_client_opponents RPC
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
    WHERE clients.id = client_id_param AND clients.is_active = true
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

-- Fix the ambiguous column reference in get_client_analysis_files RPC
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
    WHERE clients.id = client_id_param AND clients.is_active = true
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

-- Fix the ambiguous column reference in get_client_deck_sets RPC
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
    WHERE clients.id = client_id_param AND clients.is_active = true
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

-- Fix the ambiguous column reference in get_client_deck_files RPC
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
    WHERE clients.id = client_id_param AND clients.is_active = true
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
-- Fix validate_client_session and related functions
DROP FUNCTION IF EXISTS public.validate_client_session(text);

CREATE OR REPLACE FUNCTION public.validate_client_session(session_token_param text)
 RETURNS TABLE(client_id uuid, client_name text, client_type client_type)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  found_session record;
BEGIN
  -- Find and validate session
  SELECT cs.client_id, c.name, c.type, cs.expires_at, cs.is_active
  INTO found_session
  FROM public.client_sessions cs
  JOIN public.clients c ON cs.client_id = c.id
  WHERE cs.session_token = session_token_param
    AND cs.is_active = true
    AND cs.expires_at > now()
    AND c.is_active = true;

  IF found_session.client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  -- Update last active time
  UPDATE public.client_sessions
  SET last_active = now()
  WHERE session_token = session_token_param;

  -- Return client info
  RETURN QUERY
  SELECT 
    found_session.client_id,
    found_session.name,
    found_session.type;
END;
$function$;

-- Fix get_client_opponents_secure function
CREATE OR REPLACE FUNCTION public.get_client_opponents_secure(session_token_param text)
 RETURNS TABLE(id uuid, name text, description text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix get_client_deck_sets_secure function
CREATE OR REPLACE FUNCTION public.get_client_deck_sets_secure(session_token_param text)
 RETURNS TABLE(id uuid, name text, description text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
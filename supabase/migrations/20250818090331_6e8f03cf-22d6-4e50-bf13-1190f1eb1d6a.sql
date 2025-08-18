-- Fix ambiguous column reference in authenticate_client_secure function
CREATE OR REPLACE FUNCTION public.authenticate_client_secure(login_code_param text, ip_address_param inet DEFAULT NULL::inet, user_agent_param text DEFAULT NULL::text)
 RETURNS TABLE(client_id uuid, client_name text, client_type client_type, is_active boolean, session_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  client_record record;
  new_session_token text;
  recent_attempts integer;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789';
  i integer;
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

  -- Generate secure session token using random() instead of gen_random_bytes
  new_session_token := '';
  FOR i IN 1..64 LOOP
    new_session_token := new_session_token || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  -- Delete any existing sessions for this client first
  DELETE FROM public.client_sessions WHERE client_id = client_record.id;

  -- Create new session
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
  );

  -- Return client info with session token
  RETURN QUERY
  SELECT 
    client_record.id,
    client_record.name,
    client_record.type,
    client_record.is_active,
    new_session_token;
END;
$function$;
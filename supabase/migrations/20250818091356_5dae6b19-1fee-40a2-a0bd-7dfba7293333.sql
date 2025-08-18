-- Fix remaining client functions
CREATE OR REPLACE FUNCTION public.get_client_analysis_files_secure(session_token_param text)
 RETURNS TABLE(id uuid, file_name text, file_path text, file_type text, file_size bigint, opponent_id uuid, created_at timestamp with time zone)
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
$function$;

CREATE OR REPLACE FUNCTION public.get_client_deck_files_secure(session_token_param text)
 RETURNS TABLE(id uuid, deck_name text, deck_link text, deck_number integer, card_ids integer[], deck_set_id uuid, created_at timestamp with time zone)
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
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_client_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_opponents_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_analysis_files_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_deck_sets_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_deck_files_secure(text) TO authenticated;
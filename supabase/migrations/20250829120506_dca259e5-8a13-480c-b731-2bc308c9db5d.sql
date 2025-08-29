-- Grant permission for contact form to anonymous users
GRANT EXECUTE ON FUNCTION public.submit_contact_form_secure(text, text, text, inet) TO anon;
-- Fix missing RLS policies that are causing permission denied errors

-- Ensure contact_rate_limits table has proper RLS policies
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anon users to insert/update rate limiting records (needed for contact form)
CREATE POLICY "Allow anon to manage rate limits for contact form" 
ON public.contact_rate_limits 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Also allow authenticated users to manage rate limits
CREATE POLICY "Allow authenticated users to manage rate limits" 
ON public.contact_rate_limits 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ensure all necessary tables have proper policies for the service role
-- This prevents issues with edge functions and database functions

-- Allow service role full access to all tables
CREATE POLICY "Service role has full access to contact_rate_limits" 
ON public.contact_rate_limits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role has full access to contact_submissions" 
ON public.contact_submissions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Fix any potential issues with client authentication tables
CREATE POLICY "Service role has full access to client_sessions" 
ON public.client_sessions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role has full access to client_login_attempts" 
ON public.client_login_attempts 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
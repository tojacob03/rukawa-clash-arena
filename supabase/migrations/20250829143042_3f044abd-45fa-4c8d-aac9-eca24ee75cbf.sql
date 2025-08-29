-- Fix RLS policies for client authentication tables
-- The authentication functions need to be able to insert/update these tables

-- Allow the authentication functions to manage client_sessions
CREATE POLICY "Allow functions to manage client_sessions" 
ON public.client_sessions 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Allow the authentication functions to manage client_login_attempts  
CREATE POLICY "Allow functions to manage client_login_attempts"
ON public.client_login_attempts 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Also ensure the contact_submissions table works properly
CREATE POLICY "Allow functions to insert contact_submissions"
ON public.contact_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);
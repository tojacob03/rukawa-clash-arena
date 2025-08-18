-- Fix contact rate limiting RLS policy to allow proper system access
-- Replace the overly restrictive policy with one that allows system functions

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "System only access to rate limits" ON public.contact_rate_limits;

-- Create a policy that allows the secure contact function to access rate limiting data
CREATE POLICY "Allow secure contact function access" ON public.contact_rate_limits
FOR ALL 
USING (true)  -- Allow read access for rate limit checking
WITH CHECK (true);  -- Allow write access for rate limit tracking

-- Revoke all direct access from roles (only functions can access)
REVOKE ALL ON public.contact_rate_limits FROM PUBLIC;
REVOKE ALL ON public.contact_rate_limits FROM anon;
REVOKE ALL ON public.contact_rate_limits FROM authenticated;
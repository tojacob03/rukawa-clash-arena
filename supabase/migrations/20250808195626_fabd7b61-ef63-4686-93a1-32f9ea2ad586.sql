-- Create a policy to allow anonymous users to read client data during login
CREATE POLICY "Allow client login code verification" 
ON public.clients 
FOR SELECT 
USING (true);
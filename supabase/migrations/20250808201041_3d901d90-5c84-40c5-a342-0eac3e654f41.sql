-- Allow anonymous users to read deck sets for client portal access
CREATE POLICY "Allow anonymous access to deck sets" 
ON public.deck_sets 
FOR SELECT 
USING (true);

-- Allow anonymous users to read deck files for client portal access  
CREATE POLICY "Allow anonymous access to deck files"
ON public.deck_files 
FOR SELECT 
USING (true);
-- Allow anonymous read access to opponents for the client portal
CREATE POLICY "Allow anonymous access to opponents"
ON public.opponents
FOR SELECT
USING (true);

-- Allow anonymous read access to analysis files metadata for the client portal
CREATE POLICY "Allow anonymous access to analysis files"
ON public.analysis_files
FOR SELECT
USING (true);

-- Storage policy: allow public read for analysis-files bucket so clients can download/view files
CREATE POLICY "Public read analysis files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'analysis-files');
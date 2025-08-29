-- Add unique constraint on ip_address for contact rate limiting
ALTER TABLE public.contact_rate_limits ADD CONSTRAINT unique_ip_address UNIQUE (ip_address);
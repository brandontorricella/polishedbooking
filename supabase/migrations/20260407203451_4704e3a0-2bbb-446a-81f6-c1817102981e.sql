
-- Add new fields to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS offers_appointments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS offers_classes boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offers_virtual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS default_virtual_link text,
ADD COLUMN IF NOT EXISTS credentials text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}'::text[];

-- Add new fields to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS is_virtual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS virtual_link text,
ADD COLUMN IF NOT EXISTS is_class boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS class_capacity integer DEFAULT 1;

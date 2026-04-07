
-- Add visibility tracking columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS is_publicly_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS unlisted_reason TEXT,
ADD COLUMN IF NOT EXISTS unlisted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS relisted_at TIMESTAMPTZ;

-- Index for fast filtering of public listings
CREATE INDEX IF NOT EXISTS idx_business_public_visible 
ON public.businesses(is_publicly_visible, subscription_status);

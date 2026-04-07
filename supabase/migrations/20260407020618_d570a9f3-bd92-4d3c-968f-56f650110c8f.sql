ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS is_hispanic_owned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_lgbtq_owned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_lgbtq_welcoming boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_businesses_hispanic_owned ON public.businesses(is_hispanic_owned) WHERE is_publicly_visible = true;
CREATE INDEX IF NOT EXISTS idx_businesses_lgbtq_owned ON public.businesses(is_lgbtq_owned) WHERE is_publicly_visible = true;
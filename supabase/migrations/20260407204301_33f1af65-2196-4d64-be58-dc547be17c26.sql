
-- Add tip and payment method tracking to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tip_collected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50);

-- Add tip settings to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS tips_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS tip_presets INTEGER[] DEFAULT ARRAY[15, 20, 25];

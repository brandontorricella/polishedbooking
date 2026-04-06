-- Add total_claimed and max_claims to promotions table
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS total_claimed integer DEFAULT 0;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS max_claims integer;

-- Create promotion_claims table
CREATE TABLE public.promotion_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'claimed',
  UNIQUE(promotion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promotion_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view their own claims"
ON public.promotion_claims FOR SELECT
USING (auth.uid() = user_id);

-- Users can create claims
CREATE POLICY "Users can create claims"
ON public.promotion_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Business owners can view claims for their promotions
CREATE POLICY "Business owners can view promotion claims"
ON public.promotion_claims FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = promotion_claims.business_id
  AND businesses.owner_id = auth.uid()
));

-- Admins can view all claims
CREATE POLICY "Admins can view all claims"
ON public.promotion_claims FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

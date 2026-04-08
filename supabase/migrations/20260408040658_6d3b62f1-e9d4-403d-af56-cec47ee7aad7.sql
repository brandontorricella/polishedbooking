-- Add commission fields to staff_members
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 0;

-- Commission log table
CREATE TABLE IF NOT EXISTS public.staff_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_price numeric(10,2) NOT NULL,
  tip_amount numeric(10,2) DEFAULT 0,
  commission_type text NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(10,2) NOT NULL,
  is_paid boolean DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_commissions ENABLE ROW LEVEL SECURITY;

-- Business owners can manage commissions
CREATE POLICY "Business owners can manage commissions"
ON public.staff_commissions
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = staff_commissions.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = staff_commissions.business_id
  AND businesses.owner_id = auth.uid()
));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commissions_staff ON public.staff_commissions(staff_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_commissions_business ON public.staff_commissions(business_id, created_at);
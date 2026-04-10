-- Track in-person payment records
CREATE TABLE IF NOT EXISTS public.inperson_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  payment_method_note TEXT,
  stripe_payment_intent_id VARCHAR(255),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_by UUID NOT NULL
);

ALTER TABLE public.inperson_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their in-person payments"
ON public.inperson_payments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = inperson_payments.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = inperson_payments.business_id
  AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage in-person payments"
ON public.inperson_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Track hardware readers registered by businesses
CREATE TABLE IF NOT EXISTS public.stripe_readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  stripe_reader_id VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  device_type VARCHAR(100),
  location_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_readers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their readers"
ON public.stripe_readers
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = stripe_readers.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = stripe_readers.business_id
  AND businesses.owner_id = auth.uid()
));

-- Add payment tracking columns to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_link_stripe_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_collected_inperson BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inperson_payments_booking ON public.inperson_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_inperson_payments_business ON public.inperson_payments(business_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_stripe_readers_business ON public.stripe_readers(business_id);
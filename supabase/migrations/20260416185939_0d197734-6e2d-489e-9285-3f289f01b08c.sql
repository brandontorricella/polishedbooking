
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS payment_auth_type text,
  ADD COLUMN IF NOT EXISTS bnpl_provider text,
  ADD COLUMN IF NOT EXISTS final_service_amount numeric,
  ADD COLUMN IF NOT EXISTS tip_request_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS tip_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_capture_intent_id text,
  ADD COLUMN IF NOT EXISTS tip_token text;

CREATE INDEX IF NOT EXISTS idx_bookings_tip_token ON public.bookings (tip_token) WHERE tip_token IS NOT NULL;

CREATE POLICY "Public can view booking by tip token"
ON public.bookings
FOR SELECT
TO anon, authenticated
USING (tip_token IS NOT NULL);

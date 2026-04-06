
-- Add deposit settings to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deposit_type text DEFAULT 'percentage';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 25;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cancellation_hours integer DEFAULT 24;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cancellation_fee_type text DEFAULT 'deposit';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cancellation_fee_amount numeric(10,2) DEFAULT 0;

-- Add deposit/cancellation tracking to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_paid boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_payment_intent_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS remaining_balance numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_fee numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_fee_charged boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_fee_payment_intent_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS canceled_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS canceled_by text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  type text NOT NULL,
  status text DEFAULT 'pending',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Business owners can view their transactions"
ON public.payment_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = payment_transactions.business_id
  AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage transactions"
ON public.payment_transactions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

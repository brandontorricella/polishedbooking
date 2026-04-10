
-- Add 'starter' to the subscription_tier enum
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'starter' BEFORE 'basic';

-- Add booking fee percentage column to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS booking_fee_pct numeric DEFAULT 0;

-- Create giving_causes table
CREATE TABLE public.giving_causes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  organization text,
  website_url text,
  logo_url text,
  category text,
  month integer NOT NULL,
  year integer NOT NULL,
  is_current boolean DEFAULT false,
  is_active boolean DEFAULT true,
  votes integer DEFAULT 0,
  amount_donated numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.giving_causes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active causes"
  ON public.giving_causes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage causes"
  ON public.giving_causes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_causes_current ON public.giving_causes(is_current, month, year);

-- Create cause_votes table
CREATE TABLE public.cause_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cause_id uuid NOT NULL REFERENCES public.giving_causes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  voted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, cause_id)
);

ALTER TABLE public.cause_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own votes"
  ON public.cause_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cast votes"
  ON public.cause_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage votes"
  ON public.cause_votes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_votes_user ON public.cause_votes(user_id);

-- Create donation_records table
CREATE TABLE public.donation_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cause_id uuid REFERENCES public.giving_causes(id),
  month integer NOT NULL,
  year integer NOT NULL,
  revenue_base numeric(10,2) NOT NULL,
  donation_pct numeric(4,2) DEFAULT 1.00,
  donation_amount numeric(10,2) NOT NULL,
  donated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donation records"
  ON public.donation_records FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage donation records"
  ON public.donation_records FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

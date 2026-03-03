
-- Loyalty settings per business
CREATE TABLE public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  points_per_dollar NUMERIC(10,2) NOT NULL DEFAULT 1,
  redemption_rate NUMERIC(10,2) NOT NULL DEFAULT 0.01,
  min_redemption_points INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User points balance per business
CREATE TABLE public.user_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Points transaction history
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'redeemed', 'bonus'
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Loyalty programs: anyone can view active programs, owners can manage
CREATE POLICY "Anyone can view active loyalty programs"
  ON public.loyalty_programs FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = loyalty_programs.business_id AND businesses.is_published = true
  ));

CREATE POLICY "Business owners can manage loyalty programs"
  ON public.loyalty_programs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = loyalty_programs.business_id AND businesses.owner_id = auth.uid()
  ));

-- User loyalty points: users can view/manage their own
CREATE POLICY "Users can view their own points"
  ON public.user_loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.user_loyalty_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON public.user_loyalty_points FOR UPDATE
  USING (auth.uid() = user_id);

-- Business owners can view points for their business
CREATE POLICY "Business owners can view points for their business"
  ON public.user_loyalty_points FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = user_loyalty_points.business_id AND businesses.owner_id = auth.uid()
  ));

-- Points transactions: users can view their own, insert their own
CREATE POLICY "Users can view their own transactions"
  ON public.points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.points_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Business owners can view transactions for their business
CREATE POLICY "Business owners can view transactions"
  ON public.points_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = points_transactions.business_id AND businesses.owner_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_loyalty_programs_business ON public.loyalty_programs(business_id);
CREATE INDEX idx_user_loyalty_points_user ON public.user_loyalty_points(user_id);
CREATE INDEX idx_user_loyalty_points_business ON public.user_loyalty_points(business_id);
CREATE INDEX idx_points_transactions_user ON public.points_transactions(user_id);
CREATE INDEX idx_points_transactions_business ON public.points_transactions(business_id);

-- Triggers for updated_at
CREATE TRIGGER update_loyalty_programs_updated_at
  BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_loyalty_points_updated_at
  BEFORE UPDATE ON public.user_loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

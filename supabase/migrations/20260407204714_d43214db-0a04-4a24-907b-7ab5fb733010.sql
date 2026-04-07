
-- Service packages (businesses create these, clients purchase them)
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  service_ids UUID[] DEFAULT '{}',
  session_count INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  validity_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages of published businesses"
ON public.service_packages FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = service_packages.business_id AND businesses.is_published = true
));

CREATE POLICY "Business owners can manage their packages"
ON public.service_packages FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = service_packages.business_id AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = service_packages.business_id AND businesses.owner_id = auth.uid()
));

-- Client package purchases
CREATE TABLE IF NOT EXISTS public.client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sessions_total INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own packages"
ON public.client_packages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase packages"
ON public.client_packages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own packages"
ON public.client_packages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Business owners can view client packages"
ON public.client_packages FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = client_packages.business_id AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Business owners can update client packages"
ON public.client_packages FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = client_packages.business_id AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage client packages"
ON public.client_packages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Business memberships
CREATE TABLE IF NOT EXISTS public.business_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  price NUMERIC(10,2) NOT NULL,
  sessions_per_period INTEGER,
  service_ids UUID[] DEFAULT '{}',
  perks TEXT[] DEFAULT '{}',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active memberships of published businesses"
ON public.business_memberships FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = business_memberships.business_id AND businesses.is_published = true
));

CREATE POLICY "Business owners can manage their memberships"
ON public.business_memberships FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = business_memberships.business_id AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = business_memberships.business_id AND businesses.owner_id = auth.uid()
));

-- Client memberships
CREATE TABLE IF NOT EXISTS public.client_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES public.business_memberships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active',
  sessions_used_this_period INTEGER DEFAULT 0,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  canceled_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
ON public.client_memberships FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can join memberships"
ON public.client_memberships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
ON public.client_memberships FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Business owners can view client memberships"
ON public.client_memberships FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = client_memberships.business_id AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Business owners can update client memberships"
ON public.client_memberships FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = client_memberships.business_id AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage client memberships"
ON public.client_memberships FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add package reference to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS client_package_id UUID REFERENCES public.client_packages(id),
ADD COLUMN IF NOT EXISTS paid_with_package BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_packages_business ON public.service_packages(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_client_packages_user ON public.client_packages(user_id, business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_business_memberships_business ON public.business_memberships(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_client_memberships_user ON public.client_memberships(user_id, business_id, status);

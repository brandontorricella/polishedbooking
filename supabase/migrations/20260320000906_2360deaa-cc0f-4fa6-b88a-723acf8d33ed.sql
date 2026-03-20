
-- Daily aggregated analytics stats
CREATE TABLE public.analytics_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_of_week INTEGER,
  profile_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  bookings_canceled INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  new_favorites INTEGER DEFAULT 0,
  new_reviews INTEGER DEFAULT 0,
  UNIQUE(business_id, date)
);

-- Indexes
CREATE INDEX idx_analytics_daily_business_date ON public.analytics_daily_stats(business_id, date);
CREATE INDEX idx_analytics_daily_dow ON public.analytics_daily_stats(business_id, day_of_week);

-- Enable RLS
ALTER TABLE public.analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- Business owners can view their own analytics
CREATE POLICY "Business owners can view their analytics"
ON public.analytics_daily_stats
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = analytics_daily_stats.business_id
  AND businesses.owner_id = auth.uid()
));

-- Service role / system can insert/update analytics
CREATE POLICY "System can manage analytics"
ON public.analytics_daily_stats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

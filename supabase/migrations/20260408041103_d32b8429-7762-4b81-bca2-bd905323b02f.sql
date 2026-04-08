
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights_text TEXT NOT NULL,
  data_snapshot JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, week_start)
);

CREATE INDEX idx_ai_insights_business ON public.ai_insights(business_id, week_start DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their insights"
ON public.ai_insights FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = ai_insights.business_id
  AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Business owners can create insights"
ON public.ai_insights FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = ai_insights.business_id
  AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage insights"
ON public.ai_insights FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

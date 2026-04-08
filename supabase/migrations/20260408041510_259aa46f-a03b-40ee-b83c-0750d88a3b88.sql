
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT FALSE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_business ON public.custom_reports(business_id, is_favorite);

ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their reports"
ON public.custom_reports
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = custom_reports.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = custom_reports.business_id
  AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage reports"
ON public.custom_reports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

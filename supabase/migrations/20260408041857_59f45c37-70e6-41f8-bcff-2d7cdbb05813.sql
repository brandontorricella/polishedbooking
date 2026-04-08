
CREATE TABLE IF NOT EXISTS public.imported_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  import_batch_id VARCHAR(255),
  original_name VARCHAR(255),
  original_email VARCHAR(255),
  original_phone VARCHAR(50),
  original_notes TEXT,
  matched_user_id UUID,
  import_status VARCHAR(20) DEFAULT 'imported',
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imported_clients_business ON public.imported_clients(business_id, import_status);

ALTER TABLE public.imported_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage imported clients"
ON public.imported_clients
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = imported_clients.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = imported_clients.business_id
  AND businesses.owner_id = auth.uid()
));

CREATE TABLE IF NOT EXISTS public.template_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  template_type VARCHAR(50),
  sent_to VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.template_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage template sends"
ON public.template_sends
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = template_sends.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = template_sends.business_id
  AND businesses.owner_id = auth.uid()
));

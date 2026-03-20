
-- Client notes for businesses to track client info
CREATE TABLE public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client preferences (structured key-value)
CREATE TABLE public.client_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, client_id, preference_key)
);

-- Indexes
CREATE INDEX idx_client_notes_lookup ON public.client_notes(business_id, client_id);
CREATE INDEX idx_client_preferences_lookup ON public.client_preferences(business_id, client_id);

-- Enable RLS
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: Business owners can manage notes for their business
CREATE POLICY "Business owners can manage client notes"
ON public.client_notes
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = client_notes.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = client_notes.business_id
  AND businesses.owner_id = auth.uid()
));

-- RLS: Business owners can manage preferences for their business
CREATE POLICY "Business owners can manage client preferences"
ON public.client_preferences
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = client_preferences.business_id
  AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = client_preferences.business_id
  AND businesses.owner_id = auth.uid()
));

-- Updated_at trigger for client_notes
CREATE TRIGGER update_client_notes_updated_at
  BEFORE UPDATE ON public.client_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

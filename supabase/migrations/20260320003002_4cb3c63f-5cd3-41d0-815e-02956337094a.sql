
-- Follow-up settings per business
CREATE TABLE public.followup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  days_after_appointment INTEGER DEFAULT 14,
  followup_message TEXT DEFAULT 'Hi {client_name}! It''s been a while since your last visit. We''d love to see you again! Book your next appointment today.',
  include_discount BOOLEAN DEFAULT false,
  discount_percent INTEGER DEFAULT 10,
  discount_valid_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Follow-up logs
CREATE TABLE public.followup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_type TEXT DEFAULT 'push',
  discount_code TEXT,
  discount_used BOOLEAN DEFAULT false,
  rebooked BOOLEAN DEFAULT false,
  rebooked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.followup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Business owners can manage their followup settings
CREATE POLICY "Business owners can manage followup settings"
ON public.followup_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = followup_settings.business_id AND businesses.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = followup_settings.business_id AND businesses.owner_id = auth.uid()));

-- RLS: Business owners can manage followup logs
CREATE POLICY "Business owners can manage followup logs"
ON public.followup_logs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = followup_logs.business_id AND businesses.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = followup_logs.business_id AND businesses.owner_id = auth.uid()));

-- Indexes
CREATE INDEX idx_followup_logs_business ON public.followup_logs(business_id);
CREATE INDEX idx_followup_logs_user ON public.followup_logs(user_id);

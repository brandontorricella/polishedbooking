
-- Waitlist entries
CREATE TABLE public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  flexible_dates BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Waitlist notifications
CREATE TABLE public.waitlist_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_entry_id UUID NOT NULL REFERENCES public.waitlist_entries(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  available_time TIME NOT NULL,
  response TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_waitlist_business ON public.waitlist_entries(business_id, status);
CREATE INDEX idx_waitlist_user ON public.waitlist_entries(user_id, status);
CREATE INDEX idx_waitlist_notifications_entry ON public.waitlist_notifications(waitlist_entry_id);

-- Enable RLS
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
ON public.waitlist_entries
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can create waitlist entries
CREATE POLICY "Users can join waitlist"
ON public.waitlist_entries
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries (cancel)
CREATE POLICY "Users can update own waitlist entries"
ON public.waitlist_entries
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Business owners can view waitlist for their business
CREATE POLICY "Business owners can view waitlist"
ON public.waitlist_entries
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = waitlist_entries.business_id
  AND businesses.owner_id = auth.uid()
));

-- Business owners can update waitlist entries (notify)
CREATE POLICY "Business owners can update waitlist"
ON public.waitlist_entries
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = waitlist_entries.business_id
  AND businesses.owner_id = auth.uid()
));

-- Users can view notifications for their entries
CREATE POLICY "Users can view own waitlist notifications"
ON public.waitlist_notifications
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.waitlist_entries
  WHERE waitlist_entries.id = waitlist_notifications.waitlist_entry_id
  AND waitlist_entries.user_id = auth.uid()
));

-- Users can update notifications (respond)
CREATE POLICY "Users can respond to notifications"
ON public.waitlist_notifications
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.waitlist_entries
  WHERE waitlist_entries.id = waitlist_notifications.waitlist_entry_id
  AND waitlist_entries.user_id = auth.uid()
));

-- Business owners can create notifications
CREATE POLICY "Business owners can create notifications"
ON public.waitlist_notifications
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.waitlist_entries
  JOIN public.businesses ON businesses.id = waitlist_entries.business_id
  WHERE waitlist_entries.id = waitlist_notifications.waitlist_entry_id
  AND businesses.owner_id = auth.uid()
));

-- Business owners can view notifications for their entries
CREATE POLICY "Business owners can view waitlist notifications"
ON public.waitlist_notifications
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.waitlist_entries
  JOIN public.businesses ON businesses.id = waitlist_entries.business_id
  WHERE waitlist_entries.id = waitlist_notifications.waitlist_entry_id
  AND businesses.owner_id = auth.uid()
));

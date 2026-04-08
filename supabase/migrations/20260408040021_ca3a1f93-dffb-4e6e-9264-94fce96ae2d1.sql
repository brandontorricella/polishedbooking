
-- Class schedules (recurring class templates)
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  capacity INTEGER NOT NULL DEFAULT 10,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  category TEXT,
  virtual_link TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual class sessions
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  enrolled_count INTEGER DEFAULT 0,
  is_canceled BOOLEAN DEFAULT FALSE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client class enrollments
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled',
  payment_intent_id TEXT,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS: class_schedules
CREATE POLICY "Anyone can view active schedules of published businesses"
ON public.class_schedules FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_schedules.business_id AND businesses.is_published = true
));

CREATE POLICY "Business owners can manage their class schedules"
ON public.class_schedules FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_schedules.business_id AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_schedules.business_id AND businesses.owner_id = auth.uid()
));

-- RLS: class_sessions
CREATE POLICY "Anyone can view non-canceled sessions of published businesses"
ON public.class_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_sessions.business_id AND businesses.is_published = true
));

CREATE POLICY "Business owners can manage their class sessions"
ON public.class_sessions FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_sessions.business_id AND businesses.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_sessions.business_id AND businesses.owner_id = auth.uid()
));

-- RLS: class_enrollments
CREATE POLICY "Business owners can view enrollments for their business"
ON public.class_enrollments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_enrollments.business_id AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Business owners can update enrollments"
ON public.class_enrollments FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = class_enrollments.business_id AND businesses.owner_id = auth.uid()
));

CREATE POLICY "Users can enroll themselves"
ON public.class_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own enrollments"
ON public.class_enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
ON public.class_enrollments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_business ON public.class_sessions(business_id, session_date, is_canceled);
CREATE INDEX IF NOT EXISTS idx_sessions_schedule ON public.class_sessions(schedule_id, session_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.class_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON public.class_enrollments(session_id, status);
CREATE INDEX IF NOT EXISTS idx_schedules_business ON public.class_schedules(business_id, is_active);

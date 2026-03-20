
-- Staff members table
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_accepting_bookings BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff services
CREATE TABLE public.staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_duration INTEGER,
  custom_price NUMERIC(10,2),
  UNIQUE(staff_id, service_id)
);

-- Staff schedules
CREATE TABLE public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(staff_id, day_of_week)
);

-- Staff time off
CREATE TABLE public.staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add staff_id to bookings
ALTER TABLE public.bookings ADD COLUMN staff_id UUID REFERENCES public.staff_members(id);

-- Indexes
CREATE INDEX idx_staff_business ON public.staff_members(business_id, is_active);
CREATE INDEX idx_staff_services ON public.staff_services(staff_id);
CREATE INDEX idx_bookings_staff ON public.bookings(staff_id);

-- RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;

-- Anyone can view active staff of published businesses
CREATE POLICY "Anyone can view active staff" ON public.staff_members
  FOR SELECT TO public
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.businesses WHERE businesses.id = staff_members.business_id AND businesses.is_published = true
  ));

-- Business owners can manage their staff
CREATE POLICY "Business owners can manage staff" ON public.staff_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.businesses WHERE businesses.id = staff_members.business_id AND businesses.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.businesses WHERE businesses.id = staff_members.business_id AND businesses.owner_id = auth.uid()
  ));

-- Staff services: anyone can view for active staff
CREATE POLICY "Anyone can view staff services" ON public.staff_services
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_services.staff_id AND sm.is_active = true AND b.is_published = true
  ));

-- Staff services: business owners manage
CREATE POLICY "Business owners manage staff services" ON public.staff_services
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_services.staff_id AND b.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_services.staff_id AND b.owner_id = auth.uid()
  ));

-- Staff schedules: anyone can view
CREATE POLICY "Anyone can view staff schedules" ON public.staff_schedules
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_schedules.staff_id AND sm.is_active = true AND b.is_published = true
  ));

-- Staff schedules: business owners manage
CREATE POLICY "Business owners manage staff schedules" ON public.staff_schedules
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_schedules.staff_id AND b.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_schedules.staff_id AND b.owner_id = auth.uid()
  ));

-- Staff time off: business owners manage
CREATE POLICY "Business owners manage staff time off" ON public.staff_time_off
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_time_off.staff_id AND b.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff_members sm
    JOIN public.businesses b ON b.id = sm.business_id
    WHERE sm.id = staff_time_off.staff_id AND b.owner_id = auth.uid()
  ));

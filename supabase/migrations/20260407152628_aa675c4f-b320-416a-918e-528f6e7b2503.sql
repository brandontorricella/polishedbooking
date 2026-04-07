
-- Business availability (recurring weekly schedule)
CREATE TABLE IF NOT EXISTS public.business_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  UNIQUE(business_id, day_of_week)
);

ALTER TABLE public.business_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business availability"
  ON public.business_availability FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage their availability"
  ON public.business_availability FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_availability.business_id
    AND businesses.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_availability.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Time blocks (one-off blocked times)
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '00:00',
  end_time TIME NOT NULL DEFAULT '23:59',
  reason TEXT,
  notes TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their time blocks"
  ON public.time_blocks FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = time_blocks.business_id
    AND businesses.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = time_blocks.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_blocks_business_date ON public.time_blocks(business_id, block_date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_staff_date ON public.time_blocks(staff_id, block_date);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON public.bookings(business_id, booking_date, booking_time, status);
CREATE INDEX IF NOT EXISTS idx_business_availability_lookup ON public.business_availability(business_id, day_of_week);

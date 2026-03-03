
-- Service bundles table
CREATE TABLE public.service_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bundle items (services in a bundle)
CREATE TABLE public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.service_bundles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Bundle bookings (tracking when a bundle is booked)
CREATE TABLE public.bundle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.service_bundles(id),
  original_total NUMERIC(10,2) NOT NULL,
  discount_applied NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bundles_business ON public.service_bundles(business_id);
CREATE INDEX idx_bundle_items_bundle ON public.bundle_items(bundle_id);
CREATE INDEX idx_bundle_bookings_booking ON public.bundle_bookings(booking_id);

-- RLS
ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active bundles of published businesses
CREATE POLICY "Anyone can view active bundles"
ON public.service_bundles FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = service_bundles.business_id AND businesses.is_published = true
));

-- Business owners can manage their bundles
CREATE POLICY "Business owners can manage bundles"
ON public.service_bundles FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses WHERE businesses.id = service_bundles.business_id AND businesses.owner_id = auth.uid()
));

-- Anyone can view bundle items for visible bundles
CREATE POLICY "Anyone can view bundle items"
ON public.bundle_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.service_bundles sb
  JOIN public.businesses b ON b.id = sb.business_id
  WHERE sb.id = bundle_items.bundle_id AND sb.is_active = true AND b.is_published = true
));

-- Business owners can manage bundle items
CREATE POLICY "Business owners can manage bundle items"
ON public.bundle_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.service_bundles sb
  JOIN public.businesses b ON b.id = sb.business_id
  WHERE sb.id = bundle_items.bundle_id AND b.owner_id = auth.uid()
));

-- Users can view their own bundle bookings
CREATE POLICY "Users can view their bundle bookings"
ON public.bundle_bookings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings WHERE bookings.id = bundle_bookings.booking_id AND bookings.client_id = auth.uid()
));

-- Users can create bundle bookings for their own bookings
CREATE POLICY "Users can create bundle bookings"
ON public.bundle_bookings FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings WHERE bookings.id = bundle_bookings.booking_id AND bookings.client_id = auth.uid()
));

-- Business owners can view bundle bookings for their business
CREATE POLICY "Business owners can view bundle bookings"
ON public.bundle_bookings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings bk
  JOIN public.businesses b ON b.id = bk.business_id
  WHERE bk.id = bundle_bookings.booking_id AND b.owner_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_service_bundles_updated_at
BEFORE UPDATE ON public.service_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

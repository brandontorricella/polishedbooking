
-- Add new columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS business_reply text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS business_reply_at timestamp with time zone;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flag_reason text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flagged_by uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_removed boolean DEFAULT false;

-- Add unique constraint on booking_id (one review per booking)
ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- Allow business owners to update reviews on their business (for replies)
CREATE POLICY "Business owners can update reviews for replies"
ON public.reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Update the rating trigger to exclude removed reviews
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.businesses
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews
    WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    AND is_removed = false
  ),
  review_count = (
    SELECT COUNT(*)
    FROM public.reviews
    WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    AND is_removed = false
  )
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_rating ON public.reviews;
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

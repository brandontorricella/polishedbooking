CREATE POLICY "Business owners can view client profiles via bookings"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.businesses biz ON biz.id = b.business_id
    WHERE b.client_id = profiles.user_id
      AND biz.owner_id = auth.uid()
  )
);
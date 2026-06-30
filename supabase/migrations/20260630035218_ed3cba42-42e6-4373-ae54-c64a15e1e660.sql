DROP POLICY IF EXISTS "reviews insert all" ON public.reviews;
CREATE POLICY "reviews insert" ON public.reviews FOR INSERT WITH CHECK (
  char_length(device_id) BETWEEN 8 AND 128
  AND char_length(username) BETWEEN 1 AND 80
  AND rating BETWEEN 1 AND 5
);
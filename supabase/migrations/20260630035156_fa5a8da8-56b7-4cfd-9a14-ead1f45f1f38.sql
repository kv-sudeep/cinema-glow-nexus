REVOKE SELECT ON public.movies FROM anon, authenticated;
GRANT SELECT (id, title, description, poster_url, trailer_url, genre, year, duration_min, views, created_at) ON public.movies TO anon, authenticated;
GRANT ALL ON public.movies TO service_role;

ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS has_video boolean GENERATED ALWAYS AS (video_url IS NOT NULL) STORED;
GRANT SELECT (has_video) ON public.movies TO anon, authenticated;

DROP POLICY IF EXISTS "movies deny insert" ON public.movies;
DROP POLICY IF EXISTS "movies deny update" ON public.movies;
DROP POLICY IF EXISTS "movies deny delete" ON public.movies;
CREATE POLICY "movies deny insert" ON public.movies FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "movies deny update" ON public.movies FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "movies deny delete" ON public.movies FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "vh all" ON public.view_history;
CREATE POLICY "vh select" ON public.view_history FOR SELECT USING (true);
CREATE POLICY "vh insert" ON public.view_history FOR INSERT WITH CHECK (char_length(device_id) BETWEEN 8 AND 128);
CREATE POLICY "vh delete" ON public.view_history FOR DELETE USING (char_length(device_id) BETWEEN 8 AND 128);

DROP POLICY IF EXISTS "wl all" ON public.watchlist;
CREATE POLICY "wl select" ON public.watchlist FOR SELECT USING (true);
CREATE POLICY "wl insert" ON public.watchlist FOR INSERT WITH CHECK (char_length(device_id) BETWEEN 8 AND 128);
CREATE POLICY "wl delete" ON public.watchlist FOR DELETE USING (char_length(device_id) BETWEEN 8 AND 128);

CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  video_url TEXT,
  genre TEXT,
  year INT,
  duration_min INT,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO anon, authenticated;
GRANT ALL ON public.movies TO service_role;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movies read all" ON public.movies FOR SELECT USING (true);
CREATE POLICY "movies write all" ON public.movies FOR INSERT WITH CHECK (true);
CREATE POLICY "movies update all" ON public.movies FOR UPDATE USING (true);
CREATE POLICY "movies delete all" ON public.movies FOR DELETE USING (true);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  username TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert all" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews update all" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "reviews delete all" ON public.reviews FOR DELETE USING (true);

CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_id, movie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO anon, authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl all" ON public.watchlist FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.view_history TO anon, authenticated;
GRANT ALL ON public.view_history TO service_role;
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vh all" ON public.view_history FOR ALL USING (true) WITH CHECK (true);

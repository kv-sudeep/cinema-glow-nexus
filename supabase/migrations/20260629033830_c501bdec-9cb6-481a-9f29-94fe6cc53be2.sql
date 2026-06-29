
-- movies: keep public read, remove permissive writes
DROP POLICY IF EXISTS "movies write all" ON public.movies;
DROP POLICY IF EXISTS "movies update all" ON public.movies;
DROP POLICY IF EXISTS "movies delete all" ON public.movies;

-- reviews: keep public read + insert, remove update/delete
DROP POLICY IF EXISTS "reviews update all" ON public.reviews;
DROP POLICY IF EXISTS "reviews delete all" ON public.reviews;

-- storage: remove anon write/update/delete; keep public read for signed-url flow
DROP POLICY IF EXISTS "movie-assets insert" ON storage.objects;
DROP POLICY IF EXISTS "movie-assets update" ON storage.objects;
DROP POLICY IF EXISTS "movie-assets delete" ON storage.objects;

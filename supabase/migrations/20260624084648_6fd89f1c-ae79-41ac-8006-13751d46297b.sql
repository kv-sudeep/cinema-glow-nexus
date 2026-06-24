
CREATE POLICY "movie-assets read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'movie-assets');
CREATE POLICY "movie-assets insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'movie-assets');
CREATE POLICY "movie-assets update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'movie-assets');
CREATE POLICY "movie-assets delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'movie-assets');

import { supabase } from "@/integrations/supabase/client";

export type Movie = {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  video_url: string | null;
  genre: string | null;
  year: number | null;
  duration_min: number | null;
  views: number;
  created_at: string;
};

export type Review = {
  id: string;
  movie_id: string;
  device_id: string;
  username: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export async function listMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Movie[];
}

export async function getMovie(id: string): Promise<Movie | null> {
  const { data, error } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Movie) ?? null;
}

export async function createMovie(input: Partial<Movie>): Promise<Movie> {
  const { data, error } = await supabase.from("movies").insert(input as never).select().single();
  if (error) throw error;
  return data as Movie;
}

export async function updateMovie(id: string, input: Partial<Movie>): Promise<void> {
  const { error } = await supabase.from("movies").update(input as never).eq("id", id);
  if (error) throw error;
}

export async function deleteMovie(id: string): Promise<void> {
  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementViews(id: string, currentViews: number) {
  await supabase.from("movies").update({ views: currentViews + 1 } as never).eq("id", id);
}

export async function listReviews(movieId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function addReview(input: { movie_id: string; device_id: string; username: string; rating: number; comment: string | null }) {
  const { error } = await supabase.from("reviews").insert(input as never);
  if (error) throw error;
}

export async function ratingsByMovie(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("reviews").select("movie_id, rating");
  if (error) throw error;
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const r of (data ?? []) as { movie_id: string; rating: number }[]) {
    (acc[r.movie_id] ??= { sum: 0, n: 0 }).sum += r.rating;
    acc[r.movie_id].n += 1;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(acc)) out[k] = v.sum / v.n;
  return out;
}

export async function getWatchlist(deviceId: string) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("movie_id, movies(*)")
    .eq("device_id", deviceId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { movies: Movie }).movies).filter(Boolean);
}

export async function isOnWatchlist(deviceId: string, movieId: string) {
  const { data } = await supabase
    .from("watchlist")
    .select("id")
    .eq("device_id", deviceId)
    .eq("movie_id", movieId)
    .maybeSingle();
  return !!data;
}

export async function toggleWatchlist(deviceId: string, movieId: string) {
  const on = await isOnWatchlist(deviceId, movieId);
  if (on) {
    await supabase.from("watchlist").delete().eq("device_id", deviceId).eq("movie_id", movieId);
    return false;
  }
  await supabase.from("watchlist").insert({ device_id: deviceId, movie_id: movieId } as never);
  return true;
}

export async function logView(deviceId: string, movieId: string) {
  await supabase.from("view_history").insert({ device_id: deviceId, movie_id: movieId } as never);
}

export async function listViewHistory(deviceId: string, limit = 20) {
  const { data, error } = await supabase
    .from("view_history")
    .select("movie_id, watched_at, movies(*)")
    .eq("device_id", deviceId)
    .order("watched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function analytics() {
  const [{ count: movieCount }, { count: reviewCount }, { count: viewCount }, recent] = await Promise.all([
    supabase.from("movies").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("view_history").select("*", { count: "exact", head: true }),
    supabase
      .from("view_history")
      .select("watched_at, movies(title)")
      .order("watched_at", { ascending: false })
      .limit(15),
  ]);
  return {
    movieCount: movieCount ?? 0,
    reviewCount: reviewCount ?? 0,
    viewCount: viewCount ?? 0,
    recent: recent.data ?? [],
  };
}

export async function uploadAsset(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("movie-assets").upload(key, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data: signed, error: sErr } = await supabase.storage
    .from("movie-assets")
    .createSignedUrl(key, 60 * 60 * 24 * 365 * 10);
  if (sErr) throw sErr;
  return signed.signedUrl;
}
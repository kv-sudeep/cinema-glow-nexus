import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateMovie,
  adminUpdateMovie,
  adminDeleteMovie,
  adminCreateSignedUpload,
  incrementMovieViews,
} from "./admin.functions";

function getAdminCode(): string {
  if (typeof window === "undefined") return "";
  // The shared admin code is held in memory after sign-in; fall back to localStorage.
  return localStorage.getItem("mv_admin_code") || "";
}

export type Movie = {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  has_video: boolean;
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

const MOVIE_COLS =
  "id, title, description, poster_url, trailer_url, genre, year, duration_min, views, created_at, has_video";

function normalize(row: Record<string, unknown> | null): Movie | null {
  if (!row) return null;
  return { ...(row as unknown as Movie), has_video: !!(row as { has_video?: boolean }).has_video };
}

export async function listMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from("movies")
    .select(MOVIE_COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => normalize(r)!) as Movie[];
}

export async function getMovie(id: string): Promise<Movie | null> {
  const { data, error } = await supabase
    .from("movies")
    .select(MOVIE_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return normalize(data as Record<string, unknown> | null);
}

export async function createMovie(input: Partial<Movie>): Promise<Movie> {
  const data = await adminCreateMovie({ data: { adminCode: getAdminCode(), input: input as never } });
  return data as Movie;
}

export async function updateMovie(id: string, input: Partial<Movie>): Promise<void> {
  await adminUpdateMovie({ data: { adminCode: getAdminCode(), id, input: input as never } });
}

export async function deleteMovie(id: string): Promise<void> {
  await adminDeleteMovie({ data: { adminCode: getAdminCode(), id } });
}

export async function incrementViews(id: string, _currentViews: number) {
  try { await incrementMovieViews({ data: { id } }); } catch { /* non-fatal */ }
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
    .select(`movie_id, movies(${MOVIE_COLS})`)
    .eq("device_id", deviceId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => normalize((r as { movies: Record<string, unknown> }).movies))
    .filter(Boolean) as Movie[];
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
    .select(`movie_id, watched_at, movies(${MOVIE_COLS})`)
    .eq("device_id", deviceId)
    .order("watched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as { movie_id: string; watched_at: string; movies: Record<string, unknown> | null };
    return { ...row, movies: normalize(row.movies) };
  });
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
  const rawExt = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
  const allowed = ["poster", "video", "trailer"] as const;
  if (!(allowed as readonly string[]).includes(prefix)) throw new Error("Invalid prefix");
  const { uploadUrl, token, path, publicUrl } = await adminCreateSignedUpload({
    data: { adminCode: getAdminCode(), prefix: prefix as typeof allowed[number], ext: rawExt },
  });
  // Upload directly to storage via signed URL.
  const { error: upErr } = await supabase.storage
    .from("movie-assets")
    .uploadToSignedUrl(path, token, file, { contentType: file.type, upsert: false });
  if (upErr) {
    // Fallback: PUT to the signed upload URL
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  }
  return publicUrl;
}
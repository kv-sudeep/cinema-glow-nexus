import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppNav } from "@/components/AppNav";
import { MovieCard } from "@/components/MovieCard";
import { getDeviceId, getRole } from "@/lib/auth";
import { getWatchlist, ratingsByMovie } from "@/lib/movies";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — Cineverse" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const nav = useNavigate();
  useEffect(() => { if (!getRole()) nav({ to: "/" }); }, [nav]);
  const device = getDeviceId();
  const q = useQuery({ queryKey: ["watchlist", device], queryFn: () => getWatchlist(device) });
  const r = useQuery({ queryKey: ["ratings"], queryFn: ratingsByMovie });
  const movies = q.data ?? [];
  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold">My Watchlist</h1>
        <p className="text-muted-foreground mt-1">Saved on this device.</p>
        <div className="mt-8">
          {movies.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl text-muted-foreground">Nothing saved yet — explore the library and tap the bookmark.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((m) => <MovieCard key={m.id} movie={m} avgRating={r.data?.[m.id] ?? null} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
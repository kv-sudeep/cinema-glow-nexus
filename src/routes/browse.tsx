import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppNav, SearchPill } from "@/components/AppNav";
import { MovieCard } from "@/components/MovieCard";
import { CategoryStrip } from "@/components/CategoryStrip";
import { listMovies, ratingsByMovie, listViewHistory, type Movie } from "@/lib/movies";
import { getDeviceId, getRole } from "@/lib/auth";

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse — Cineverse" }] }),
  component: Browse,
});

function Browse() {
  const nav = useNavigate();
  useEffect(() => { if (!getRole()) nav({ to: "/" }); }, [nav]);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const moviesQ = useQuery({ queryKey: ["movies"], queryFn: listMovies });
  const ratingsQ = useQuery({ queryKey: ["ratings"], queryFn: ratingsByMovie });
  const histQ = useQuery({ queryKey: ["history", getDeviceId()], queryFn: () => listViewHistory(getDeviceId(), 8) });

  const movies = moviesQ.data ?? [];
  const ratings = ratingsQ.data ?? {};

  const extraCats = useMemo(
    () => Array.from(new Set(movies.map((m) => m.genre).filter(Boolean) as string[])),
    [movies]
  );

  const filtered = useMemo(() => {
    const arr = movies.filter((m) =>
      (q ? (m.title + " " + (m.description || "")).toLowerCase().includes(q.toLowerCase()) : true) &&
      (!category || (m.genre || "").toLowerCase() === category.toLowerCase())
    );
    return arr;
  }, [movies, q, category]);

  const newMovies = useMemo(() => [...movies]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10), [movies]);

  const continueWatching = useMemo(() => {
    const seen = new Set<string>();
    const out: Movie[] = [];
    for (const h of (histQ.data ?? []) as { movie_id: string; movies?: Movie | null }[]) {
      if (!h.movies || seen.has(h.movie_id)) continue;
      seen.add(h.movie_id);
      out.push(h.movies);
      if (out.length >= 10) break;
    }
    return out;
  }, [histQ.data]);

  // recommendations: same genre as recently viewed
  const recoGenres = useMemo(() => {
    const set = new Set<string>();
    for (const h of histQ.data ?? []) {
      const g = (h as { movies?: { genre?: string | null } }).movies?.genre;
      if (g) set.add(g);
    }
    return set;
  }, [histQ.data]);
  const recommendations = useMemo(() => {
    if (recoGenres.size === 0) return movies.slice(0, 6);
    return movies.filter((m) => m.genre && recoGenres.has(m.genre)).slice(0, 8);
  }, [movies, recoGenres]);

  const featured = movies[0];

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-4">
        <CategoryStrip active={category} onSelect={setCategory} extra={extraCats} />
      </div>
      {featured && (
        <section className="relative">
          <div className="absolute inset-0 -z-10">
            {featured.poster_url ? (
              <img src={featured.poster_url} alt="" className="h-[60vh] w-full object-cover opacity-40" />
            ) : (
              <div className="h-[60vh] bg-gradient-to-br from-primary/30 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
            <span className="inline-block text-xs uppercase tracking-widest px-2.5 py-1 rounded-full glass">Featured</span>
            <h1 className="mt-4 text-4xl sm:text-6xl font-extrabold leading-[1.05] max-w-3xl">
              {featured.title}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground line-clamp-3">{featured.description}</p>
            <button
              onClick={() => nav({ to: "/movie/$id", params: { id: featured.id } })}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-[0_0_30px_oklch(0.68_0.24_320/0.45)]"
            >
              ▶ Watch now
            </button>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
        <div className="flex gap-3 items-center">
          <SearchPill value={q} onChange={setQ} />
        </div>

        {continueWatching.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Continue watching</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {continueWatching.map((m) => (
                <MovieCard key={m.id} movie={m} avgRating={ratings[m.id] ?? null} />
              ))}
            </div>
          </section>
        )}

        {newMovies.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">New movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {newMovies.map((m) => (
                <MovieCard key={m.id} movie={m} avgRating={ratings[m.id] ?? null} />
              ))}
            </div>
          </section>
        )}

        {recommendations.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">{recoGenres.size > 0 ? "Recommended for you" : "Fresh picks"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((m) => (
                <MovieCard key={m.id} movie={m} avgRating={ratings[m.id] ?? null} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">
            {category ? `${category} movies` : "All movies"}{" "}
            <span className="text-muted-foreground text-sm font-normal">({filtered.length})</span>
          </h2>
          {moviesQ.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl glow-card animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <p className="text-muted-foreground">No movies match your filters yet.</p>
              {getRole() === "admin" && (
                <button onClick={() => nav({ to: "/admin" })} className="mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground">Add the first movie</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map((m) => (
                <MovieCard key={m.id} movie={m} avgRating={ratings[m.id] ?? null} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
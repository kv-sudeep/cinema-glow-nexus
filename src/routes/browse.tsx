import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppNav, SearchPill } from "@/components/AppNav";
import { MovieCard } from "@/components/MovieCard";
import { HeroBanner, PosterCard } from "@/components/HeroBanner";
import { CategoryStrip } from "@/components/CategoryStrip";
import { CATEGORY_BANNERS, CategoryBannerHeader } from "@/components/CategoryBanners";
import { LibraryStatus } from "@/components/LibraryStatus";
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

      {featured && <HeroBanner movie={featured} rating={ratings[featured.id] ?? null} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 pt-6 space-y-8">
        <SearchPill value={q} onChange={setQ} />
        <LibraryStatus />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Trending in</h2>
          <CategoryStrip active={category} onSelect={setCategory} extra={extraCats} />
        </div>

        {continueWatching.length > 0 && (
          <Row title="Continue Watching" movies={continueWatching} />
        )}

        {newMovies.length > 0 && (
          <Row title="New Movies" movies={newMovies} />
        )}

        {recommendations.length > 0 && (
          <Row
            title={recoGenres.size > 0 ? "Recommended for you" : "Fresh picks"}
            movies={recommendations}
          />
        )}

        {CATEGORY_BANNERS.map((c) => {
          const items = movies.filter(
            (m) => (m.genre || "").toLowerCase() === c.name.toLowerCase()
          );
          if (items.length === 0) return null;
          return (
            <section key={c.name}>
              <CategoryBannerHeader name={c.name} count={items.length} onSelect={setCategory} />
              <div className="row-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
                {items.map((m) => (
                  <PosterCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="text-xl font-bold mb-3">
            {category ? `${category} movies` : "All movies"}{" "}
            <span className="text-muted-foreground text-sm font-normal">({filtered.length})</span>
          </h2>
          {moviesQ.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-card animate-pulse" />
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

function Row({ title, movies }: { title: string; movies: Movie[] }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">{title}</h2>
      <div className="row-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
        {movies.map((m) => (
          <PosterCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}
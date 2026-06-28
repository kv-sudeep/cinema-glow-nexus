import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppNav, SearchPill } from "@/components/AppNav";

import { HeroBanner, PosterCard } from "@/components/HeroBanner";

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

  const moviesQ = useQuery({ queryKey: ["movies"], queryFn: listMovies });
  const ratingsQ = useQuery({ queryKey: ["ratings"], queryFn: ratingsByMovie });
  const histQ = useQuery({ queryKey: ["history", getDeviceId()], queryFn: () => listViewHistory(getDeviceId(), 8) });

  const movies = moviesQ.data ?? [];
  const ratings = ratingsQ.data ?? {};



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

  const featured = movies[0];

  return (
    <div className="min-h-screen">
      <AppNav />

      {featured && <HeroBanner movie={featured} rating={ratings[featured.id] ?? null} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 pt-6 space-y-8">
        <SearchPill value={q} onChange={setQ} />
        <LibraryStatus />

        {continueWatching.length > 0 && (
          <LandscapeRow title="Continue Watching" movies={continueWatching} />
        )}

        {CATEGORY_BANNERS.map((c) => {
          const items = movies.filter(
            (m) => (m.genre || "").toLowerCase() === c.name.toLowerCase()
          );
          const hasItems = items.length > 0;
          return (
            <section key={c.name}>
              <CategoryBannerHeader name={c.name} count={items.length} />
              {hasItems ? (
                <div className="row-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
                  {items.map((m) => (
                    <PosterCard key={m.id} movie={m} />
                  ))}
                </div>
              ) : (
                <div className="py-8 glass rounded-2xl text-center">
                  <p className="text-muted-foreground text-sm">
                    No {c.name} movies yet.
                  </p>
                  {getRole() === "admin" && (
                    <button
                      onClick={() => nav({ to: "/admin" })}
                      className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm"
                    >
                      Add the first {c.name} movie
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}

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
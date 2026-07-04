import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";

import { HeroCarousel, PosterCard, LandscapeCard } from "@/components/HeroBanner";

import { CATEGORY_BANNERS, CategoryBannerHeader } from "@/components/CategoryBanners";

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

  const query = q.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!query) return [];
    return movies.filter((m) =>
      m.title.toLowerCase().includes(query) ||
      (m.genre ?? "").toLowerCase().includes(query)
    );
  }, [movies, query]);

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

  const featured = useMemo(() => movies.slice(0, 6), [movies]);

  if (moviesQ.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading movies…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav search={q} onSearch={setQ} />

      {!query && featured.length > 0 && (
        <HeroCarousel movies={featured} ratings={ratings} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 pt-6 space-y-8">
        {query ? (
          <section>
            <h2 className="text-lg font-bold mb-3">
              Results for "{q}" <span className="text-muted-foreground font-normal">· {searchResults.length}</span>
            </h2>
            {searchResults.length === 0 ? (
              <div className="py-10 glass rounded-2xl text-center text-sm text-muted-foreground">
                No movies match your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {searchResults.map((m) => (
                  <PosterCard key={m.id} movie={m} />
                ))}
              </div>
            )}
          </section>
        ) : (
        <>
        {continueWatching.length > 0 && (
          <LandscapeRow title="Continue Watching" movies={continueWatching} />
        )}

        {CATEGORY_BANNERS.map((c) => {
          const items = movies.filter(
            (m) => (m.genre || "").toLowerCase() === c.name.toLowerCase()
          );
          return <CategorySection key={c.name} name={c.name} items={items} onAdmin={() => nav({ to: "/admin" })} />;
        })}
        </>
        )}
      </main>
    </div>
  );
}

function CategorySection({ name, items, onAdmin }: { name: string; items: Movie[]; onAdmin: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = items.length > 0;
  const canExpand = items.length > 5;
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <CategoryBannerHeader name={name} count={items.length} />
        </div>
        {canExpand && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mb-3 shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full glass text-xs hover:bg-white/10"
          >
            {expanded ? (<><ChevronUp className="h-3.5 w-3.5" /> Show less</>) : (<><ChevronDown className="h-3.5 w-3.5" /> View all</>)}
          </button>
        )}
      </div>
      {hasItems ? (
        expanded ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {items.map((m) => (
              <PosterCard key={m.id} movie={m} />
            ))}
          </div>
        ) : (
          <div className="row-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
            {items.map((m) => (
              <PosterCard key={m.id} movie={m} />
            ))}
          </div>
        )
      ) : (
        <div className="py-8 glass rounded-2xl text-center">
          <p className="text-muted-foreground text-sm">No {name} movies yet.</p>
          {getRole() === "admin" && (
            <button onClick={onAdmin} className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">
              Add the first {name} movie
            </button>
          )}
        </div>
      )}
    </section>
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

function LandscapeRow({ title, movies }: { title: string; movies: Movie[] }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">{title}</h2>
      <div className="row-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
        {movies.map((m) => (
          <LandscapeCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppNav, SearchPill } from "@/components/AppNav";
import { MovieCard } from "@/components/MovieCard";
import { listMovies, ratingsByMovie, listViewHistory } from "@/lib/movies";
import { getDeviceId, getRole } from "@/lib/auth";

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse — Cineverse" }] }),
  component: Browse,
});

function Browse() {
  const nav = useNavigate();
  useEffect(() => { if (!getRole()) nav({ to: "/" }); }, [nav]);

  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "title" | "rating" | "views">("new");

  const moviesQ = useQuery({ queryKey: ["movies"], queryFn: listMovies });
  const ratingsQ = useQuery({ queryKey: ["ratings"], queryFn: ratingsByMovie });
  const histQ = useQuery({ queryKey: ["history", getDeviceId()], queryFn: () => listViewHistory(getDeviceId(), 8) });

  const movies = moviesQ.data ?? [];
  const ratings = ratingsQ.data ?? {};

  const genres = useMemo(() => Array.from(new Set(movies.map((m) => m.genre).filter(Boolean) as string[])).sort(), [movies]);
  const years = useMemo(() => Array.from(new Set(movies.map((m) => m.year).filter(Boolean) as number[])).sort((a, b) => b - a), [movies]);

  const filtered = useMemo(() => {
    let arr = movies.filter((m) =>
      (q ? (m.title + " " + (m.description || "")).toLowerCase().includes(q.toLowerCase()) : true) &&
      (genre === "all" || m.genre === genre) &&
      (year === "all" || String(m.year) === year)
    );
    arr = [...arr].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "rating") return (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0);
      if (sort === "views") return b.views - a.views;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return arr;
  }, [movies, q, genre, year, sort, ratings]);

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
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
          <SearchPill value={q} onChange={setQ} />
          <Select value={genre} onChange={setGenre} options={[["all", "All genres"], ...genres.map((g) => [g, g] as [string, string])]} />
          <Select value={year} onChange={setYear} options={[["all", "All years"], ...years.map((y) => [String(y), String(y)] as [string, string])]} />
          <Select value={sort} onChange={(v) => setSort(v as typeof sort)} options={[["new", "Newest"], ["title", "A–Z"], ["rating", "Top rated"], ["views", "Most watched"]]} />
        </div>

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
          <h2 className="text-xl font-bold mb-4">All movies <span className="text-muted-foreground text-sm font-normal">({filtered.length})</span></h2>
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 focus:border-primary/60 focus:outline-none text-sm"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-background">{l}</option>
      ))}
    </select>
  );
}
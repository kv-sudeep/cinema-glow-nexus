import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Bookmark, PlayCircle, User as UserIcon } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { LandscapeCard, PosterCard } from "@/components/HeroBanner";
import { getDeviceId, getDisplayName, getRole, setDisplayName } from "@/lib/auth";
import { getWatchlist, listMovies, listViewHistory, type Movie } from "@/lib/movies";
import { allProgress, getDownloads, removeDownload } from "@/lib/progress";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Cineverse" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const nav = useNavigate();
  useEffect(() => { if (!getRole()) nav({ to: "/" }); }, [nav]);

  const device = getDeviceId();
  const [name, setName] = useState(() => getDisplayName());
  const role = getRole();

  const moviesQ = useQuery({ queryKey: ["movies"], queryFn: listMovies });
  const wlQ = useQuery({ queryKey: ["watchlist", device], queryFn: () => getWatchlist(device) });
  const histQ = useQuery({ queryKey: ["history", device], queryFn: () => listViewHistory(device, 20) });

  const movies = moviesQ.data ?? [];
  const byId = useMemo(() => Object.fromEntries(movies.map((m) => [m.id, m])), [movies]);

  const watching = useMemo(() => {
    const prog = allProgress();
    const entries = Object.entries(prog)
      .sort((a, b) => b[1].at - a[1].at)
      .map(([id]) => byId[id])
      .filter(Boolean) as Movie[];
    if (entries.length > 0) return entries;
    // Fallback to view history if no local progress yet
    const seen = new Set<string>();
    const out: Movie[] = [];
    for (const h of (histQ.data ?? []) as { movie_id: string; movies?: Movie | null }[]) {
      if (!h.movies || seen.has(h.movie_id)) continue;
      seen.add(h.movie_id); out.push(h.movies);
    }
    return out;
  }, [byId, histQ.data]);

  const downloads = useMemo(() => {
    const dl = getDownloads();
    return Object.entries(dl)
      .sort((a, b) => b[1].at - a[1].at)
      .map(([id, meta]) => ({ id, meta, movie: byId[id] }));
  }, [byId]);

  const watchlist = wlQ.data ?? [];

  function saveName() {
    setDisplayName(name || "Cinephile");
  }

  function fmtSize(n: number | null) {
    if (n == null) return "—";
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <header className="glass rounded-2xl p-5 sm:p-6 flex items-center gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center shrink-0 shadow-[0_0_30px_oklch(0.68_0.24_320/0.45)]">
            <UserIcon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                className="bg-transparent text-xl sm:text-2xl font-extrabold outline-none border-b border-transparent focus:border-primary/60 min-w-0"
              />
              {role && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-muted-foreground">
                  {role}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Device ID · <span className="font-mono">{device.slice(0, 8)}…</span></p>
          </div>
        </header>

        <Section icon={<PlayCircle className="h-4 w-4" />} title="Continue Watching" count={watching.length}>
          {watching.length === 0 ? (
            <Empty text="Nothing in progress yet. Start a movie to see it here." />
          ) : (
            <div className="row-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
              {watching.map((m) => <LandscapeCard key={m.id} movie={m} />)}
            </div>
          )}
        </Section>

        <Section icon={<Download className="h-4 w-4" />} title="Downloads" count={downloads.length}>
          {downloads.length === 0 ? (
            <Empty text="No downloads yet. Tap Download on any movie." />
          ) : (
            <ul className="grid gap-2">
              {downloads.map(({ id, meta, movie }) => (
                <li key={id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="h-14 w-10 sm:h-16 sm:w-12 rounded-md overflow-hidden bg-card border border-white/5 shrink-0">
                    {movie?.poster_url ? (
                      <img src={movie.poster_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{movie?.title ?? meta.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{meta.name}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtSize(meta.size)} · {new Date(meta.at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {movie && (
                      <Link to="/movie/$id" params={{ id: movie.id }} className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/25">Open</Link>
                    )}
                    <button onClick={() => { removeDownload(id); location.reload(); }} className="text-xs px-3 py-1.5 rounded-full glass hover:bg-white/10 text-muted-foreground">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<Bookmark className="h-4 w-4" />} title="Watchlist" count={watchlist.length}>
          {watchlist.length === 0 ? (
            <Empty text="Nothing saved. Tap the bookmark on any movie." />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {watchlist.map((m) => <PosterCard key={m.id} movie={m} />)}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold mb-3">
        <span className="text-primary">{icon}</span>
        {title}
        <span className="text-muted-foreground font-normal text-sm">· {count}</span>
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-8 glass rounded-2xl text-center text-sm text-muted-foreground">{text}</div>
  );
}
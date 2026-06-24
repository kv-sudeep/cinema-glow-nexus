import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, Download, Play, Share2, Star } from "lucide-react";
import { addReview, getMovie, incrementViews, isOnWatchlist, listReviews, logView, toggleWatchlist } from "@/lib/movies";
import { getDeviceId, getDisplayName, getRole, setDisplayName } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { toast } from "sonner";

export const Route = createFileRoute("/movie/$id")({
  head: () => ({ meta: [{ title: "Watch — Cineverse" }] }),
  component: MoviePage,
});

function MoviePage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const device = getDeviceId();

  useEffect(() => { if (!getRole()) nav({ to: "/" }); }, [nav]);

  const movieQ = useQuery({ queryKey: ["movie", id], queryFn: () => getMovie(id) });
  const reviewsQ = useQuery({ queryKey: ["reviews", id], queryFn: () => listReviews(id) });
  const wlQ = useQuery({ queryKey: ["wl", id, device], queryFn: () => isOnWatchlist(device, id) });

  const [playing, setPlaying] = useState<"trailer" | "video" | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(() => getDisplayName());

  const m = movieQ.data;
  const avg = useMemo(() => {
    const arr = reviewsQ.data ?? [];
    if (arr.length === 0) return null;
    return arr.reduce((s, r) => s + r.rating, 0) / arr.length;
  }, [reviewsQ.data]);

  if (!m) {
    return (
      <div className="min-h-screen"><AppNav />
        <div className="max-w-4xl mx-auto p-10 text-center text-muted-foreground">{movieQ.isLoading ? "Loading…" : "Movie not found"}</div>
      </div>
    );
  }

  function startVideo() {
    setPlaying("video");
    logView(device, id).catch(() => {});
    if (m) incrementViews(id, m.views).catch(() => {});
  }

  async function onSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setDisplayName(name || "Cinephile");
    try {
      await addReview({ movie_id: id, device_id: device, username: name || "Cinephile", rating, comment: comment.trim() || null });
      setComment("");
      toast.success("Review posted");
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      qc.invalidateQueries({ queryKey: ["ratings"] });
    } catch (e) {
      toast.error("Could not post review");
    }
  }

  async function onToggleWl() {
    const on = await toggleWatchlist(device, id);
    toast.success(on ? "Added to watchlist" : "Removed from watchlist");
    qc.invalidateQueries({ queryKey: ["wl", id, device] });
  }

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ title: m.title, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {m.poster_url && <img src={m.poster_url} alt="" className="h-[80vh] w-full object-cover opacity-25" />}
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>

          <div className="mt-6 grid md:grid-cols-[280px_1fr] gap-8">
            <div className="mx-auto md:mx-0 w-44 sm:w-56 md:w-full aspect-[2/3] rounded-2xl overflow-hidden glow-card">
              {m.poster_url ? <img src={m.poster_url} alt={m.title} className="h-full w-full object-cover" /> : <div className="h-full bg-primary/20" />}
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{m.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {m.year && <span>{m.year}</span>}
                {m.genre && <span>• {m.genre}</span>}
                {m.duration_min && <span>• {m.duration_min} min</span>}
                {avg != null && <span className="inline-flex items-center gap-1 text-amber-300">• <Star className="h-3.5 w-3.5 fill-current" /> {avg.toFixed(1)}</span>}
                <span>• {m.views} views</span>
              </div>
              <p className="mt-4 text-muted-foreground max-w-2xl">{m.description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={startVideo} disabled={!m.video_url} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-[0_0_30px_oklch(0.68_0.24_320/0.45)] disabled:opacity-50">
                  <Play className="h-4 w-4 fill-current" /> Play
                </button>
                {m.trailer_url && (
                  <button onClick={() => setPlaying("trailer")} className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass hover:bg-white/10">
                    Trailer
                  </button>
                )}
                <button onClick={onToggleWl} className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass hover:bg-white/10">
                  {wlQ.data ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                  {wlQ.data ? "On list" : "Watchlist"}
                </button>
                {m.video_url && (
                  <a href={m.video_url} download className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass hover:bg-white/10">
                    <Download className="h-4 w-4" /> Download
                  </a>
                )}
                <button onClick={onShare} className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass hover:bg-white/10">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {playing && (
            <Player url={playing === "trailer" ? m.trailer_url! : m.video_url!} onClose={() => setPlaying(null)} title={m.title} />
          )}

          <section className="mt-12 grid md:grid-cols-[1fr_360px] gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Reviews ({reviewsQ.data?.length ?? 0})</h2>
              <div className="space-y-3">
                {(reviewsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Be the first to review.</p>}
                {(reviewsQ.data ?? []).map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.username}</span>
                      <span className="text-amber-300 inline-flex items-center gap-0.5 text-sm">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                      </span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={onSubmitReview} className="glass rounded-2xl p-5 h-fit">
              <h3 className="font-bold mb-3">Leave a review</h3>
              <label className="text-xs text-muted-foreground">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 mb-3 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-primary/60 text-sm" />
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setRating(n)}>
                    <Star className={"h-6 w-6 " + (n <= rating ? "text-amber-300 fill-current" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts…" rows={4} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-primary/60 text-sm resize-none" />
              <button className="mt-3 w-full py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">Post review</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Player({ url, onClose, title }: { url: string; onClose: () => void; title: string }) {
  const isHls = /\.m3u8(\?|$)/i.test(url);
  const isDash = /\.mpd(\?|$)/i.test(url);
  const isYouTube = /youtu\.be|youtube\.com/.test(url);

  useEffect(() => {
    if (!isHls) return;
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v) return;
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; }
    let hls: { destroy: () => void } | null = null;
    import("https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js" as string)
      .then(() => {
        const Hls = (window as unknown as { Hls?: { isSupported: () => boolean; new (): { loadSource: (u: string) => void; attachMedia: (v: HTMLVideoElement) => void; destroy: () => void } } }).Hls;
        if (Hls && Hls.isSupported()) {
          const inst = new Hls();
          inst.loadSource(url);
          inst.attachMedia(v);
          hls = inst;
        }
      })
      .catch(() => { v.src = url; });
    return () => { hls?.destroy(); };
  }, [url, isHls]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-[0_30px_80px_oklch(0_0_0/0.8)]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full glass text-sm">Close</button>
        {isYouTube ? (
          <iframe
            src={toYouTubeEmbed(url)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : isDash ? (
          <video id="cv-player" src={url} controls autoPlay className="h-full w-full" />
        ) : (
          <video id="cv-player" src={isHls ? undefined : url} controls autoPlay className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  } catch { return url; }
}
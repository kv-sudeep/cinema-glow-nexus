import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, Compass, Download, Heart, Languages, ListVideo, MessageSquare, Maximize2, Minimize2, Pause, Play, Rewind, FastForward, Share2, Star, Sun, Volume2, VolumeX, Gauge } from "lucide-react";
import { addReview, getMovie, incrementViews, isOnWatchlist, listReviews, logView, toggleWatchlist } from "@/lib/movies";
import { getMovieStreamMeta } from "@/lib/admin.functions";
import { getDeviceId, getDisplayName, getRole, setDisplayName } from "@/lib/auth";
import { addDownload, getProgress, setProgress } from "@/lib/progress";
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
  const [autoFs, setAutoFs] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(() => getDisplayName());
  const [dlOpen, setDlOpen] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{ kind: "youtube" | "hls" | "dash" | "video" | "embed" | "none"; ext: string; youtubeUrl: string | null; embedUrl: string | null; languages: string[]; language: string | null } | null>(null);
  const [lang, setLang] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!movieQ.data?.has_video) { setVideoMeta(null); return; }
    getMovieStreamMeta({ data: { id, lang: lang ?? undefined } })
      .then((m) => { if (!cancelled) setVideoMeta(m as typeof videoMeta extends infer T ? T : never); })
      .catch(() => { if (!cancelled) setVideoMeta({ kind: "video", ext: "mp4", youtubeUrl: null, embedUrl: null, languages: [], language: null }); });
    return () => { cancelled = true; };
  }, [id, movieQ.data?.has_video, lang]);

  const m = movieQ.data;
  const avg = useMemo(() => {
    const arr = reviewsQ.data ?? [];
    if (arr.length === 0) return null;
    return arr.reduce((s, r) => s + r.rating, 0) / arr.length;
  }, [reviewsQ.data]);

  const startVideo = () => {
    setPlaying("video");
    logView(device, id).catch(() => {});
    if (movieQ.data) incrementViews(id, movieQ.data.views).catch(() => {});
  };

  // Auto-start playback in fullscreen when arriving from a movie card (#play hash)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!movieQ.data?.has_video) return;
    if (window.location.hash !== "#play") return;
    if (playing) return;
    setAutoFs(true);
    startVideo();
    try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieQ.data?.has_video]);

  if (!m) {
    return (
      <div className="min-h-screen"><AppNav />
        <div className="max-w-4xl mx-auto p-10 text-center text-muted-foreground">{movieQ.isLoading ? "Loading…" : "Movie not found"}</div>
      </div>
    );
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
    const cur = m;
    if (!cur) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ title: cur.title, url }); return; } catch {}
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
                {m.trailer_url && (
                  <button onClick={() => setPlaying("trailer")} className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass hover:bg-white/10">
                    Trailer
                  </button>
                )}
                {m.has_video && (
                  <button onClick={() => { setAutoFs(true); startVideo(); }} title="Play" aria-label="Play" className="h-11 w-11 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground inline-flex items-center justify-center shadow-[0_0_30px_oklch(0.68_0.24_320/0.45)]">
                    <Play className="h-5 w-5 fill-current" />
                  </button>
                )}
                <button onClick={onToggleWl} title={wlQ.data ? "On watchlist" : "Watchlist"} aria-label={wlQ.data ? "On watchlist" : "Watchlist"} className="h-11 w-11 rounded-full glass hover:bg-white/10 inline-flex items-center justify-center">
                  {wlQ.data ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </button>
                {m.has_video && videoMeta?.kind !== "embed" && videoMeta?.kind !== "youtube" && (
                  <button onClick={() => setDlOpen(true)} title="Download" aria-label="Download" className="h-11 w-11 rounded-full glass hover:bg-white/10 inline-flex items-center justify-center">
                    <Download className="h-5 w-5" />
                  </button>
                )}
                <button onClick={onShare} title="Share" aria-label="Share" className="h-11 w-11 rounded-full glass hover:bg-white/10 inline-flex items-center justify-center">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              {videoMeta && videoMeta.languages.length > 1 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Languages className="h-3.5 w-3.5" /> Audio / Language:
                  </span>
                  {videoMeta.languages.map((L) => {
                    const active = (lang ?? videoMeta.language) === L;
                    return (
                      <button
                        key={L}
                        onClick={() => setLang(L)}
                        className={
                          "px-3 py-1 rounded-full text-xs border transition " +
                          (active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "glass border-white/10 hover:bg-white/10")
                        }
                      >
                        {L}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {playing && (
            <Player
              autoFullscreen={playing === "video" && autoFs}
              url={
                playing === "trailer"
                  ? m.trailer_url!
                  : videoMeta?.kind === "youtube" && videoMeta.youtubeUrl
                  ? videoMeta.youtubeUrl
                  : videoMeta?.kind === "embed" && videoMeta.embedUrl
                  ? videoMeta.embedUrl
                  : `/api/stream/${m.id}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`
              }
              probeUrl={
                playing === "trailer"
                  ? m.trailer_url!
                  : videoMeta?.youtubeUrl
                  ?? videoMeta?.embedUrl
                  ?? `stream.${videoMeta?.ext || "mp4"}`
              }
              kind={playing === "trailer" ? undefined : videoMeta?.kind}
              onClose={() => setPlaying(null)}
              title={m.title}
              movieId={playing === "video" ? m.id : undefined}
            />
          )}

          {dlOpen && m.has_video && videoMeta?.kind !== "embed" && videoMeta?.kind !== "youtube" && (
            <DownloadDialog
              movieId={m.id}
              title={m.title}
              streamUrl={`/api/stream/${m.id}`}
              ext={videoMeta?.ext || "mp4"}
              onClose={() => setDlOpen(false)}
            />
          )}

          <section className="mt-12 grid md:grid-cols-[1fr_360px] gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4 inline-flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Reviews ({reviewsQ.data?.length ?? 0})</h2>
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

function Player({ url, probeUrl, onClose, title, movieId, kind, autoFullscreen }: { url: string; probeUrl: string; onClose: () => void; title: string; movieId?: string; kind?: "youtube" | "hls" | "dash" | "video" | "embed" | "none"; autoFullscreen?: boolean }) {
  const probe = probeUrl || url;
  const isHls = /\.m3u8(\?|$)/i.test(probe);
  const isDash = /\.mpd(\?|$)/i.test(probe);
  const isYouTube = kind === "youtube" || /youtu\.be|youtube\.com/.test(probe);
  const isEmbed = kind === "embed";
  const [theater, setTheater] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeControls = isYouTube || isEmbed;

  useEffect(() => {
    if (nativeControls) return;
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (v) v.volume = Math.max(0, Math.min(1, volume / 100));
  }, [volume, nativeControls, url]);

  // Auto-hide UI overlay after inactivity
  const bumpUi = () => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 3500);
  };
  useEffect(() => { bumpUi(); return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, []);

  // Wire custom controls to <video>
  useEffect(() => {
    if (nativeControls) return;
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrent(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
    };
  }, [nativeControls, url]);

  useEffect(() => {
    if (nativeControls) return;
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (v) v.playbackRate = speed;
  }, [speed, nativeControls, url]);

  const togglePlay = () => {
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };
  const seek = (delta: number) => {
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta));
  };
  const scrubTo = (val: number) => {
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v || !v.duration) return;
    v.currentTime = (val / 100) * v.duration;
  };
  const fmtTime = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  async function toggleFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  }

  // Auto-enter fullscreen when opened from a movie card
  useEffect(() => {
    if (!autoFullscreen) return;
    const el = wrapRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.requestFullscreen?.().catch(() => {});
    }, 120);
    return () => clearTimeout(t);
  }, [autoFullscreen]);

  async function handleBack() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    onClose();
  }

  useEffect(() => {
    if (!isHls) return;
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v) return;
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; }
    let hls: { destroy: () => void } | null = null;
    const loadHls = () => new Promise<void>((resolve, reject) => {
      const w = window as unknown as { Hls?: unknown };
      if (w.Hls) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("hls load failed"));
      document.head.appendChild(s);
    });
    loadHls().then(() => {
      const Hls = (window as unknown as { Hls?: { isSupported: () => boolean; new (): { loadSource: (u: string) => void; attachMedia: (v: HTMLVideoElement) => void; destroy: () => void } } }).Hls;
      if (Hls && Hls.isSupported()) {
        const inst = new Hls();
        inst.loadSource(url);
        inst.attachMedia(v);
        hls = inst;
      } else {
        v.src = url;
      }
    }).catch(() => { v.src = url; });
    return () => { hls?.destroy(); };
  }, [url, isHls]);

  // Resume + persist progress (skipped for YouTube embeds)
  useEffect(() => {
    if (isYouTube || !movieId) return;
    const v = document.getElementById("cv-player") as HTMLVideoElement | null;
    if (!v) return;
    const saved = getProgress(movieId);
    const onLoaded = () => {
      if (saved && saved.t > 5 && saved.t < v.duration - 10) {
        try { v.currentTime = saved.t; } catch {}
      }
    };
    const onTime = () => {
      if (v.duration > 0) setProgress(movieId, v.currentTime, v.duration);
    };
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      if (v.duration > 0) setProgress(movieId, v.currentTime, v.duration);
    };
  }, [movieId, isYouTube, url]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        ref={wrapRef}
        className={
          "relative bg-black rounded-2xl overflow-hidden shadow-[0_30px_80px_oklch(0_0_0/0.8)] " +
          (theater || isEmbed
            ? "w-full h-[100dvh] sm:h-[92vh] max-w-none"
            : "w-full max-w-5xl aspect-video")
        }
        onClick={(e) => e.stopPropagation()}
        onMouseMove={bumpUi}
        onTouchStart={bumpUi}
      >
        {isYouTube ? (
          <iframe
            src={toYouTubeEmbed(probe)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : isEmbed ? (
          <iframe
            src={url}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="h-full w-full"
          />
        ) : (
          <video
            id="cv-player"
            src={isHls ? undefined : url}
            controlsList="nodownload"
            autoPlay
            playsInline
            preload="metadata"
            onClick={togglePlay}
            className="h-full w-full bg-black"
            style={{ filter: `brightness(${brightness}%)` }}
          />
        )}

        {/* Custom overlay UI — hidden for iframe/embed players */}
        {!nativeControls && (
          <div
            className={
              "absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 " +
              (uiVisible ? "opacity-100" : "opacity-0")
            }
          >
            {/* Top gradient + bar */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
            <div className="absolute top-0 inset-x-0 flex items-start justify-between p-3 sm:p-4 pointer-events-auto">
              <div className="flex items-start gap-2 min-w-0">
                <button onClick={handleBack} title="Back" aria-label="Back" className="h-10 w-10 rounded-full hover:bg-white/10 inline-flex items-center justify-center shrink-0">
                  <ArrowLeft className="h-6 w-6 text-white" />
                </button>
                <div className="min-w-0 mt-1.5">
                  <div className="text-white font-semibold text-sm sm:text-base truncate">{title}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setTheater((v) => !v)} title="Theater" className="h-10 w-10 rounded-full hover:bg-white/10 inline-flex items-center justify-center">
                  {theater ? <Minimize2 className="h-5 w-5 text-white" /> : <Maximize2 className="h-5 w-5 text-white" />}
                </button>
                <button onClick={toggleFullscreen} title="Fullscreen" className="h-10 w-10 rounded-full hover:bg-white/10 inline-flex items-center justify-center">
                  <Maximize2 className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Left vertical brightness */}
            <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto select-none">
              <Sun className="h-5 w-5 text-white/90" />
              <div className="h-36 w-6 flex items-center justify-center">
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  aria-label="Brightness"
                  className="w-36 accent-white -rotate-90 cursor-pointer"
                />
              </div>
            </div>

            {/* Right vertical volume */}
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto select-none">
              {volume === 0 ? <VolumeX className="h-5 w-5 text-white/90" /> : <Volume2 className="h-5 w-5 text-white/90" />}
              <div className="h-36 w-6 flex items-center justify-center">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="w-36 accent-white -rotate-90 cursor-pointer"
                />
              </div>
            </div>

            {/* Center controls */}
            <div className="absolute inset-0 flex items-center justify-center gap-10 sm:gap-16 pointer-events-none">
              <button onClick={() => seek(-10)} title="Rewind 10s" aria-label="Rewind 10 seconds" className="pointer-events-auto text-white/90 hover:text-white transition">
                <Rewind className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.5} />
              </button>
              <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"} className="pointer-events-auto text-white/95 hover:text-white transition">
                {isPlaying ? <Pause className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.25} /> : <Play className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.25} />}
              </button>
              <button onClick={() => seek(10)} title="Forward 10s" aria-label="Forward 10 seconds" className="pointer-events-auto text-white/90 hover:text-white transition">
                <FastForward className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.5} />
              </button>
            </div>

            {/* Bottom gradient + progress + actions */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 pointer-events-auto">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={duration ? (current / duration) * 100 : 0}
                  onChange={(e) => scrubTo(Number(e.target.value))}
                  aria-label="Seek"
                  className="flex-1 accent-primary cursor-pointer"
                />
                <span className="text-white/90 text-xs sm:text-sm tabular-nums">
                  {fmtTime(current)} / {fmtTime(duration)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-white/90">
                <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                  <button className="inline-flex items-center gap-1.5 hover:text-white">
                    <Compass className="h-4 w-4" /> Watch Next
                  </button>
                  <button className="inline-flex items-center gap-1.5 hover:text-white">
                    <ListVideo className="h-4 w-4" /> Episodes
                  </button>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm relative">
                  <button onClick={() => setSpeedOpen((v) => !v)} className="inline-flex items-center gap-1.5 hover:text-white">
                    <Gauge className="h-4 w-4" /> Speed <span className="text-white/70">{speed}x</span>
                  </button>
                  {speedOpen && (
                    <div className="absolute right-16 bottom-8 glass rounded-xl p-1 flex flex-col text-xs">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSpeed(s); setSpeedOpen(false); }}
                          className={"px-3 py-1.5 rounded-lg text-left hover:bg-white/10 " + (speed === s ? "text-primary" : "")}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setLiked((v) => !v)} className="inline-flex items-center gap-1.5 hover:text-white">
                    <Heart className={"h-4 w-4 " + (liked ? "fill-primary text-primary" : "")} /> Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadDialog({ movieId, title, streamUrl, ext, onClose }: { movieId: string; title: string; streamUrl: string; ext: string; onClose: () => void }) {
  const [size, setSize] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileName = useMemo(() => {
    const safe = title.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "") || "movie";
    return `${safe}.${(ext || "mkv").toLowerCase()}`;
  }, [title, ext]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(streamUrl, { method: "HEAD" });
        const len = r.headers.get("content-length");
        if (!cancelled && len) setSize(parseInt(len, 10));
      } catch (e) {
        if (!cancelled) setErr("Could not read file size");
      }
    })();
    return () => { cancelled = true; };
  }, [streamUrl]);

  function fmt(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  function confirmDownload() {
    addDownload(movieId, fileName, size);
    const a = document.createElement("a");
    a.href = streamUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-1">Download movie?</h3>
        <p className="text-xs text-muted-foreground mb-4">The file will be saved to your device.</p>
        <div className="space-y-2 text-sm mb-5">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">File name</span>
            <span className="font-mono text-xs truncate max-w-[60%]" title={fileName}>{fileName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Size</span>
            <span>{size != null ? fmt(size) : err ?? "Calculating…"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Format</span>
            <span className="uppercase">{fileName.split(".").pop()}</span>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10">Cancel</button>
          <button onClick={confirmDownload} className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
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
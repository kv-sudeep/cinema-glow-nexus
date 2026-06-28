import { Link } from "@tanstack/react-router";
import { Play, Plus } from "lucide-react";
import type { Movie } from "@/lib/movies";

export function HeroBanner({ movie, rating }: { movie: Movie; rating?: number | null }) {
  return (
    <div className="relative mx-2 sm:mx-4 mt-3 rounded-2xl overflow-hidden">
      <Link to="/movie/$id" params={{ id: movie.id }} className="block">
        <div className="relative aspect-[3/4] sm:aspect-[16/9] w-full">
          {movie.poster_url ? (
            <img src={movie.poster_url} alt={movie.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          {rating != null && (
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 backdrop-blur px-2 py-1 text-xs font-bold">
              <span className="text-amber-300">IMDb</span>
              <span>{rating.toFixed(1)}</span>
            </div>
          )}

          <div className="absolute left-4 right-24 bottom-4 sm:bottom-8">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg">
              {movie.title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-foreground/80 flex flex-wrap items-center gap-x-2">
              {movie.year && <span>{movie.year}</span>}
              {movie.year && movie.genre && <span className="opacity-60">•</span>}
              {movie.genre && <span>{movie.genre}</span>}
            </p>
          </div>
        </div>
      </Link>

      <div className="absolute right-3 bottom-4 sm:bottom-8 flex flex-col gap-3">
        <Link
          to="/watchlist"
          className="h-11 w-11 rounded-full bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center hover:bg-white/25 transition"
          aria-label="Add to watchlist"
        >
          <Plus className="h-5 w-5" />
        </Link>
        <Link
          to="/movie/$id"
          params={{ id: movie.id }}
          className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition"
          aria-label="Play"
        >
          <Play className="h-5 w-5 fill-current" />
        </Link>
      </div>
    </div>
  );
}

export function PosterCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to="/movie/$id"
      params={{ id: movie.id }}
      className="block w-[140px] sm:w-[170px] group"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-white/5">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <span className="text-2xl font-bold neon-text">{movie.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium line-clamp-1">{movie.title}</h3>
        {movie.genre && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{movie.genre}</p>
        )}
      </div>
    </Link>
  );
}

export function LandscapeCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to="/movie/$id"
      params={{ id: movie.id }}
      className="block w-[260px] sm:w-[320px] group"
    >
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-card border border-white/5">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <span className="text-3xl font-bold neon-text">{movie.title.slice(0, 1)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-sm font-semibold line-clamp-1 drop-shadow">{movie.title}</h3>
          {movie.genre && (
            <p className="text-[11px] text-white/80 line-clamp-1">{movie.genre}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
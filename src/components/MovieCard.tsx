import { Link } from "@tanstack/react-router";
import { Play, Star } from "lucide-react";
import type { Movie } from "@/lib/movies";

export function MovieCard({ movie, avgRating }: { movie: Movie; avgRating?: number | null }) {
  return (
    <Link
      to="/movie/$id"
      params={{ id: movie.id }}
      className="group block tilt-3d"
    >
      <div className="tilt-3d-inner glow-card overflow-hidden rounded-2xl">
        <div className="relative aspect-[2/3] overflow-hidden">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-3xl neon-text font-bold">{movie.title.slice(0, 1)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            {movie.year && (
              <span className="text-[10px] px-2 py-0.5 rounded-full glass">{movie.year}</span>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <div className="rounded-full bg-primary/90 p-4 shadow-[0_0_30px_oklch(0.68_0.24_320/0.7)]">
              <Play className="h-6 w-6 text-primary-foreground fill-current" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{movie.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              {movie.genre && <span>{movie.genre}</span>}
              {avgRating != null && (
                <span className="inline-flex items-center gap-0.5 text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {avgRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
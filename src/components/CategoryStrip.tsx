import { useMemo } from "react";

export const DEFAULT_CATEGORIES = [
  "Kannada",
  "Telugu",
  "Hindi",
  "Tamil",
  "Malayalam",
  "English",
  "Action",
  "Comedy",
  "Drama",
  "Thriller",
  "Romance",
  "Sci-Fi",
  "Horror",
  "Animation",
];

export function CategoryStrip({
  active,
  onSelect,
  extra = [],
}: {
  active: string | null;
  onSelect: (cat: string | null) => void;
  extra?: string[];
}) {
  const cats = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    for (const e of extra) if (e) set.add(e);
    return Array.from(set);
  }, [extra]);

  const loop = [...cats, ...cats];

  return (
    <div className="relative marquee-mask overflow-hidden py-1">
      <div className="marquee-track gap-3">
        {loop.map((c, i) => {
          const isActive = active === c;
          return (
            <button
              key={c + i}
              onClick={() => onSelect(isActive ? null : c)}
              className={
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border " +
                (isActive
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent shadow-[0_0_20px_oklch(0.68_0.24_320/0.5)]"
                  : "glass border-white/10 text-foreground/80 hover:text-foreground hover:border-primary/40")
              }
            >
              {c}
            </button>
          );
        })}
      </div>
      {active && (
        <button
          onClick={() => onSelect(null)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-xs px-3 py-1 rounded-full bg-background/80 border border-white/10 hover:border-primary/50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
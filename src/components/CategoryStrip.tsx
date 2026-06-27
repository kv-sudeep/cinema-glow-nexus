import { useMemo } from "react";
import { TrendingUp } from "lucide-react";

export const DEFAULT_CATEGORIES = [
  "Kannada",
  "Telugu",
  "Hindi",
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

  return (
    <div className="flex flex-col gap-2 py-1">
      <button
        onClick={() => onSelect(null)}
        className={
          "w-full inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition border " +
          (active === null
            ? "bg-white/5 border-white/30 text-foreground"
            : "bg-transparent border-white/10 text-foreground/70 hover:text-foreground")
        }
      >
        <TrendingUp className="h-3.5 w-3.5" /> Trending
      </button>
      {cats.map((c) => {
        const isActive = active === c;
        return (
          <button
            key={c}
            onClick={() => onSelect(isActive ? null : c)}
            className={
              "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition border " +
              (isActive
                ? "bg-white/5 border-white/30 text-foreground"
                : "bg-transparent border-white/10 text-foreground/70 hover:text-foreground hover:border-white/20")
            }
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
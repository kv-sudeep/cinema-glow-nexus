import kannada from "@/assets/cat/kannada.jpg";
import telugu from "@/assets/cat/telugu.jpg";
import hindi from "@/assets/cat/hindi.jpg";
import tamil from "@/assets/cat/tamil.jpg";
import malayalam from "@/assets/cat/malayalam.jpg";
import english from "@/assets/cat/english.jpg";
import action from "@/assets/cat/action.jpg";
import comedy from "@/assets/cat/comedy.jpg";
import drama from "@/assets/cat/drama.jpg";
import thriller from "@/assets/cat/thriller.jpg";
import romance from "@/assets/cat/romance.jpg";
import scifi from "@/assets/cat/sci-fi.jpg";
import horror from "@/assets/cat/horror.jpg";
import animation from "@/assets/cat/animation.jpg";

export const CATEGORY_BANNERS: { name: string; img: string }[] = [
  { name: "Kannada", img: kannada },
  { name: "Telugu", img: telugu },
  { name: "Hindi", img: hindi },
  { name: "Tamil", img: tamil },
  { name: "Malayalam", img: malayalam },
  { name: "English", img: english },
  { name: "Action", img: action },
  { name: "Comedy", img: comedy },
  { name: "Drama", img: drama },
  { name: "Thriller", img: thriller },
  { name: "Romance", img: romance },
  { name: "Sci-Fi", img: scifi },
  { name: "Horror", img: horror },
  { name: "Animation", img: animation },
];

export const CATEGORY_BANNER_MAP: Record<string, string> = Object.fromEntries(
  CATEGORY_BANNERS.map((c) => [c.name.toLowerCase(), c.img])
);

export function CategoryBannerHeader({
  name,
  count,
  onSelect,
}: {
  name: string;
  count: number;
  onSelect?: (cat: string) => void;
}) {
  const img = CATEGORY_BANNER_MAP[name.toLowerCase()];
  const inner = (
    <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden border border-white/10 group">
      {img && (
        <img
          src={img}
          alt={name}
          loading="lazy"
          width={1280}
          height={704}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-5">
        <h3 className="text-xl sm:text-2xl font-extrabold drop-shadow-lg">{name}</h3>
        <span className="text-xs sm:text-sm text-muted-foreground bg-black/40 rounded-full px-3 py-1 backdrop-blur">
          {count} {count === 1 ? "movie" : "movies"}
        </span>
      </div>
    </div>
  );
  return onSelect ? (
    <button onClick={() => onSelect(name)} className="block w-full text-left mb-3">
      {inner}
    </button>
  ) : (
    <div className="mb-3">{inner}</div>
  );
}
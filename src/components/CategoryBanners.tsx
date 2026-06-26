import { Link } from "@tanstack/react-router";
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

export function CategoryBanners({
  onSelect,
}: {
  onSelect?: (cat: string) => void;
}) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">Browse by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORY_BANNERS.map((c) => {
          const inner = (
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 group">
              <img
                src={c.img}
                alt={c.name}
                loading="lazy"
                width={1280}
                height={704}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute left-3 bottom-2 right-3">
                <h3 className="text-lg sm:text-xl font-extrabold drop-shadow-lg">{c.name}</h3>
              </div>
            </div>
          );
          return onSelect ? (
            <button key={c.name} onClick={() => onSelect(c.name)} className="text-left">
              {inner}
            </button>
          ) : (
            <Link key={c.name} to="/browse" className="block">
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
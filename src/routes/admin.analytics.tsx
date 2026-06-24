import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analytics } from "@/lib/movies";
import { Eye, Film, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const q = useQuery({ queryKey: ["analytics"], queryFn: analytics });
  const d = q.data;
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={<Film className="h-5 w-5" />} label="Movies" value={d?.movieCount ?? "—"} />
        <Stat icon={<Eye className="h-5 w-5" />} label="Total views" value={d?.viewCount ?? "—"} />
        <Stat icon={<MessageSquare className="h-5 w-5" />} label="Reviews" value={d?.reviewCount ?? "—"} />
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold mb-3">Recent activity</h3>
        <ul className="space-y-2 text-sm">
          {(d?.recent ?? []).map((r, i) => {
            const row = r as { watched_at: string; movies?: { title?: string } | null };
            return (
              <li key={i} className="flex justify-between border-b border-white/5 pb-2">
                <span>Someone watched <strong>{row.movies?.title ?? "a movie"}</strong></span>
                <span className="text-muted-foreground">{new Date(row.watched_at).toLocaleString()}</span>
              </li>
            );
          })}
          {(!d || d.recent.length === 0) && <li className="text-muted-foreground">No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glow-card rounded-2xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon} {label}</div>
      <div className="mt-2 text-3xl font-extrabold neon-text">{value}</div>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { listMovies } from "@/lib/movies";
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react";

export function LibraryStatus() {
  const q = useQuery({ queryKey: ["movies"], queryFn: listMovies });
  const count = q.data?.length ?? 0;

  let tone = "border-white/10 bg-white/5";
  let Icon = Database;
  let title = "Library";
  let msg = "";

  if (q.isLoading) {
    Icon = Loader2;
    title = "Checking library…";
    msg = "Reading /rest/v1/movies";
  } else if (q.isError) {
    tone = "border-destructive/40 bg-destructive/10";
    Icon = AlertCircle;
    title = "Library request failed";
    msg = (q.error as Error)?.message ?? "Unknown error";
  } else if (count === 0) {
    tone = "border-amber-500/40 bg-amber-500/10";
    Icon = AlertCircle;
    title = "Library is empty (0 movies)";
    msg = "Hero banner needs at least 1 movie. Add one in Admin to render it.";
  } else {
    tone = "border-emerald-500/30 bg-emerald-500/10";
    Icon = CheckCircle2;
    title = `${count} movie${count === 1 ? "" : "s"} loaded`;
    msg = "/rest/v1/movies responded OK";
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${tone}`}>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${q.isLoading ? "animate-spin" : ""}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{msg}</div>
      </div>
      <div className="text-xs font-mono text-muted-foreground shrink-0">count: {count}</div>
    </div>
  );
}
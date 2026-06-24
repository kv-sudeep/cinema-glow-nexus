import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2, Upload, X } from "lucide-react";
import { createMovie, deleteMovie, listMovies, type Movie, updateMovie, uploadAsset } from "@/lib/movies";
import { toast } from "sonner";
import { CategoryStrip } from "@/components/CategoryStrip";

export const Route = createFileRoute("/admin/")({
  component: AdminLibrary,
});

type FormState = {
  title: string;
  description: string;
  poster_url: string;
  trailer_url: string;
  video_url: string;
  genre: string;
  year: string;
  duration_min: string;
};

const empty: FormState = { title: "", description: "", poster_url: "", trailer_url: "", video_url: "", genre: "", year: "", duration_min: "" };

function AdminLibrary() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["movies"], queryFn: listMovies });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const movies = q.data ?? [];
  const extraCats = useMemo(
    () => Array.from(new Set(movies.map((m) => m.genre).filter(Boolean) as string[])),
    [movies]
  );
  const filtered = useMemo(
    () => movies.filter((m) => {
      const matchSearch = (m.title + " " + (m.genre || "")).toLowerCase().includes(search.toLowerCase());
      const matchCat = !category || (m.genre || "").toLowerCase() === category.toLowerCase();
      return matchSearch && matchCat;
    }),
    [movies, search, category]
  );

  function startCreate() { setEditing(null); setOpen(true); }
  function startEdit(m: Movie) { setEditing(m); setOpen(true); }
  async function onDelete(m: Movie) {
    if (!confirm(`Delete "${m.title}"?`)) return;
    try { await deleteMovie(m.id); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["movies"] }); }
    catch { toast.error("Delete failed"); }
  }

  return (
    <div className="space-y-6">
      <CategoryStrip active={category} onSelect={setCategory} extra={extraCats} />
      <div className="flex flex-wrap gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search library…" className="flex-1 min-w-[200px] px-4 py-2.5 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:border-primary/60" />
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
          <Plus className="h-4 w-4" /> New movie
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4 hidden md:table-cell">Genre</th>
              <th className="p-4 hidden md:table-cell">Year</th>
              <th className="p-4">Views</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">{q.isLoading ? "Loading…" : "No movies yet."}</td></tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {m.poster_url ? <img src={m.poster_url} alt="" className="h-12 w-9 rounded object-cover" /> : <div className="h-12 w-9 rounded bg-white/5" />}
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">{m.description}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell text-muted-foreground">{m.genre}</td>
                <td className="p-4 hidden md:table-cell text-muted-foreground">{m.year}</td>
                <td className="p-4 text-muted-foreground">{m.views}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(m)} className="p-2 rounded-lg hover:bg-white/10"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(m)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <MovieDialog initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["movies"] }); }} />}
    </div>
  );
}

function MovieDialog({ initial, onClose, onSaved }: { initial: Movie | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(() => initial ? {
    title: initial.title, description: initial.description ?? "", poster_url: initial.poster_url ?? "",
    trailer_url: initial.trailer_url ?? "", video_url: initial.video_url ?? "", genre: initial.genre ?? "",
    year: initial.year ? String(initial.year) : "", duration_min: initial.duration_min ? String(initial.duration_min) : "",
  } : empty);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ poster?: number; video?: number; trailer?: number }>({});

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function doUpload(kind: "poster" | "video" | "trailer", file: File) {
    const maxMb = kind === "poster" ? 10 : 500;
    if (file.size > maxMb * 1024 * 1024) { toast.error(`File too big (max ${maxMb}MB)`); return; }
    if (kind === "poster" && !file.type.startsWith("image/")) { toast.error("Poster must be an image"); return; }
    if (kind !== "poster" && !file.type.startsWith("video/")) { toast.error("Must be a video file"); return; }
    setProgress((p) => ({ ...p, [kind]: 5 }));
    const t = setInterval(() => setProgress((p) => ({ ...p, [kind]: Math.min(90, (p[kind] ?? 5) + 10) })), 250);
    try {
      const url = await uploadAsset(file, kind);
      clearInterval(t);
      setProgress((p) => ({ ...p, [kind]: 100 }));
      if (kind === "poster") set("poster_url", url);
      if (kind === "video") set("video_url", url);
      if (kind === "trailer") set("trailer_url", url);
      toast.success(`${kind} uploaded`);
      setTimeout(() => setProgress((p) => ({ ...p, [kind]: undefined })), 1500);
    } catch (e) {
      clearInterval(t);
      setProgress((p) => ({ ...p, [kind]: undefined }));
      toast.error(`Upload failed: ${(e as Error).message}`);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      poster_url: form.poster_url.trim() || null,
      trailer_url: form.trailer_url.trim() || null,
      video_url: form.video_url.trim() || null,
      genre: form.genre.trim() || null,
      year: form.year ? Number(form.year) : null,
      duration_min: form.duration_min ? Number(form.duration_min) : null,
    };
    try {
      if (initial) await updateMovie(initial.id, payload);
      else await createMovie(payload);
      toast.success("Saved");
      onSaved();
    } catch (e) { toast.error("Save failed: " + (e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="my-8 w-full max-w-2xl glass rounded-3xl p-6 space-y-4 relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"><X className="h-4 w-4" /></button>
        <h2 className="text-2xl font-bold">{initial ? "Edit movie" : "Add new movie"}</h2>

        <Field label="Title *"><input value={form.title} onChange={(e) => set("title", e.target.value)} className="inp" /></Field>
        <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="inp resize-none" /></Field>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Category / Language"><input value={form.genre} onChange={(e) => set("genre", e.target.value)} className="inp" placeholder="Kannada, Telugu, Hindi, Action…" list="cat-suggest" /></Field>
          <Field label="Year"><input value={form.year} onChange={(e) => set("year", e.target.value)} type="number" className="inp" /></Field>
          <Field label="Duration (min)"><input value={form.duration_min} onChange={(e) => set("duration_min", e.target.value)} type="number" className="inp" /></Field>
        </div>

        <AssetField label="Poster" url={form.poster_url} onUrl={(u) => set("poster_url", u)} progress={progress.poster} onFile={(f) => doUpload("poster", f)} accept="image/*" />
        <AssetField label="Trailer (URL or video file)" url={form.trailer_url} onUrl={(u) => set("trailer_url", u)} progress={progress.trailer} onFile={(f) => doUpload("trailer", f)} accept="video/*" hint="YouTube links work too" />
        <AssetField label="Movie video (URL, HLS .m3u8, DASH .mpd, or file)" url={form.video_url} onUrl={(u) => set("video_url", u)} progress={progress.video} onFile={(f) => doUpload("video", f)} accept="video/*" />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full glass">Cancel</button>
          <button disabled={busy} className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold disabled:opacity-50">
            {busy ? "Saving…" : "Save movie"}
          </button>
        </div>

        <style>{`.inp{width:100%;padding:.6rem .85rem;border-radius:.75rem;background:oklch(1 0 0 / .05);border:1px solid oklch(1 0 0 / .1);outline:none;font-size:.9rem}.inp:focus{border-color:oklch(0.68 0.24 320 / .6)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}

function AssetField({ label, url, onUrl, onFile, progress, accept, hint }: { label: string; url: string; onUrl: (s: string) => void; onFile: (f: File) => void; progress?: number; accept: string; hint?: string }) {
  return (
    <div>
      <label className="block">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="mt-1 flex gap-2">
          <input value={url} onChange={(e) => onUrl(e.target.value)} placeholder="https://…" className="inp flex-1" />
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass hover:bg-white/10 text-sm">
            <Upload className="h-4 w-4" /> Upload
            <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
        </div>
      </label>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
      {progress != null && (
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
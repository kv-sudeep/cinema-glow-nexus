// Per-device playback progress + downloads, persisted in localStorage.

const PROGRESS_KEY = "mv_progress_v1"; // { [movieId]: { t: seconds, d: duration, at: ts } }
const DOWNLOADS_KEY = "mv_downloads_v1"; // { [movieId]: { name, size, at } }

type ProgressMap = Record<string, { t: number; d: number; at: number }>;
type DownloadsMap = Record<string, { name: string; size: number | null; at: number }>;

function read<T>(key: string): T {
  if (typeof window === "undefined") return {} as T;
  try { return JSON.parse(localStorage.getItem(key) || "{}") as T; }
  catch { return {} as T; }
}
function write<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(v));
}

export function getProgress(id: string) {
  const map = read<ProgressMap>(PROGRESS_KEY);
  return map[id] ?? null;
}
export function setProgress(id: string, t: number, d: number) {
  if (!isFinite(t) || !isFinite(d) || d <= 0) return;
  const map = read<ProgressMap>(PROGRESS_KEY);
  // Drop if essentially complete
  if (t / d > 0.97) { delete map[id]; }
  else { map[id] = { t, d, at: Date.now() }; }
  write(PROGRESS_KEY, map);
}
export function clearProgress(id: string) {
  const map = read<ProgressMap>(PROGRESS_KEY);
  delete map[id];
  write(PROGRESS_KEY, map);
}
export function allProgress(): ProgressMap {
  return read<ProgressMap>(PROGRESS_KEY);
}

export function getDownloads(): DownloadsMap {
  return read<DownloadsMap>(DOWNLOADS_KEY);
}
export function addDownload(id: string, name: string, size: number | null) {
  const map = read<DownloadsMap>(DOWNLOADS_KEY);
  map[id] = { name, size, at: Date.now() };
  write(DOWNLOADS_KEY, map);
}
export function removeDownload(id: string) {
  const map = read<DownloadsMap>(DOWNLOADS_KEY);
  delete map[id];
  write(DOWNLOADS_KEY, map);
}
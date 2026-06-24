const ROLE_KEY = "mv_role";
const DEVICE_KEY = "mv_device";
const NAME_KEY = "mv_name";

export type Role = "admin" | "user";

const PASS_ADMIN = "8884";
const PASS_USER = "5162";

export function checkPassword(code: string): Role | null {
  if (code === PASS_ADMIN) return "admin";
  if (code === PASS_USER) return "user";
  return null;
}

export function setRole(role: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(ROLE_KEY);
  return v === "admin" || v === "user" ? v : null;
}

export function clearRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let v = localStorage.getItem(DEVICE_KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, v);
  }
  return v;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem(NAME_KEY) || "Cinephile";
}

export function setDisplayName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}
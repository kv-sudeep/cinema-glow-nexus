const ROLE_KEY = "mv_role";
const DEVICE_KEY = "mv_device";
const NAME_KEY = "mv_name";
const EXPIRES_KEY = "mv_role_expires";
const ATTEMPTS_KEY = "mv_attempts";
const LOCK_KEY = "mv_locked_until";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000; // 1 minute
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type Role = "admin" | "user";

const PASS_ADMIN = "8884";
const PASS_USER = "5162";

export function checkPassword(code: string): Role | null {
  if (code === PASS_ADMIN) return "admin";
  if (code === PASS_USER) return "user";
  return null;
}

export function setRole(role: Role, remember: boolean = false) {
  if (typeof window === "undefined") return;
  // Clear both stores first so toggling remember works predictably
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  const store = remember ? localStorage : sessionStorage;
  store.setItem(ROLE_KEY, role);
  if (remember) {
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + REMEMBER_MS));
  }
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  // Session takes precedence (active tab), then persistent
  const sessV = sessionStorage.getItem(ROLE_KEY);
  if (sessV === "admin" || sessV === "user") return sessV;
  const v = localStorage.getItem(ROLE_KEY);
  if (v !== "admin" && v !== "user") return null;
  const exp = Number(localStorage.getItem(EXPIRES_KEY) || 0);
  if (exp && Date.now() > exp) {
    clearRole();
    return null;
  }
  return v;
}

export function clearRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

// ---- Attempt tracking / lockout ----

export function getLockRemainingMs(): number {
  if (typeof window === "undefined") return 0;
  const until = Number(localStorage.getItem(LOCK_KEY) || 0);
  const left = until - Date.now();
  return left > 0 ? left : 0;
}

export function getAttempts(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(ATTEMPTS_KEY) || 0);
}

export function recordFailedAttempt(): { attempts: number; lockedMs: number } {
  if (typeof window === "undefined") return { attempts: 0, lockedMs: 0 };
  const n = getAttempts() + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(n));
  if (n >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCK_MS;
    localStorage.setItem(LOCK_KEY, String(until));
    return { attempts: n, lockedMs: LOCK_MS };
  }
  return { attempts: n, lockedMs: 0 };
}

export function resetAttempts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(LOCK_KEY);
}

export const AUTH_LIMITS = { MAX_ATTEMPTS, LOCK_MS };

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
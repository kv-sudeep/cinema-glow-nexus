import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Film, Lock, Sparkles, AlertCircle, ShieldAlert } from "lucide-react";
import {
  checkPassword,
  setRole,
  getRole,
  getLockRemainingMs,
  getAttempts,
  recordFailedAttempt,
  resetAttempts,
  AUTH_LIMITS,
} from "@/lib/auth";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Cineverse" },
      { name: "description", content: "Enter your access code to step into Cineverse." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [lockMs, setLockMs] = useState(0);
  const [attempts, setAttemptsState] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (getRole()) nav({ to: "/browse" });
    inputRef.current?.focus();
    setLockMs(getLockRemainingMs());
    setAttemptsState(getAttempts());
  }, [nav]);

  // Tick down lockout countdown
  useEffect(() => {
    if (lockMs <= 0) return;
    const id = window.setInterval(() => {
      const left = getLockRemainingMs();
      setLockMs(left);
      if (left <= 0) {
        resetAttempts();
        setAttemptsState(0);
        setErr(null);
        window.clearInterval(id);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [lockMs]);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const stillLocked = getLockRemainingMs();
    if (stillLocked > 0) {
      setLockMs(stillLocked);
      setErr(`Too many failed attempts. Try again in ${Math.ceil(stillLocked / 1000)}s.`);
      triggerShake();
      return;
    }

    const trimmed = code.trim();
    if (!trimmed) {
      setErr("Please enter your access code.");
      triggerShake();
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setErr("Access codes are digits only.");
      triggerShake();
      return;
    }
    if (trimmed.length < 4) {
      setErr("Access code must be at least 4 digits.");
      triggerShake();
      return;
    }

    const role = checkPassword(trimmed);
    if (!role) {
      const { attempts: n, lockedMs } = recordFailedAttempt();
      setAttemptsState(n);
      if (lockedMs > 0) {
        setLockMs(lockedMs);
        setErr(`Account locked after ${AUTH_LIMITS.MAX_ATTEMPTS} failed attempts. Try again in ${Math.ceil(lockedMs / 1000)}s.`);
      } else {
        const left = AUTH_LIMITS.MAX_ATTEMPTS - n;
        setErr(`Incorrect access code. ${left} attempt${left === 1 ? "" : "s"} remaining.`);
      }
      triggerShake();
      setCode("");
      return;
    }

    resetAttempts();
    setAttemptsState(0);
    setRole(role, remember);
    nav({ to: "/browse" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      {/* floating orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 -left-10 h-72 w-72 rounded-full bg-primary/40 blur-3xl animate-float-orb" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float-orb" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-fuchsia-500/25 blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10 w-full max-w-md tilt-3d">
        <div className="tilt-3d-inner login-card relative rounded-3xl p-8 sm:p-10 animate-fade-in-up">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 blur-2xl bg-primary/60 rounded-full" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_40px_oklch(0.68_0.24_320/0.6)]">
                <Film className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="neon-text">CINEVERSE</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <Sparkles className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Enter your access code to continue
            </p>
          </div>

          <form onSubmit={onSubmit} className={"mt-8 space-y-4 " + (shake ? "animate-[shake_0.4s]" : "")}>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={code}
                onChange={(e) => { setCode(e.target.value); setErr(null); }}
                disabled={lockMs > 0}
                placeholder="•   •   •   •"
                className="w-full pl-11 pr-4 py-4 text-center tracking-[0.4em] text-lg rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <label className="flex items-center justify-between gap-2 px-1 text-sm text-muted-foreground select-none cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[oklch(0.68_0.24_320)]"
                />
                Remember me for 30 days
              </span>
              {attempts > 0 && lockMs <= 0 && (
                <span className="text-xs text-amber-400/80">{attempts}/{AUTH_LIMITS.MAX_ATTEMPTS} tries</span>
              )}
            </label>

            {err && (
              <div
                role="alert"
                aria-live="assertive"
                className={
                  "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm " +
                  (lockMs > 0
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : "border-destructive/40 bg-destructive/10 text-destructive")
                }
              >
                {lockMs > 0 ? (
                  <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={lockMs > 0}
              className="w-full py-3.5 rounded-2xl font-semibold text-primary-foreground bg-gradient-to-r from-primary via-fuchsia-500 to-accent shadow-[0_0_30px_oklch(0.68_0.24_320/0.5)] hover:shadow-[0_0_50px_oklch(0.68_0.24_320/0.7)] transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_30px_oklch(0.68_0.24_320/0.5)]"
            >
              {lockMs > 0 ? `Locked — ${Math.ceil(lockMs / 1000)}s` : "Enter Cineverse"}
            </button>
          </form>

          <div className="mt-6 text-[11px] text-muted-foreground/80 text-center leading-relaxed">
            Two access tiers: viewers can stream & rate, admins can upload & manage the library.
          </div>
        </div>
      </div>

      <style>{`@keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-8px)} 40%,60%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

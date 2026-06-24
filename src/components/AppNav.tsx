import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Film, Bookmark, Shield, LogOut, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { clearRole, getRole, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppNav() {
  const navigate = useNavigate();
  const [role, setR] = useState<Role | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setR(getRole()); }, [path]);

  function logout() {
    clearRole();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
        <Link to="/browse" className="flex items-center gap-2 mr-2">
          <div className="relative">
            <Film className="h-6 w-6 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/40 -z-10" />
          </div>
          <span className="font-bold tracking-tight text-lg neon-text hidden sm:inline">CINEVERSE</span>
        </Link>
        <nav className="flex items-center gap-1 ml-2">
          <NavLink to="/browse" label="Browse" />
          <NavLink to="/watchlist" label="Watchlist" icon={<Bookmark className="h-4 w-4" />} />
          {role === "admin" && (
            <NavLink to="/admin" label="Admin" icon={<Shield className="h-4 w-4" />} />
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {role && (
            <span className="hidden sm:inline-flex text-xs uppercase tracking-wider px-2 py-1 rounded-full border border-white/10 text-muted-foreground">
              {role}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to || path.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition " +
        (active
          ? "bg-primary/15 text-foreground shadow-[0_0_20px_oklch(0.68_0.24_320/0.35)]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5")
      }
    >
      {icon}
      {label}
    </Link>
  );
}

export function SearchPill({ value, onChange, placeholder = "Search movies..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white/5 border border-white/10 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition placeholder:text-muted-foreground/70"
      />
    </div>
  );
}
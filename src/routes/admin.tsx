import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { getRole } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Cineverse" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { if (getRole() !== "admin") nav({ to: "/" }); }, [nav]);

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Admin Console</h1>
            <p className="text-muted-foreground text-sm">Manage your library and watch live activity.</p>
          </div>
          <nav className="flex gap-1 glass rounded-full p-1">
            <TabLink to="/admin" exact label="Library" current={path} />
            <TabLink to="/admin/analytics" label="Analytics" current={path} />
          </nav>
        </div>
        <div className="mt-8 pb-20">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function TabLink({ to, label, current, exact }: { to: string; label: string; current: string; exact?: boolean }) {
  const active = exact ? current === to : current === to || current.startsWith(to + "/");
  return (
    <Link to={to} className={"px-4 py-1.5 rounded-full text-sm transition " + (active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</Link>
  );
}
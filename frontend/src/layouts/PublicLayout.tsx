import { Link, NavLink, Outlet } from "react-router";
import { Logo } from "@/components/common";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

// Top-navbar layout used by guests and candidates.
export function PublicLayout() {
  const user = useAuthStore((s) => s.user);

  const links =
    user?.role === "CANDIDATE"
      ? [
          { to: "/candidate", label: "Dashboard", end: true },
          { to: "/jobs", label: "Find jobs", end: false },
          { to: "/candidate/applications", label: "Applications", end: false },
          { to: "/candidate/profile", label: "Profile", end: false },
        ]
      : [{ to: "/jobs", label: "Find jobs", end: false }];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "RECRUITER" && (
              <Button asChild size="sm" variant="outline">
                <Link to="/recruiter">Recruiter dashboard</Link>
              </Button>
            )}
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <Logo className="scale-90" />
          <p>© {new Date().getFullYear()} HireFlow. Built with React, Node.js & PostgreSQL.</p>
        </div>
      </footer>
    </div>
  );
}

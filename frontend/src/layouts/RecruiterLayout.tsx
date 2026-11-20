import { Link, NavLink, Outlet } from "react-router";
import { Building2, ExternalLink, LayoutDashboard, PlusCircle } from "lucide-react";
import { Logo } from "@/components/common";
import { UserMenu } from "@/components/UserMenu";
import { useRecruiterProfile } from "@/hooks/queries";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/recruiter", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/recruiter/jobs/new", label: "Post a job", icon: PlusCircle, end: false },
  { to: "/recruiter/profile", label: "Company profile", icon: Building2, end: false },
];

// Sidebar dashboard layout, only for recruiters.
export function RecruiterLayout() {
  const { data: profile } = useRecruiterProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        <div className="flex h-16 items-center px-6">
          <Logo light />
        </div>

        <div className="mx-4 mb-4 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Company</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{profile?.companyName ?? "…"}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" : "text-slate-300 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <Link
            to="/jobs"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="size-[18px]" />
            View public job board
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <p className="hidden text-sm text-slate-500 lg:block">
              Recruiter workspace{profile ? ` · ${profile.companyName}` : ""}
            </p>
            <UserMenu />
          </div>
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600",
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

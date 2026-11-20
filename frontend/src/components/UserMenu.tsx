import { useNavigate } from "react-router";
import { Briefcase, ChevronDown, FileText, LayoutDashboard, LogOut, Search, User as UserIcon } from "lucide-react";
import { Avatar } from "@/components/common";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/queries";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  if (!user) return null;

  const isRecruiter = user.role === "RECRUITER";
  const links = isRecruiter
    ? [
        { to: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
        { to: "/recruiter/jobs/new", label: "Post a job", icon: Briefcase },
        { to: "/recruiter/profile", label: "Company profile", icon: UserIcon },
        { to: "/jobs", label: "Public job board", icon: Search },
      ]
    : [
        { to: "/candidate", label: "Dashboard", icon: LayoutDashboard },
        { to: "/jobs", label: "Find jobs", icon: Search },
        { to: "/candidate/applications", label: "My applications", icon: FileText },
        { to: "/candidate/profile", label: "Profile & resume", icon: UserIcon },
      ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
        <Avatar name={initials(user.firstName, user.lastName)} className="size-8 text-xs" />
        <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.firstName}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <p className="font-semibold text-slate-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">{isRecruiter ? "Recruiter" : "Candidate"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map(({ to, label, icon: Icon }) => (
          <DropdownMenuItem key={to} onSelect={() => navigate(to)}>
            <Icon /> {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

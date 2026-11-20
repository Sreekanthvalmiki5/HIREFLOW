import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";
import type { Role } from "@/types/api";

export const homeFor = (role: Role | undefined) => (role === "RECRUITER" ? "/recruiter" : role === "CANDIDATE" ? "/candidate" : "/");

// Only lets the given role in. Guests go to /login (and come back after),
// a user with the wrong role is sent to their own dashboard.
// (The backend enforces the same rules; this is just for the UI.)
export function ProtectedRoute({ role }: { role: Role }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

// Login/register pages: users who are ALREADY logged in when they open the page go to their dashboard.
// Only the user at first render is checked, so after a successful login the page itself
// decides where to go (e.g. back to the job they were trying to apply for).
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const [initialUser] = useState(() => useAuthStore.getState().user);
  if (initialUser) return <Navigate to={homeFor(initialUser.role)} replace />;
  return <>{children}</>;
}

import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-indigo-600">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-500">The page you're looking for doesn't exist or was moved.</p>
        <Button asChild className="mt-8">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

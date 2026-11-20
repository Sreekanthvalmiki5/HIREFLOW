import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/common";

// Split-screen layout shared by the login and register pages.
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo light />
          <div>
            <h2 className="text-4xl font-bold leading-tight text-white">
              The simplest way to <br />
              <span className="text-indigo-300">find and hire talent.</span>
            </h2>
            <ul className="mt-8 space-y-4 text-slate-300">
              {[
                "Applicants ranked by skill match",
                "Secure resume storage on AWS S3",
                "Track every application in real time",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-indigo-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} HireFlow</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

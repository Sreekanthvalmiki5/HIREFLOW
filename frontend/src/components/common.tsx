import * as React from "react";
import { Link } from "react-router";
import { Loader2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { applicationStatusLabel, cn, jobStatusLabel } from "@/lib/utils";
import type { ApplicationStatus, JobStatus } from "@/types/api";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M5 20V4h3.5v6h7V4H19v16h-3.5v-6.5h-7V20z" />
        </svg>
      </span>
      <span className={cn("text-lg font-bold tracking-tight", light ? "text-white" : "text-slate-900")}>
        Hire<span className={light ? "text-indigo-200" : "text-indigo-600"}>Flow</span>
      </span>
    </Link>
  );
}

const applicationStatusVariant: Record<ApplicationStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  APPLIED: "info",
  SHORTLISTED: "purple",
  INTERVIEW: "warning",
  REJECTED: "danger",
  HIRED: "success",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={applicationStatusVariant[status]}>{applicationStatusLabel[status]}</Badge>;
}

const jobStatusVariant: Record<JobStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  OPEN: "success",
  DRAFT: "secondary",
  CLOSED: "danger",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant={jobStatusVariant[status]}>
      <span className={cn("size-1.5 rounded-full", status === "OPEN" ? "bg-emerald-500" : status === "CLOSED" ? "bg-red-500" : "bg-slate-400")} />
      {jobStatusLabel[status]}
    </Badge>
  );
}

export function MatchScore({ score, className }: { score: number | null; className?: string }) {
  if (score == null) return <span className={cn("text-xs text-slate-400", className)}>No score</span>;
  const tone =
    score >= 70 ? "text-emerald-700 bg-emerald-50 ring-emerald-600/20" : score >= 40 ? "text-amber-700 bg-amber-50 ring-amber-600/20" : "text-slate-600 bg-slate-100 ring-slate-500/10";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tone, className)}>
      {score}% match
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-500 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: "indigo" | "emerald" | "amber" | "violet" | "sky";
  hint?: string;
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-lg", tones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Loader2 className="size-7 animate-spin text-indigo-600" />
    </div>
  );
}

export function SkillChips({
  skills,
  highlight,
  max,
}: {
  skills: string[];
  highlight?: string[];
  max?: number;
}) {
  const shown = max ? skills.slice(0, max) : skills;
  const hidden = skills.length - shown.length;
  const hl = new Set(highlight ?? []);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span
          key={s}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            hl.has(s) ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" : "bg-slate-100 text-slate-600",
          )}
        >
          {s}
        </span>
      ))}
      {hidden > 0 && <span className="rounded-md px-2 py-0.5 text-xs text-slate-400">+{hidden} more</span>}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-semibold text-indigo-700",
        className,
      )}
    >
      {name}
    </span>
  );
}

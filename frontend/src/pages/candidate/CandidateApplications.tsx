import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { FileText, Trash2 } from "lucide-react";
import { ApplicationStatusBadge, EmptyState, MatchScore, PageHeader } from "@/components/common";
import { CompanyMark } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyApplications, useWithdrawApplication } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { applicationStatusLabel, cn, formatDate, timeAgo } from "@/lib/utils";
import type { ApplicationStatus, MyApplication } from "@/types/api";

const TABS: ("ALL" | ApplicationStatus)[] = ["ALL", "APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"];

export function CandidateApplications() {
  const { data: apps, isLoading } = useMyApplications();
  const withdraw = useWithdrawApplication();
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");
  const [toWithdraw, setToWithdraw] = useState<MyApplication | null>(null);

  const filtered = apps?.filter((a) => tab === "ALL" || a.status === tab) ?? [];
  const countFor = (t: (typeof TABS)[number]) => (t === "ALL" ? apps?.length : apps?.filter((a) => a.status === t).length) ?? 0;

  const confirmWithdraw = () => {
    if (!toWithdraw) return;
    withdraw.mutate(toWithdraw.id, {
      onSuccess: () => {
        toast.success("Application withdrawn");
        setToWithdraw(null);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="My applications" description="Track the status of every job you've applied to." />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition cursor-pointer",
              tab === t ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {t === "ALL" ? "All" : applicationStatusLabel[t]}
            <span className={cn("rounded-full px-1.5 text-xs", tab === t ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{countFor(t)}</span>
          </button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-64 rounded-xl" />}

      {apps && filtered.length === 0 && (
        <EmptyState
          icon={FileText}
          title={tab === "ALL" ? "You haven't applied to any jobs yet" : `No ${applicationStatusLabel[tab as ApplicationStatus].toLowerCase()} applications`}
          action={
            tab === "ALL" && (
              <Button asChild>
                <Link to="/jobs">Find jobs</Link>
              </Button>
            )
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {filtered.map((a) => (
              <li key={a.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <CompanyMark name={a.job.recruiter.companyName} />
                  <div className="min-w-0">
                    <Link to={`/jobs/${a.job.id}`} className="block truncate font-semibold text-slate-900 hover:text-indigo-600">
                      {a.job.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {a.job.recruiter.companyName} · {a.job.location}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Applied {formatDate(a.appliedAt)}
                      {a.statusUpdatedAt !== a.appliedAt && ` · Updated ${timeAgo(a.statusUpdatedAt)}`}
                      {a.job.status === "CLOSED" && " · Job closed"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <MatchScore score={a.matchScore} />
                  <ApplicationStatusBadge status={a.status} />
                  {a.status === "APPLIED" && (
                    <Button variant="ghost" size="icon" title="Withdraw application" onClick={() => setToWithdraw(a)}>
                      <Trash2 className="text-slate-400" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!toWithdraw} onOpenChange={(o) => !o && setToWithdraw(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw application?</DialogTitle>
            <DialogDescription>
              Your application for <span className="font-medium text-slate-700">{toWithdraw?.job.title}</span> will be removed. You can apply
              again later if the job is still open.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToWithdraw(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={confirmWithdraw} loading={withdraw.isPending}>
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Briefcase,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  PlayCircle,
  StopCircle,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { EmptyState, JobStatusBadge, PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteJob, useRecruiterJobs, useUpdateJob } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { cn, employmentTypeLabel, formatDate, jobStatusLabel } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import type { JobStatus, RecruiterJob } from "@/types/api";

const TABS: ("ALL" | JobStatus)[] = ["ALL", "OPEN", "DRAFT", "CLOSED"];

export function RecruiterDashboard() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const { data, isLoading } = useRecruiterJobs();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");
  const [toDelete, setToDelete] = useState<RecruiterJob | null>(null);

  const jobs = data?.jobs.filter((j) => tab === "ALL" || j.status === tab) ?? [];
  const totalViews = data?.jobs.reduce((s, j) => s + j.viewsCount, 0) ?? 0;

  const setStatus = (job: RecruiterJob, status: JobStatus) =>
    updateJob.mutate(
      { id: job.id, body: { status } },
      {
        onSuccess: () => toast.success(status === "OPEN" ? "Job is now live" : status === "CLOSED" ? "Job closed" : "Moved to drafts"),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  const confirmDelete = () =>
    toDelete &&
    deleteJob.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Job deleted");
        setToDelete(null);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Manage your job postings and review applicants."
        actions={
          <Button asChild>
            <Link to="/recruiter/jobs/new">
              <Plus /> Post a job
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total postings" value={data?.totalJobs ?? "–"} icon={Briefcase} tone="indigo" />
        <StatCard label="Live jobs" value={data?.openJobs ?? "–"} icon={Zap} tone="emerald" />
        <StatCard label="Total applicants" value={data?.totalApplicants ?? "–"} icon={Users} tone="violet" />
        <StatCard label="Total job views" value={data ? totalViews.toLocaleString() : "–"} icon={Eye} tone="sky" />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-900">Your job postings</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer",
                  tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900",
                )}
              >
                {t === "ALL" ? "All" : jobStatusLabel[t]}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        )}

        {data && jobs.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={Briefcase}
              title={tab === "ALL" ? "No jobs posted yet" : `No ${jobStatusLabel[tab as JobStatus].toLowerCase()} jobs`}
              description={tab === "ALL" ? "Create your first job posting to start receiving applications." : undefined}
              action={
                tab === "ALL" && (
                  <Button asChild>
                    <Link to="/recruiter/jobs/new">
                      <Plus /> Post a job
                    </Link>
                  </Button>
                )
              }
            />
          </div>
        )}

        {jobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Applicants</th>
                  <th className="px-5 py-3 text-right">Views</th>
                  <th className="px-5 py-3">Posted</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <Link to={`/recruiter/jobs/${job.id}/applicants`} className="font-semibold text-slate-900 hover:text-indigo-600">
                        {job.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {job.location} · {employmentTypeLabel[job.employmentType]}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/recruiter/jobs/${job.id}/applicants`}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        <Users className="size-4" /> {job.applicantsCount}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">{job.viewsCount}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(job.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Job actions">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => navigate(`/recruiter/jobs/${job.id}/applicants`)}>
                            <Users /> View applicants
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => navigate(`/recruiter/jobs/${job.id}/edit`)}>
                            <Pencil /> Edit job
                          </DropdownMenuItem>
                          {job.status !== "DRAFT" && (
                            <DropdownMenuItem onSelect={() => window.open(`/jobs/${job.id}`, "_blank")}>
                              <ExternalLink /> View public page
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {job.status === "OPEN" ? (
                            <DropdownMenuItem onSelect={() => setStatus(job, "CLOSED")}>
                              <StopCircle /> Close job
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setStatus(job, "OPEN")}>
                              <PlayCircle /> {job.status === "DRAFT" ? "Publish" : "Reopen"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem destructive onSelect={() => setToDelete(job)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this job?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-slate-700">{toDelete?.title}</span> and its{" "}
              <span className="font-medium text-slate-700">{toDelete?.applicantsCount ?? 0} application(s)</span> will be permanently deleted.
              To stop new applications but keep the data, close the job instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleteJob.isPending}>
              Delete job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

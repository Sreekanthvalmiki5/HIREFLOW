import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  PartyPopper,
  Pencil,
  SearchX,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { ApplicationStatusBadge, Avatar, EmptyState, FullPageLoader, JobStatusBadge, MatchScore, SkillChips } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchResumeUrl, useApplicants, useRecruiterJobs, useUpdateApplicationStatus } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { applicationStatusLabel, cn, initials, timeAgo } from "@/lib/utils";
import type { Applicant, ApplicationStatus } from "@/types/api";

const PIPELINE: { status: ApplicationStatus; icon: typeof Star }[] = [
  { status: "APPLIED", icon: Users },
  { status: "SHORTLISTED", icon: Star },
  { status: "INTERVIEW", icon: CalendarCheck },
  { status: "HIRED", icon: PartyPopper },
  { status: "REJECTED", icon: XCircle },
];

export function ApplicantsPage() {
  const { id: jobId } = useParams();
  const { data: recruiterJobs, isLoading: jobsLoading } = useRecruiterJobs();
  const job = recruiterJobs?.jobs.find((j) => j.id === jobId);
  const { data: applicants, isLoading } = useApplicants(jobId);
  const updateStatus = useUpdateApplicationStatus(jobId ?? "");

  const [tab, setTab] = useState<"ALL" | ApplicationStatus>("ALL");
  const [minScore, setMinScore] = useState(0);
  const [noteFor, setNoteFor] = useState<Applicant | null>(null);
  const [note, setNote] = useState("");
  const [loadingResume, setLoadingResume] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      applicants?.filter((a) => (tab === "ALL" || a.status === tab) && (minScore === 0 || (a.matchScore ?? 0) >= minScore)) ?? [],
    [applicants, tab, minScore],
  );
  const countFor = (s: ApplicationStatus) => applicants?.filter((a) => a.status === s).length ?? 0;

  const changeStatus = (a: Applicant, status: ApplicationStatus) =>
    updateStatus.mutate(
      { id: a.id, status },
      {
        onSuccess: () => toast.success(`${a.candidate.user.firstName} moved to ${applicationStatusLabel[status]}`),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  const saveNote = () =>
    noteFor &&
    updateStatus.mutate(
      { id: noteFor.id, status: noteFor.status, recruiterNote: note.trim() },
      {
        onSuccess: () => {
          toast.success("Note saved");
          setNoteFor(null);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  // Get a fresh 5-minute S3 link from the API, then open it.
  const viewResume = async (a: Applicant) => {
    const tab = window.open("", "_blank"); // open first so the browser doesn't block the popup
    setLoadingResume(a.id);
    try {
      const { url } = await fetchResumeUrl(a.id);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingResume(null);
    }
  };

  if (jobsLoading) return <FullPageLoader />;
  if (!job)
    return (
      <EmptyState
        icon={SearchX}
        title="Job not found"
        description="It may have been deleted, or it belongs to another recruiter."
        action={
          <Button asChild variant="outline">
            <Link to="/recruiter">Back to dashboard</Link>
          </Button>
        }
      />
    );

  return (
    <>
      <Link to="/recruiter" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      {/* Job header */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5" /> {job.applicantsCount} applicant{job.applicantsCount === 1 ? "" : "s"}
            </span>
            <span>{job.viewsCount} views</span>
          </p>
          {job.skills.length > 0 && (
            <div className="mt-3">
              <SkillChips skills={job.skills} />
            </div>
          )}
        </div>
        <Button asChild variant="outline">
          <Link to={`/recruiter/jobs/${job.id}/edit`}>
            <Pencil /> Edit job
          </Link>
        </Button>
      </div>

      {/* Pipeline tabs */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <PipelineTab active={tab === "ALL"} onClick={() => setTab("ALL")} label="All" count={applicants?.length ?? 0} icon={Users} />
        {PIPELINE.map(({ status, icon }) => (
          <PipelineTab
            key={status}
            active={tab === status}
            onClick={() => setTab(status)}
            label={applicationStatusLabel[status]}
            count={countFor(status)}
            icon={icon}
          />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filtered.length}</span> · sorted by best match
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="minScore" className="text-sm text-slate-500">
            Min match
          </label>
          <Select id="minScore" className="h-9 w-28" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
            {[0, 25, 50, 70, 90].map((v) => (
              <option key={v} value={v}>
                {v === 0 ? "Any" : `${v}%+`}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-xl" />}

      {applicants && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title={applicants.length === 0 ? "No applicants yet" : "No applicants match these filters"}
          description={applicants.length === 0 ? "Share your job link. Applications will show up here, ranked by skill match." : undefined}
        />
      )}

      <div className="space-y-3">
        {filtered.map((a) => {
          const name = `${a.candidate.user.firstName} ${a.candidate.user.lastName}`;
          return (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <Avatar name={initials(a.candidate.user.firstName, a.candidate.user.lastName)} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{name}</h3>
                      <MatchScore score={a.matchScore} />
                      <ApplicationStatusBadge status={a.status} />
                    </div>
                    {a.candidate.headline && <p className="mt-0.5 text-sm text-slate-600">{a.candidate.headline}</p>}
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <a href={`mailto:${a.candidate.user.email}`} className="inline-flex items-center gap-1 hover:text-indigo-600">
                        <Mail className="size-3.5" /> {a.candidate.user.email}
                      </a>
                      {a.candidate.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {a.candidate.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="size-3.5" /> {a.candidate.experienceYears} yrs exp
                      </span>
                      <span>Applied {timeAgo(a.appliedAt)}</span>
                    </p>
                    {a.candidate.skills.length > 0 && (
                      <div className="mt-3">
                        <SkillChips skills={a.candidate.skills} highlight={job.skills} max={10} />
                      </div>
                    )}
                    {a.coverLetter && (
                      <details className="group mt-3">
                        <summary className="cursor-pointer list-none text-xs font-medium text-indigo-600 hover:text-indigo-500">
                          <span className="inline-flex items-center gap-1">
                            <ChevronDown className="size-3.5 transition group-open:rotate-180" /> Cover letter
                          </span>
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{a.coverLetter}</p>
                      </details>
                    )}
                    {a.recruiterNote && (
                      <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/10">
                        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-amber-600" />
                        <span className="whitespace-pre-wrap">{a.recruiterNote}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!a.candidate.resumeFileName || loadingResume === a.id}
                    title={a.candidate.resumeFileName ?? "No resume uploaded"}
                    onClick={() => viewResume(a)}
                  >
                    {loadingResume === a.id ? <Loader2 className="animate-spin" /> : <FileText />}
                    {a.candidate.resumeFileName ? "View resume" : "No resume"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        Move to <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {PIPELINE.filter((p) => p.status !== a.status).map(({ status, icon: Icon }) => (
                        <DropdownMenuItem key={status} destructive={status === "REJECTED"} onSelect={() => changeStatus(a, status)}>
                          <Icon /> {applicationStatusLabel[status]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNoteFor(a);
                      setNote(a.recruiterNote ?? "");
                    }}
                  >
                    <MessageSquareText /> {a.recruiterNote ? "Edit note" : "Add note"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Private note</DialogTitle>
            <DialogDescription>
              About {noteFor?.candidate.user.firstName} {noteFor?.candidate.user.lastName}. Only you can see this.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} maxLength={2000} placeholder="e.g. Strong React skills, schedule a call…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteFor(null)}>
              Cancel
            </Button>
            <Button onClick={saveNote} loading={updateStatus.isPending}>
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PipelineTab({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon: typeof Star;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition cursor-pointer",
        active ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className={cn("size-4", active ? "text-indigo-200" : "text-slate-400")} /> {label}
      </span>
      <span className={cn("text-lg font-bold", active ? "text-white" : "text-slate-900")}>{count}</span>
    </button>
  );
}

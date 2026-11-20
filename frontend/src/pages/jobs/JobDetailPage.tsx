import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileWarning,
  Globe,
  IndianRupee,
  MapPin,
  SearchX,
} from "lucide-react";
import { ApplicationStatusBadge, EmptyState, FullPageLoader, SkillChips } from "@/components/common";
import { CompanyMark } from "@/components/JobCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useApply, useCandidateProfile, useJob, useMyApplications } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { employmentTypeLabel, formatDate, formatExperience, formatSalary, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

export function JobDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isCandidate = user?.role === "CANDIDATE";

  const { data: job, isLoading, isError } = useJob(id);
  const { data: myApps } = useMyApplications(isCandidate);
  const { data: profile } = useCandidateProfile(isCandidate);
  const apply = useApply(id ?? "");

  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  if (isLoading) return <FullPageLoader />;
  if (isError || !job)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={SearchX}
          title="Job not found"
          description="This job may have been removed or is no longer public."
          action={
            <Button asChild variant="outline">
              <Link to="/jobs">Browse jobs</Link>
            </Button>
          }
        />
      </div>
    );

  const myApplication = myApps?.find((a) => a.job.id === job.id);
  const matchedSkills = profile ? job.skills.filter((s) => profile.skills.includes(s)) : [];

  const submit = () =>
    apply.mutate(
      { coverLetter: coverLetter.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Application submitted! Good luck 🎉");
          setOpen(false);
          setCoverLetter("");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  const facts = [
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Briefcase, label: "Experience", value: formatExperience(job.minExperience, job.maxExperience) },
    { icon: IndianRupee, label: "Salary", value: formatSalary(job.salaryMin, job.salaryMax) },
    { icon: CalendarDays, label: "Posted", value: formatDate(job.createdAt) },
    { icon: Eye, label: "Views", value: job.viewsCount.toLocaleString() },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <CompanyMark name={job.recruiter.companyName} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
                {job.status === "CLOSED" && <Badge variant="danger">Closed</Badge>}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
                <span className="font-medium">{job.recruiter.companyName}</span>
                {job.recruiter.companyWebsite && (
                  <a
                    href={job.recruiter.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                  >
                    <Globe className="size-3.5" /> Website
                  </a>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{employmentTypeLabel[job.employmentType]}</Badge>
                <Badge variant="outline">
                  <MapPin className="size-3" /> {job.location}
                </Badge>
                <Badge variant="secondary">Posted {timeAgo(job.createdAt)}</Badge>
              </div>
            </div>
          </div>

          {/* Apply area – depends on who is looking */}
          <div className="shrink-0 sm:text-right">
            {!user && (
              <Button asChild size="lg">
                <Link to="/login" state={{ from: location.pathname }}>
                  Sign in to apply
                </Link>
              </Button>
            )}
            {user?.role === "RECRUITER" && (
              <p className="max-w-56 text-sm text-slate-500">You're signed in as a recruiter. Only candidates can apply.</p>
            )}
            {isCandidate &&
              (myApplication ? (
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" /> Applied {timeAgo(myApplication.appliedAt)}
                  </span>
                  <ApplicationStatusBadge status={myApplication.status} />
                </div>
              ) : job.status !== "OPEN" ? (
                <Button size="lg" disabled>
                  No longer accepting applications
                </Button>
              ) : (
                <Button size="lg" onClick={() => setOpen(true)}>
                  Apply now
                </Button>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About the role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{job.description}</div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-medium text-slate-900">{value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills required</CardTitle>
              {isCandidate && job.skills.length > 0 && (
                <p className="text-xs text-slate-500">
                  You have <span className="font-semibold text-emerald-700">{matchedSkills.length}</span> of {job.skills.length} skills
                </p>
              )}
            </CardHeader>
            <CardContent>
              {job.skills.length ? (
                <SkillChips skills={job.skills} highlight={matchedSkills} />
              ) : (
                <p className="text-sm text-slate-500">No specific skills listed.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>
              at {job.recruiter.companyName} · Your profile{profile?.resumeFileName ? " and resume" : ""} will be shared with the recruiter.
            </DialogDescription>
          </DialogHeader>

          {profile && !profile.resumeFileName && (
            <div className="mb-4 flex gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
              <FileWarning className="size-5 shrink-0" />
              <p>
                You haven't uploaded a resume yet.{" "}
                <Link to="/candidate/profile" className="font-semibold underline">
                  Upload one
                </Link>{" "}
                to improve your chances.
              </p>
            </div>
          )}
          {profile && profile.skills.length === 0 && (
            <div className="mb-4 flex gap-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800 ring-1 ring-inset ring-sky-600/20">
              <AlertCircle className="size-5 shrink-0" />
              <p>Add skills to your profile so recruiters see a match score.</p>
            </div>
          )}

          <label htmlFor="coverLetter" className="text-sm font-medium text-slate-700">
            Cover letter <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Textarea
            id="coverLetter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            maxLength={5000}
            rows={6}
            className="mt-1.5"
            placeholder="Tell the recruiter why you're a great fit…"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{coverLetter.length}/5000</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={apply.isPending}>
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

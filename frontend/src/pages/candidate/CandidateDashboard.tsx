import { Link } from "react-router";
import { ArrowRight, CheckCircle2, Circle, FileText, PartyPopper, Search, Send, Star } from "lucide-react";
import { ApplicationStatusBadge, EmptyState, MatchScore, PageHeader, StatCard } from "@/components/common";
import { CompanyMark, JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCandidateProfile, useJobs, useMyApplications } from "@/hooks/queries";
import { cn, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

export function CandidateDashboard() {
  const user = useAuthStore((s) => s.user)!;
  const { data: profile } = useCandidateProfile();
  const { data: apps, isLoading } = useMyApplications();
  // Recommend jobs that need the candidate's top skill.
  const topSkill = profile?.skills[0];
  const { data: recommended } = useJobs({ skill: topSkill, limit: 4 });

  const count = (s: string[]) => apps?.filter((a) => s.includes(a.status)).length ?? 0;

  const checklist = profile
    ? [
        { label: "Add a headline", done: !!profile.headline },
        { label: "Add your skills", done: profile.skills.length > 0 },
        { label: "Add your location", done: !!profile.location },
        { label: "Add a phone number", done: !!profile.phone },
        { label: "Upload your resume", done: !!profile.resumeFileName },
      ]
    : [];
  const completeness = checklist.length ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Hi, ${user.firstName} 👋`}
        description="Here's what's happening with your job search."
        actions={
          <Button asChild>
            <Link to="/jobs">
              <Search /> Find jobs
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={apps?.length ?? "–"} icon={Send} tone="indigo" />
        <StatCard label="Shortlisted" value={apps ? count(["SHORTLISTED"]) : "–"} icon={Star} tone="violet" />
        <StatCard label="Interviews" value={apps ? count(["INTERVIEW"]) : "–"} icon={FileText} tone="amber" />
        <StatCard label="Offers" value={apps ? count(["HIRED"]) : "–"} icon={PartyPopper} tone="emerald" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Recent applications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent applications</CardTitle>
              <CardDescription>Status updates from recruiters</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/candidate/applications">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-40" />}
            {apps && apps.length === 0 && (
              <EmptyState
                icon={Send}
                title="No applications yet"
                description="Find a role you like and apply in one click."
                action={
                  <Button asChild size="sm">
                    <Link to="/jobs">Browse jobs</Link>
                  </Button>
                }
              />
            )}
            <ul className="divide-y divide-slate-100">
              {apps?.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3.5">
                  <CompanyMark name={a.job.recruiter.companyName} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${a.job.id}`} className="block truncate font-medium text-slate-900 hover:text-indigo-600">
                      {a.job.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {a.job.recruiter.companyName} · Applied {timeAgo(a.appliedAt)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <MatchScore score={a.matchScore} />
                  </div>
                  <ApplicationStatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Profile strength */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Profile strength</CardTitle>
            <CardDescription>Complete profiles get better match scores.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-all", completeness === 100 ? "bg-emerald-500" : "bg-indigo-600")}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900">{completeness}%</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2.5 text-sm", c.done ? "text-slate-400 line-through" : "text-slate-700")}>
                  {c.done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-slate-300" />}
                  {c.label}
                </li>
              ))}
            </ul>
            {completeness < 100 && (
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/candidate/profile">Complete profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommended && recommended.data.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{topSkill ? `Jobs for your ${topSkill} skills` : "Latest jobs"}</h2>
              <p className="text-sm text-slate-500">Based on your profile</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recommended.data.map((job) => (
              <JobCard key={job.id} job={job} appliedStatus={apps?.some((a) => a.job.id === job.id) ? "applied" : undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

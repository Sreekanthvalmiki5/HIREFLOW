import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, BarChart3, FileCheck2, MapPin, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/hooks/queries";
import { useAuthStore } from "@/store/auth";

export function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const { data, isLoading } = useJobs({ limit: 6 });

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/jobs?${params}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute -right-32 top-20 size-[28rem] rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur">
              <Sparkles className="size-3.5" /> Skill-based matching for every application
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Hire faster.{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Get hired smarter.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              One platform for candidates to find the right role and for recruiters to find the right people, ranked by how well their
              skills match.
            </p>

            <form onSubmit={search} className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-indigo-950/50 sm:flex-row">
              <label className="flex flex-1 items-center gap-2 rounded-xl px-3">
                <Search className="size-5 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Job title, skill or keyword"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl px-3 sm:w-48 sm:border-l sm:border-slate-200">
                <MapPin className="size-5 text-slate-400" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <Button type="submit" size="lg" className="rounded-xl">
                Search jobs
              </Button>
            </form>

            {!user && (
              <p className="mt-6 text-sm text-slate-400">
                Hiring?{" "}
                <Link to="/register?role=recruiter" className="font-semibold text-indigo-300 hover:text-indigo-200">
                  Post your first job free →
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Built for both sides of hiring</h2>
          <p className="mt-3 text-slate-500">Different tools for candidates and recruiters, one simple workflow.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: FileCheck2,
              title: "For candidates",
              text: "Build your profile once, upload your resume securely and track every application's status in one place.",
            },
            {
              icon: Users,
              title: "For recruiters",
              text: "Post jobs in minutes, see applicants ranked by skill match and move them through your pipeline.",
            },
            {
              icon: BarChart3,
              title: "Smart matching",
              text: "Every application gets a match score based on the skills the job needs and the skills the candidate has.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest jobs */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Latest openings</h2>
              <p className="mt-2 text-slate-500">Fresh roles posted by recruiters on HireFlow.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/jobs">
                View all <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            {data?.data.map((job) => <JobCard key={job.id} job={job} />)}
            {data && data.data.length === 0 && (
              <p className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
                No jobs posted yet. Recruiters can post the first one!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-14 text-center shadow-xl">
            <ShieldCheck className="mx-auto size-10 text-indigo-200" />
            <h2 className="mt-4 text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-100">Create a free account as a candidate or a recruiter.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
                <Link to="/register">I'm looking for a job</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/register?role=recruiter">I'm hiring</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

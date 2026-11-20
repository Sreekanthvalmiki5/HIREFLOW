import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, MapPin, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/common";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs, useMyApplications } from "@/hooks/queries";
import { employmentTypeLabel } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import type { EmploymentType, JobFilters } from "@/types/api";

const LIMIT = 10;

export function JobsPage() {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  // The URL is the source of truth for filters, so searches can be shared and survive refresh.
  const filters: JobFilters = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      location: params.get("location") ?? undefined,
      skill: params.get("skill") ?? undefined,
      employmentType: (params.get("employmentType") as EmploymentType | null) ?? undefined,
      page: Number(params.get("page") ?? 1),
      limit: LIMIT,
    }),
    [params],
  );

  const [form, setForm] = useState({ q: "", location: "", skill: "", employmentType: "" });
  useEffect(() => {
    setForm({
      q: filters.q ?? "",
      location: filters.location ?? "",
      skill: filters.skill ?? "",
      employmentType: filters.employmentType ?? "",
    });
  }, [filters]);

  const { data, isLoading, isFetching, isError } = useJobs(filters);
  const { data: myApps } = useMyApplications(user?.role === "CANDIDATE");
  const appliedJobIds = new Set(myApps?.map((a) => a.job.id));

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    const next = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => v.trim() && next.set(k, v.trim()));
    setParams(next);
  };

  const goToPage = (page: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = [...params.keys()].some((k) => k !== "page");

  return (
    <div>
      {/* Search banner */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Find your next role</h1>
          <p className="mt-2 text-slate-500">Browse open positions from companies hiring on HireFlow.</p>
          <form onSubmit={apply} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={form.q}
                onChange={(e) => setForm({ ...form, q: e.target.value })}
                placeholder="Job title or keyword"
                className="h-11 pl-9"
              />
            </div>
            <div className="relative sm:w-56">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location"
                className="h-11 pl-9"
              />
            </div>
            <Button type="submit" className="h-11 px-6">
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        {/* Filters */}
        <aside>
          <div className="sticky top-24 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <SlidersHorizontal className="size-4" /> Filters
              </h2>
              {hasFilters && (
                <button onClick={() => setParams({})} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skill">Skill</Label>
              <Input
                id="skill"
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="e.g. react"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employmentType">Job type</Label>
              <Select
                id="employmentType"
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              >
                <option value="">All types</option>
                {Object.entries(employmentTypeLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => apply()}>
              Apply filters
            </Button>
          </div>
        </aside>

        {/* Results */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {data ? (
                <>
                  <span className="font-semibold text-slate-900">{data.total}</span> job{data.total === 1 ? "" : "s"} found
                </>
              ) : (
                " "
              )}
            </p>
            {isFetching && !isLoading && <span className="text-xs text-slate-400">Updating…</span>}
          </div>

          <div className="space-y-3">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            {isError && (
              <EmptyState icon={SearchX} title="Couldn't load jobs" description="Check that the backend server is running and try again." />
            )}
            {data?.data.map((job) => <JobCard key={job.id} job={job} appliedStatus={appliedJobIds.has(job.id) ? "applied" : undefined} />)}
            {data && data.data.length === 0 && (
              <EmptyState
                icon={SearchX}
                title="No jobs match your search"
                description="Try different keywords or remove some filters."
                action={
                  hasFilters && (
                    <Button variant="outline" onClick={() => setParams({})}>
                      Clear filters
                    </Button>
                  )
                }
              />
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" disabled={data.page <= 1} onClick={() => goToPage(data.page - 1)}>
                <ChevronLeft /> Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {data.page} of {data.totalPages}
              </span>
              <Button variant="outline" disabled={data.page >= data.totalPages} onClick={() => goToPage(data.page + 1)}>
                Next <ChevronRight />
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

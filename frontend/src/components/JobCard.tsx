import { Link } from "react-router";
import { Briefcase, Clock, IndianRupee, MapPin } from "lucide-react";
import { SkillChips } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { employmentTypeLabel, formatExperience, formatSalary, timeAgo } from "@/lib/utils";
import type { JobListItem } from "@/types/api";

export function CompanyMark({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  // Stable colour per company name.
  const palettes = [
    "from-indigo-500 to-violet-500",
    "from-sky-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-fuchsia-500 to-purple-500",
  ];
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm ${palettes[hash % palettes.length]} ${size === "lg" ? "size-14 text-xl" : "size-11 text-base"}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function JobCard({ job, appliedStatus }: { job: JobListItem; appliedStatus?: string }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <CompanyMark name={job.recruiter.companyName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-indigo-600">{job.title}</h3>
              <p className="text-sm text-slate-500">{job.recruiter.companyName}</p>
            </div>
            <div className="flex items-center gap-2">
              {appliedStatus && <Badge variant="success">Applied</Badge>}
              <Badge variant="outline">{employmentTypeLabel[job.employmentType]}</Badge>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-slate-400" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-4 text-slate-400" /> {formatExperience(job.minExperience, job.maxExperience)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IndianRupee className="size-4 text-slate-400" /> {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <SkillChips skills={job.skills} max={5} />
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock className="size-3.5" /> {timeAgo(job.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

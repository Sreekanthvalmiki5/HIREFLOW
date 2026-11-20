import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApplicationStatus, EmploymentType, JobStatus } from "@/types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, name] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// Salaries are yearly INR: 600000 -> "₹6 LPA"
function lakhs(n: number) {
  const l = n / 100000;
  return `₹${Number.isInteger(l) ? l : l.toFixed(1)}L`;
}

export function formatSalary(min: number | null, max: number | null) {
  if (min == null && max == null) return "Not disclosed";
  if (min != null && max != null) return `${lakhs(min)} – ${lakhs(max)} / yr`;
  if (min != null) return `From ${lakhs(min)} / yr`;
  return `Up to ${lakhs(max!)} / yr`;
}

export function formatExperience(min: number, max: number | null) {
  if (max == null) return min === 0 ? "Any experience" : `${min}+ yrs`;
  if (min === max) return `${min} yrs`;
  return `${min}–${max} yrs`;
}

export const employmentTypeLabel: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const jobStatusLabel: Record<JobStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
};

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

export function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// Types that mirror the backend API responses.

export type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "REJECTED" | "HIRED";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Recruiter {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite: string | null;
  designation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  userId: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  experienceYears: number;
  skills: string[];
  resumeFileName: string | null;
  resumeUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  minExperience: number;
  maxExperience: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  status: JobStatus;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface JobListItem
  extends Pick<
    Job,
    | "id"
    | "title"
    | "location"
    | "employmentType"
    | "minExperience"
    | "maxExperience"
    | "salaryMin"
    | "salaryMax"
    | "skills"
    | "createdAt"
  > {
  recruiter: { companyName: string };
}

export interface JobDetail extends Job {
  recruiter: { companyName: string; companyWebsite: string | null };
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecruiterJob extends Job {
  applicantsCount: number;
}

export interface RecruiterJobsResponse {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  jobs: RecruiterJob[];
}

export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  matchScore: number | null;
  appliedAt: string;
  statusUpdatedAt: string;
  job: {
    id: string;
    title: string;
    location: string;
    status: JobStatus;
    recruiter: { companyName: string };
  };
}

export interface Applicant {
  id: string;
  status: ApplicationStatus;
  matchScore: number | null;
  coverLetter: string | null;
  recruiterNote: string | null;
  appliedAt: string;
  statusUpdatedAt: string;
  candidate: {
    id: string;
    headline: string | null;
    location: string | null;
    experienceYears: number;
    skills: string[];
    resumeFileName: string | null;
    resumeUpdatedAt: string | null;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface JobInput {
  title: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  minExperience: number;
  maxExperience: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  status: JobStatus;
}

export interface JobFilters {
  q?: string;
  location?: string;
  skill?: string;
  employmentType?: EmploymentType;
  page?: number;
  limit?: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
  };
}

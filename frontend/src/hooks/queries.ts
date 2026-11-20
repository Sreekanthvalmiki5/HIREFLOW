import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type {
  Applicant,
  ApplicationStatus,
  AuthResponse,
  Candidate,
  JobDetail,
  JobFilters,
  JobInput,
  JobListItem,
  MyApplication,
  Paginated,
  Recruiter,
  RecruiterJobsResponse,
} from "@/types/api";

// All TanStack Query hooks in one place. Query keys are centralised so
// mutations can invalidate exactly the data they change.
export const queryKeys = {
  jobs: (filters: JobFilters) => ["jobs", filters] as const,
  job: (id: string) => ["job", id] as const,
  recruiterJobs: ["recruiter", "jobs"] as const,
  recruiterProfile: ["recruiter", "profile"] as const,
  applicants: (jobId: string) => ["applicants", jobId] as const,
  candidateProfile: ["candidate", "profile"] as const,
  myApplications: ["candidate", "applications"] as const,
};

/* ---------------- Auth ---------------- */

export interface RegisterPayload {
  role: "CANDIDATE" | "RECRUITER";
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
  companyWebsite?: string;
  designation?: string;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) =>
      (await api.post<AuthResponse>("/auth/login", body)).data,
    onSuccess: ({ token, user }) => {
      qc.clear();
      setAuth(token, user);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RegisterPayload) =>
      (await api.post<AuthResponse>("/auth/register", body)).data,
    onSuccess: ({ token, user }) => {
      qc.clear();
      setAuth(token, user);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return () => {
    logout();
    qc.clear(); // drop cached data from the previous user
  };
}

/* ---------------- Public jobs ---------------- */

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: queryKeys.jobs(filters),
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""));
      return (await api.get<Paginated<JobListItem>>("/jobs", { params })).data;
    },
    placeholderData: keepPreviousData, // keep old results visible while the next page loads
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.job(id ?? ""),
    queryFn: async () => (await api.get<JobDetail>(`/jobs/${id}`)).data,
    enabled: Boolean(id),
    staleTime: 5 * 60_000, // each fetch counts a view, so don't refetch constantly
  });
}

/* ---------------- Candidate ---------------- */

export function useCandidateProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.candidateProfile,
    queryFn: async () => (await api.get<Candidate>("/candidates/me")).data,
    enabled,
  });
}

export type CandidateUpdate = Partial<
  Pick<Candidate, "phone" | "headline" | "location" | "experienceYears" | "skills">
>;

export function useUpdateCandidateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CandidateUpdate) => (await api.patch<Candidate>("/candidates/me", body)).data,
    onSuccess: (data) => qc.setQueryData(queryKeys.candidateProfile, data),
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("resume", file);
      return (
        await api.put<{ resumeFileName: string; resumeUpdatedAt: string }>("/candidates/me/resume", form)
      ).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.candidateProfile }),
  });
}

export function useMyApplications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: async () => (await api.get<MyApplication[]>("/candidates/me/applications")).data,
    enabled,
  });
}

export function useApply(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { coverLetter?: string }) => (await api.post(`/jobs/${jobId}/apply`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myApplications }),
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string) => api.delete(`/applications/${applicationId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myApplications }),
  });
}

/* ---------------- Recruiter ---------------- */

export function useRecruiterProfile() {
  return useQuery({
    queryKey: queryKeys.recruiterProfile,
    queryFn: async () => (await api.get<Recruiter>("/recruiters/me")).data,
  });
}

export type RecruiterUpdate = Partial<Pick<Recruiter, "companyName" | "companyWebsite" | "designation">>;

export function useUpdateRecruiterProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RecruiterUpdate) => (await api.patch<Recruiter>("/recruiters/me", body)).data,
    onSuccess: (data) => qc.setQueryData(queryKeys.recruiterProfile, data),
  });
}

export function useRecruiterJobs() {
  return useQuery({
    queryKey: queryKeys.recruiterJobs,
    queryFn: async () => (await api.get<RecruiterJobsResponse>("/recruiters/me/jobs")).data,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: JobInput) => (await api.post("/jobs", body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recruiterJobs });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<JobInput> }) =>
      (await api.patch(`/jobs/${id}`, body)).data,
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.recruiterJobs });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: queryKeys.job(id) });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recruiterJobs });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useApplicants(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applicants(jobId ?? ""),
    queryFn: async () => (await api.get<Applicant[]>(`/jobs/${jobId}/applications`)).data,
    enabled: Boolean(jobId),
  });
}

export function useUpdateApplicationStatus(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      recruiterNote,
    }: {
      id: string;
      status: ApplicationStatus;
      recruiterNote?: string;
    }) => (await api.patch(`/applications/${id}/status`, { status, recruiterNote })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.applicants(jobId) }),
  });
}

// Not a hook: called on click to get a fresh 5-minute S3 link.
export async function fetchResumeUrl(applicationId: string) {
  return (
    await api.get<{ url: string; fileName: string | null }>(`/applications/${applicationId}/resume`)
  ).data;
}

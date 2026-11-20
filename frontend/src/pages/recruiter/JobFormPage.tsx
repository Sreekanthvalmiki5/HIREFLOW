import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, SearchX } from "lucide-react";
import { EmptyState, FormField, FullPageLoader, PageHeader } from "@/components/common";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useCreateJob, useRecruiterJobs, useUpdateJob } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { employmentTypeLabel, jobStatusLabel } from "@/lib/utils";
import type { EmploymentType, JobInput, JobStatus } from "@/types/api";

const optionalInt = z.string().trim().regex(/^\d*$/, "Whole numbers only");

// Numbers are kept as strings in the form (inputs give strings) and converted on submit.
const schema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters").max(150),
    location: z.string().trim().min(2, "Location is required").max(100),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
    status: z.enum(["DRAFT", "OPEN", "CLOSED"]),
    minExperience: z.string().trim().regex(/^\d{1,2}$/, "Enter 0-50"),
    maxExperience: optionalInt,
    salaryMin: optionalInt,
    salaryMax: optionalInt,
    skills: z.array(z.string()).max(50),
    description: z.string().trim().min(20, "Write at least 20 characters").max(10000),
  })
  .superRefine((v, ctx) => {
    if (v.maxExperience && Number(v.maxExperience) < Number(v.minExperience))
      ctx.addIssue({ code: "custom", path: ["maxExperience"], message: "Must be ≥ min experience" });
    if (v.salaryMin && v.salaryMax && Number(v.salaryMax) < Number(v.salaryMin))
      ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Must be ≥ min salary" });
  });
type FormValues = z.infer<typeof schema>;

const toNum = (s: string) => (s.trim() === "" ? null : Number(s));

export function JobFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: recruiterJobs, isLoading } = useRecruiterJobs();
  const existing = recruiterJobs?.jobs.find((j) => j.id === id);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      location: "",
      employmentType: "FULL_TIME",
      status: "OPEN",
      minExperience: "0",
      maxExperience: "",
      salaryMin: "",
      salaryMax: "",
      skills: [],
      description: "",
    },
  });

  useEffect(() => {
    if (existing)
      reset({
        title: existing.title,
        location: existing.location,
        employmentType: existing.employmentType,
        status: existing.status,
        minExperience: String(existing.minExperience),
        maxExperience: existing.maxExperience?.toString() ?? "",
        salaryMin: existing.salaryMin?.toString() ?? "",
        salaryMax: existing.salaryMax?.toString() ?? "",
        skills: existing.skills,
        description: existing.description,
      });
  }, [existing, reset]);

  const onSubmit = (v: FormValues) => {
    const body: JobInput = {
      title: v.title,
      location: v.location,
      employmentType: v.employmentType as EmploymentType,
      status: v.status as JobStatus,
      minExperience: Number(v.minExperience),
      maxExperience: toNum(v.maxExperience),
      salaryMin: toNum(v.salaryMin),
      salaryMax: toNum(v.salaryMax),
      skills: v.skills,
      description: v.description,
    };
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? "Job updated" : body.status === "DRAFT" ? "Draft saved" : "Job published 🚀");
        navigate("/recruiter");
      },
      onError: (err: unknown) => toast.error(getErrorMessage(err)),
    };
    if (isEdit) updateJob.mutate({ id: id!, body }, opts);
    else createJob.mutate(body, opts);
  };

  if (isEdit && isLoading) return <FullPageLoader />;
  if (isEdit && !existing)
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

  const statusOptions: JobStatus[] = isEdit ? ["DRAFT", "OPEN", "CLOSED"] : ["OPEN", "DRAFT"];

  return (
    <>
      <Link to="/recruiter" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>
      <PageHeader
        title={isEdit ? "Edit job" : "Post a new job"}
        description={isEdit ? existing?.title : "Candidates are matched to your job by the skills you list."}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>What role are you hiring for?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField label="Job title" htmlFor="title" error={errors.title?.message} className="sm:col-span-2">
              <Input id="title" placeholder="e.g. Frontend Developer (React)" aria-invalid={!!errors.title} {...register("title")} />
            </FormField>
            <FormField label="Location" htmlFor="location" error={errors.location?.message}>
              <Input id="location" placeholder="Hyderabad / Remote" aria-invalid={!!errors.location} {...register("location")} />
            </FormField>
            <FormField label="Employment type" htmlFor="employmentType">
              <Select id="employmentType" {...register("employmentType")}>
                {Object.entries(employmentTypeLabel).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requirements & pay</CardTitle>
            <CardDescription>Salary is yearly, in rupees (e.g. 600000 = ₹6 LPA). Leave blank to hide it.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Min experience (yrs)" htmlFor="minExperience" error={errors.minExperience?.message}>
              <Input id="minExperience" inputMode="numeric" aria-invalid={!!errors.minExperience} {...register("minExperience")} />
            </FormField>
            <FormField label="Max experience (yrs)" htmlFor="maxExperience" error={errors.maxExperience?.message}>
              <Input id="maxExperience" inputMode="numeric" placeholder="Optional" aria-invalid={!!errors.maxExperience} {...register("maxExperience")} />
            </FormField>
            <FormField label="Min salary (₹/yr)" htmlFor="salaryMin" error={errors.salaryMin?.message}>
              <Input id="salaryMin" inputMode="numeric" placeholder="Optional" aria-invalid={!!errors.salaryMin} {...register("salaryMin")} />
            </FormField>
            <FormField label="Max salary (₹/yr)" htmlFor="salaryMax" error={errors.salaryMax?.message}>
              <Input id="salaryMax" inputMode="numeric" placeholder="Optional" aria-invalid={!!errors.salaryMax} {...register("salaryMax")} />
            </FormField>
            <FormField
              label="Required skills"
              htmlFor="skills"
              error={errors.skills?.message}
              hint="Press Enter after each skill. Used to score applicants."
              className="sm:col-span-2 lg:col-span-4"
            >
              <Controller
                control={control}
                name="skills"
                render={({ field }) => <TagInput id="skills" value={field.value} onChange={field.onChange} placeholder="react, typescript, node…" />}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Responsibilities, requirements and what you offer.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField label="Job description" htmlFor="description" error={errors.description?.message}>
              <Textarea
                id="description"
                rows={12}
                placeholder={"About the role…\n\nResponsibilities:\n- …\n\nRequirements:\n- …"}
                aria-invalid={!!errors.description}
                {...register("description")}
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="status" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <Select id="status" className="w-40" {...register("status")}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === "OPEN" ? "Open (live)" : jobStatusLabel[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/recruiter")}>
                Cancel
              </Button>
              <Button type="submit" loading={createJob.isPending || updateJob.isPending}>
                {isEdit ? "Save changes" : "Create job"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </>
  );
}

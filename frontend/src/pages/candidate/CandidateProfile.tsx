import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, FileText, Mail, UploadCloud } from "lucide-react";
import { Avatar, FormField, FullPageLoader, PageHeader } from "@/components/common";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCandidateProfile, useUpdateCandidateProfile, useUploadResume } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { cn, formatDate, initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  headline: z.string().trim().max(200),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9 -]{7,15}$/.test(v), "Enter a valid phone number"),
  location: z.string().trim().max(100),
  experienceYears: z.string().regex(/^\d{1,2}$/, "Enter years as a number (0-60)"),
  skills: z.array(z.string()).max(50),
});
type FormValues = z.infer<typeof schema>;

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function CandidateProfile() {
  const user = useAuthStore((s) => s.user)!;
  const { data: profile, isLoading } = useCandidateProfile();
  const update = useUpdateCandidateProfile();
  const upload = useUploadResume();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { headline: "", phone: "", location: "", experienceYears: "0", skills: [] },
  });

  // Fill the form once the profile loads.
  useEffect(() => {
    if (profile)
      reset({
        headline: profile.headline ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        experienceYears: String(profile.experienceYears),
        skills: profile.skills,
      });
  }, [profile, reset]);

  const onSubmit = (v: FormValues) =>
    update.mutate(
      {
        headline: v.headline || null,
        phone: v.phone || null,
        location: v.location || null,
        experienceYears: Number(v.experienceYears),
        skills: v.skills,
      },
      {
        onSuccess: () => toast.success("Profile saved"),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    // Quick checks in the browser; the server checks again (type, size and file content).
    if (!ACCEPTED.includes(file.type)) return toast.error("Please upload a PDF or DOCX file");
    if (file.size > MAX_BYTES) return toast.error("File is too large (max 5 MB)");
    upload.mutate(file, {
      onSuccess: () => toast.success("Resume uploaded"),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  if (isLoading || !profile) return <FullPageLoader />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Profile & resume" description="Recruiters see this information when you apply." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Profile form */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardHeader>
              <CardTitle>Professional details</CardTitle>
              <CardDescription>Skills are used to calculate your match score for each job.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField label="Headline" htmlFor="headline" error={errors.headline?.message} hint="e.g. Full-stack developer · React & Node.js">
                <Input id="headline" placeholder="Your professional headline" {...register("headline")} />
              </FormField>

              <FormField label="Skills" htmlFor="skills" error={errors.skills?.message} hint="Press Enter after each skill">
                <Controller
                  control={control}
                  name="skills"
                  render={({ field }) => (
                    <TagInput id="skills" value={field.value} onChange={field.onChange} placeholder="react, node, postgresql…" />
                  )}
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Location" htmlFor="location" error={errors.location?.message}>
                  <Input id="location" placeholder="Hyderabad" {...register("location")} />
                </FormField>
                <FormField label="Years of experience" htmlFor="experienceYears" error={errors.experienceYears?.message}>
                  <Input id="experienceYears" inputMode="numeric" aria-invalid={!!errors.experienceYears} {...register("experienceYears")} />
                </FormField>
              </div>

              <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" placeholder="+91 98765 43210" aria-invalid={!!errors.phone} {...register("phone")} />
              </FormField>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" variant="ghost" disabled={!isDirty} onClick={() => reset()}>
                Discard
              </Button>
              <Button type="submit" loading={update.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Account */}
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Avatar name={initials(user.firstName, user.lastName)} className="size-14 text-lg" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
                  <Mail className="size-3.5" /> {user.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
              <CardDescription>PDF or DOCX, up to 5 MB. Stored privately on AWS S3.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.resumeFileName && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-white text-emerald-600 ring-1 ring-emerald-200">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{profile.resumeFileName}</p>
                    {profile.resumeUpdatedAt && <p className="text-xs text-slate-500">Uploaded {formatDate(profile.resumeUpdatedAt)}</p>}
                  </div>
                  <CheckCircle2 className="size-5 text-emerald-600" />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                disabled={upload.isPending}
                className={cn(
                  "flex w-full flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition cursor-pointer",
                  dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50",
                  upload.isPending && "opacity-60",
                )}
              >
                <UploadCloud className={cn("size-8", upload.isPending ? "animate-bounce text-indigo-500" : "text-slate-400")} />
                <p className="mt-3 text-sm font-medium text-slate-900">
                  {upload.isPending ? "Uploading…" : profile.resumeFileName ? "Replace resume" : "Upload your resume"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Drag & drop or click to browse</p>
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

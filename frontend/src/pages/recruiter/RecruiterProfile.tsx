import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Avatar, FormField, FullPageLoader, PageHeader } from "@/components/common";
import { CompanyMark } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRecruiterProfile, useUpdateRecruiterProfile } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(200),
  companyWebsite: z
    .string()
    .trim()
    .refine((v) => v === "" || z.url().safeParse(v).success, "Enter a full URL, e.g. https://acme.com"),
  designation: z.string().trim().max(100),
});
type FormValues = z.infer<typeof schema>;

export function RecruiterProfile() {
  const user = useAuthStore((s) => s.user)!;
  const { data: profile, isLoading } = useRecruiterProfile();
  const update = useUpdateRecruiterProfile();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: "", companyWebsite: "", designation: "" },
  });

  useEffect(() => {
    if (profile)
      reset({
        companyName: profile.companyName,
        companyWebsite: profile.companyWebsite ?? "",
        designation: profile.designation ?? "",
      });
  }, [profile, reset]);

  const onSubmit = (v: FormValues) =>
    update.mutate(
      { companyName: v.companyName, companyWebsite: v.companyWebsite || null, designation: v.designation || null },
      {
        onSuccess: () => toast.success("Company profile saved"),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  if (isLoading || !profile) return <FullPageLoader />;

  return (
    <>
      <PageHeader title="Company profile" description="Shown to candidates on every job you post." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
              <CardDescription>Keep this up to date so candidates know who's hiring.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField label="Company name" htmlFor="companyName" error={errors.companyName?.message}>
                <Input id="companyName" aria-invalid={!!errors.companyName} {...register("companyName")} />
              </FormField>
              <FormField label="Company website" htmlFor="companyWebsite" error={errors.companyWebsite?.message}>
                <Input id="companyWebsite" placeholder="https://acme.com" aria-invalid={!!errors.companyWebsite} {...register("companyWebsite")} />
              </FormField>
              <FormField label="Your designation" htmlFor="designation" error={errors.designation?.message}>
                <Input id="designation" placeholder="Talent Acquisition Lead" {...register("designation")} />
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
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How candidates see your company</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <CompanyMark name={watch("companyName") || profile.companyName} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{watch("companyName") || profile.companyName}</p>
                <p className="truncate text-sm text-indigo-600">{watch("companyWebsite") || "No website"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your account</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar name={initials(user.firstName, user.lastName)} className="size-12" />
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
        </div>
      </div>
    </>
  );
}

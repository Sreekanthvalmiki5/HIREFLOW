import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Briefcase, UserRound } from "lucide-react";
import { FormField } from "@/components/common";
import { homeFor } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister, type RegisterPayload } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AuthShell } from "./AuthShell";

// Same rules as the backend's Zod schema, so most errors are caught before the request.
const schema = z
  .object({
    role: z.enum(["CANDIDATE", "RECRUITER"]),
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters").max(72),
    companyName: z.string().trim(),
    companyWebsite: z.string().trim(),
    designation: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.role !== "RECRUITER") return;
    if (v.companyName.length < 2) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required" });
    if (v.companyWebsite && !z.url().safeParse(v.companyWebsite).success)
      ctx.addIssue({ code: "custom", path: ["companyWebsite"], message: "Enter a full URL, e.g. https://acme.com" });
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: params.get("role") === "recruiter" ? "RECRUITER" : "CANDIDATE",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      companyName: "",
      companyWebsite: "",
      designation: "",
    },
  });
  const role = watch("role");

  const onSubmit = (v: FormValues) => {
    const payload: RegisterPayload = {
      role: v.role,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      password: v.password,
      ...(v.role === "RECRUITER" && {
        companyName: v.companyName,
        companyWebsite: v.companyWebsite || undefined,
        designation: v.designation || undefined,
      }),
    };
    registerUser.mutate(payload, {
      onSuccess: ({ user }) => {
        toast.success("Account created!");
        navigate(user.role === "CANDIDATE" ? "/candidate/profile" : homeFor(user.role), { replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const roleOptions = [
    { value: "CANDIDATE" as const, title: "I'm a candidate", text: "Find and apply to jobs", icon: UserRound },
    { value: "RECRUITER" as const, title: "I'm a recruiter", text: "Post jobs and hire", icon: Briefcase },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-3">
          {roleOptions.map(({ value, title, text, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("role", value)}
              className={cn(
                "flex flex-col items-start rounded-xl border-2 p-4 text-left transition cursor-pointer",
                role === value ? "border-indigo-600 bg-indigo-50/60" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <Icon className={cn("size-5", role === value ? "text-indigo-600" : "text-slate-400")} />
              <span className="mt-2 text-sm font-semibold text-slate-900">{title}</span>
              <span className="text-xs text-slate-500">{text}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
          </FormField>
          <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </FormField>

        {role === "RECRUITER" && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company details</p>
            <FormField label="Company name" htmlFor="companyName" error={errors.companyName?.message}>
              <Input id="companyName" placeholder="Acme Technologies" aria-invalid={!!errors.companyName} {...register("companyName")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Website (optional)" htmlFor="companyWebsite" error={errors.companyWebsite?.message}>
                <Input id="companyWebsite" placeholder="https://acme.com" aria-invalid={!!errors.companyWebsite} {...register("companyWebsite")} />
              </FormField>
              <FormField label="Your role (optional)" htmlFor="designation">
                <Input id="designation" placeholder="HR Manager" {...register("designation")} />
              </FormField>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={registerUser.isPending}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

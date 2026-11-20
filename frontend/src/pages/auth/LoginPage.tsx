import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FormField } from "@/components/common";
import { homeFor } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/queries";
import { getErrorMessage } from "@/lib/api";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = (values: FormValues) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome back, ${user.firstName}!`);
        navigate(from ?? homeFor(user.role), { replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle={
        <>
          New here?{" "}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register("password")} />
        </FormField>
        <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

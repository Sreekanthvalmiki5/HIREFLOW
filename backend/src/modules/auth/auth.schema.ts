import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Invalid email"));

// bcrypt only uses the first 72 bytes of a password, so cap it there.
const password = z.string().min(8, "Password must be at least 8 characters").max(72);

const baseRegister = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email,
  password,
});

// The "role" field decides which extra fields are required.
// ADMIN is deliberately not allowed: nobody can sign up as admin.
export const registerSchema = z.discriminatedUnion("role", [
  baseRegister.extend({ role: z.literal("CANDIDATE") }),
  baseRegister.extend({
    role: z.literal("RECRUITER"),
    companyName: z.string().trim().min(2).max(200),
    companyWebsite: z.url().optional(),
    designation: z.string().trim().max(100).optional(),
  }),
]);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

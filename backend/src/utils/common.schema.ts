import { z } from "zod";

// Validates ":id" route params so a bad id returns 400 instead of a database error.
export const idParamSchema = z.object({ id: z.uuid("Invalid id") });

// Trim, lowercase and de-duplicate skills so "React", " react " and "REACT" match.
export const skillsSchema = z
  .array(z.string().trim().toLowerCase().min(1).max(50))
  .max(50)
  .transform((skills) => [...new Set(skills)]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

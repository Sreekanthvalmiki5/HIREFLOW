import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

// Validate environment variables once at startup: the app fails fast with a clear
// message instead of crashing later when a missing value is first used.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  AWS_REGION: z.string().default("ap-south-1"),
  S3_BUCKET: z
    .string()
    .optional()
    .transform((v) => v || undefined),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

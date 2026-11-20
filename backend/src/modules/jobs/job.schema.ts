import { z } from "zod";
import { EmploymentType, JobStatus } from "@prisma/client";
import { paginationSchema, skillsSchema } from "../../utils/common.schema";

const jobFields = {
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(10_000),
  location: z.string().trim().min(2).max(100),
  employmentType: z.enum(EmploymentType),
  minExperience: z.number().int().min(0).max(50),
  maxExperience: z.number().int().min(0).max(50).nullable(),
  salaryMin: z.number().int().min(0).nullable(),
  salaryMax: z.number().int().min(0).nullable(),
  skills: skillsSchema,
  status: z.enum(JobStatus),
};

export const createJobSchema = z.object({
  ...jobFields,
  employmentType: jobFields.employmentType.default("FULL_TIME"),
  minExperience: jobFields.minExperience.default(0),
  maxExperience: jobFields.maxExperience.optional(),
  salaryMin: jobFields.salaryMin.optional(),
  salaryMax: jobFields.salaryMax.optional(),
  skills: jobFields.skills.default([]),
  // A new job can be saved as draft or published, but not created already closed.
  status: z.enum(["DRAFT", "OPEN"]).default("OPEN"),
});

export const updateJobSchema = z.object(jobFields).partial();

export const listJobsQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  skill: z.string().trim().toLowerCase().max(50).optional(),
  employmentType: z.enum(EmploymentType).optional(),
});

export const applySchema = z.object({
  coverLetter: z.string().trim().max(5000).optional(),
});

export const listApplicantsQuerySchema = z.object({
  status: z.enum(["APPLIED", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"]).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
});

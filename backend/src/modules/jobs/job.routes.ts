import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../middleware/auth";
import { AppError, notFound } from "../../utils/AppError";
import { idParamSchema } from "../../utils/common.schema";
import { getCandidateByUserId, getRecruiterByUserId } from "../profiles/profile.helpers";
import {
  applySchema,
  createJobSchema,
  listApplicantsQuerySchema,
  listJobsQuerySchema,
  updateJobSchema,
} from "./job.schema";

const router = Router();

/* ---------- helpers ---------- */

// Checks min <= max for experience and salary on the FINAL values
// (for PATCH, some come from the request and some from the existing row).
function assertValidRanges(job: {
  minExperience: number;
  maxExperience?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
}) {
  if (job.maxExperience != null && job.maxExperience < job.minExperience) {
    throw new AppError(400, "maxExperience must be >= minExperience", "INVALID_RANGE");
  }
  if (job.salaryMin != null && job.salaryMax != null && job.salaryMax < job.salaryMin) {
    throw new AppError(400, "salaryMax must be >= salaryMin", "INVALID_RANGE");
  }
}

// Returns the job only if it belongs to the logged-in recruiter.
// Returns 404 (not 403) so other recruiters can't even confirm the job exists.
async function getOwnedJob(jobId: string, userId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, recruiter: { userId } } });
  if (!job) throw notFound("Job");
  return job;
}

// Simple skill-overlap score (0-100). Can later be replaced by an LLM score
// computed in a BullMQ background job.
function skillMatchScore(candidateSkills: string[], jobSkills: string[]): number | null {
  if (jobSkills.length === 0) return null;
  const have = new Set(candidateSkills);
  const matched = jobSkills.filter((s) => have.has(s)).length;
  return Math.round((matched / jobSkills.length) * 100);
}

const jobListSelect = {
  id: true,
  title: true,
  location: true,
  employmentType: true,
  minExperience: true,
  maxExperience: true,
  salaryMin: true,
  salaryMax: true,
  skills: true,
  createdAt: true,
  recruiter: { select: { companyName: true } },
} satisfies Prisma.JobSelect;

/* ---------- public ---------- */

// GET /api/jobs?q=react&location=hyderabad&skill=node&page=1&limit=20
router.get("/", async (req, res) => {
  const { q, location, skill, employmentType, page, limit } = listJobsQuerySchema.parse(req.query);

  const where: Prisma.JobWhereInput = {
    status: "OPEN",
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(location && { location: { contains: location, mode: "insensitive" } }),
    ...(skill && { skills: { has: skill } }),
    ...(employmentType && { employmentType }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      select: jobListSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

// GET /api/jobs/:id  (counts a view)
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const existing = await prisma.job.findUnique({ where: { id }, select: { status: true } });
  if (!existing || existing.status === "DRAFT") throw notFound("Job");

  // Atomic increment in SQL (views_count = views_count + 1), safe under concurrent requests.
  const job = await prisma.job.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
    include: { recruiter: { select: { companyName: true, companyWebsite: true } } },
  });
  res.json(job);
});

/* ---------- recruiter ---------- */

// POST /api/jobs
router.post("/", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  const input = createJobSchema.parse(req.body);
  assertValidRanges(input);

  const recruiter = await getRecruiterByUserId(req.user!.id);
  const job = await prisma.job.create({ data: { ...input, recruiterId: recruiter.id } });

  req.log.info({ jobId: job.id, recruiterId: recruiter.id }, "Job created");
  res.status(201).json(job);
});

// PATCH /api/jobs/:id
router.patch("/:id", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateJobSchema.parse(req.body);
  const job = await getOwnedJob(id, req.user!.id);

  assertValidRanges({ ...job, ...input });

  // Keep closedAt in sync with status.
  const closedAt =
    input.status === undefined || input.status === job.status
      ? undefined
      : input.status === "CLOSED"
        ? new Date()
        : null;

  const updated = await prisma.job.update({ where: { id }, data: { ...input, closedAt } });
  res.json(updated);
});

// DELETE /api/jobs/:id  (also deletes its applications via ON DELETE CASCADE)
router.delete("/:id", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await getOwnedJob(id, req.user!.id);
  await prisma.job.delete({ where: { id } });

  req.log.info({ jobId: id }, "Job deleted");
  res.status(204).end();
});

// GET /api/jobs/:id/applications?status=SHORTLISTED&minScore=60
router.get("/:id/applications", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { status, minScore } = listApplicantsQuerySchema.parse(req.query);
  await getOwnedJob(id, req.user!.id);

  const applications = await prisma.application.findMany({
    where: {
      jobId: id,
      ...(status && { status }),
      ...(minScore !== undefined && { matchScore: { gte: minScore } }),
    },
    // Best matches first, then earliest applicants.
    orderBy: [{ matchScore: { sort: "desc", nulls: "last" } }, { appliedAt: "asc" }],
    select: {
      id: true,
      status: true,
      matchScore: true,
      coverLetter: true,
      recruiterNote: true,
      appliedAt: true,
      statusUpdatedAt: true,
      candidate: {
        select: {
          id: true,
          headline: true,
          location: true,
          experienceYears: true,
          skills: true,
          resumeFileName: true,
          resumeUpdatedAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  res.json(applications);
});

/* ---------- candidate ---------- */

// POST /api/jobs/:id/apply
router.post("/:id/apply", requireAuth, requireRole("CANDIDATE"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { coverLetter } = applySchema.parse(req.body ?? {});

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.status === "DRAFT") throw notFound("Job");
  if (job.status !== "OPEN") {
    throw new AppError(400, "This job is no longer accepting applications", "JOB_CLOSED");
  }

  const candidate = await getCandidateByUserId(req.user!.id);

  try {
    const application = await prisma.application.create({
      data: {
        jobId: id,
        candidateId: candidate.id,
        coverLetter,
        matchScore: skillMatchScore(candidate.skills, job.skills),
      },
    });
    req.log.info({ applicationId: application.id, jobId: id }, "Application submitted");
    res.status(201).json(application);
  } catch (err) {
    // UNIQUE(job_id, candidate_id) in the DB blocks double applications, even under a race.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError(409, "You have already applied to this job", "ALREADY_APPLIED");
    }
    throw err;
  }
});

export default router;

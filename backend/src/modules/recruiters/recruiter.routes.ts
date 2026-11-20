import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getRecruiterByUserId } from "../profiles/profile.helpers";

const router = Router();
router.use(requireAuth, requireRole("RECRUITER"));

const updateRecruiterSchema = z.object({
  companyName: z.string().trim().min(2).max(200).optional(),
  companyWebsite: z.url().nullable().optional(),
  designation: z.string().trim().max(100).nullable().optional(),
});

// GET /api/recruiters/me
router.get("/me", async (req, res) => {
  res.json(await getRecruiterByUserId(req.user!.id));
});

// PATCH /api/recruiters/me
router.patch("/me", async (req, res) => {
  const data = updateRecruiterSchema.parse(req.body);
  const recruiter = await getRecruiterByUserId(req.user!.id);
  const updated = await prisma.recruiter.update({ where: { id: recruiter.id }, data });
  res.json(updated);
});

// GET /api/recruiters/me/jobs -> my jobs (all statuses) with applicant counts
router.get("/me/jobs", async (req, res) => {
  const recruiter = await getRecruiterByUserId(req.user!.id);
  const jobs = await prisma.job.findMany({
    where: { recruiterId: recruiter.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  // "postings" and "applicants" are calculated, not stored, so they are never stale.
  res.json({
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === "OPEN").length,
    totalApplicants: jobs.reduce((sum, j) => sum + j._count.applications, 0),
    jobs: jobs.map(({ _count, ...job }) => ({ ...job, applicantsCount: _count.applications })),
  });
});

export default router;

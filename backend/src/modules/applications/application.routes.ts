import { Router } from "express";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getViewUrl, isS3Configured } from "../../lib/s3";
import { requireAuth, requireRole } from "../../middleware/auth";
import { AppError, notFound } from "../../utils/AppError";
import { idParamSchema } from "../../utils/common.schema";

const router = Router();
router.use(requireAuth);

const updateStatusSchema = z.object({
  status: z.enum(ApplicationStatus),
  recruiterNote: z.string().trim().max(2000).optional(),
});

// The application, but only if it is for a job owned by this recruiter.
async function getApplicationForRecruiter(applicationId: string, userId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { recruiter: { userId } } },
    include: { candidate: { select: { resumeKey: true, resumeFileName: true } } },
  });
  if (!application) throw notFound("Application");
  return application;
}

// PATCH /api/applications/:id/status   (recruiter action: shortlist, reject, hire...)
router.patch("/:id/status", requireRole("RECRUITER"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { status, recruiterNote } = updateStatusSchema.parse(req.body);
  const application = await getApplicationForRecruiter(id, req.user!.id);

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status,
      recruiterNote,
      ...(status !== application.status && { statusUpdatedAt: new Date() }),
    },
  });

  req.log.info({ applicationId: id, from: application.status, to: status }, "Application status changed");
  res.json(updated);
});

// GET /api/applications/:id/resume  -> short-lived S3 link for the recruiter
router.get("/:id/resume", requireRole("RECRUITER"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const application = await getApplicationForRecruiter(id, req.user!.id);

  if (!application.candidate.resumeKey) {
    throw new AppError(404, "Candidate has not uploaded a resume", "NO_RESUME");
  }
  if (!isS3Configured) {
    throw new AppError(503, "Resume storage is not configured", "S3_DISABLED");
  }

  const url = await getViewUrl(application.candidate.resumeKey);
  res.json({ url, fileName: application.candidate.resumeFileName, expiresInSeconds: 300 });
});

// DELETE /api/applications/:id   (candidate withdraws; only before the recruiter acts)
router.delete("/:id", requireRole("CANDIDATE"), async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const application = await prisma.application.findFirst({
    where: { id, candidate: { userId: req.user!.id } },
  });
  if (!application) throw notFound("Application");
  if (application.status !== "APPLIED") {
    throw new AppError(400, "Application can no longer be withdrawn", "CANNOT_WITHDRAW");
  }

  await prisma.application.delete({ where: { id } });
  res.status(204).end();
});

export default router;

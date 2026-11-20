import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { deleteFile, isS3Configured, uploadFile } from "../../lib/s3";
import { requireAuth, requireRole } from "../../middleware/auth";
import { AppError } from "../../utils/AppError";
import { skillsSchema } from "../../utils/common.schema";
import { getCandidateByUserId } from "../profiles/profile.helpers";

const router = Router();
router.use(requireAuth, requireRole("CANDIDATE"));

const updateCandidateSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 -]{7,15}$/, "Invalid phone number")
    .nullable()
    .optional(),
  headline: z.string().trim().max(200).nullable().optional(),
  location: z.string().trim().max(100).nullable().optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  skills: skillsSchema.optional(),
});

// Never send the S3 key or the extracted text to the client.
const candidateOmit = { resumeKey: true, resumeText: true } as const;

// GET /api/candidates/me
router.get("/me", async (req, res) => {
  const candidate = await prisma.candidate.findUnique({
    where: { userId: req.user!.id },
    omit: candidateOmit,
  });
  res.json(candidate);
});

// PATCH /api/candidates/me
router.patch("/me", async (req, res) => {
  const data = updateCandidateSchema.parse(req.body);
  const candidate = await getCandidateByUserId(req.user!.id);
  const updated = await prisma.candidate.update({
    where: { id: candidate.id },
    data,
    omit: candidateOmit,
  });
  res.json(updated);
});

// GET /api/candidates/me/applications -> jobs I applied to, with status
router.get("/me/applications", async (req, res) => {
  const candidate = await getCandidateByUserId(req.user!.id);
  const applications = await prisma.application.findMany({
    where: { candidateId: candidate.id },
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      status: true,
      matchScore: true,
      appliedAt: true,
      statusUpdatedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          status: true,
          recruiter: { select: { companyName: true } },
        },
      },
    },
  });
  res.json(applications);
});

/* ---------- Resume upload to S3 ---------- */

const ALLOWED_TYPES: Record<string, { ext: string; magic: string }> = {
  "application/pdf": { ext: "pdf", magic: "%PDF" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    magic: "PK",
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in ALLOWED_TYPES) cb(null, true);
    else cb(new AppError(400, "Only PDF or DOCX files are allowed", "INVALID_FILE_TYPE"));
  },
});

const requireS3: RequestHandler = (_req, _res, next) => {
  if (!isS3Configured) {
    throw new AppError(503, "Resume upload is not configured (S3_BUCKET missing)", "S3_DISABLED");
  }
  next();
};

// PUT /api/candidates/me/resume  (multipart/form-data, field name "resume")
router.put("/me/resume", requireS3, upload.single("resume"), async (req, res) => {
  const file = req.file;
  if (!file) throw new AppError(400, "Attach a file in the 'resume' field", "FILE_REQUIRED");

  // The browser-sent mimetype can be faked, so also check the file's first bytes.
  const type = ALLOWED_TYPES[file.mimetype];
  if (!file.buffer.subarray(0, 4).toString("latin1").startsWith(type.magic)) {
    throw new AppError(400, "File content does not match its type", "INVALID_FILE_CONTENT");
  }

  const candidate = await getCandidateByUserId(req.user!.id);
  const key = `resumes/${candidate.id}/${Date.now()}.${type.ext}`;

  // Order matters: 1) upload new file, 2) point the DB at it, 3) delete the old file.
  // If step 1 fails nothing changed; if step 3 fails we only leave a harmless orphan file.
  await uploadFile(key, file.buffer, file.mimetype);

  const updated = await prisma.candidate.update({
    where: { id: candidate.id },
    data: { resumeKey: key, resumeFileName: file.originalname, resumeUpdatedAt: new Date() },
    select: { resumeFileName: true, resumeUpdatedAt: true },
  });

  if (candidate.resumeKey) {
    deleteFile(candidate.resumeKey).catch((err) =>
      req.log.warn({ err, key: candidate.resumeKey }, "Failed to delete old resume"),
    );
  }

  req.log.info({ candidateId: candidate.id, key }, "Resume uploaded");
  res.json(updated);
});

export default router;

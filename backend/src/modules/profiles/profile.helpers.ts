import { prisma } from "../../lib/prisma";
import { notFound } from "../../utils/AppError";

// The JWT holds the user id. These look up the matching recruiter / candidate profile.
export async function getRecruiterByUserId(userId: string) {
  const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
  if (!recruiter) throw notFound("Recruiter profile");
  return recruiter;
}

export async function getCandidateByUserId(userId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId } });
  if (!candidate) throw notFound("Candidate profile");
  return candidate;
}

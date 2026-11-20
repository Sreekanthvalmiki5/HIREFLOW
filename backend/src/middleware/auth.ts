import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const tokenPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(Role),
});

export function signToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

// Reads "Authorization: Bearer <token>", verifies it and sets req.user.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid Authorization header", "UNAUTHORIZED");
  }

  try {
    // Pin the algorithm so a token signed with "none" or another algorithm is rejected.
    const decoded = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ["HS256"] });
    const payload = tokenPayloadSchema.parse(decoded);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw new AppError(401, "Invalid or expired token", "UNAUTHORIZED");
  }
  next();
};

// Use after requireAuth: requireRole("RECRUITER")
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission for this action", "FORBIDDEN");
    }
    next();
  };

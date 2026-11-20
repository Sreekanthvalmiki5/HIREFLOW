import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { httpLogger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { errorHandler, notFoundHandler } from "./middleware/error";
import authRoutes from "./modules/auth/auth.routes";
import recruiterRoutes from "./modules/recruiters/recruiter.routes";
import candidateRoutes from "./modules/candidates/candidate.routes";
import jobRoutes from "./modules/jobs/job.routes";
import applicationRoutes from "./modules/applications/application.routes";

export const app = express();

app.use(httpLogger); // structured request logs + request id
app.use(helmet()); // security headers
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
app.use(express.json({ limit: "100kb" })); // reject huge JSON bodies

// Health check for Docker / load balancers: also checks the database connection.
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "degraded", db: "down" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

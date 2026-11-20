import type { ErrorRequestHandler, RequestHandler, Response } from "express";
import { ZodError, z } from "zod";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { AppError } from "../utils/AppError";

// Every error response has the same shape: { error: { code, message, details? } }
function sendError(res: Response, status: number, code: string, message: string, details?: unknown) {
  res.status(status).json({ error: { code, message, ...(details !== undefined && { details }) } });
}

export const notFoundHandler: RequestHandler = (req) => {
  throw new AppError(404, `Route ${req.method} ${req.path} not found`, "ROUTE_NOT_FOUND");
};

// Express 5 forwards errors thrown in async handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request data", z.flattenError(err));
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, 409, "CONFLICT", "A record with this value already exists", {
        fields: err.meta?.target,
      });
    }
    if (err.code === "P2025") {
      return sendError(res, 404, "NOT_FOUND", "Record not found");
    }
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5 MB)" : err.message;
    return sendError(res, 400, "UPLOAD_ERROR", message);
  }

  // Malformed JSON body from express.json()
  if (err?.type === "entity.parse.failed") {
    return sendError(res, 400, "INVALID_JSON", "Request body is not valid JSON");
  }

  // Anything else is a bug or an outage: log the full error, but never leak details to the client.
  req.log.error({ err }, "Unhandled error");
  sendError(res, 500, "INTERNAL_ERROR", "Something went wrong");
};

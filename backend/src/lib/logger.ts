import { randomUUID } from "node:crypto";
import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "../config/env";

// Structured (JSON) logs in production, pretty colored logs in development.
// Secrets are redacted so tokens and passwords never end up in log files.
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
      }
    : {}),
});

// One log line per HTTP request, with a request id that is also sent back
// in the x-request-id header so a user-reported error can be traced in the logs.
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: { ignore: (req) => req.url === "/health" },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, (err?: Error) => {
  if (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API server started");
});

// Graceful shutdown: stop taking new requests, finish in-flight ones, close DB pool.
function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // force-exit if it hangs
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

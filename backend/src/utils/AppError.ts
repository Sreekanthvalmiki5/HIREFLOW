// An error we throw on purpose. The error handler turns it into a clean JSON response.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what = "Resource") => new AppError(404, `${what} not found`, "NOT_FOUND");

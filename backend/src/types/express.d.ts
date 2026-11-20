import type { Role } from "@prisma/client";

// Adds `req.user` (set by requireAuth) to Express's Request type.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export {};

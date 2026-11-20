import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { requireAuth, signToken } from "../../middleware/auth";
import { AppError, notFound } from "../../utils/AppError";
import { loginSchema, registerSchema } from "./auth.schema";

const router = Router();

const BCRYPT_ROUNDS = 12;

// Fields that are safe to send to the client (never passwordHash).
export const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

// Used when the email does not exist, so login takes the same time either way
// and an attacker cannot tell which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Nested create = user and profile are inserted in ONE transaction.
  // If the profile insert fails, the user row is rolled back too.
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      role: input.role,
      ...(input.role === "RECRUITER"
        ? {
            recruiter: {
              create: {
                companyName: input.companyName,
                companyWebsite: input.companyWebsite,
                designation: input.designation,
              },
            },
          }
        : { candidate: { create: {} } }),
    },
    select: publicUserSelect,
  });
  // A duplicate email throws Prisma P2002, which the error handler turns into 409.

  req.log.info({ userId: user.id, role: user.role }, "User registered");
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  // Same message for "no such user" and "wrong password".
  if (!user || !passwordOk) {
    req.log.warn({ email }, "Failed login");
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const { passwordHash: _omit, ...publicUser } = user;
  res.json({ token: signToken(user), user: publicUser });
});

// GET /api/auth/me  -> logged-in user with their profile
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      ...publicUserSelect,
      recruiter: true,
      candidate: { omit: { resumeKey: true, resumeText: true } },
    },
  });
  if (!user) throw notFound("User");
  res.json(user);
});

export default router;

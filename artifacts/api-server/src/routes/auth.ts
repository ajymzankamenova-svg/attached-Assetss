import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, signToken, hashPassword, comparePassword, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, role = "volunteer", language = "ru" } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash,
      name,
      role: role === "admin" ? "admin" : "volunteer",
      language,
      skills: [],
      interests: [],
      badges: [],
    }).returning();
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/onboarding", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { interests, skills, availability, location, ageGroup, transportMode } = req.body;
    const [updated] = await db.update(usersTable)
      .set({
        interests: interests || [],
        skills: skills || [],
        availability,
        location,
        ageGroup,
        transportMode,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, req.user!.userId))
      .returning();
    res.json(formatUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    language: user.language,
    avatar: user.avatar,
    bio: user.bio,
    onboardingCompleted: user.onboardingCompleted,
    level: user.level,
    xp: user.xp,
    badges: user.badges || [],
    totalHours: user.totalHours,
    rating: user.rating,
    skills: user.skills || [],
    interests: user.interests || [],
    location: user.location,
    tasksCompleted: user.tasksCompleted,
    reputationScore: user.reputationScore,
    createdAt: user.createdAt,
  };
}

export { formatUser };
export default router;

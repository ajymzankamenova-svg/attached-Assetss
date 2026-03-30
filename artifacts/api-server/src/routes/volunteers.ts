import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, applicationsTable, tasksTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/volunteers", requireAuth, async (req: AuthRequest, res) => {
  try {
    const volunteers = await db.select().from(usersTable)
      .where(eq(usersTable.role, "volunteer"))
      .orderBy(desc(usersTable.rating));

    res.json(volunteers.map(v => ({
      id: v.id,
      name: v.name,
      email: v.email,
      level: v.level,
      xp: v.xp,
      totalHours: v.totalHours,
      rating: v.rating,
      skills: v.skills || [],
      badges: v.badges || [],
      tasksCompleted: v.tasksCompleted,
      reputationScore: v.reputationScore,
      location: v.location,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/volunteers/leaderboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    const volunteers = await db.select().from(usersTable)
      .where(eq(usersTable.role, "volunteer"))
      .orderBy(desc(usersTable.totalHours));

    res.json(volunteers.slice(0, 20).map((v, i) => ({
      rank: i + 1,
      volunteerId: v.id,
      name: v.name,
      level: v.level,
      totalHours: v.totalHours,
      rating: v.rating,
      badges: v.badges || [],
      tasksCompleted: v.tasksCompleted,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/volunteers/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [volunteer] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!volunteer) {
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }

    // Get completed tasks
    const apps = await db.select({ app: applicationsTable, task: tasksTable })
      .from(applicationsTable)
      .leftJoin(tasksTable, eq(applicationsTable.taskId, tasksTable.id))
      .where(eq(applicationsTable.volunteerId, id));

    const completedTaskIds = new Set(
      apps.filter(a => a.app.status === "completed").map(a => a.task?.id).filter(Boolean)
    );
    const completedTasks = apps
      .filter(a => a.task && completedTaskIds.has(a.task.id))
      .map(a => ({
        ...a.task!,
        skillsRequired: a.task!.skillsRequired || [],
        applicantsCount: 0,
        approvedCount: 0,
      }));

    const achievements = generateAchievements(volunteer);

    res.json({
      id: volunteer.id,
      name: volunteer.name,
      email: volunteer.email,
      level: volunteer.level,
      xp: volunteer.xp,
      totalHours: volunteer.totalHours,
      rating: volunteer.rating,
      skills: volunteer.skills || [],
      badges: volunteer.badges || [],
      tasksCompleted: volunteer.tasksCompleted,
      reputationScore: volunteer.reputationScore,
      location: volunteer.location,
      bio: volunteer.bio,
      interests: volunteer.interests || [],
      completedTasks,
      achievements,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function generateAchievements(volunteer: typeof usersTable.$inferSelect) {
  const badges = volunteer.badges || [];
  return [
    { id: "first_task", name: "First Step", description: "Complete your first task", icon: "star", earned: volunteer.tasksCompleted >= 1, earnedAt: null },
    { id: "five_tasks", name: "Active Volunteer", description: "Complete 5 tasks", icon: "award", earned: badges.includes("five_tasks"), earnedAt: null },
    { id: "ten_hours", name: "10 Hours Club", description: "Contribute 10+ hours", icon: "clock", earned: badges.includes("ten_hours"), earnedAt: null },
    { id: "perfect_rating", name: "Perfect Score", description: "Receive a 5/5 rating", icon: "trophy", earned: badges.includes("perfect_rating"), earnedAt: null },
    { id: "eco_warrior", name: "Eco Warrior", description: "Participate in 3 eco tasks", icon: "leaf", earned: volunteer.tasksCompleted >= 3, earnedAt: null },
    { id: "community_leader", name: "Community Leader", description: "Reach level 5", icon: "crown", earned: volunteer.level >= 5, earnedAt: null },
  ];
}

export default router;

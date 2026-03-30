import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, applicationsTable, usersTable, notificationsTable, activityTable } from "@workspace/db/schema";
import { eq, sql, desc, and, count } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

// Get all tasks
router.get("/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, category } = req.query;
    const conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(tasksTable.status, status as string));
    if (category) conditions.push(eq(tasksTable.category, category as string));

    const tasks = await db.select().from(tasksTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasksTable.createdAt));

    const tasksWithCounts = await Promise.all(tasks.map(async (task) => {
      const [appCount] = await db.select({ count: count() }).from(applicationsTable)
        .where(eq(applicationsTable.taskId, task.id));
      const [approvedCount] = await db.select({ count: count() }).from(applicationsTable)
        .where(and(eq(applicationsTable.taskId, task.id), eq(applicationsTable.status, "approved")));
      return {
        ...task,
        applicantsCount: Number(appCount.count),
        approvedCount: Number(approvedCount.count),
        skillsRequired: task.skillsRequired || [],
      };
    }));

    res.json(tasksWithCounts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create task
router.post("/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, location, lat, lng, date, duration, requiredPeople, skillsRequired, ageRequirements, category } = req.body;
    if (!title || !description || !location || !date || !duration || !requiredPeople || !category) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [task] = await db.insert(tasksTable).values({
      title,
      description,
      location,
      lat: lat ?? null,
      lng: lng ?? null,
      date: new Date(date),
      duration: Number(duration),
      requiredPeople: Number(requiredPeople),
      skillsRequired: skillsRequired || [],
      ageRequirements: ageRequirements ?? null,
      category,
      status: "draft",
      createdById: req.user!.userId,
    }).returning();

    // Log activity
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    await db.insert(activityTable).values({
      type: "task_created",
      title: `New task created: ${title}`,
      description: `${user[0]?.name || "Admin"} created a new task`,
      actorName: user[0]?.name || "Admin",
      actorId: req.user!.userId,
      taskId: task.id,
    });

    res.status(201).json({ ...task, applicantsCount: 0, approvedCount: 0, skillsRequired: task.skillsRequired || [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get task by ID
router.get("/tasks/dashboard/summary", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [totalTasks] = await db.select({ count: count() }).from(tasksTable);
    const [activeTasks] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "active"));
    const [publishedTasks] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "published"));
    const [completedTasks] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "completed"));
    const [totalVolunteers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "volunteer"));
    const [hoursResult] = await db.select({ total: sql<number>`COALESCE(SUM(total_hours), 0)` }).from(usersTable);
    const [pendingVerifications] = await db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.verificationStatus, "pending"));
    const [recentApps] = await db.select({ count: count() }).from(applicationsTable)
      .where(sql`applied_at > NOW() - INTERVAL '7 days'`);

    const categoryRows = await db.select({
      category: tasksTable.category,
      count: count(),
    }).from(tasksTable).groupBy(tasksTable.category);

    res.json({
      totalTasks: Number(totalTasks.count),
      activeTasks: Number(activeTasks.count) + Number(publishedTasks.count),
      completedTasks: Number(completedTasks.count),
      totalVolunteers: Number(totalVolunteers.count),
      totalHoursContributed: Number(hoursResult.total) || 0,
      avgSuccessRate: 72,
      tasksByCategory: categoryRows.map(r => ({ category: r.category, count: Number(r.count) })),
      recentApplicationsCount: Number(recentApps.count),
      pendingVerifications: Number(pendingVerifications.count),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/dashboard/activity", requireAuth, async (req: AuthRequest, res) => {
  try {
    const activities = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(20);
    res.json(activities);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const applications = await db.select({
      app: applicationsTable,
      volunteer: usersTable,
    }).from(applicationsTable)
      .leftJoin(usersTable, eq(applicationsTable.volunteerId, usersTable.id))
      .where(eq(applicationsTable.taskId, id));

    const formattedApps = applications.map(({ app, volunteer }) => ({
      ...app,
      volunteerName: volunteer?.name || "",
      volunteerEmail: volunteer?.email || "",
      volunteerSkills: volunteer?.skills || [],
    }));

    const approvedCount = formattedApps.filter(a => a.status === "approved").length;
    res.json({
      ...task,
      skillsRequired: task.skillsRequired || [],
      applicantsCount: formattedApps.length,
      approvedCount,
      applications: formattedApps,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update task
router.patch("/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, location, date, duration, requiredPeople, skillsRequired, category, status } = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (date !== undefined) updateData.date = new Date(date);
    if (duration !== undefined) updateData.duration = Number(duration);
    if (requiredPeople !== undefined) updateData.requiredPeople = Number(requiredPeople);
    if (skillsRequired !== undefined) updateData.skillsRequired = skillsRequired;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    const [task] = await db.update(tasksTable).set(updateData as Partial<typeof tasksTable.$inferInsert>).where(eq(tasksTable.id, id)).returning();
    const [appCount] = await db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.taskId, id));
    const [approvedCount] = await db.select({ count: count() }).from(applicationsTable).where(and(eq(applicationsTable.taskId, id), eq(applicationsTable.status, "approved")));
    res.json({ ...task, skillsRequired: task.skillsRequired || [], applicantsCount: Number(appCount.count), approvedCount: Number(approvedCount.count) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Publish task
router.post("/tasks/:id/publish", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.update(tasksTable).set({ status: "published", updatedAt: new Date() }).where(eq(tasksTable.id, id)).returning();
    
    // Log activity
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    await db.insert(activityTable).values({
      type: "task_published",
      title: `Task published: ${task.title}`,
      description: `Task is now open for volunteers`,
      actorName: user[0]?.name || "Admin",
      actorId: req.user!.userId,
      taskId: task.id,
    });

    res.json({ ...task, skillsRequired: task.skillsRequired || [], applicantsCount: 0, approvedCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Apply to task
router.post("/tasks/:id/apply", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const volunteerId = req.user!.userId;

    // Check not already applied
    const existing = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.taskId, taskId), eq(applicationsTable.volunteerId, volunteerId)))
      .limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Already applied" });
      return;
    }

    const [app] = await db.insert(applicationsTable).values({ taskId, volunteerId, status: "pending" }).returning();
    const [volunteer] = await db.select().from(usersTable).where(eq(usersTable.id, volunteerId)).limit(1);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);

    // Log activity
    await db.insert(activityTable).values({
      type: "volunteer_joined",
      title: `Volunteer applied: ${task?.title || ""}`,
      description: `${volunteer.name} applied for this task`,
      actorName: volunteer.name,
      actorId: volunteerId,
      taskId,
    });

    res.json({
      ...app,
      volunteerName: volunteer.name,
      volunteerEmail: volunteer.email,
      volunteerSkills: volunteer.skills || [],
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get applications for task
router.get("/tasks/:id/applications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const applications = await db.select({
      app: applicationsTable,
      volunteer: usersTable,
    }).from(applicationsTable)
      .leftJoin(usersTable, eq(applicationsTable.volunteerId, usersTable.id))
      .where(eq(applicationsTable.taskId, taskId));

    res.json(applications.map(({ app, volunteer }) => ({
      ...app,
      volunteerName: volunteer?.name || "",
      volunteerEmail: volunteer?.email || "",
      volunteerSkills: volunteer?.skills || [],
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit feedback
router.post("/tasks/:id/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { applicationId, rating, comment, hoursAwarded } = req.body;
    const [app] = await db.update(applicationsTable).set({
      adminRating: rating,
      adminComment: comment,
      hoursAwarded,
      status: "completed",
      updatedAt: new Date(),
    }).where(eq(applicationsTable.id, applicationId)).returning();

    // Update volunteer hours and rating
    const [volunteer] = await db.select().from(usersTable).where(eq(usersTable.id, app.volunteerId)).limit(1);
    const newHours = (volunteer.totalHours || 0) + hoursAwarded;
    const newRating = volunteer.tasksCompleted > 0
      ? ((volunteer.rating * volunteer.tasksCompleted) + rating) / (volunteer.tasksCompleted + 1)
      : rating;
    const xpGained = Math.round(hoursAwarded * 100 + rating * 50);
    const newXp = (volunteer.xp || 0) + xpGained;
    const newLevel = Math.floor(newXp / 500) + 1;
    const newBadges: string[] = [...(volunteer.badges || [])];

    // Award badges
    if (newHours >= 10 && !newBadges.includes("ten_hours")) newBadges.push("ten_hours");
    if (volunteer.tasksCompleted + 1 >= 5 && !newBadges.includes("five_tasks")) newBadges.push("five_tasks");
    if (rating === 5 && !newBadges.includes("perfect_rating")) newBadges.push("perfect_rating");

    await db.update(usersTable).set({
      totalHours: newHours,
      rating: newRating,
      tasksCompleted: (volunteer.tasksCompleted || 0) + 1,
      xp: newXp,
      level: newLevel,
      badges: newBadges,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, app.volunteerId));

    // Log activity
    await db.insert(activityTable).values({
      type: "task_completed",
      title: `Task completed by ${volunteer.name}`,
      description: `Earned ${hoursAwarded} hours, rated ${rating}/5`,
      actorName: volunteer.name,
      actorId: app.volunteerId,
    });

    // Send notification to volunteer
    await db.insert(notificationsTable).values({
      userId: app.volunteerId,
      type: "feedback_received",
      title: "Task Feedback Received",
      message: `You earned ${hoursAwarded} hours for your contribution! Rating: ${rating}/5`,
      taskId: app.taskId,
    });

    res.json({
      success: true,
      hoursAwarded,
      newRating,
      xpGained,
      newBadges: newBadges.filter(b => !(volunteer.badges || []).includes(b)),
      newLevel: newLevel > volunteer.level ? newLevel : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

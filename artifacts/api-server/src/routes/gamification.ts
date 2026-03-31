import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, tasksTable, applicationsTable, certificatesTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "crypto";

const router = Router();

const LEVEL_NAMES = [
  { min: 1, max: 1, name: "Бастаушы волонтер", nameRu: "Начинающий волонтёр", nameEn: "Starter Volunteer", icon: "🌱" },
  { min: 2, max: 2, name: "Мейірімді жүрек", nameRu: "Доброе сердце", nameEn: "Kind Heart", icon: "❤️" },
  { min: 3, max: 3, name: "Белсенді көмекші", nameRu: "Активный помощник", nameEn: "Active Helper", icon: "⚡" },
  { min: 4, max: 4, name: "Супер волонтёр", nameRu: "Супер волонтёр", nameEn: "Super Volunteer", icon: "⭐" },
  { min: 5, max: 5, name: "Қоғам қаһарманы", nameRu: "Герой сообщества", nameEn: "Community Hero", icon: "🦸" },
  { min: 6, max: 6, name: "Master Volunteer", nameRu: "Мастер волонтёр", nameEn: "Master Volunteer", icon: "👑" },
  { min: 7, max: 99, name: "Elite Leader", nameRu: "Элитный лидер", nameEn: "Elite Leader", icon: "🏆" },
];

const QUESTS_TEMPLATE = [
  { id: "eco_starter", icon: "🌱", category: "ecology", titleKz: "Эко бастамасы", titleRu: "Эко старт", titleEn: "Eco Starter", descKz: "3 экология тапсырмасын орында", descRu: "Выполни 3 экологические задачи", descEn: "Complete 3 ecology tasks", target: 3, unit: "tasks", xpReward: 300, badge: "Eco Starter 🌱" },
  { id: "hour_hero", icon: "⏱️", category: "hours", titleKz: "Уақыт батыры", titleRu: "Герой времени", titleEn: "Time Hero", descKz: "10 сағат еріктілік жұмыс жаса", descRu: "Отработай 10 часов волонтёрства", descEn: "Volunteer for 10 hours", target: 10, unit: "hours", xpReward: 500, badge: "Time Hero ⏱️" },
  { id: "kind_soul", icon: "❤️", category: "social", titleKz: "Мейірімді жан", titleRu: "Добрая душа", titleEn: "Kind Soul", descKz: "5 әлеуметтік тапсырма орында", descRu: "Выполни 5 социальных задач", descEn: "Complete 5 social tasks", target: 5, unit: "tasks", xpReward: 400, badge: "Kind Soul ❤️" },
  { id: "team_leader", icon: "👑", category: "leadership", titleKz: "Команда лидері", titleRu: "Лидер команды", titleEn: "Team Leader", descKz: "1 рет лидер рөлінде болып тапсырма орында", descRu: "Выполни задачу в роли лидера команды", descEn: "Complete a task as team leader", target: 1, unit: "tasks", xpReward: 600, badge: "Team Leader 👑" },
  { id: "first_steps", icon: "👣", category: "beginner", titleKz: "Алғашқы қадам", titleRu: "Первые шаги", titleEn: "First Steps", descKz: "Алғашқы тапсырмаңды орында", descRu: "Выполни свою первую задачу", descEn: "Complete your first task", target: 1, unit: "tasks", xpReward: 150, badge: "First Steps 👣" },
  { id: "community_pillar", icon: "🏛️", category: "community", titleKz: "Қауымдастық тіреуі", titleRu: "Опора сообщества", titleEn: "Community Pillar", descKz: "10 тапсырма орында", descRu: "Выполни 10 задач", descEn: "Complete 10 tasks", target: 10, unit: "tasks", xpReward: 1000, badge: "Community Pillar 🏛️" },
];

const ACHIEVEMENTS = [
  { id: "first_task", icon: "👣", badge: "First Steps 👣", descKz: "Алғашқы тапсырма", descRu: "Первая задача", descEn: "First task", condition: (u: any) => u.tasksCompleted >= 1 },
  { id: "eco_starter", icon: "🌱", badge: "Eco Starter 🌱", descKz: "Эко бастамасы", descRu: "Эко старт", descEn: "Eco starter", condition: (u: any) => u.tasksCompleted >= 3 },
  { id: "kind_soul", icon: "❤️", badge: "Kind Soul ❤️", descKz: "Мейірімді жан", descRu: "Добрая душа", descEn: "Kind soul", condition: (u: any) => u.tasksCompleted >= 5 },
  { id: "hour_hero", icon: "⏱️", badge: "Time Hero ⏱️", descKz: "Уақыт батыры", descRu: "Герой времени", descEn: "Time hero", condition: (u: any) => u.totalHours >= 10 },
  { id: "team_leader", icon: "👑", badge: "Team Leader 👑", descKz: "Команда лидері", descRu: "Лидер команды", descEn: "Team leader", condition: (u: any) => u.level >= 4 },
  { id: "community_pillar", icon: "🏛️", badge: "Community Pillar 🏛️", descKz: "Қауымдастық тіреуі", descRu: "Опора сообщества", descEn: "Community pillar", condition: (u: any) => u.tasksCompleted >= 10 },
  { id: "master", icon: "🔮", badge: "Master Volunteer 🔮", descKz: "Мастер волонтёр", descRu: "Мастер волонтёр", descEn: "Master volunteer", condition: (u: any) => u.level >= 6 },
];

// GET /api/gamification/profile - get full gamification profile
router.get("/gamification/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const levelInfo = LEVEL_NAMES.find(l => user.level >= l.min && user.level <= l.max) || LEVEL_NAMES[0];
    const nextLevel = LEVEL_NAMES.find(l => l.min === user.level + 1);
    const xpForNext = (user.level + 1) * 1000;
    const xpProgress = Math.min(100, ((user.xp % 1000) / 1000) * 100);

    const earnedBadges = new Set(user.badges || []);
    const achievements = ACHIEVEMENTS.map(a => ({
      ...a,
      earned: earnedBadges.has(a.badge) || a.condition(user),
    }));

    const quests = QUESTS_TEMPLATE.map(q => {
      let progress = 0;
      if (q.unit === "tasks") progress = Math.min(q.target, user.tasksCompleted || 0);
      if (q.unit === "hours") progress = Math.min(q.target, Math.floor(user.totalHours || 0));
      const completed = progress >= q.target;
      const claimed = earnedBadges.has(q.badge);
      return { ...q, progress, completed, claimed };
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        xp: user.xp,
        xpForNext,
        xpProgress,
        totalHours: user.totalHours,
        tasksCompleted: user.tasksCompleted,
        rating: user.rating,
        reputationScore: user.reputationScore,
        badges: user.badges,
      },
      levelInfo,
      nextLevel,
      quests,
      achievements,
      impactScore: Math.round((user.tasksCompleted * 15) + (user.totalHours * 10) + (user.reputationScore * 2)),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/gamification/leaderboard
router.get("/gamification/leaderboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      level: usersTable.level,
      xp: usersTable.xp,
      tasksCompleted: usersTable.tasksCompleted,
      totalHours: usersTable.totalHours,
      badges: usersTable.badges,
      avatar: usersTable.avatar,
    }).from(usersTable)
      .where(eq(usersTable.role, "volunteer"))
      .orderBy(desc(usersTable.xp))
      .limit(20);

    const leaderboard = users.map((u, idx) => {
      const levelInfo = LEVEL_NAMES.find(l => u.level >= l.min && u.level <= l.max) || LEVEL_NAMES[0];
      const impactScore = Math.round((u.tasksCompleted * 15) + (u.totalHours * 10));
      return { ...u, rank: idx + 1, levelInfo, impactScore };
    });

    res.json(leaderboard);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/gamification/claim-quest/:questId
router.post("/gamification/claim-quest/:questId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const questId = req.params.questId;
    const quest = QUESTS_TEMPLATE.find(q => q.id === questId);
    if (!quest) { res.status(404).json({ error: "Quest not found" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    let progress = 0;
    if (quest.unit === "tasks") progress = user.tasksCompleted || 0;
    if (quest.unit === "hours") progress = Math.floor(user.totalHours || 0);

    if (progress < quest.target) {
      res.status(400).json({ error: "Quest not completed yet", progress, target: quest.target });
      return;
    }

    const existingBadges: string[] = user.badges || [];
    if (existingBadges.includes(quest.badge)) {
      res.status(400).json({ error: "Quest already claimed" });
      return;
    }

    const newXp = user.xp + quest.xpReward;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const newBadges = [...existingBadges, quest.badge];

    await db.update(usersTable).set({
      xp: newXp,
      level: newLevel,
      badges: newBadges,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, req.user!.userId));

    res.json({ success: true, xpEarned: quest.xpReward, badge: quest.badge, newLevel, newXp });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ai/generate-certificate/:applicationId
router.post("/ai/generate-certificate/:applicationId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const applicationId = parseInt(req.params.applicationId);
    const language = req.body.language || "ru";
    const LANG = { kz: "Қазақ тілінде жауап бер. ", ru: "Отвечай на русском. ", en: "Respond in English. " };

    const [application] = await db.select().from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId)).limit(1);
    if (!application) { res.status(404).json({ error: "Application not found" }); return; }

    const [task] = await db.select().from(tasksTable)
      .where(eq(tasksTable.id, application.taskId)).limit(1);
    const [volunteer] = await db.select().from(usersTable)
      .where(eq(usersTable.id, application.volunteerId)).limit(1);
    if (!task || !volunteer) { res.status(404).json({ error: "Task or volunteer not found" }); return; }

    const [curator] = req.user?.role === "admin"
      ? await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1)
      : [null as any];

    // Check if certificate already exists
    const [existingCert] = await db.select().from(certificatesTable)
      .where(and(
        eq(certificatesTable.applicationId, applicationId),
        eq(certificatesTable.userId, volunteer.id)
      )).limit(1);

    if (existingCert) {
      res.json(existingCert);
      return;
    }

    // Determine certificate level
    const hours = application.hoursAwarded || task.duration;
    const rating = application.adminRating || 4;
    let level = "Basic";
    if (volunteer.level >= 6 || volunteer.tasksCompleted >= 15) level = "Impact";
    else if (volunteer.level >= 4 || volunteer.tasksCompleted >= 8) level = "Leadership";
    else if (volunteer.level >= 3 || volunteer.tasksCompleted >= 3) level = "Advanced";

    const aiPrompt = `${LANG[language as keyof typeof LANG] || LANG.ru}
You are generating an official volunteer certificate description for a social impact platform in Kazakhstan called "Sun Proactive AI".

Volunteer: ${volunteer.name}
Task: ${task.title}
Description: ${task.description}
Location: ${task.location}
Duration: ${hours} hours
Role: ${application.role || "Volunteer"}
Skills used: ${(task.skillsRequired || []).join(", ")}
Admin rating: ${rating}/5
Certificate level: ${level}

Write a professional, inspiring 2-3 sentence certificate description that:
1. Mentions the specific contribution and impact
2. Highlights key skills demonstrated
3. Notes the community benefit achieved

Keep it formal but warm. Output ONLY the description text, no JSON, no headers.`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 400,
      messages: [{ role: "user", content: aiPrompt }],
    });

    const aiDescription = aiResponse.choices[0]?.message?.content?.trim() || "Successfully completed the volunteer mission with dedication and positive impact.";

    const verifyToken = randomUUID();
    const [certificate] = await db.insert(certificatesTable).values({
      userId: volunteer.id,
      taskId: task.id,
      applicationId,
      level,
      hoursAwarded: hours,
      skillsUsed: task.skillsRequired || [],
      role: application.role || "Volunteer",
      aiDescription,
      curatorName: curator?.name || "Sun Proactive AI",
      impactScore: Math.round(hours * 10 + rating * 20 + volunteer.level * 15),
      verifyToken,
    }).returning();

    res.json(certificate);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

// GET /api/certificates/:id - get certificate by id
router.get("/certificates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, id)).limit(1);
    if (!cert) { res.status(404).json({ error: "Certificate not found" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, cert.userId)).limit(1);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, cert.taskId)).limit(1);

    res.json({ ...cert, volunteerName: user?.name, taskTitle: task?.title, taskLocation: task?.location });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/certificates/verify/:token
router.get("/certificates/verify/:token", async (req, res) => {
  try {
    const [cert] = await db.select().from(certificatesTable)
      .where(eq(certificatesTable.verifyToken, req.params.token)).limit(1);
    if (!cert) { res.status(404).json({ valid: false }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, cert.userId)).limit(1);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, cert.taskId)).limit(1);

    res.json({ valid: true, ...cert, volunteerName: user?.name, taskTitle: task?.title });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/my/certificates
router.get("/my/certificates", requireAuth, async (req: AuthRequest, res) => {
  try {
    const certs = await db.select().from(certificatesTable)
      .where(eq(certificatesTable.userId, req.user!.userId))
      .orderBy(desc(certificatesTable.createdAt));

    const enriched = await Promise.all(certs.map(async (c) => {
      const [task] = await db.select({ title: tasksTable.title, location: tasksTable.location })
        .from(tasksTable).where(eq(tasksTable.id, c.taskId)).limit(1);
      return { ...c, taskTitle: task?.title, taskLocation: task?.location };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

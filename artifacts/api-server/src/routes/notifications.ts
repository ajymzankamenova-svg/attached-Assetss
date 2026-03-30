import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, req.user!.userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(notifications);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [notification] = await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, id))
      .returning();
    res.json(notification);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

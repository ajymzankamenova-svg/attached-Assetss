import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// List conversations
router.get("/openai/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const convos = await db.select().from(conversations)
      .where(eq(conversations.userId, req.user!.userId))
      .orderBy(desc(conversations.updatedAt));
    res.json(convos);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create conversation
router.post("/openai/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, taskId } = req.body;
    const [convo] = await db.insert(conversations).values({
      title: title || "New Conversation",
      userId: req.user!.userId,
      taskId: taskId ?? null,
    }).returning();
    res.status(201).json(convo);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get conversation with messages
router.get("/openai/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [convo] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (!convo) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json({ ...convo, messages: msgs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send message (SSE streaming)
router.post("/openai/conversations/:id/messages", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { content, language = "ru", systemContext } = req.body;

  if (!content) {
    res.status(400).json({ error: "Message content required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Save user message
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content,
    });

    // Get conversation history
    const history = await db.select().from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt)
      .limit(20);

    const langInstructions: Record<string, string> = {
      kz: "Қазақ тілінде жауап бер.",
      ru: "Отвечай на русском языке.",
      en: "Respond in English.",
    };

    const systemMsg = systemContext || `You are Sun Proactive AI — an intelligent assistant for a social impact volunteer platform in Kazakhstan. ${langInstructions[language] || langInstructions.ru} Help users understand tasks, find opportunities, and make a positive impact in their community.`;

    const chatMessages = [
      { role: "system" as const, content: systemMsg },
      ...history.slice(0, -1).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content },
    ];

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Save assistant response
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    // Update conversation timestamp
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err);
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    res.end();
  }
});

export default router;

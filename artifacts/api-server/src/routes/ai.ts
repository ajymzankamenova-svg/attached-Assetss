import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, usersTable, applicationsTable, notificationsTable } from "@workspace/db/schema";
import { eq, ne, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const LANG_PROMPTS = {
  kz: "Қазақ тілінде жауап бер. ",
  ru: "Отвечай на русском языке. ",
  en: "Respond in English. ",
};

// AI Task Dialogue
router.post("/ai/task-dialogue", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { message, conversationHistory = [], language = "ru", currentTaskDraft } = req.body;
    const langPrompt = LANG_PROMPTS[language as keyof typeof LANG_PROMPTS] || LANG_PROMPTS.ru;

    const systemPrompt = `${langPrompt}You are an AI assistant helping create volunteer social impact tasks. 
Your goal is to help the user define a well-structured task by asking clarifying questions.
Extract the following information through dialogue: title, description, location, date, duration (hours), required_people, skills_required, age_requirements, category.

Current draft: ${JSON.stringify(currentTaskDraft || {})}

When you have all necessary information, output a complete task draft in JSON format wrapped in <task_draft>...</task_draft> tags.
Also suggest optimal number of people based on the task type.
Be warm, encouraging, and conversational. Keep responses concise.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(conversationHistory as { role: "user" | "assistant"; content: string }[]),
      { role: "user" as const, content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages,
    });

    const aiMessage = response.choices[0]?.message?.content || "";
    
    // Extract task draft if present
    let taskDraft = currentTaskDraft || null;
    const draftMatch = aiMessage.match(/<task_draft>([\s\S]*?)<\/task_draft>/);
    if (draftMatch) {
      try {
        taskDraft = JSON.parse(draftMatch[1]);
      } catch {}
    }

    const cleanMessage = aiMessage.replace(/<task_draft>[\s\S]*?<\/task_draft>/g, "").trim();
    const requiredFields = ["title", "description", "location", "date", "duration", "requiredPeople", "skillsRequired", "category"];
    const missingFields = taskDraft 
      ? requiredFields.filter(f => !taskDraft[f] && !taskDraft[f.replace(/([A-Z])/g, '_$1').toLowerCase()])
      : requiredFields;

    res.json({
      message: cleanMessage,
      taskDraft,
      isComplete: !!taskDraft && missingFields.length === 0,
      missingFields,
      suggestedPeopleCount: taskDraft?.requiredPeople || null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "AI dialogue failed" });
  }
});

// Task Quality Analysis
router.get("/ai/task-quality/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Analyze this volunteer task and provide a quality assessment (score 0-100):
Task: ${JSON.stringify({
  title: task.title,
  description: task.description,
  location: task.location,
  date: task.date,
  duration: task.duration,
  requiredPeople: task.requiredPeople,
  skillsRequired: task.skillsRequired,
  ageRequirements: task.ageRequirements,
  category: task.category,
})}

Respond in JSON format:
{
  "score": number 0-100,
  "grade": "excellent|good|fair|poor",
  "missingFields": ["list of missing or weak fields"],
  "suggestions": ["specific improvement suggestions"],
  "strengths": ["what is good about this task"]
}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      score: 60,
      grade: "fair",
      missingFields: [],
      suggestions: ["Add more details to the description"],
      strengths: ["Has a clear title"],
    };

    // Update task quality score
    await db.update(tasksTable).set({ qualityScore: analysis.score }).where(eq(tasksTable.id, taskId));

    res.json(analysis);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Quality analysis failed" });
  }
});

// Semantic Volunteer Matching
router.get("/ai/match-volunteers/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const volunteers = await db.select().from(usersTable).where(eq(usersTable.role, "volunteer"));
    if (volunteers.length === 0) {
      res.json([]);
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Match these volunteers to this task using semantic similarity.

Task: ${JSON.stringify({ title: task.title, description: task.description, skillsRequired: task.skillsRequired, category: task.category, location: task.location })}

Volunteers: ${JSON.stringify(volunteers.map(v => ({ id: v.id, name: v.name, skills: v.skills, interests: v.interests, location: v.location })))}

For each volunteer, provide a match score 0-100 and reasons. Respond in JSON array format:
[{"volunteerId": id, "name": "name", "matchScore": number, "matchReasons": ["reason1", "reason2"], "availabilityMatch": true}]`
      }],
    });

    const text = response.choices[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Merge with volunteer data
    matches = matches.map((m: { volunteerId: number; matchScore: number; matchReasons: string[]; availabilityMatch: boolean }) => {
      const vol = volunteers.find(v => v.id === m.volunteerId);
      return {
        ...m,
        skills: vol?.skills || [],
        locationDistance: null,
      };
    });

    res.json(matches.sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Matching failed" });
  }
});

// AI Team Builder
router.post("/ai/build-team/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const volunteers = await db.select().from(usersTable).where(eq(usersTable.role, "volunteer"));

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Build an optimal team for this volunteer task. Assign roles: leader (1), executors, communicators.

Task: ${JSON.stringify({ title: task.title, description: task.description, skillsRequired: task.skillsRequired, requiredPeople: task.requiredPeople })}
Available volunteers: ${JSON.stringify(volunteers.map(v => ({ id: v.id, name: v.name, skills: v.skills, rating: v.rating, level: v.level })))}

Respond in JSON:
{
  "leader": {"volunteerId": id, "name": "name", "role": "leader", "matchScore": number, "reason": "why leader"},
  "executors": [{"volunteerId": id, "name": "name", "role": "executor", "matchScore": number, "reason": "why executor"}],
  "communicators": [{"volunteerId": id, "name": "name", "role": "communicator", "matchScore": number, "reason": "why communicator"}],
  "reasoning": "overall team composition reasoning"
}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { leader: null, executors: [], communicators: [], reasoning: "" };

    // Assign roles to applications
    const allMembers = [result.leader, ...(result.executors || []), ...(result.communicators || [])].filter(Boolean);
    for (const member of allMembers) {
      const existing = await db.select().from(applicationsTable)
        .where(eq(applicationsTable.volunteerId, member.volunteerId))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(applicationsTable).set({ role: member.role, status: "approved", matchScore: member.matchScore }).where(eq(applicationsTable.id, existing[0].id));
      } else {
        await db.insert(applicationsTable).values({
          taskId, volunteerId: member.volunteerId, role: member.role, status: "approved", matchScore: member.matchScore
        });
      }

      // Notify volunteers
      await db.insert(notificationsTable).values({
        userId: member.volunteerId,
        type: "team_assigned",
        title: "You've been assigned to a team!",
        message: `You are ${member.matchScore}% suitable for this task. Role: ${member.role}`,
        taskId,
      });
    }

    res.json({
      success: true,
      team: { leader: result.leader, executors: result.executors || [], communicators: result.communicators || [] },
      reasoning: result.reasoning,
      notificationssSent: allMembers.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Team building failed" });
  }
});

// Success Prediction
router.get("/ai/predict-success/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const [{ count: appCount }] = await db.select({ count: eq(applicationsTable.status, "approved") }).from(applicationsTable).where(eq(applicationsTable.taskId, taskId));

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Predict the success probability for this volunteer task (0-100%).

Task: ${JSON.stringify({
  title: task.title,
  description: task.description,
  date: task.date,
  duration: task.duration,
  requiredPeople: task.requiredPeople,
  category: task.category,
  qualityScore: task.qualityScore,
})}

Respond in JSON:
{
  "successProbability": number 0-100,
  "confidenceLevel": "high|medium|low",
  "positiveFactors": ["factor1"],
  "negativeFactors": ["factor1"],
  "recommendations": ["action1"]
}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      successProbability: 65,
      confidenceLevel: "medium",
      positiveFactors: ["Clear description"],
      negativeFactors: ["Needs more volunteers"],
      recommendations: ["Promote the task"],
    };

    await db.update(tasksTable).set({ successPrediction: prediction.successProbability }).where(eq(tasksTable.id, taskId));

    res.json(prediction);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Prediction failed" });
  }
});

// Risk Analysis
router.get("/ai/risk-analysis/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Analyze risks for this volunteer task.

Task: ${JSON.stringify({ title: task.title, description: task.description, date: task.date, duration: task.duration, location: task.location, requiredPeople: task.requiredPeople })}

Respond in JSON:
{
  "overallRisk": "low|medium|high|critical",
  "riskScore": number 0-100,
  "risks": [{"type": "string", "severity": "low|medium|high", "description": "string", "mitigation": "string"}],
  "mitigationStrategies": ["strategy1"]
}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const risk = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      overallRisk: "medium",
      riskScore: 40,
      risks: [],
      mitigationStrategies: [],
    };

    res.json(risk);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Risk analysis failed" });
  }
});

// Smart Suggestions
router.get("/ai/smart-suggestions/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.taskId, taskId));

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `This volunteer task has ${apps.length} applications out of ${task.requiredPeople} needed people. Suggest improvements.

Task: ${JSON.stringify({ title: task.title, description: task.description, date: task.date, requiredPeople: task.requiredPeople })}
Current applications: ${apps.length}

Respond in JSON:
{
  "suggestions": [{"category": "string", "suggestion": "string", "impact": "low|medium|high"}],
  "urgency": "low|medium|high",
  "currentIssues": ["issue1"]
}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      suggestions: [],
      urgency: "medium",
      currentIssues: [],
    };

    res.json(suggestions);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Suggestions failed" });
  }
});

// Personal Recommendations
router.get("/ai/personal-recommendation", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [volunteer] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.status, "published"));

    if (allTasks.length === 0) {
      res.json([]);
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Recommend tasks for this volunteer and explain why they are perfect for each.

Volunteer: ${JSON.stringify({ skills: volunteer?.skills, interests: volunteer?.interests, location: volunteer?.location, totalHours: volunteer?.totalHours })}
Available tasks: ${JSON.stringify(allTasks.slice(0, 10).map(t => ({ id: t.id, title: t.title, category: t.category, skillsRequired: t.skillsRequired, location: t.location })))}

Respond in JSON array (max 5 recommendations):
[{"taskId": id, "matchScore": number 0-100, "reasons": ["reason1"], "personalMessage": "personalized message why this volunteer is perfect"}]`
      }],
    });

    const text = response.choices[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const result = recommendations.map((r: { taskId: number; matchScore: number; reasons: string[]; personalMessage: string }) => {
      const task = allTasks.find(t => t.id === r.taskId);
      if (!task) return null;
      return {
        task: { ...task, skillsRequired: task.skillsRequired || [], applicantsCount: 0, approvedCount: 0 },
        matchScore: r.matchScore,
        reasons: r.reasons,
        personalMessage: r.personalMessage,
      };
    }).filter(Boolean);

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Recommendations failed" });
  }
});

// RAG Chatbot
router.post("/ai/chatbot/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { question, language = "ru" } = req.body;
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const langPrompt = LANG_PROMPTS[language as keyof typeof LANG_PROMPTS] || LANG_PROMPTS.ru;
    const taskData = JSON.stringify({
      title: task.title,
      description: task.description,
      location: task.location,
      date: task.date,
      duration: task.duration,
      requiredPeople: task.requiredPeople,
      skillsRequired: task.skillsRequired,
      ageRequirements: task.ageRequirements,
      category: task.category,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `${langPrompt}You are a helpful assistant for volunteer tasks. Answer ONLY based on the provided task data. If the information is not in the task data, say "This information is not provided" (in the appropriate language). Do NOT make up information.

Task data: ${taskData}`
        },
        { role: "user", content: question }
      ],
    });

    const answer = response.choices[0]?.message?.content || "This information is not provided";
    const foundInTaskData = !answer.toLowerCase().includes("not provided") && !answer.toLowerCase().includes("не указано");

    res.json({
      answer,
      foundInTaskData,
      relatedFields: ["description", "location", "date", "duration"].filter(f =>
        taskData.toLowerCase().includes(f.toLowerCase())
      ),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Chatbot failed" });
  }
});

// Vision Verification
router.post("/ai/verify-completion/:applicationId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const applicationId = parseInt(req.params.applicationId);
    const { photoUrl, photoBase64 } = req.body;
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, app.taskId)).limit(1);

    const imageContent = photoBase64
      ? { type: "image_url" as const, image_url: { url: `data:image/jpeg;base64,${photoBase64}` } }
      : { type: "image_url" as const, image_url: { url: photoUrl } };

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            content: `Verify if this photo shows completion of the volunteer task: "${task?.title || ""}". Description: "${task?.description || ""}". 
Determine if: 1) The photo is relevant to the task, 2) Shows evidence of task completion.
Respond in JSON: {"status": "approved|rejected", "confidence": 0.0-1.0, "reason": "explanation", "detectedElements": ["element1"]}`
          } as { type: "text"; content: string },
          imageContent as { type: "image_url"; image_url: { url: string } },
        ],
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      status: "rejected",
      confidence: 0.5,
      reason: "Could not analyze image",
      detectedElements: [],
    };

    // Update application
    await db.update(applicationsTable).set({
      completionPhotoUrl: photoUrl,
      verificationStatus: result.status,
      verificationReason: result.reason,
    }).where(eq(applicationsTable.id, applicationId));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Reputation Analysis
router.get("/ai/reputation/:volunteerId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const volunteerId = parseInt(req.params.volunteerId);
    const [volunteer] = await db.select().from(usersTable).where(eq(usersTable.id, volunteerId)).limit(1);
    if (!volunteer) {
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{
        role: "user",
        content: `Analyze this volunteer's reputation and predict their future behavior.

Volunteer data: ${JSON.stringify({
  totalHours: volunteer.totalHours,
  rating: volunteer.rating,
  tasksCompleted: volunteer.tasksCompleted,
  level: volunteer.level,
  badges: volunteer.badges,
  skills: volunteer.skills,
  memberSince: volunteer.createdAt,
})}

Respond in JSON:
{
  "overallScore": number 0-100,
  "reliability": number 0-100,
  "activity": number 0-100,
  "behavior": number 0-100,
  "trend": "improving|stable|declining",
  "insights": ["insight1", "insight2"],
  "predictedFutureBehavior": "prediction string"
}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      overallScore: volunteer.reputationScore || 50,
      reliability: 70,
      activity: 60,
      behavior: 80,
      trend: "stable",
      insights: ["Active volunteer"],
      predictedFutureBehavior: "Will continue contributing",
    };

    // Update reputation score
    await db.update(usersTable).set({ reputationScore: analysis.overallScore }).where(eq(usersTable.id, volunteerId));

    res.json(analysis);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Reputation analysis failed" });
  }
});

export default router;

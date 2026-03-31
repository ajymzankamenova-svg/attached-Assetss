import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { tasksTable } from "./tasks";

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  taskId: integer("task_id").notNull().references(() => tasksTable.id),
  applicationId: integer("application_id").notNull(),
  level: text("level").notNull().default("Basic"),
  hoursAwarded: real("hours_awarded").notNull().default(0),
  skillsUsed: jsonb("skills_used").$type<string[]>().notNull().default([]),
  role: text("role"),
  aiDescription: text("ai_description").notNull(),
  curatorName: text("curator_name"),
  impactScore: integer("impact_score").default(0),
  verifyToken: text("verify_token").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCertificateSchema = createInsertSchema(certificatesTable).omit({ id: true, createdAt: true });
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;

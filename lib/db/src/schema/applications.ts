import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { tasksTable } from "./tasks";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id),
  volunteerId: integer("volunteer_id").notNull().references(() => usersTable.id),
  matchScore: integer("match_score"),
  role: text("role"),
  status: text("status").notNull().default("pending"),
  completionPhotoUrl: text("completion_photo_url"),
  verificationStatus: text("verification_status"),
  verificationReason: text("verification_reason"),
  hoursAwarded: real("hours_awarded"),
  adminRating: real("admin_rating"),
  adminComment: text("admin_comment"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, appliedAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;

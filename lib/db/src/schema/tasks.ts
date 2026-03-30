import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  requiredPeople: integer("required_people").notNull(),
  skillsRequired: jsonb("skills_required").$type<string[]>().notNull().default([]),
  ageRequirements: text("age_requirements"),
  category: text("category").notNull(),
  status: text("status").notNull().default("draft"),
  qualityScore: integer("quality_score"),
  successPrediction: integer("success_prediction"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

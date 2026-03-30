import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("volunteer"),
  language: text("language").notNull().default("ru"),
  avatar: text("avatar"),
  bio: text("bio"),
  location: text("location"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  availability: text("availability"),
  ageGroup: text("age_group"),
  transportMode: text("transport_mode"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  badges: jsonb("badges").$type<string[]>().notNull().default([]),
  totalHours: real("total_hours").notNull().default(0),
  rating: real("rating").notNull().default(0),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  reputationScore: real("reputation_score").notNull().default(50),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

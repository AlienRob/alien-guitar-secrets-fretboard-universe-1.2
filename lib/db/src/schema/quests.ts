import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const questTemplatesTable = pgTable("quest_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exerciseType: text("exercise_type").notNull(),
  targetCount: integer("target_count").notNull(),
  xpReward: integer("xp_reward").notNull(),
});

export const dailyQuestsTable = pgTable("daily_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  templateId: integer("template_id").notNull().references(() => questTemplatesTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exerciseType: text("exercise_type").notNull(),
  targetCount: integer("target_count").notNull(),
  currentCount: integer("current_count").notNull().default(0),
  xpReward: integer("xp_reward").notNull(),
  completed: boolean("completed").notNull().default(false),
  questDate: text("quest_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestTemplateSchema = createInsertSchema(questTemplatesTable).omit({ id: true });
export type InsertQuestTemplate = z.infer<typeof insertQuestTemplateSchema>;
export type QuestTemplate = typeof questTemplatesTable.$inferSelect;

export const insertDailyQuestSchema = createInsertSchema(dailyQuestsTable).omit({ id: true, createdAt: true });
export type InsertDailyQuest = z.infer<typeof insertDailyQuestSchema>;
export type DailyQuest = typeof dailyQuestsTable.$inferSelect;

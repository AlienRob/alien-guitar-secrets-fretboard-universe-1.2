import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  key: text("key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconEmoji: text("icon_emoji").notNull(),
  category: text("category").notNull().default("general"),
  xpReward: integer("xp_reward").notNull().default(0),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
});

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ id: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;

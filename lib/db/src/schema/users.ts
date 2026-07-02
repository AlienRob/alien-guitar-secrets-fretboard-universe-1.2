import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  username: text("username").notNull().unique(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  belt: text("belt").notNull().default("white"),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  totalSessions: integer("total_sessions").notNull().default(0),
  solarSystem: integer("solar_system").notNull().default(1),
  planet: integer("planet").notNull().default(1),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Manually granted ("comped") premium — set when a user redeems a valid
  // premium access code. Grants full premium access without a Stripe payment.
  compedPremium: boolean("comped_premium").notNull().default(false),
  trailFlags: jsonb("trail_flags").$type<{
    findingNotesViewed: boolean;
    intervalsViewed: boolean;
    practiceStarted: boolean;
    scaleLessonViewed: boolean;
    chordLessonViewed: boolean;
  }>().default({ findingNotesViewed: false, intervalsViewed: false, practiceStarted: false, scaleLessonViewed: false, chordLessonViewed: false }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

// Email addresses captured by the free FretFlow app's signup gate.
export const fretflowLeadsTable = pgTable("fretflow_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("fretflow"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFretflowLeadSchema = z.object({
  email: z.email().max(320),
});
export type InsertFretflowLead = z.infer<typeof insertFretflowLeadSchema>;
export type FretflowLead = typeof fretflowLeadsTable.$inferSelect;

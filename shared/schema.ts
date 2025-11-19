import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  csvFilename: text("csv_filename").notNull(),
  country: varchar("country", { length: 10 }).notNull().default('gb'),
  language: varchar("language", { length: 10 }).notNull().default('en'),
  totalQueries: integer("total_queries").notNull(),
  totalResults: integer("total_results").notNull(),
  totalBrandMatches: integer("total_brand_matches").notNull(),
  apiCallsMade: integer("api_calls_made").notNull(),
  processingTimeSeconds: decimal("processing_time_seconds", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default('completed'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  scheduledFor: timestamp("scheduled_for"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }),
}, (table) => ({
  projectIdIdx: index("searches_project_id_idx").on(table.projectId),
  createdAtIdx: index("searches_created_at_idx").on(table.createdAt),
}));

export const rankingResults = pgTable("ranking_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  searchId: varchar("search_id").notNull().references(() => searches.id, { onDelete: 'cascade' }),
  query: text("query").notNull(),
  brand: text("brand").notNull(),
  branch: text("branch").notNull(),
  rankingPosition: integer("ranking_position"),
  title: text("title"),
  address: text("address"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  category: text("category"),
  brandMatch: boolean("brand_match").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  searchIdIdx: index("ranking_results_search_id_idx").on(table.searchId),
  queryBrandBranchIdx: index("ranking_results_query_brand_branch_idx").on(table.query, table.brand, table.branch),
  createdAtIdx: index("ranking_results_created_at_idx").on(table.createdAt),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  createdAt: true,
});

export const insertRankingResultSchema = createInsertSchema(rankingResults).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Search = typeof searches.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type RankingResult = typeof rankingResults.$inferSelect;
export type InsertRankingResult = z.infer<typeof insertRankingResultSchema>;

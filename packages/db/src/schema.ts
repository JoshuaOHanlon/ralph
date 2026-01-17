import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const repos = sqliteTable("repos", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  gitUrl: text("git_url").notNull(),
  branch: text("branch").notNull().default("main"),
  dockerImage: text("docker_image").notNull(),
  keywords: text("keywords").notNull().default("[]"), // JSON array
  description: text("description").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  repoId: text("repo_id")
    .notNull()
    .references(() => repos.id),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  priority: integer("priority").notNull().default(100),
  prd: text("prd").notNull(), // JSON PRD document
  triggeredBy: text("triggered_by", {
    enum: ["slack", "dashboard", "api"],
  }).notNull(),
  slackChannelId: text("slack_channel_id"),
  slackThreadTs: text("slack_thread_ts"),
  slackUserId: text("slack_user_id"),
  iteration: integer("iteration").notNull().default(0),
  maxIterations: integer("max_iterations").notNull().default(10),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const jobLogs = sqliteTable("job_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  iteration: integer("iteration").notNull(),
  stream: text("stream", { enum: ["stdout", "stderr"] }).notNull(),
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
});

export type RepoRow = typeof repos.$inferSelect;
export type InsertRepoRow = typeof repos.$inferInsert;
export type JobRow = typeof jobs.$inferSelect;
export type InsertJobRow = typeof jobs.$inferInsert;
export type JobLogRow = typeof jobLogs.$inferSelect;
export type InsertJobLogRow = typeof jobLogs.$inferInsert;

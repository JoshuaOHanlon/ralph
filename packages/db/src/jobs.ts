import { eq, and, desc, sql, asc, ne, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { CreateJob, Job, JobStatus, Prd, CreateJobLog, JobLog } from "@ralph/core";
import { jobs, jobLogs, type JobRow, type JobLogRow } from "./schema.js";
import { getDb } from "./client.js";

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    repoId: row.repoId,
    status: row.status as JobStatus,
    priority: row.priority,
    prd: JSON.parse(row.prd) as Prd,
    triggeredBy: row.triggeredBy as "slack" | "dashboard" | "api",
    slackChannelId: row.slackChannelId ?? undefined,
    slackThreadTs: row.slackThreadTs ?? undefined,
    slackUserId: row.slackUserId ?? undefined,
    iteration: row.iteration,
    maxIterations: row.maxIterations,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: row.createdAt.getTime(),
    startedAt: row.startedAt?.getTime(),
    completedAt: row.completedAt?.getTime(),
  };
}

function rowToJobLog(row: JobLogRow): JobLog {
  return {
    id: row.id,
    jobId: row.jobId,
    iteration: row.iteration,
    stream: row.stream as "stdout" | "stderr",
    content: row.content,
    timestamp: row.timestamp.getTime(),
  };
}

export async function getAllJobs(): Promise<Job[]> {
  const db = getDb();
  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return rows.map(rowToJob);
}

export async function getJobsByStatus(status: JobStatus): Promise<Job[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, status))
    .orderBy(asc(jobs.priority), asc(jobs.createdAt));
  return rows.map(rowToJob);
}

export async function getJobById(id: string): Promise<Job | null> {
  const db = getDb();
  const rows = await db.select().from(jobs).where(eq(jobs.id, id));
  return rows[0] ? rowToJob(rows[0]) : null;
}

export async function createJob(data: CreateJob): Promise<Job> {
  const db = getDb();
  const id = randomUUID();
  const now = new Date();

  await db.insert(jobs).values({
    id,
    repoId: data.repoId,
    status: "pending",
    priority: data.priority,
    prd: JSON.stringify(data.prd),
    triggeredBy: data.triggeredBy,
    slackChannelId: data.slackChannelId,
    slackThreadTs: data.slackThreadTs,
    slackUserId: data.slackUserId,
    maxIterations: data.maxIterations,
    iteration: 0,
    createdAt: now,
  });

  const job = await getJobById(id);
  if (!job) throw new Error("Failed to create job");
  return job;
}

// Atomic dequeue - gets next pending job and marks it as running
export async function dequeueJob(): Promise<Job | null> {
  const db = getDb();

  // Use a raw SQL transaction for atomic operation
  const sqlite = (db as { $client: { prepare: (sql: string) => { run: (...args: unknown[]) => { changes: number }; get: (...args: unknown[]) => Record<string, unknown> | undefined } } }).$client;

  const now = Date.now();

  // Find the next pending job ordered by priority and creation time
  const row = sqlite
    .prepare(
      `SELECT * FROM jobs
       WHERE status = 'pending'
       ORDER BY priority ASC, created_at ASC
       LIMIT 1`
    )
    .get() as JobRow | undefined;

  if (!row) return null;

  // Atomically update the job status
  const result = sqlite
    .prepare(
      `UPDATE jobs
       SET status = 'running', started_at = ?
       WHERE id = ? AND status = 'pending'`
    )
    .run(now, row.id);

  // If the update affected no rows, another worker grabbed it
  if (result.changes === 0) return null;

  // Return the updated job
  return getJobById(row.id);
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  errorMessage?: string
): Promise<Job | null> {
  const db = getDb();
  const now = new Date();

  const updates: Partial<typeof jobs.$inferInsert> = { status };

  if (status === "completed" || status === "failed" || status === "cancelled") {
    updates.completedAt = now;
  }

  if (errorMessage !== undefined) {
    updates.errorMessage = errorMessage;
  }

  await db.update(jobs).set(updates).where(eq(jobs.id, id));
  return getJobById(id);
}

export async function updateJobIteration(
  id: string,
  iteration: number
): Promise<Job | null> {
  const db = getDb();
  await db.update(jobs).set({ iteration }).where(eq(jobs.id, id));
  return getJobById(id);
}

export async function updateJobPrd(
  id: string,
  prd: Prd
): Promise<Job | null> {
  const db = getDb();
  await db.update(jobs).set({ prd: JSON.stringify(prd) }).where(eq(jobs.id, id));
  return getJobById(id);
}

export async function cancelJob(id: string): Promise<Job | null> {
  return updateJobStatus(id, "cancelled");
}

export async function countPendingJobs(): Promise<number> {
  const db = getDb();
  const rows = await db.select().from(jobs).where(eq(jobs.status, "pending"));
  return rows.length;
}

export async function getRunningJob(): Promise<Job | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "running"))
    .limit(1);
  return rows[0] ? rowToJob(rows[0]) : null;
}

// Job logs
export async function addJobLog(data: CreateJobLog): Promise<void> {
  const db = getDb();
  await db.insert(jobLogs).values({
    jobId: data.jobId,
    iteration: data.iteration,
    stream: data.stream,
    content: data.content,
    timestamp: new Date(data.timestamp),
  });
}

export async function getJobLogs(
  jobId: string,
  options?: { iteration?: number; afterId?: number }
): Promise<JobLog[]> {
  const db = getDb();

  let query = db.select().from(jobLogs).where(eq(jobLogs.jobId, jobId));

  if (options?.iteration !== undefined) {
    query = db
      .select()
      .from(jobLogs)
      .where(
        and(eq(jobLogs.jobId, jobId), eq(jobLogs.iteration, options.iteration))
      );
  }

  const rows = await query.orderBy(asc(jobLogs.id));

  let result = rows.map(rowToJobLog);

  if (options?.afterId !== undefined) {
    result = result.filter((log) => log.id > options.afterId!);
  }

  return result;
}

export async function deleteJobLogs(jobId: string): Promise<void> {
  const db = getDb();
  await db.delete(jobLogs).where(eq(jobLogs.jobId, jobId));
}

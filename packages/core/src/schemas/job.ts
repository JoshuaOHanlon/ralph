import { z } from "zod";
import { PrdSchema } from "./prd.js";

export const JobStatus = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export type JobStatus = z.infer<typeof JobStatus>;

export const JobTrigger = z.enum(["slack", "dashboard", "api"]);

export type JobTrigger = z.infer<typeof JobTrigger>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  repoId: z.string().uuid(),
  status: JobStatus.default("pending"),
  priority: z.number().int().default(100),
  prd: PrdSchema,
  triggeredBy: JobTrigger,
  slackChannelId: z.string().optional(),
  slackThreadTs: z.string().optional(),
  slackUserId: z.string().optional(),
  iteration: z.number().int().default(0),
  maxIterations: z.number().int().default(10),
  errorMessage: z.string().optional(),
  createdAt: z.number().int().positive(),
  startedAt: z.number().int().positive().optional(),
  completedAt: z.number().int().positive().optional(),
});

export type Job = z.infer<typeof JobSchema>;

export const CreateJobSchema = JobSchema.omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  iteration: true,
  status: true,
});

export type CreateJob = z.infer<typeof CreateJobSchema>;

export const JobLogStream = z.enum(["stdout", "stderr"]);

export type JobLogStream = z.infer<typeof JobLogStream>;

export const JobLogSchema = z.object({
  id: z.number().int().positive(),
  jobId: z.string().uuid(),
  iteration: z.number().int(),
  stream: JobLogStream,
  content: z.string(),
  timestamp: z.number().int().positive(),
});

export type JobLog = z.infer<typeof JobLogSchema>;

export const CreateJobLogSchema = JobLogSchema.omit({
  id: true,
});

export type CreateJobLog = z.infer<typeof CreateJobLogSchema>;

import { z } from "zod";

export const WorkerSettingsSchema = z.object({
  pollIntervalMs: z.number().int().positive().default(5000),
  maxIterations: z.number().int().positive().default(10),
});

export type WorkerSettings = z.infer<typeof WorkerSettingsSchema>;

export const SlackSettingsSchema = z.object({
  allowedChannels: z.array(z.string()).default([]),
  rateLimitPerHour: z.number().int().positive().default(5),
});

export type SlackSettings = z.infer<typeof SlackSettingsSchema>;

export const DockerSettingsSchema = z.object({
  memoryLimit: z.string().default("4g"),
  cpuLimit: z.number().positive().default(2),
  networkMode: z.string().default("none"),
});

export type DockerSettings = z.infer<typeof DockerSettingsSchema>;

export const SettingsSchema = z.object({
  worker: WorkerSettingsSchema.default({}),
  slack: SlackSettingsSchema.default({}),
  docker: DockerSettingsSchema.default({}),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const HealthStatusSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  services: z.object({
    database: z.enum(["connected", "disconnected", "error"]),
    docker: z.enum(["available", "unavailable", "error"]),
    slack: z.enum(["authenticated", "unauthenticated", "error"]),
    tunnel: z.enum(["connected", "disconnected", "not_configured"]),
  }),
  repos: z.number().int(),
  pendingJobs: z.number().int(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

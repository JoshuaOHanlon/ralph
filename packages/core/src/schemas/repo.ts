import { z } from "zod";

export const RepoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(50),
  gitUrl: z.string().url().or(z.string().startsWith("git@")),
  branch: z.string().default("main"),
  dockerImage: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  description: z.string().default(""),
  enabled: z.boolean().default(true),
  createdAt: z.number().int().positive(),
});

export type Repo = z.infer<typeof RepoSchema>;

export const CreateRepoSchema = RepoSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateRepo = z.infer<typeof CreateRepoSchema>;

export const UpdateRepoSchema = CreateRepoSchema.partial();

export type UpdateRepo = z.infer<typeof UpdateRepoSchema>;

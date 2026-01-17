import { z } from "zod";

export const UserStorySchema = z.object({
  id: z.string().regex(/^US-\d{3}$/),
  title: z.string().min(1).max(200),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()).min(1),
  priority: z.number().int().positive(),
  passes: z.boolean().default(false),
  notes: z.string().default(""),
});

export type UserStory = z.infer<typeof UserStorySchema>;

export const PrdSchema = z.object({
  project: z.string().min(1),
  branchName: z.string().regex(/^ralph\/[a-z0-9-]+$/),
  description: z.string(),
  userStories: z.array(UserStorySchema).min(1),
});

export type Prd = z.infer<typeof PrdSchema>;

export const CreatePrdSchema = PrdSchema;

export type CreatePrd = z.infer<typeof CreatePrdSchema>;

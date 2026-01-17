import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { CreateRepo, UpdateRepo, Repo } from "@ralph/core";
import { repos, type RepoRow } from "./schema.js";
import { getDb } from "./client.js";

function rowToRepo(row: RepoRow): Repo {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    gitUrl: row.gitUrl,
    branch: row.branch,
    dockerImage: row.dockerImage,
    keywords: JSON.parse(row.keywords) as string[],
    description: row.description,
    enabled: row.enabled,
    createdAt: row.createdAt.getTime(),
  };
}

export async function getAllRepos(): Promise<Repo[]> {
  const db = getDb();
  const rows = await db.select().from(repos);
  return rows.map(rowToRepo);
}

export async function getEnabledRepos(): Promise<Repo[]> {
  const db = getDb();
  const rows = await db.select().from(repos).where(eq(repos.enabled, true));
  return rows.map(rowToRepo);
}

export async function getRepoById(id: string): Promise<Repo | null> {
  const db = getDb();
  const rows = await db.select().from(repos).where(eq(repos.id, id));
  return rows[0] ? rowToRepo(rows[0]) : null;
}

export async function getRepoBySlug(slug: string): Promise<Repo | null> {
  const db = getDb();
  const rows = await db.select().from(repos).where(eq(repos.slug, slug));
  return rows[0] ? rowToRepo(rows[0]) : null;
}

export async function createRepo(data: CreateRepo): Promise<Repo> {
  const db = getDb();
  const id = randomUUID();
  const now = new Date();

  await db.insert(repos).values({
    id,
    name: data.name,
    slug: data.slug,
    gitUrl: data.gitUrl,
    branch: data.branch,
    dockerImage: data.dockerImage,
    keywords: JSON.stringify(data.keywords),
    description: data.description,
    enabled: data.enabled,
    createdAt: now,
  });

  const repo = await getRepoById(id);
  if (!repo) throw new Error("Failed to create repo");
  return repo;
}

export async function updateRepo(
  id: string,
  data: UpdateRepo
): Promise<Repo | null> {
  const db = getDb();

  const updates: Partial<typeof repos.$inferInsert> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.gitUrl !== undefined) updates.gitUrl = data.gitUrl;
  if (data.branch !== undefined) updates.branch = data.branch;
  if (data.dockerImage !== undefined) updates.dockerImage = data.dockerImage;
  if (data.keywords !== undefined)
    updates.keywords = JSON.stringify(data.keywords);
  if (data.description !== undefined) updates.description = data.description;
  if (data.enabled !== undefined) updates.enabled = data.enabled;

  if (Object.keys(updates).length === 0) {
    return getRepoById(id);
  }

  await db.update(repos).set(updates).where(eq(repos.id, id));
  return getRepoById(id);
}

export async function deleteRepo(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(repos).where(eq(repos.id, id));
  return result.changes > 0;
}

export async function countRepos(): Promise<number> {
  const db = getDb();
  const rows = await db.select().from(repos);
  return rows.length;
}

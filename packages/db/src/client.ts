import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

let db: ReturnType<typeof createDatabase> | null = null;

function createDatabase(dbPath: string) {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  return drizzle(sqlite, { schema });
}

export function getDb(dbPath?: string) {
  if (!db) {
    const path = dbPath ?? process.env.DATABASE_PATH ?? "./data/ralph.db";
    db = createDatabase(path);
  }
  return db;
}

export function closeDb() {
  db = null;
}

export type Database = ReturnType<typeof getDb>;

import type { App } from "@slack/bolt";
import { handleRalphCommand } from "./ralph.js";
import { handleReposCommand } from "./repos.js";

export function registerCommands(app: App) {
  // /ralph - Main command for creating jobs
  app.command("/ralph", handleRalphCommand);

  // /repos - Repository management
  app.command("/repos", handleReposCommand);
}

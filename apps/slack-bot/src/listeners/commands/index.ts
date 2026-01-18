import type { App } from "@slack/bolt";
import { handleRalphberryCommand } from "./ralphberry.js";
import { handleReposCommand } from "./repos.js";

export function registerCommands(app: App) {
  // /ralphberry - Main command for creating jobs
  app.command("/ralphberry", handleRalphberryCommand);

  // /repos - Repository management
  app.command("/repos", handleReposCommand);
}

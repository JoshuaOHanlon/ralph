import type { App } from "@slack/bolt";
import { handleAppMention } from "./app-mention.js";
import { handleMessage } from "./message.js";

export function registerEvents(app: App) {
  // Handle @ralph mentions
  app.event("app_mention", handleAppMention);

  // Handle messages in threads (for PRD conversation)
  app.event("message", handleMessage);
}

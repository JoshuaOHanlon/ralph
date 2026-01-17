import { App, LogLevel } from "@slack/bolt";
import { createServer } from "http";
import { registerCommands } from "./listeners/commands/index.js";
import { registerEvents } from "./listeners/events/index.js";
import { registerActions } from "./listeners/actions/index.js";
import { registerViews } from "./listeners/views/index.js";

const PORT = parseInt(process.env.SLACK_BOT_PORT ?? "3000", 10);

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.INFO,
});

// Register all listeners
registerCommands(app);
registerEvents(app);
registerActions(app);
registerViews(app);

// Health check endpoint
const healthServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Start the app
async function start() {
  await app.start();
  healthServer.listen(PORT);
  console.log(`[Slack Bot] Running on port ${PORT}`);
  console.log("[Slack Bot] Socket mode enabled");
}

start().catch((error) => {
  console.error("[Slack Bot] Failed to start:", error);
  process.exit(1);
});

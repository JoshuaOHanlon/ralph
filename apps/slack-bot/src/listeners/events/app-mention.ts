import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { getEnabledRepos } from "@ralphberry/db";
import { classifyRepo } from "../../services/classifier.js";
import { startPrdConversation } from "../../services/prd-conversation.js";
import { isChannelAllowed } from "../../services/channel-guard.js";

export async function handleAppMention({
  event,
  client,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"app_mention">) {
  // Check channel restrictions
  if (!isChannelAllowed(event.channel)) {
    return;
  }

  // Remove the bot mention from the text
  const text = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();

  if (!text) {
    await say({
      text: "Hi! Tell me what you'd like to do. Example: `@ralphberry add dark mode to the design system`",
      thread_ts: event.thread_ts ?? event.ts,
    });
    return;
  }

  // Get enabled repos
  const repos = await getEnabledRepos();

  if (repos.length === 0) {
    await say({
      text: "No repositories configured. Use `/repos add` to add a repository first.",
      thread_ts: event.thread_ts ?? event.ts,
    });
    return;
  }

  // Classify which repo this request is for
  const matchedRepo = classifyRepo(text, repos);

  if (!matchedRepo) {
    // Ask user to select a repo
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "I couldn't determine which repository this is for. Please select one:",
          },
        },
        {
          type: "actions",
          elements: repos.slice(0, 5).map((repo) => ({
            type: "button",
            text: {
              type: "plain_text",
              text: repo.name,
            },
            value: JSON.stringify({ repoId: repo.id, description: text }),
            action_id: `select_repo_${repo.id}`,
          })),
        },
      ],
      thread_ts: event.thread_ts ?? event.ts,
    });
    return;
  }

  // Start PRD conversation
  await startPrdConversation(client, {
    channelId: event.channel,
    userId: event.user,
    repo: matchedRepo,
    description: text,
    threadTs: event.thread_ts ?? event.ts,
  });
}

import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { getEnabledRepos } from "@ralph/db";
import { classifyRepo } from "../../services/classifier.js";
import { startPrdConversation } from "../../services/prd-conversation.js";
import { isChannelAllowed } from "../../services/channel-guard.js";

export async function handleRalphCommand({
  command,
  ack,
  respond,
  client,
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) {
  await ack();

  // Check channel restrictions
  if (!isChannelAllowed(command.channel_id)) {
    await respond({
      text: "Sorry, Ralph is not available in this channel.",
      response_type: "ephemeral",
    });
    return;
  }

  const text = command.text.trim();

  if (!text) {
    await respond({
      text: "Please describe what you'd like to do. Example: `/ralph add dark mode to the design system`",
      response_type: "ephemeral",
    });
    return;
  }

  // Get enabled repos
  const repos = await getEnabledRepos();

  if (repos.length === 0) {
    await respond({
      text: "No repositories configured. Use `/repos add` to add a repository first.",
      response_type: "ephemeral",
    });
    return;
  }

  // Classify which repo this request is for
  const matchedRepo = classifyRepo(text, repos);

  if (!matchedRepo) {
    // Couldn't determine repo - ask user to clarify
    await respond({
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
      response_type: "ephemeral",
    });
    return;
  }

  // Start PRD conversation in a thread
  await startPrdConversation(client, {
    channelId: command.channel_id,
    userId: command.user_id,
    repo: matchedRepo,
    description: text,
  });

  await respond({
    text: `Starting PRD conversation for *${matchedRepo.name}*. Check the thread below!`,
    response_type: "in_channel",
  });
}

import type { AllMiddlewareArgs, SlackActionMiddlewareArgs, ButtonAction } from "@slack/bolt";
import { getRepoById } from "@ralphberry/db";
import { startPrdConversation } from "../../services/prd-conversation.js";

export async function handleSelectRepo({
  action,
  ack,
  client,
  body,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<ButtonAction>) {
  await ack();

  if (!action.value) return;

  const { repoId, description } = JSON.parse(action.value) as {
    repoId: string;
    description: string;
  };

  const repo = await getRepoById(repoId);
  if (!repo) return;

  const channelId = body.channel?.id;
  const userId = body.user.id;

  if (!channelId) return;

  // Start PRD conversation
  await startPrdConversation(client, {
    channelId,
    userId,
    repo,
    description,
  });
}

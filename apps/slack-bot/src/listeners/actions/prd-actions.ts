import type { AllMiddlewareArgs, SlackActionMiddlewareArgs, ButtonAction } from "@slack/bolt";
import { queue } from "@ralphberry/queue";
import { getRepoById } from "@ralphberry/db";
import type { Prd } from "@ralphberry/core";
import { sendJobStartedNotification } from "../../services/notifications.js";

export async function handleConfirmPrd({
  action,
  ack,
  client,
  body,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<ButtonAction>) {
  await ack();

  if (!action.value) return;

  const { repoId, prd } = JSON.parse(action.value) as {
    repoId: string;
    prd: Prd;
  };

  const repo = await getRepoById(repoId);
  if (!repo) return;

  const channelId = body.channel?.id;
  const userId = body.user.id;
  const threadTs = "message" in body ? body.message?.ts : undefined;

  // Create job in queue
  const job = await queue.enqueue({
    repoId: repo.id,
    prd,
    triggeredBy: "slack",
    priority: 100,
    maxIterations: parseInt(process.env.WORKER_MAX_ITERATIONS ?? "10", 10),
    slackChannelId: channelId,
    slackThreadTs: threadTs,
    slackUserId: userId,
  });

  // Send notification
  if (channelId) {
    await sendJobStartedNotification(client, {
      channelId,
      threadTs,
      job,
      repo,
    });
  }
}

export async function handleCancelPrd({
  ack,
  respond,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<ButtonAction>) {
  await ack();

  await respond({
    text: "PRD creation cancelled.",
    replace_original: true,
  });
}

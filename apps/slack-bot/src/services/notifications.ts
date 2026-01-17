import type { WebClient } from "@slack/web-api";
import type { Job, Repo } from "@ralph/core";

interface JobNotificationParams {
  channelId: string;
  threadTs?: string;
  job: Job;
  repo: Repo;
}

export async function sendJobStartedNotification(
  client: WebClient,
  params: JobNotificationParams
): Promise<void> {
  const { channelId, threadTs, job, repo } = params;

  await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: `Job started for ${repo.name}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:rocket: *Job Started*\n\n*Repository:* ${repo.name}\n*Job ID:* \`${job.id.slice(0, 8)}\`\n*Stories:* ${job.prd.userStories.length}\n*Max Iterations:* ${job.maxIterations}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Branch: \`${job.prd.branchName}\``,
          },
        ],
      },
    ],
  });
}

export async function sendJobCompletedNotification(
  client: WebClient,
  params: JobNotificationParams
): Promise<void> {
  const { channelId, threadTs, job, repo } = params;

  const completedStories = job.prd.userStories.filter((s) => s.passes).length;
  const totalStories = job.prd.userStories.length;
  const allComplete = completedStories === totalStories;

  await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: `Job ${allComplete ? "completed" : "finished"} for ${repo.name}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${allComplete ? ":white_check_mark:" : ":warning:"} *Job ${allComplete ? "Completed" : "Finished"}*\n\n*Repository:* ${repo.name}\n*Job ID:* \`${job.id.slice(0, 8)}\`\n*Stories Completed:* ${completedStories}/${totalStories}\n*Iterations Used:* ${job.iteration}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Branch: \`${job.prd.branchName}\``,
          },
        ],
      },
    ],
  });
}

export async function sendJobFailedNotification(
  client: WebClient,
  params: JobNotificationParams & { error: string }
): Promise<void> {
  const { channelId, threadTs, job, repo, error } = params;

  await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: `Job failed for ${repo.name}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:x: *Job Failed*\n\n*Repository:* ${repo.name}\n*Job ID:* \`${job.id.slice(0, 8)}\`\n*Error:* ${error}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Iteration: ${job.iteration}/${job.maxIterations}`,
          },
        ],
      },
    ],
  });
}

import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { handlePrdResponse } from "../../services/prd-conversation.js";
import { isChannelAllowed } from "../../services/channel-guard.js";

export async function handleMessage({
  event,
  client,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message">) {
  // Ignore bot messages
  if ("bot_id" in event) return;
  if (!("thread_ts" in event) || !event.thread_ts) return;
  if (!("text" in event) || !event.text) return;

  // Check channel restrictions
  if (!isChannelAllowed(event.channel)) return;

  // Try to handle as PRD conversation response
  await handlePrdResponse(client, {
    channelId: event.channel,
    userId: "user" in event ? event.user : undefined,
    threadTs: event.thread_ts,
    text: event.text,
  });
}

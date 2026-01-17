// Channel restrictions for the bot

const allowedChannels = process.env.SLACK_ALLOWED_CHANNELS
  ? process.env.SLACK_ALLOWED_CHANNELS.split(",").map((c) => c.trim())
  : [];

/**
 * Check if a channel is allowed to use the bot
 */
export function isChannelAllowed(channelId: string): boolean {
  // If no restrictions configured, allow all channels
  if (allowedChannels.length === 0) {
    return true;
  }

  return allowedChannels.includes(channelId);
}

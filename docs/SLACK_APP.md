# Slack App Setup Guide

This guide walks through creating and configuring a Slack app for Ralphberry.

## Create the Slack App

### Option 1: From Manifest (Recommended)

1. Go to https://api.slack.com/apps
2. Click **Create New App**
3. Select **From an app manifest**
4. Choose your workspace
5. Paste the contents of `apps/slack-bot/manifest.json`
6. Click **Create**

### Option 2: Manual Setup

1. Go to https://api.slack.com/apps
2. Click **Create New App** → **From scratch**
3. Name it "Ralphberry" and select your workspace

#### Configure OAuth Scopes

Go to **OAuth & Permissions** and add these Bot Token Scopes:

- `app_mentions:read`
- `channels:history`
- `channels:read`
- `chat:write`
- `commands`
- `groups:history`
- `groups:read`
- `im:history`
- `im:read`
- `im:write`
- `mpim:history`
- `mpim:read`
- `users:read`

#### Enable Socket Mode

Go to **Socket Mode** and:
1. Toggle **Enable Socket Mode** to ON
2. Give the token a name (e.g., "ralphberry-socket")
3. Copy the App-Level Token (`xapp-...`) - you'll need this

#### Configure Slash Commands

Go to **Slash Commands** and add:

| Command | Description | Usage Hint |
|---------|-------------|------------|
| `/ralphberry` | Create a new task for Ralphberry | add dark mode to design system |
| `/repos` | Manage repositories | list \| add \| edit <slug> \| remove <slug> |

#### Enable Events

Go to **Event Subscriptions**:
1. Toggle **Enable Events** to ON
2. Under **Subscribe to bot events**, add:
   - `app_mention`
   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`

#### Enable Interactivity

Go to **Interactivity & Shortcuts**:
1. Toggle **Interactivity** to ON
2. (Request URL is not needed with Socket Mode)

## Install the App

1. Go to **Install App**
2. Click **Install to Workspace**
3. Authorize the permissions
4. Copy the **Bot User OAuth Token** (`xoxb-...`)

## Get Your Credentials

You need three tokens:

| Token | Where to Find | Starts With |
|-------|---------------|-------------|
| Bot Token | OAuth & Permissions | `xoxb-` |
| Signing Secret | Basic Information → App Credentials | (hex string) |
| App Token | Basic Information → App-Level Tokens | `xapp-` |

## Configure Ralphberry

Add the tokens to your `.env` file:

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
```

## Channel Configuration (Optional)

To restrict Ralphberry to specific channels:

1. Get the channel ID:
   - Right-click on a channel in Slack
   - Click "View channel details"
   - At the bottom, copy the Channel ID (starts with `C`)

2. Add to your `.env`:
   ```bash
   SLACK_ALLOWED_CHANNELS=C0123456789,C9876543210
   ```

## Invite Ralphberry to Channels

After installing, invite Ralphberry to the channels where it should respond:

```
/invite @Ralphberry
```

## Test the Integration

1. In an allowed channel, type:
   ```
   @ralphberry hello
   ```

2. Ralphberry should respond with a greeting

3. Try creating a task:
   ```
   /ralphberry add a button to the homepage
   ```

## Troubleshooting

### "not_authed" error
- Check that `SLACK_BOT_TOKEN` starts with `xoxb-`
- Reinstall the app to your workspace

### Bot doesn't respond to mentions
- Ensure the bot is invited to the channel
- Check that `app_mention` event is subscribed
- Verify Socket Mode is enabled

### Commands not working
- Check that slash commands are configured
- Ensure the command names match exactly
- Verify the app is installed to your workspace

### "invalid_auth" error
- Regenerate your tokens and update `.env`
- Check that App Token starts with `xapp-`

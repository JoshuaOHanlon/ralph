# Ralphberry Slack Bot Dockerfile
FROM node:22-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/queue/package.json ./packages/queue/
COPY apps/slack-bot/package.json ./apps/slack-bot/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/slack-bot/ ./apps/slack-bot/

# Build
RUN pnpm run build

WORKDIR /app/apps/slack-bot

EXPOSE 3000

CMD ["node", "dist/index.js"]

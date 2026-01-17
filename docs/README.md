# Ralph Platform

Autonomous AI agent platform for software development. Ralph runs Claude Code in isolated Docker containers, executing tasks defined in PRDs (Product Requirements Documents).

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker
- jq

### One-Command Setup

```bash
git clone https://github.com/you/ralph-platform
cd ralph-platform
./setup.sh
```

The setup wizard will guide you through:
1. Checking prerequisites
2. Configuring your Anthropic API key
3. Setting up Slack integration (optional)
4. Setting up Cloudflare Tunnel (optional)
5. Installing dependencies
6. Building the platform

### Manual Setup

```bash
# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your API keys

# Initialize database
pnpm run db:generate
pnpm run db:migrate

# Build projects
pnpm run build

# Build Docker base image
docker build -t ralph-base:latest -f docker/base/Dockerfile .

# Start with Docker Compose
docker compose up -d

# Or start services individually
pnpm run worker    # Job executor
pnpm run bot       # Slack bot
pnpm run dashboard # Web UI
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Slack Cloud                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS webhook
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Cloudflare Tunnel (ralph.yourdomain.com → localhost:3000)          │
└──────────────────────────────────────────────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────────────────┐
    │                          │                                       │
    ▼                          ▼                                       ▼
┌────────────┐          ┌────────────┐                          ┌────────────┐
│ Slack Bot  │          │ Dashboard  │                          │   Worker   │
│ (Bolt.js)  │          │ (Next.js)  │                          │  (Node.js) │
│ :3000      │          │ :3001      │                          │            │
└─────┬──────┘          └─────┬──────┘                          └─────┬──────┘
      │                       │                                       │
      └───────────────────────┴───────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SQLite + Queue  │
                    │  (packages/db)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Docker Container │
                    │ (per-repo image) │
                    └──────────────────┘
```

## Using Ralph

### Via Slack

1. Mention Ralph with a task description:
   ```
   @ralph add dark mode to the design system
   ```

2. Answer the clarifying questions

3. Confirm the generated PRD

4. Ralph queues and executes the job

### Via Dashboard

1. Open http://localhost:3001
2. View jobs and their status
3. Manage repositories

### Via API

```bash
# Get health status
curl http://localhost:3000/health

# Get all jobs
curl http://localhost:3001/api/jobs

# Get job logs
curl http://localhost:3001/api/jobs/{id}/logs
```

## Documentation

- [Detailed Setup Guide](./SETUP.md)
- [Slack App Setup](./SLACK_APP.md)
- [Cloudflare Tunnel Setup](./CLOUDFLARE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Architecture](./ARCHITECTURE.md)

## Project Structure

```
ralph-platform/
├── apps/
│   ├── slack-bot/      # Bolt.js Slack integration
│   ├── dashboard/      # Next.js web UI
│   └── worker/         # Job executor daemon
├── packages/
│   ├── core/           # Shared types and schemas
│   ├── db/             # SQLite database layer
│   └── queue/          # Job queue abstraction
├── docker/
│   └── base/           # Base Docker image
├── scripts/            # Setup and diagnostic scripts
├── systemd/            # Linux service files
├── config/             # Configuration templates
└── docs/               # Documentation
```

## License

MIT

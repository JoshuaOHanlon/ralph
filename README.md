# Ralphberry Platform

Ralphberry is an autonomous AI agent platform that runs [Claude Code](https://claude.ai/code) in isolated Docker containers. It executes tasks defined in PRDs (Product Requirements Documents), with each iteration using a fresh Claude Code instance with clean context.

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/).

## Features

- **Slack Integration**: Create tasks naturally via `@ralphberry` mentions or `/ralphberry` commands
- **Web Dashboard**: Monitor jobs, view logs, and manage repositories
- **Docker Isolation**: Each job runs in a sandboxed container
- **Multi-Repo Support**: Manage multiple repositories with keyword-based routing
- **SQLite Queue**: Simple, reliable job queue with atomic dequeue
- **Open Source Ready**: One-command setup for Raspberry Pi 5

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker
- jq

### Installation

```bash
git clone https://github.com/you/ralphberry-platform
cd ralphberry-platform
./setup.sh
```

Or manually:

```bash
pnpm install
cp .env.example .env
# Edit .env with your API keys
pnpm run db:migrate
pnpm run build
docker compose up -d
```

### Using Ralphberry

**Via Slack:**
```
@ralphberry add dark mode to the design system
```

**Via Dashboard:**
Open http://localhost:3001

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Slack Cloud                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
    ▼                          ▼                          ▼
┌────────────┐          ┌────────────┐          ┌────────────┐
│ Slack Bot  │          │ Dashboard  │          │   Worker   │
│ (Bolt.js)  │          │ (Next.js)  │          │  (Node.js) │
│ :3000      │          │ :3001      │          │            │
└─────┬──────┘          └─────┬──────┘          └─────┬──────┘
      │                       │                       │
      └───────────────────────┴───────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SQLite + Queue  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Docker Container │
                    │   (Claude CLI)   │
                    └──────────────────┘
```

## Project Structure

```
ralphberry-platform/
├── apps/
│   ├── slack-bot/      # Bolt.js Slack integration
│   ├── dashboard/      # Next.js web UI
│   └── worker/         # Job executor daemon
├── packages/
│   ├── core/           # Shared types and Zod schemas
│   ├── db/             # SQLite + Drizzle ORM
│   └── queue/          # Job queue abstraction
├── docker/             # Docker images
├── scripts/            # Setup and diagnostic scripts
├── systemd/            # Linux service files
└── docs/               # Documentation
```

## Documentation

- [Detailed Setup Guide](./docs/SETUP.md)
- [Slack App Setup](./docs/SLACK_APP.md)
- [Cloudflare Tunnel](./docs/CLOUDFLARE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Standalone Usage

The original standalone Ralphberry loop is still available:

```bash
# Create a PRD
/prd create a task priority system

# Convert to Ralphberry format
/ralphberry convert tasks/prd-task-priority.md

# Run Ralphberry loop
./ralphberry.sh [max_iterations]
```

## Critical Concepts

### Each Iteration = Fresh Context

Each iteration spawns a **new Claude Code instance** with clean context. Memory persists via:
- Git history (commits from previous iterations)
- `progress.txt` (learnings and context)
- `prd.json` (which stories are done)

### Small Tasks

Each story should be completable in one context window. Right-sized stories:
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic

### Feedback Loops

Ralphberry requires feedback loops to work effectively:
- Typecheck catches type errors
- Tests verify behavior
- CI must stay green

## References

- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [Original implementation by Ryan Carson](https://github.com/snarktank/ralph)

## License

MIT

# Ralph Platform Instructions

## Overview

Ralph is a modular autonomous AI agent platform for running Claude Code in isolated Docker containers. It provides Slack integration, a web dashboard, and a SQLite-backed job queue.

## Architecture

- **apps/slack-bot** - Bolt.js Slack integration (port 3000)
- **apps/dashboard** - Next.js web UI (port 3001)
- **apps/worker** - Job executor daemon
- **packages/core** - Shared types and Zod schemas
- **packages/db** - SQLite + Drizzle ORM
- **packages/queue** - Job queue abstraction

## Commands

```bash
# Setup
./setup.sh                  # Interactive setup wizard
./scripts/diagnose.sh       # Check system health

# Development
pnpm install                # Install dependencies
pnpm run build              # Build all packages
pnpm run dev                # Start development servers

# Database
pnpm run db:generate        # Generate Drizzle migrations
pnpm run db:migrate         # Run migrations

# Services
pnpm run worker             # Start job worker
pnpm run bot                # Start Slack bot
pnpm run dashboard          # Start dashboard

# Docker
docker compose up -d        # Start all services
docker compose logs -f      # View logs
```

## Key Files

| File | Purpose |
|------|---------|
| `ralph.sh` | Standalone loop for running without platform |
| `prompt.md` | Instructions given to each Claude Code instance |
| `prd.json.example` | Example PRD format |
| `.env.example` | Environment variable template |
| `docker-compose.yml` | Docker orchestration config |

## Patterns

- Jobs run in isolated Docker containers with the `ralph-base` image
- Each iteration spawns a fresh Claude Code instance with clean context
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- The worker uses atomic dequeue to prevent race conditions
- Slack bot uses Socket Mode for real-time communication

## Development Tips

- Run `pnpm run typecheck` to check all packages
- Use `turbo.json` for build caching and task orchestration
- Packages depend on each other: core → db → queue
- The dashboard uses React 19 and Next.js 15

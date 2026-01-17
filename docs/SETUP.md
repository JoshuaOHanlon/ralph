# Ralph Platform - Detailed Setup Guide

This guide walks through setting up Ralph Platform on a Raspberry Pi 5 or any Linux/macOS system.

## Prerequisites

### Hardware Requirements

- **Raspberry Pi 5 (8GB)** recommended, or any system with:
  - 4GB+ RAM
  - 20GB+ storage
  - Network connectivity

### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 22+ | Runtime |
| pnpm | 9+ | Package manager |
| Docker | 24+ | Container runtime |
| jq | 1.6+ | JSON processing |
| git | 2+ | Version control |

### Install Prerequisites

```bash
# Run the automated installer
./scripts/install-prereqs.sh

# Or install manually:

# Node.js 22 (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm

# Docker (Raspberry Pi / Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes

# jq
sudo apt install jq  # Debian/Ubuntu
brew install jq      # macOS
```

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/you/ralph-platform
cd ralph-platform
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Required: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Required for Slack: Get from https://api.slack.com/apps
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...

# Optional: Cloudflare Tunnel token
TUNNEL_TOKEN=...
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Initialize Database

```bash
# Generate Drizzle migrations
pnpm run db:generate

# Run migrations
pnpm run db:migrate
```

### 5. Build Projects

```bash
pnpm run build
```

### 6. Build Docker Images

```bash
# Build the base image
docker build -t ralph-base:latest -f docker/base/Dockerfile .
```

### 7. Add a Repository

Clone your first repository:

```bash
mkdir -p repos
git clone git@github.com:yourorg/your-repo.git repos/your-repo
```

Build a repo-specific Docker image (optional):

```bash
# If your repo has special dependencies, create repos/your-repo/Dockerfile.ralph
docker build -t ralph-your-repo:latest -f repos/your-repo/Dockerfile.ralph .

# Or just tag the base image
docker tag ralph-base:latest ralph-your-repo:latest
```

### 8. Start Services

#### Option A: Docker Compose (Recommended)

```bash
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

#### Option B: Individual Services

```bash
# Terminal 1: Worker
pnpm run worker

# Terminal 2: Slack Bot
pnpm run bot

# Terminal 3: Dashboard
pnpm run dashboard
```

#### Option C: systemd (Production)

```bash
sudo ./systemd/install-services.sh

# Control services
sudo systemctl start ralph-worker
sudo systemctl start ralph-bot
sudo systemctl start ralph-dashboard

# View logs
journalctl -u ralph-worker -f
```

### 9. Verify Setup

```bash
./scripts/diagnose.sh
```

Expected output:
```
✓ Node.js v22.x installed
✓ pnpm available
✓ Docker daemon running
✓ jq available
✓ .env file exists
✓ Anthropic API key valid
✓ Slack bot connected
✓ Database exists
✓ ralph-base:latest Docker image exists
✓ Slack Bot running on port 3000
✓ Dashboard running on port 3001
```

## Adding Repositories

### Via Slack

```
/repos add
```

Fill in the modal:
- **Name**: Display name (e.g., "Design System")
- **Slug**: URL-safe identifier (e.g., "design-system")
- **Git URL**: Repository URL
- **Branch**: Default branch (usually "main")
- **Docker Image**: Image name (e.g., "ralph-design-system:latest")
- **Keywords**: Comma-separated keywords for matching
- **Description**: What this repository contains

### Via Dashboard

1. Open http://localhost:3001/repos
2. Click "Add Repository"
3. Fill in the form

### Via Database

```bash
# Using sqlite3
sqlite3 data/ralph.db "INSERT INTO repos (id, name, slug, git_url, branch, docker_image, keywords, description, enabled, created_at) VALUES ('uuid', 'My Repo', 'my-repo', 'git@github.com:org/repo.git', 'main', 'ralph-my-repo:latest', '[\"keyword1\", \"keyword2\"]', 'Description', 1, $(date +%s)000)"
```

## Cloudflare Tunnel Setup

See [CLOUDFLARE.md](./CLOUDFLARE.md) for detailed tunnel setup instructions.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

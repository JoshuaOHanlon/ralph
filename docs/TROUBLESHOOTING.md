# Troubleshooting Guide

Common issues and their solutions when running Ralphberry Platform.

## Diagnostic Script

Always start by running the diagnostic script:

```bash
./scripts/diagnose.sh
```

This checks all prerequisites and services.

## Common Issues

### Setup Issues

#### "Node.js version too old"

```bash
# Install Node.js 22
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
nvm alias default 22
```

#### "pnpm not found"

```bash
npm install -g pnpm
```

#### "Docker permission denied"

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker ps
```

### Database Issues

#### "Database not initialized"

```bash
pnpm run db:generate
pnpm run db:migrate
```

#### "Database locked"

This usually means another process is accessing the database.

```bash
# Find processes using the database
lsof data/ralphberry.db

# Or restart services
docker compose restart
```

#### "No such table: repos"

Run migrations:

```bash
pnpm run db:migrate
```

### Slack Issues

#### "not_authed" or "invalid_auth"

1. Check your tokens in `.env`:
   - `SLACK_BOT_TOKEN` should start with `xoxb-`
   - `SLACK_APP_TOKEN` should start with `xapp-`

2. Regenerate tokens:
   - Go to https://api.slack.com/apps
   - Find your app
   - Regenerate the affected token
   - Update `.env`

3. Restart the bot:
   ```bash
   docker compose restart slack-bot
   # or
   pkill -f "slack-bot" && pnpm run bot
   ```

#### Bot doesn't respond

1. Check bot is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check bot is in the channel:
   ```
   /invite @Ralphberryberry
   ```

3. Check channel restrictions in `.env`:
   ```bash
   # Remove or update SLACK_ALLOWED_CHANNELS
   ```

4. Check Socket Mode is enabled in Slack app settings

#### Slash commands not working

1. Verify commands are registered in Slack app settings
2. Check the command names match exactly
3. Reinstall the app to your workspace

### Worker Issues

#### "Docker image not found"

```bash
# Build the base image
docker build -t ralphberry-base:latest -f docker/base/Dockerfile .

# Tag for specific repo
docker tag ralphberry-base:latest ralph-your-repo:latest
```

#### Jobs stuck in "pending"

1. Check worker is running:
   ```bash
   docker compose logs worker
   ```

2. Check for Docker socket access:
   ```bash
   docker ps
   ```

3. Restart worker:
   ```bash
   docker compose restart worker
   ```

#### Container exits immediately

Check the container logs:

```bash
# Find the container ID
docker ps -a | grep ralphberry

# View logs
docker logs CONTAINER_ID
```

Common causes:
- Missing `ANTHROPIC_API_KEY`
- Missing `prd.json` in workspace
- Git authentication issues

### Docker Issues

#### "Cannot connect to Docker daemon"

```bash
# Start Docker
sudo systemctl start docker

# On macOS, open Docker Desktop
open -a Docker
```

#### "No space left on device"

```bash
# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a
```

#### Container network issues

If containers can't communicate:

```bash
# Recreate networks
docker compose down
docker network prune
docker compose up -d
```

### Network Issues

#### Can't access dashboard externally

1. Check firewall:
   ```bash
   sudo ufw allow 3001
   ```

2. Check binding:
   - Dashboard should bind to `0.0.0.0`, not `127.0.0.1`

3. Use Cloudflare Tunnel for secure external access

#### Slack webhooks failing

1. Ensure Socket Mode is enabled (recommended)
2. Or set up Cloudflare Tunnel for HTTP webhooks
3. Check Request URL in Slack app settings

### Performance Issues

#### High memory usage

```bash
# Check memory
free -h

# Limit Docker memory
# Edit docker-compose.yml or use:
docker compose up -d --memory=4g
```

#### Slow job execution

1. Check available CPU:
   ```bash
   htop
   ```

2. Reduce concurrent operations:
   ```bash
   # In .env
   DOCKER_CPU_LIMIT=1
   ```

3. Increase poll interval:
   ```bash
   WORKER_POLL_INTERVAL=10000
   ```

## Logs

### View service logs

```bash
# Docker Compose
docker compose logs -f slack-bot
docker compose logs -f worker
docker compose logs -f dashboard

# systemd
journalctl -u ralphberry-bot -f
journalctl -u ralphberry-worker -f
journalctl -u ralphberry-dashboard -f
```

### View job logs

```bash
# Via API
curl http://localhost:3001/api/jobs/JOB_ID/logs

# Via Dashboard
open http://localhost:3001/jobs/JOB_ID
```

## Reset Everything

If all else fails, reset the installation:

```bash
# Stop services
docker compose down

# Remove data
rm -rf data/
rm -rf node_modules/
rm -rf apps/*/node_modules/
rm -rf packages/*/node_modules/

# Clean Docker
docker system prune -a

# Reinstall
./setup.sh
```

## Getting Help

1. Check the [GitHub Issues](https://github.com/you/ralphberry-platform/issues)
2. Run diagnostics and include the output
3. Include relevant logs
4. Describe what you expected vs what happened

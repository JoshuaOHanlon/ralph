#!/bin/bash
# Ralphberry Platform Diagnostics
# Checks all components and connectivity

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
}

echo ""
echo "Ralphberry Platform Diagnostics"
echo "=========================="
echo ""

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 22 ]; then
    check_pass "Node.js $(node --version) installed"
  else
    check_warn "Node.js $(node --version) installed (22+ recommended)"
  fi
else
  check_fail "Node.js not installed"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
  check_pass "pnpm $(pnpm --version) available"
else
  check_fail "pnpm not available"
fi

# Check Docker
if command -v docker &> /dev/null; then
  if docker info &> /dev/null 2>&1; then
    check_pass "Docker daemon running"
  else
    check_fail "Docker daemon not running or permission denied"
  fi
else
  check_fail "Docker not installed"
fi

# Check jq
if command -v jq &> /dev/null; then
  check_pass "jq available"
else
  check_fail "jq not installed"
fi

echo ""

# Check .env file
if [ -f "$SCRIPT_DIR/.env" ]; then
  check_pass ".env file exists"

  # Source .env for checks
  set -a
  source "$SCRIPT_DIR/.env"
  set +a

  # Check Anthropic API key
  if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "sk-ant-..." ]; then
    # Try to validate the key
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      "https://api.anthropic.com/v1/messages" \
      -d '{"model":"claude-sonnet-4-20250514","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}' \
      -H "Content-Type: application/json" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "400" ]; then
      check_pass "Anthropic API key valid"
    elif [ "$RESPONSE" = "401" ]; then
      check_fail "Anthropic API key invalid"
    else
      check_warn "Could not validate Anthropic API key (network issue?)"
    fi
  else
    check_fail "Anthropic API key not configured"
  fi

  # Check Slack tokens
  if [ -n "$SLACK_BOT_TOKEN" ] && [ "$SLACK_BOT_TOKEN" != "xoxb-..." ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
      "https://slack.com/api/auth.test" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "200" ]; then
      check_pass "Slack bot connected"
    else
      check_warn "Could not verify Slack bot token"
    fi
  else
    check_warn "Slack bot token not configured"
  fi

  # Check Cloudflare Tunnel
  if [ -n "$TUNNEL_TOKEN" ]; then
    check_pass "Cloudflare Tunnel configured"
  else
    check_warn "Cloudflare Tunnel not configured (optional)"
  fi

else
  check_fail ".env file not found"
  echo "  Run: cp .env.example .env"
fi

echo ""

# Check database
if [ -f "$SCRIPT_DIR/data/ralphberry.db" ]; then
  check_pass "Database exists"

  # Count repos
  if command -v sqlite3 &> /dev/null; then
    REPO_COUNT=$(sqlite3 "$SCRIPT_DIR/data/ralphberry.db" "SELECT COUNT(*) FROM repos" 2>/dev/null || echo "0")
    JOB_COUNT=$(sqlite3 "$SCRIPT_DIR/data/ralphberry.db" "SELECT COUNT(*) FROM jobs WHERE status='pending'" 2>/dev/null || echo "0")
    check_pass "$REPO_COUNT repositories configured"
    if [ "$JOB_COUNT" = "0" ]; then
      check_warn "No jobs in queue (that's ok!)"
    else
      check_pass "$JOB_COUNT pending jobs"
    fi
  else
    check_warn "sqlite3 not available - cannot check database contents"
  fi
else
  check_warn "Database not initialized"
  echo "  Run: pnpm run db:migrate"
fi

echo ""

# Check Docker images
if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
  if docker image inspect ralphberry-base:latest &> /dev/null; then
    check_pass "ralphberry-base:latest Docker image exists"
  else
    check_warn "ralphberry-base:latest Docker image not built"
    echo "  Run: docker build -t ralphberry-base:latest -f docker/base/Dockerfile ."
  fi
fi

echo ""

# Check services (if running)
check_service() {
  local name=$1
  local port=$2

  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" 2>/dev/null || echo "000")

  if [ "$RESPONSE" = "200" ]; then
    check_pass "$name running on port $port"
  else
    check_warn "$name not running on port $port"
  fi
}

echo "Services:"
check_service "Slack Bot" 3000
check_service "Dashboard" 3001

echo ""
echo "Diagnostics complete!"
echo ""

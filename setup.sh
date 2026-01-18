#!/bin/bash
# Ralphberry Platform Setup Wizard
# Interactive setup for Raspberry Pi 5 and other systems

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Ralphberry Platform Setup${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo ""
}

print_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "  $1"
}

check_command() {
  if command -v "$1" &> /dev/null; then
    return 0
  else
    return 1
  fi
}

# Check prerequisites
check_prerequisites() {
  print_step "Checking prerequisites..."

  local missing=()

  # Check Node.js
  if check_command node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 22 ]; then
      print_success "Node.js $(node --version)"
    else
      print_error "Node.js 22+ required (found $(node --version))"
      missing+=("node")
    fi
  else
    print_error "Node.js not found"
    missing+=("node")
  fi

  # Check pnpm
  if check_command pnpm; then
    print_success "pnpm $(pnpm --version)"
  else
    print_error "pnpm not found"
    missing+=("pnpm")
  fi

  # Check Docker
  if check_command docker; then
    if docker info &> /dev/null; then
      print_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
    else
      print_error "Docker not running or permission denied"
      missing+=("docker")
    fi
  else
    print_error "Docker not found"
    missing+=("docker")
  fi

  # Check jq
  if check_command jq; then
    print_success "jq $(jq --version)"
  else
    print_error "jq not found"
    missing+=("jq")
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    echo ""
    print_error "Missing prerequisites: ${missing[*]}"
    echo ""
    echo "Install missing tools:"
    echo "  • Node.js 22: https://nodejs.org/ or use nvm"
    echo "  • pnpm: npm install -g pnpm"
    echo "  • Docker: https://docs.docker.com/get-docker/"
    echo "  • jq: brew install jq (macOS) or apt install jq (Linux)"
    echo ""
    echo "Or run: ./scripts/install-prereqs.sh"
    exit 1
  fi

  echo ""
}

# Setup environment
setup_environment() {
  print_step "Setting up environment..."

  if [ -f "$SCRIPT_DIR/.env" ]; then
    print_info "Found existing .env file"
    read -p "  Overwrite? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
      print_info "Keeping existing .env"
      return
    fi
  fi

  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  print_success "Created .env from template"

  # Get Anthropic API key
  echo ""
  print_info "Enter your Anthropic API key (from https://console.anthropic.com/):"
  read -s -p "  ANTHROPIC_API_KEY: " api_key
  echo ""

  if [ -n "$api_key" ]; then
    sed -i.bak "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$api_key|" "$SCRIPT_DIR/.env"
    rm -f "$SCRIPT_DIR/.env.bak"
    print_success "Anthropic API key configured"
  else
    print_error "No API key provided - you'll need to add it manually to .env"
  fi

  echo ""
}

# Setup Slack app
setup_slack() {
  print_step "Slack App Setup"
  echo ""
  print_info "You'll need to create a Slack app to use Ralphberry with Slack."
  print_info "1. Go to https://api.slack.com/apps"
  print_info "2. Click 'Create New App' → 'From a manifest'"
  print_info "3. Select your workspace"
  print_info "4. Paste the contents of apps/slack-bot/manifest.json"
  print_info "5. Install the app to your workspace"
  echo ""

  read -p "  Have you created the Slack app? (y/N): " created

  if [[ "$created" =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Enter your Slack app credentials:"

    read -p "  SLACK_BOT_TOKEN (xoxb-...): " bot_token
    read -p "  SLACK_SIGNING_SECRET: " signing_secret
    read -p "  SLACK_APP_TOKEN (xapp-...): " app_token

    if [ -n "$bot_token" ]; then
      sed -i.bak "s|SLACK_BOT_TOKEN=.*|SLACK_BOT_TOKEN=$bot_token|" "$SCRIPT_DIR/.env"
    fi
    if [ -n "$signing_secret" ]; then
      sed -i.bak "s|SLACK_SIGNING_SECRET=.*|SLACK_SIGNING_SECRET=$signing_secret|" "$SCRIPT_DIR/.env"
    fi
    if [ -n "$app_token" ]; then
      sed -i.bak "s|SLACK_APP_TOKEN=.*|SLACK_APP_TOKEN=$app_token|" "$SCRIPT_DIR/.env"
    fi
    rm -f "$SCRIPT_DIR/.env.bak"

    print_success "Slack credentials configured"
  else
    print_info "You can configure Slack later by editing .env"
  fi

  echo ""
}

# Setup Cloudflare Tunnel
setup_tunnel() {
  print_step "Cloudflare Tunnel Setup (Optional)"
  echo ""
  print_info "A Cloudflare Tunnel allows external access to Ralphberry"
  print_info "without port forwarding. This is optional."
  echo ""

  read -p "  Set up Cloudflare Tunnel? (y/N): " setup_tunnel

  if [[ "$setup_tunnel" =~ ^[Yy]$ ]]; then
    if ! check_command cloudflared; then
      print_info "Installing cloudflared..."

      if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
      else
        curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
        sudo dpkg -i /tmp/cloudflared.deb
        rm /tmp/cloudflared.deb
      fi
    fi

    print_info "Please log in to Cloudflare:"
    cloudflared tunnel login

    print_info "Creating tunnel..."
    read -p "  Tunnel name (default: ralphberry): " tunnel_name
    tunnel_name=${tunnel_name:-ralphberry}

    cloudflared tunnel create "$tunnel_name"

    print_info "Get your tunnel token from the Cloudflare dashboard"
    print_info "and add it to your .env as TUNNEL_TOKEN"

    print_success "Cloudflare Tunnel created"
  else
    print_info "Skipping Cloudflare Tunnel setup"
  fi

  echo ""
}

# Install dependencies
install_dependencies() {
  print_step "Installing dependencies..."

  cd "$SCRIPT_DIR"
  pnpm install

  print_success "Dependencies installed"
  echo ""
}

# Setup database
setup_database() {
  print_step "Setting up database..."

  mkdir -p "$SCRIPT_DIR/data"
  mkdir -p "$SCRIPT_DIR/repos"

  cd "$SCRIPT_DIR"
  pnpm run db:generate
  pnpm run db:migrate

  print_success "Database initialized"
  echo ""
}

# Build projects
build_projects() {
  print_step "Building projects..."

  cd "$SCRIPT_DIR"
  pnpm run build

  print_success "Projects built"
  echo ""
}

# Build Docker images
build_docker() {
  print_step "Building Docker images..."

  cd "$SCRIPT_DIR"

  # Build base image
  docker build -t ralphberry-base:latest -f docker/base/Dockerfile .
  print_success "Built ralphberry-base:latest"

  echo ""
}

# Add first repository
add_first_repo() {
  print_step "Add Your First Repository"
  echo ""

  read -p "  Add a repository now? (y/N): " add_repo

  if [[ "$add_repo" =~ ^[Yy]$ ]]; then
    echo ""
    read -p "  Repository name: " repo_name
    read -p "  Slug (lowercase, hyphens): " repo_slug
    read -p "  Git URL: " git_url
    read -p "  Branch (default: main): " branch
    branch=${branch:-main}
    read -p "  Keywords (comma-separated): " keywords
    read -p "  Description: " description

    # Build repo-specific Docker image
    docker_image="ralphberry-${repo_slug}:latest"

    # Clone repo for building
    print_info "Cloning repository..."
    git clone --depth 1 -b "$branch" "$git_url" "$SCRIPT_DIR/repos/$repo_slug"

    # Check for custom Dockerfile
    if [ -f "$SCRIPT_DIR/repos/$repo_slug/Dockerfile.ralph" ]; then
      print_info "Building custom Docker image..."
      docker build -t "$docker_image" -f "$SCRIPT_DIR/repos/$repo_slug/Dockerfile.ralph" "$SCRIPT_DIR/repos/$repo_slug"
    else
      print_info "Using base Docker image..."
      docker tag ralphberry-base:latest "$docker_image"
    fi

    print_success "Repository added: $repo_name"
    print_info "Add it to your database with /repos add in Slack"
    print_info "or through the dashboard at http://localhost:3001/repos"
  else
    print_info "You can add repositories later via Slack or the dashboard"
  fi

  echo ""
}

# Run health check
run_health_check() {
  print_step "Running health check..."

  "$SCRIPT_DIR/scripts/diagnose.sh"

  echo ""
}

# Print completion message
print_completion() {
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Setup Complete!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  echo "  Start Ralphberry with Docker Compose:"
  echo "    docker compose up -d"
  echo ""
  echo "  Or start services individually:"
  echo "    pnpm run worker    # Start the job worker"
  echo "    pnpm run bot       # Start the Slack bot"
  echo "    pnpm run dashboard # Start the dashboard"
  echo ""
  echo "  Access the dashboard at:"
  echo "    http://localhost:3001"
  echo ""
  echo "  For systemd services (recommended for Pi):"
  echo "    sudo ./systemd/install-services.sh"
  echo ""
  echo "  Documentation:"
  echo "    docs/README.md     - Quick start guide"
  echo "    docs/SETUP.md      - Detailed setup"
  echo "    docs/SLACK_APP.md  - Slack app setup"
  echo ""
}

# Main setup flow
main() {
  print_header

  check_prerequisites
  setup_environment
  setup_slack
  setup_tunnel
  install_dependencies
  setup_database
  build_projects
  build_docker
  add_first_repo
  run_health_check
  print_completion
}

main "$@"

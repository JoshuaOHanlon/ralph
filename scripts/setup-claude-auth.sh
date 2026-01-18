#!/bin/bash
# Claude OAuth Setup Script
# Captures OAuth credentials from `claude login` for use with Ralphberry

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Claude OAuth Setup for Ralphberry${NC}"
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

# Default auth directory
AUTH_DIR="${CLAUDE_AUTH_DIR:-$HOME/.claude-hub/auth}"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --auth-dir) AUTH_DIR="$2"; shift ;;
    -h|--help)
      echo "Usage: $0 [--auth-dir <path>]"
      echo ""
      echo "Options:"
      echo "  --auth-dir  Directory to store OAuth credentials (default: ~/.claude-hub/auth)"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

check_claude_cli() {
  if ! command -v claude &> /dev/null; then
    print_error "Claude CLI not found"
    echo ""
    echo "Install with: npm install -g @anthropic-ai/claude-code"
    exit 1
  fi
  print_success "Claude CLI found: $(claude --version 2>/dev/null || echo 'installed')"
}

run_claude_login() {
  print_step "Running claude login..."
  echo ""
  print_info "A browser window will open for authentication."
  print_info "Complete the login process to obtain OAuth credentials."
  echo ""

  # Run claude login interactively
  claude login

  echo ""
  print_success "Claude login completed"
}

check_credentials() {
  local claude_dir="$HOME/.claude"
  local creds_file="$claude_dir/.credentials.json"

  if [ ! -f "$creds_file" ]; then
    print_error "Credentials file not found at $creds_file"
    print_info "Make sure you completed the login process successfully"
    exit 1
  fi

  print_success "Credentials file found"
}

copy_credentials() {
  local claude_dir="$HOME/.claude"
  local creds_file="$claude_dir/.credentials.json"

  print_step "Copying credentials to $AUTH_DIR..."

  # Create auth directory
  mkdir -p "$AUTH_DIR"

  # Copy credentials file
  cp "$creds_file" "$AUTH_DIR/.credentials.json"

  # Copy any other relevant claude config files
  if [ -f "$claude_dir/settings.json" ]; then
    cp "$claude_dir/settings.json" "$AUTH_DIR/settings.json"
  fi

  # Set restrictive permissions
  chmod 700 "$AUTH_DIR"
  chmod 600 "$AUTH_DIR/.credentials.json"
  if [ -f "$AUTH_DIR/settings.json" ]; then
    chmod 600 "$AUTH_DIR/settings.json"
  fi

  print_success "Credentials copied to $AUTH_DIR"
}

update_env_file() {
  local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  local env_file="$script_dir/.env"

  if [ ! -f "$env_file" ]; then
    print_info "No .env file found, skipping auto-configuration"
    return
  fi

  print_step "Updating .env file..."

  # Check if CLAUDE_AUTH_MODE already exists
  if grep -q "^CLAUDE_AUTH_MODE=" "$env_file"; then
    sed -i.bak "s|^CLAUDE_AUTH_MODE=.*|CLAUDE_AUTH_MODE=oauth|" "$env_file"
  else
    echo "" >> "$env_file"
    echo "# Claude OAuth Authentication" >> "$env_file"
    echo "CLAUDE_AUTH_MODE=oauth" >> "$env_file"
  fi

  # Check if CLAUDE_AUTH_DIR already exists
  if grep -q "^CLAUDE_AUTH_DIR=" "$env_file"; then
    sed -i.bak "s|^CLAUDE_AUTH_DIR=.*|CLAUDE_AUTH_DIR=$AUTH_DIR|" "$env_file"
  else
    echo "CLAUDE_AUTH_DIR=$AUTH_DIR" >> "$env_file"
  fi

  rm -f "$env_file.bak"
  print_success "Updated .env with OAuth configuration"
}

print_completion() {
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  OAuth Setup Complete!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  echo "  Credentials stored at:"
  echo "    $AUTH_DIR"
  echo ""
  echo "  To use OAuth authentication, ensure your .env has:"
  echo "    CLAUDE_AUTH_MODE=oauth"
  echo "    CLAUDE_AUTH_DIR=$AUTH_DIR"
  echo ""
  echo "  Important notes:"
  echo "    - Access tokens refresh automatically"
  echo "    - Refresh tokens may expire after extended periods"
  echo "    - Re-run this script if authentication fails"
  echo ""
  echo "  Rate limits (Claude Max subscription):"
  echo "    - Max 5x: ~50-200 prompts per 5 hours"
  echo "    - Max 20x: ~200-800 prompts per 5 hours"
  echo "    - Usage is shared with Claude web interface"
  echo ""
}

verify_setup() {
  print_step "Verifying OAuth setup..."

  # Test that credentials can be read
  if [ -f "$AUTH_DIR/.credentials.json" ]; then
    if jq -e '.accessToken' "$AUTH_DIR/.credentials.json" > /dev/null 2>&1; then
      print_success "OAuth credentials verified"
    else
      print_error "Invalid credentials file format"
      exit 1
    fi
  else
    print_error "Credentials not found after copy"
    exit 1
  fi
}

main() {
  print_header

  check_claude_cli

  echo ""
  print_info "This script will:"
  print_info "  1. Run 'claude login' to authenticate with Claude Max"
  print_info "  2. Copy OAuth credentials to $AUTH_DIR"
  print_info "  3. Update your .env file for OAuth mode"
  echo ""

  read -p "  Continue? (Y/n): " confirm
  if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo "Aborted."
    exit 0
  fi

  echo ""
  run_claude_login
  check_credentials
  copy_credentials
  verify_setup
  update_env_file
  print_completion
}

main "$@"

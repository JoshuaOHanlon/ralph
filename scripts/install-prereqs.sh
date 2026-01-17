#!/bin/bash
# Install prerequisites for Ralph Platform
# Supports macOS (with Homebrew) and Debian/Ubuntu Linux

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

detect_os() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macos"
  elif [ -f /etc/debian_version ]; then
    echo "debian"
  elif [ -f /etc/redhat-release ]; then
    echo "redhat"
  else
    echo "unknown"
  fi
}

OS=$(detect_os)

echo ""
echo "Ralph Platform - Prerequisites Installer"
echo "========================================="
echo "Detected OS: $OS"
echo ""

# Install Node.js 22
install_node() {
  print_step "Installing Node.js 22..."

  if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 22 ]; then
      print_success "Node.js $(node --version) already installed"
      return
    fi
  fi

  case $OS in
    macos)
      if command -v brew &> /dev/null; then
        brew install node@22
        brew link node@22 --force --overwrite
      else
        print_error "Homebrew not found. Install from https://brew.sh"
        exit 1
      fi
      ;;
    debian)
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
      ;;
    *)
      print_error "Please install Node.js 22 manually from https://nodejs.org"
      exit 1
      ;;
  esac

  print_success "Node.js $(node --version) installed"
}

# Install pnpm
install_pnpm() {
  print_step "Installing pnpm..."

  if command -v pnpm &> /dev/null; then
    print_success "pnpm $(pnpm --version) already installed"
    return
  fi

  npm install -g pnpm
  print_success "pnpm $(pnpm --version) installed"
}

# Install Docker
install_docker() {
  print_step "Installing Docker..."

  if command -v docker &> /dev/null; then
    print_success "Docker already installed"
    return
  fi

  case $OS in
    macos)
      print_error "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
      echo "  After installing, open Docker Desktop to start the daemon"
      ;;
    debian)
      curl -fsSL https://get.docker.com | sh
      sudo usermod -aG docker $USER
      print_success "Docker installed"
      echo "  You may need to log out and back in for group changes to take effect"
      ;;
    *)
      print_error "Please install Docker manually from https://docs.docker.com/get-docker/"
      ;;
  esac
}

# Install jq
install_jq() {
  print_step "Installing jq..."

  if command -v jq &> /dev/null; then
    print_success "jq already installed"
    return
  fi

  case $OS in
    macos)
      brew install jq
      ;;
    debian)
      sudo apt-get update
      sudo apt-get install -y jq
      ;;
    *)
      print_error "Please install jq manually"
      ;;
  esac

  print_success "jq installed"
}

# Install git
install_git() {
  print_step "Installing git..."

  if command -v git &> /dev/null; then
    print_success "git already installed"
    return
  fi

  case $OS in
    macos)
      # Xcode command line tools include git
      xcode-select --install 2>/dev/null || true
      ;;
    debian)
      sudo apt-get update
      sudo apt-get install -y git
      ;;
    *)
      print_error "Please install git manually"
      ;;
  esac

  print_success "git installed"
}

# Main
install_node
install_pnpm
install_docker
install_jq
install_git

echo ""
print_success "Prerequisites installed!"
echo ""
echo "Next steps:"
echo "  1. If Docker was just installed, start Docker Desktop (macOS) or run: sudo systemctl start docker"
echo "  2. Run: ./setup.sh"
echo ""

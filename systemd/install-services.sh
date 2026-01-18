#!/bin/bash
# Install Ralphberry systemd services
# Run as root: sudo ./install-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RALPH_DIR="$(dirname "$SCRIPT_DIR")"

# Detect user
if [ -n "$SUDO_USER" ]; then
  RALPH_USER="$SUDO_USER"
else
  RALPH_USER="pi"
fi

echo "Installing Ralphberry systemd services..."
echo "  User: $RALPH_USER"
echo "  Directory: $RALPH_DIR"
echo ""

# Update service files with correct paths and user
update_service() {
  local service=$1
  local tmp_file="/tmp/$service"

  cp "$SCRIPT_DIR/$service" "$tmp_file"

  # Replace paths and user
  sed -i "s|/home/pi/ralphberry-platform|$RALPH_DIR|g" "$tmp_file"
  sed -i "s|User=pi|User=$RALPH_USER|g" "$tmp_file"
  sed -i "s|Group=pi|Group=$RALPH_USER|g" "$tmp_file"

  # Copy to systemd
  cp "$tmp_file" "/etc/systemd/system/$service"
  rm "$tmp_file"

  echo "  Installed: $service"
}

# Install each service
update_service "ralphberry-worker.service"
update_service "ralphberry-bot.service"
update_service "ralphberry-dashboard.service"

# Reload systemd
systemctl daemon-reload

echo ""
echo "Services installed. Available commands:"
echo ""
echo "  Start services:"
echo "    sudo systemctl start ralphberry-worker"
echo "    sudo systemctl start ralphberry-bot"
echo "    sudo systemctl start ralphberry-dashboard"
echo ""
echo "  Enable on boot:"
echo "    sudo systemctl enable ralphberry-worker"
echo "    sudo systemctl enable ralphberry-bot"
echo "    sudo systemctl enable ralphberry-dashboard"
echo ""
echo "  View logs:"
echo "    journalctl -u ralphberry-worker -f"
echo "    journalctl -u ralphberry-bot -f"
echo "    journalctl -u ralphberry-dashboard -f"
echo ""
echo "  Start all at once:"
echo "    sudo systemctl start ralphberry-worker ralphberry-bot ralphberry-dashboard"
echo "    sudo systemctl enable ralphberry-worker ralphberry-bot ralphberry-dashboard"
echo ""

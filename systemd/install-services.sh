#!/bin/bash
# Install Ralph systemd services
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

echo "Installing Ralph systemd services..."
echo "  User: $RALPH_USER"
echo "  Directory: $RALPH_DIR"
echo ""

# Update service files with correct paths and user
update_service() {
  local service=$1
  local tmp_file="/tmp/$service"

  cp "$SCRIPT_DIR/$service" "$tmp_file"

  # Replace paths and user
  sed -i "s|/home/pi/ralph-platform|$RALPH_DIR|g" "$tmp_file"
  sed -i "s|User=pi|User=$RALPH_USER|g" "$tmp_file"
  sed -i "s|Group=pi|Group=$RALPH_USER|g" "$tmp_file"

  # Copy to systemd
  cp "$tmp_file" "/etc/systemd/system/$service"
  rm "$tmp_file"

  echo "  Installed: $service"
}

# Install each service
update_service "ralph-worker.service"
update_service "ralph-bot.service"
update_service "ralph-dashboard.service"

# Reload systemd
systemctl daemon-reload

echo ""
echo "Services installed. Available commands:"
echo ""
echo "  Start services:"
echo "    sudo systemctl start ralph-worker"
echo "    sudo systemctl start ralph-bot"
echo "    sudo systemctl start ralph-dashboard"
echo ""
echo "  Enable on boot:"
echo "    sudo systemctl enable ralph-worker"
echo "    sudo systemctl enable ralph-bot"
echo "    sudo systemctl enable ralph-dashboard"
echo ""
echo "  View logs:"
echo "    journalctl -u ralph-worker -f"
echo "    journalctl -u ralph-bot -f"
echo "    journalctl -u ralph-dashboard -f"
echo ""
echo "  Start all at once:"
echo "    sudo systemctl start ralph-worker ralph-bot ralph-dashboard"
echo "    sudo systemctl enable ralph-worker ralph-bot ralph-dashboard"
echo ""

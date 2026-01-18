# Cloudflare Tunnel Setup

Cloudflare Tunnel provides secure external access to Ralphberry without port forwarding or exposing your IP address.

## Why Use a Tunnel?

- **No port forwarding**: Works behind NAT/firewalls
- **Automatic HTTPS**: Free SSL certificates
- **DDoS protection**: Cloudflare's network protection
- **Simple setup**: No complex networking required

## Prerequisites

- Cloudflare account (free tier works)
- A domain managed by Cloudflare (or use `*.trycloudflare.com` for testing)

## Setup Steps

### 1. Install cloudflared

#### macOS
```bash
brew install cloudflared
```

#### Raspberry Pi / Debian
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

#### Other Linux
```bash
curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### 2. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser window. Select the domain you want to use.

### 3. Create a Tunnel

```bash
cloudflared tunnel create ralphberry
```

This creates a tunnel and outputs credentials. Note the tunnel ID.

### 4. Configure DNS

```bash
cloudflared tunnel route dns ralphberry ralphberry.yourdomain.com
```

Replace `yourdomain.com` with your actual domain.

### 5. Create Tunnel Config

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/pi/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ralphberry.yourdomain.com
    service: http://localhost:3000
  - hostname: ralphberry-dashboard.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

### 6. Get Tunnel Token

For Docker deployment, you need a tunnel token:

1. Go to https://one.dash.cloudflare.com/
2. Select your account
3. Go to **Access** → **Tunnels**
4. Find your tunnel and click **Configure**
5. Copy the token

Add to your `.env`:

```bash
TUNNEL_TOKEN=eyJ...
```

### 7. Run the Tunnel

#### With Docker Compose

The tunnel is included in `docker-compose.yml`. Start it with:

```bash
docker compose --profile tunnel up -d
```

#### Standalone

```bash
cloudflared tunnel run ralphberry
```

#### As a Service

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## Update Slack App

If using a custom domain for webhooks:

1. Go to your Slack app settings
2. Under **Interactivity & Shortcuts**, set Request URL to:
   ```
   https://ralphberry.yourdomain.com/slack/events
   ```
3. Under **Event Subscriptions**, set Request URL to:
   ```
   https://ralphberry.yourdomain.com/slack/events
   ```

Note: With Socket Mode enabled (recommended), you don't need to configure request URLs.

## Quick Test (No Domain Required)

For testing, you can use a temporary URL:

```bash
cloudflared tunnel --url http://localhost:3000
```

This creates a temporary `*.trycloudflare.com` URL that lasts until you stop the process.

## Troubleshooting

### Tunnel not connecting

```bash
# Check tunnel status
cloudflared tunnel info ralphberry

# Test connectivity
curl https://ralphberry.yourdomain.com/health
```

### DNS not resolving

```bash
# Verify DNS record
dig ralphberry.yourdomain.com

# Check Cloudflare DNS settings
```

### Connection refused

- Ensure the Slack bot is running on port 3000
- Check firewall isn't blocking localhost
- Verify the config.yml service URLs are correct

#!/usr/bin/env bash
# gstack++ n8n Integration Installer
# 
# Installs n8n workflow automation for gstack++ skills.
# Supports: self-hosted n8n, n8n.cloud, and Docker deployments.
#
# Usage: ./install-n8n-integration.sh [--mode MODE] [--n8n-url URL]
#
# Modes:
#   docker      - Install n8n via Docker Compose (default)
#   cloud       - Configure for n8n.cloud (SaaS)
#   self-hosted - Configure existing self-hosted n8n instance
#   mcp-only    - Install MCP server wrapper only (no n8n)

set -e

# ─── Colors and Logging ─────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Configuration ──────────────────────────────────────────────────────

GSTACKPLUSPLUS_DIR="$(cd "$(dirname "$0")" && pwd)"
N8N_DIR="$GSTACKPLUSPLUS_DIR/n8n"
N8N_CONFIG_DIR="$HOME/.gstackplusplus/n8n"
DOCKER_COMPOSE_FILE="$N8N_DIR/docker-compose.yml"

# Defaults
INSTALL_MODE="docker"
N8N_URL="http://localhost:5678"
N8N_WEBHOOK_URL="http://localhost:5678/webhook"
INSTALL_MCP=true
INSTALL_N8N=true

# ─── Parse Arguments ────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      INSTALL_MODE="$2"
      shift 2
      ;;
    --n8n-url)
      N8N_URL="$2"
      N8N_WEBHOOK_URL="$2/webhook"
      shift 2
      ;;
    --no-mcp)
      INSTALL_MCP=false
      shift
      ;;
    --help)
      cat << EOF
gstack++ n8n Integration Installer

Usage: $0 [--mode MODE] [--n8n-url URL] [--no-mcp]

Modes:
  docker      - Install n8n via Docker Compose (default)
  cloud       - Configure for n8n.cloud (SaaS)
  self-hosted - Configure existing self-hosted n8n instance
  mcp-only    - Install MCP server wrapper only (no n8n)

Options:
  --n8n-url   URL of your n8n instance (default: http://localhost:5678)
  --no-mcp    Skip MCP server installation
  --help      Show this help message

Examples:
  $0                                    # Docker install with defaults
  $0 --mode cloud                       # Configure for n8n.cloud
  $0 --mode self-hosted --n8n-url https://n8n.example.com
  $0 --mcp-only                         # MCP server only, no n8n
EOF
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate mode
case $INSTALL_MODE in
  docker|cloud|self-hosted|mcp-only)
    ;;
  *)
    log_error "Invalid mode: $INSTALL_MODE"
    exit 1
    ;;
esac

# Adjust flags based on mode
if [ "$INSTALL_MODE" = "mcp-only" ]; then
  INSTALL_N8N=false
fi

# ─── System Checks ──────────────────────────────────────────────────────

check_command() {
  if ! command -v "$1" &> /dev/null; then
    log_error "$1 is required but not installed."
    exit 1
  fi
}

log_info "Checking system requirements..."

check_command git
check_command bun

if [ "$INSTALL_N8N" = true ] && [ "$INSTALL_MODE" = "docker" ]; then
  check_command docker
  check_command docker-compose
  
  if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running. Please start Docker and try again."
    exit 1
  fi
fi

log_success "System requirements met"

# ─── Configuration Directory Setup ──────────────────────────────────────

log_info "Setting up configuration directory..."

mkdir -p "$N8N_CONFIG_DIR"
mkdir -p "$N8N_DIR/workflows"
mkdir -p "$N8N_DIR/nodes"

# ─── Docker Compose Configuration ───────────────────────────────────────

if [ "$INSTALL_MODE" = "docker" ]; then
  log_info "Creating Docker Compose configuration..."
  
  cat > "$DOCKER_COMPOSE_FILE" << 'DOCKERCOMPOSE'
version: '3.8'

services:
  n8n:
    image: n8n-io/n8n:latest
    container_name: gstack-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST:-localhost}
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_SECURE_COOKIE=false
      - WEBHOOK_URL=${WEBHOOK_URL:-http://localhost:5678/webhook}
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=false
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY:-}
      - N8N_USER_FOLDER=/home/node/.n8n
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/workflows:ro
    networks:
      - gstack-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  gstack-network:
    driver: bridge

volumes:
  n8n_data:
    driver: local
DOCKERCOMPOSE

  log_success "Docker Compose configuration created at $DOCKER_COMPOSE_FILE"
fi

# ─── Environment Configuration ──────────────────────────────────────────

log_info "Creating environment configuration..."

cat > "$N8N_CONFIG_DIR/.env" << ENVFILE
# gstack++ n8n Integration Configuration
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# n8n Instance
N8N_URL=$N8N_URL
N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL
N8N_API_KEY=${N8N_API_KEY:-}

# gstack++ Configuration
GSTACKPLUSPLUS_DIR=$GSTACKPLUSPLUS_DIR
GSTACK_CLI=$GSTACKPLUSPLUS_DIR/browse/dist/browse

# Webhook Authentication
GSTACK_WEBHOOK_AUTH_TOKEN=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")

# GitHub Integration (optional)
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET:-}
GITHUB_API_URL=https://api.github.com

# Slack Integration (optional)
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}

# Jira Integration (optional)
JIRA_BASE_URL=${JIRA_BASE_URL:-}
JIRA_API_TOKEN=${JIRA_API_TOKEN:-}
JIRA_USER_EMAIL=${JIRA_USER_EMAIL:-}

# MCP Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
ENVFILE

chmod 600 "$N8N_CONFIG_DIR/.env"
log_success "Environment configuration created at $N8N_CONFIG_DIR/.env"

# ─── n8n Credentials Template ───────────────────────────────────────────

log_info "Creating n8n credentials template..."

cat > "$N8N_CONFIG_DIR/credentials.json" << 'CREDENTIALS'
{
  "githubApi": {
    "id": "github-creds",
    "name": "GitHub API",
    "type": "httpHeaderAuth",
    "data": {
      "username": "",
      "password": ""
    }
  },
  "gstackAuth": {
    "id": "gstack-auth",
    "name": "gstack++ API Auth",
    "type": "httpHeaderAuth",
    "data": {
      "username": "Bearer",
      "password": "CHANGE_ME"
    }
  }
}
CREDENTIALS

log_success "Credentials template created at $N8N_CONFIG_DIR/credentials.json"

# ─── MCP Server Package Configuration ───────────────────────────────────

if [ "$INSTALL_MCP" = true ]; then
  log_info "Setting up MCP server..."
  
  cat > "$N8N_DIR/package.json" << 'PACKAGEJSON'
{
  "name": "gstackplusplus-mcp",
  "version": "0.1.0",
  "description": "gstack++ MCP server wrapper for external AI agents",
  "type": "module",
  "main": "scripts/mcp-server.ts",
  "scripts": {
    "start": "bun run scripts/mcp-server.ts",
    "dev": "bun --watch run scripts/mcp-server.ts",
    "build": "bun build --compile scripts/mcp-server.ts --outfile dist/mcp-server"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
PACKAGEJSON

  log_info "Installing MCP server dependencies..."
  (cd "$N8N_DIR" && bun install)
  
  log_success "MCP server installed"
fi

# ─── Workflow Import Script ─────────────────────────────────────────────

log_info "Creating workflow import script..."

cat > "$N8N_DIR/scripts/import-workflows.sh" << 'IMPORTSCRIPT'
#!/usr/bin/env bash
# Import gstack++ workflows into n8n

set -e

N8N_URL="${N8N_URL:-http://localhost:5678}"
N8N_API_KEY="${N8N_API_KEY:-}"
WORKFLOWS_DIR="$(dirname "$0")/../workflows"

if [ -z "$N8N_API_KEY" ]; then
  echo "N8N_API_KEY environment variable is not set."
  echo "Set it in ~/.gstackplusplus/n8n/.env and source it first."
  exit 1
fi

echo "Importing workflows to $N8N_URL..."

for workflow_file in "$WORKFLOWS_DIR"/*.json; do
  if [ -f "$workflow_file" ]; then
    workflow_name="$(basename "$workflow_file" .json)"
    echo "Importing $workflow_name..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$N8N_URL/api/v1/workflows" \
      -H "Content-Type: application/json" \
      -H "X-N8N-API-Key: $N8N_API_KEY" \
      -d @"$workflow_file")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
      echo "  ✓ Imported successfully"
    else
      echo "  ✗ Failed: $http_code"
      echo "  Response: $body"
    fi
  fi
done

echo "Workflow import complete."
IMPORTSCRIPT

chmod +x "$N8N_DIR/scripts/import-workflows.sh"
log_success "Workflow import script created"

# ─── Installation Instructions ──────────────────────────────────────────

log_info "Creating installation guide..."

cat > "$N8N_CONFIG_DIR/SETUP.md" << SETUPDOC
# gstack++ n8n Integration Setup

This guide walks you through completing the n8n integration setup.

## Quick Start

### 1. Start n8n (Docker mode)

\`\`\`bash
cd $N8N_DIR
docker-compose up -d
\`\`\`

n8n will be available at http://localhost:5678

### 2. Configure credentials

Edit \`~/.gstackplusplus/n8n/.env\` and set:

\`\`\`bash
# Required
GSTACK_WEBHOOK_AUTH_TOKEN=<already-generated>

# Optional (for integrations)
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_API_TOKEN=your-jira-api-token
JIRA_USER_EMAIL=your-email@company.com
\`\`\`

### 3. Import workflows

\`\`\`bash
source ~/.gstackplusplus/n8n/.env
export N8N_API_KEY=your-n8n-api-key
./n8n/scripts/import-workflows.sh
\`\`\`

### 4. Set up GitHub webhook

In your GitHub repository settings:

1. Go to Settings → Webhooks → Add webhook
2. Payload URL: \`$N8N_WEBHOOK_URL/github-pr\`
3. Content type: application/json
4. Secret: Your \`GITHUB_WEBHOOK_SECRET\`
5. Events: Pull requests, Pushes

### 5. Test the integration

Trigger a test workflow:

\`\`\`bash
curl -X POST $N8N_WEBHOOK_URL/gstack-review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \$GSTACK_WEBHOOK_AUTH_TOKEN" \
  -d '{"branch": "feature-test", "base": "main"}'
\`\`\`

## MCP Server Setup (Optional)

The MCP server allows external AI agents (not Claude Code) to use gstack++ workflows.

### Start MCP Server

\`\`\`bash
cd $N8N_DIR
bun run start
\`\`\`

### Configure Claude Desktop

Add to \`~/.config/claude/claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "gstack": {
      "command": "bun",
      "args": ["run", "start"],
      "cwd": "$N8N_DIR",
      "env": {
        "GSTACKPLUSPLUS_DIR": "$GSTACKPLUSPLUS_DIR"
      }
    }
  }
}
\`\`\`

### Configure via mcp-remote (for stdio clients)

\`\`\`bash
npx mcp-remote http://localhost:3000/mcp
\`\`\`

## Available Workflows

| Workflow | Webhook Path | Description |
|----------|-------------|-------------|
| Code Review | \`/gstack-review\` | Pre-landing PR review with auto-fix |
| QA Pipeline | \`/gstack-qa\` | Build → test → analyze → report |
| Ship | \`/gstack-ship\` | One-command ship with PR creation |
| CEO Review | \`/gstack-ceo-review\` | Product strategy analysis |
| Eng Review | \`/gstack-eng-review\` | Architecture planning |

## Troubleshooting

### n8n won't start

Check Docker logs:
\`\`\`bash
docker-compose logs -f n8n
\`\`\`

### Webhook not triggering

1. Verify webhook URL is accessible from GitHub
2. Check \`GITHUB_WEBHOOK_SECRET\` matches
3. Review n8n execution logs in UI

### MCP server connection fails

1. Ensure MCP server is running: \`bun run start\`
2. Check port 3000 is not in use
3. Verify gstack++ CLI path in environment

## Next Steps

1. Customize workflows in n8n UI
2. Add additional integrations (Jira, Slack, etc.)
3. Set up scheduled QA runs
4. Configure team notifications

## Support

- n8n docs: https://docs.n8n.io
- gstack++ docs: \`$GSTACKPLUSPLUS_DIR/README.md\`
- MCP protocol: https://modelcontextprotocol.io
SETUPDOC

log_success "Installation guide created at $N8N_CONFIG_DIR/SETUP.md"

# ─── Start n8n (Docker mode) ────────────────────────────────────────────

if [ "$INSTALL_MODE" = "docker" ]; then
  log_info "Starting n8n Docker container..."
  
  (cd "$N8N_DIR" && docker-compose up -d)
  
  log_info "Waiting for n8n to start..."
  sleep 10
  
  for i in {1..30}; do
    if curl -s "$N8N_URL/healthz" &> /dev/null; then
      log_success "n8n is running at $N8N_URL"
      break
    fi
    if [ $i -eq 30 ]; then
      log_warn "n8n may still be starting. Check with: docker-compose logs -f n8n"
    fi
    sleep 2
  done
fi

# ─── Final Summary ──────────────────────────────────────────────────────

cat << SUMMARY

${GREEN}╔══════════════════════════════════════════════════════════╗${NC}
${GREEN}║     gstack++ n8n Integration Installation Complete!     ║${NC}
${GREEN}╚══════════════════════════════════════════════════════════╝${NC}

${BLUE}Installation Summary:${NC}
  Mode: $INSTALL_MODE
  n8n URL: $N8N_URL
  Webhook URL: $N8N_WEBHOOK_URL
  MCP Server: $([ "$INSTALL_MCP" = true ] && echo "Installed" || echo "Skipped")

${BLUE}Configuration Files:${NC}
  Environment: $N8N_CONFIG_DIR/.env
  Credentials: $N8N_CONFIG_DIR/credentials.json
  Setup Guide: $N8N_CONFIG_DIR/SETUP.md
  $(if [ "$INSTALL_MODE" = "docker" ]; then echo "Docker Compose: $DOCKER_COMPOSE_FILE"; fi)

${BLUE}Next Steps:${NC}
  1. Review and customize: $N8N_CONFIG_DIR/.env
  2. Read setup guide: $N8N_CONFIG_DIR/SETUP.md
  $(if [ "$INSTALL_MODE" = "docker" ]; then echo "3. Access n8n: $N8N_URL"; fi)
  $(if [ "$INSTALL_MCP" = true ]; then echo "$([ "$INSTALL_MODE" = "docker" ] && echo "4." || echo "3.") Start MCP server: cd $N8N_DIR && bun run start"; fi)

${YELLOW}Important:${NC}
  - Save your GSTACK_WEBHOOK_AUTH_TOKEN from .env
  - Set up GitHub webhooks pointing to $N8N_WEBHOOK_URL
  - For production: change N8N_ENCRYPTION_KEY and use HTTPS

${BLUE}Need help?${NC}
  - Run: cat $N8N_CONFIG_DIR/SETUP.md
  - Check: $GSTACKPLUSPLUS_DIR/MCP-N8N-FEASIBILITY.md

SUMMARY

log_success "Installation complete!"

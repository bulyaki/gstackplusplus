# gstack++ n8n Integration

Automate your C++ development workflow with n8n orchestration and MCP server integration.

## Overview

This integration adds **workflow automation** and **external AI agent support** to gstack++:

| Component | What it does |
|-----------|-------------|
| **n8n Workflows** | Automate `/review`, `/qa`, `/ship` with GitHub, Slack, Jira integrations |
| **MCP Server** | Expose gstack++ skills to external AI agents (Claude Desktop, Cursor, etc.) |
| **Custom n8n Node** | Native n8n node for gstack++ operations |

## Quick Start

### 1. Install

```bash
./install-n8n-integration.sh
```

This installs:
- n8n via Docker Compose (or configures n8n.cloud)
- Pre-built workflows for review, QA, and ship
- MCP server wrapper
- Configuration templates

### 2. Start n8n

```bash
cd n8n
docker-compose up -d
```

Access n8n at http://localhost:5678

### 3. Import Workflows

```bash
source ~/.gstackplusplus/n8n/.env
export N8N_API_KEY=your-api-key
./scripts/import-workflows.sh
```

### 4. Configure GitHub Webhook

In your GitHub repo settings:
- **Payload URL**: `http://your-n8n-url/webhook/gstack-review`
- **Content type**: `application/json`
- **Secret**: Your `GITHUB_WEBHOOK_SECRET`
- **Events**: Pull requests, Pushes

## Architecture

```
┌─────────────┐
│   GitHub    │
│   Webhook   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│         n8n Workflow        │
│  ┌───────────────────────┐  │
│  │ Webhook Trigger       │  │
│  │ → gstack++ HTTP Call  │  │
│  │ → GitHub Comment      │  │
│  │ → Slack Notification  │  │
│  └───────────────────────┘  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    gstack++ CLI             │
│  (existing HTTP protocol)   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Browse Server / Skills     │
└─────────────────────────────┘
```

## Workflows

### Code Review (`gstack-review.json`)

**Trigger**: GitHub PR webhook

**Actions**:
1. Runs `/review` skill via HTTP
2. Parses review results
3. Posts comment to PR with findings
4. Adds `needs-review` label
5. Notifies Slack channel

**Webhook**: `POST /webhook/gstack-review`

**Payload**:
```json
{
  "branch": "feature-xyz",
  "base": "main",
  "repository": "owner/repo",
  "pullRequestId": 42,
  "githubApiUrl": "https://api.github.com"
}
```

### QA Pipeline (`gstack-qa.json`)

**Trigger**: Push webhook or scheduled cron

**Actions**:
1. Runs `/qa` skill with sanitizers
2. Checks health score
3. Sets GitHub commit status (success/failure)
4. Notifies Slack with results
5. Updates Jira issue status

**Webhook**: `POST /webhook/gstack-qa`

**Payload**:
```json
{
  "branch": "feature-xyz",
  "sha": "abc123",
  "repository": "owner/repo",
  "sanitizers": ["address", "undefined"],
  "runValgrind": false
}
```

### Ship Pipeline (`gstack-ship.json`)

**Trigger**: Manual trigger or merged PR webhook

**Actions**:
1. Runs `/ship` skill
2. Creates pull request
3. Adds `ready-to-merge` and `tests-passing` labels
4. Notifies Slack with PR link

**Webhook**: `POST /webhook/gstack-ship`

## MCP Server

The MCP server exposes gstack++ workflows to **external AI agents** (not Claude Code).

### Start MCP Server

```bash
cd n8n
bun install
bun run start
```

### Configure Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gstack": {
      "command": "bun",
      "args": ["run", "start"],
      "cwd": "/path/to/gstackplusplus/n8n",
      "env": {
        "GSTACKPLUSPLUS_DIR": "/Users/yourname/.claude/skills/gstackplusplus"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `gstack_review` | Pre-landing code review |
| `gstack_qa` | QA pipeline with sanitizers |
| `gstack_ship` | Ship workflow with PR creation |
| `gstack_plan_ceo_review` | CEO/product strategy review |
| `gstack_plan_eng_review` | Engineering planning |
| `gstack_browse` | Browser automation commands |

### Example MCP Tool Call

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "gstack_review",
    "arguments": {
      "branch": "feature-xyz",
      "base": "main"
    }
  }
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Pre-Landing Review: 7 issues (3 critical, 4 informational)..."
    }]
  }
}
```

## Configuration

### Environment Variables

Edit `~/.gstackplusplus/n8n/.env`:

```bash
# n8n Instance
N8N_URL=http://localhost:5678
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=your-n8n-api-key

# gstack++ Configuration
GSTACKPLUSPLUS_DIR=/Users/yourname/.claude/skills/gstackplusplus
GSTACK_CLI=/Users/yourname/.claude/skills/gstackplusplus/browse/dist/browse

# Webhook Authentication
GSTACK_WEBHOOK_AUTH_TOKEN=auto-generated-token

# GitHub Integration
GITHUB_WEBHOOK_SECRET=your-github-secret
GITHUB_API_URL=https://api.github.com

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Jira Integration
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_API_TOKEN=your-jira-token
JIRA_USER_EMAIL=your-email@company.com
```

### Credentials

n8n credentials are stored in `~/.gstackplusplus/n8n/credentials.json`:

```json
{
  "githubApi": {
    "id": "github-creds",
    "name": "GitHub API",
    "type": "httpHeaderAuth",
    "data": {
      "username": "your-github-username",
      "password": "your-github-token"
    }
  },
  "gstackAuth": {
    "id": "gstack-auth",
    "name": "gstack++ API Auth",
    "type": "httpHeaderAuth",
    "data": {
      "username": "Bearer",
      "password": "your-gstack-webhook-token"
    }
  }
}
```

## Custom n8n Node

The `GstackPlusPlus.node.ts` provides a native n8n node for gstack++ operations.

### Installation

```bash
# In n8n custom nodes directory
cp n8n/nodes/GstackPlusPlus.node.ts ~/.n8n/custom/nodes/
cp n8n/nodes/gstack-icon.svg ~/.n8n/custom/nodes/
```

### Usage

1. Add **gstack++** node to your workflow
2. Select operation: Review, QA, Ship, or Browse Command
3. Configure parameters (branch, base, sanitizers, etc.)
4. Connect to triggers and other nodes

## Troubleshooting

### n8n won't start

```bash
docker-compose logs -f n8n
```

Common issues:
- Port 5678 already in use
- Docker daemon not running
- Insufficient memory

### Webhook not triggering

1. Check webhook URL is accessible (use ngrok for local testing)
2. Verify `GITHUB_WEBHOOK_SECRET` matches
3. Check n8n execution logs in UI

### MCP server connection fails

```bash
# Check if server is running
curl http://localhost:3000/healthz

# Check logs
bun run start 2>&1 | grep -i error
```

### gstack++ CLI not found

Ensure `GSTACKPLUSPLUS_DIR` is set correctly:

```bash
export GSTACKPLUSPLUS_DIR=/Users/yourname/.claude/skills/gstackplusplus
ls $GSTACKPLUSPLUS_DIR/browse/dist/browse
```

## Advanced Usage

### Scheduled QA Runs

Add cron trigger in n8n:

```json
{
  "trigger": "cron",
  "expression": "0 2 * * *",  // Daily at 2 AM
  "workflow": "gstack-qa"
}
```

### Multi-Branch Monitoring

Create workflow that monitors multiple branches:

1. Webhook trigger with branch list
2. Loop node for each branch
3. Parallel QA execution
4. Aggregate results

### Custom Notifications

Add custom notification nodes:
- Microsoft Teams webhook
- Email via SMTP
- PagerDuty for critical failures
- Discord bot

## Security Considerations

1. **Use HTTPS** in production (n8n.cloud or reverse proxy)
2. **Rotate tokens** regularly (webhook auth, API keys)
3. **Limit webhook IPs** if possible (GitHub IP ranges)
4. **Enable n8n authentication** (set `N8N_BASIC_AUTH_ACTIVE=true`)
5. **Audit workflow executions** in n8n UI

## Performance Tips

1. **Parallel execution**: Run sanitizers in parallel n8n branches
2. **Timeout settings**: Set appropriate timeouts (1800s for QA)
3. **Error handling**: Use n8n error triggers for failures
4. **Caching**: Cache build artifacts between runs

## See Also

- `MCP-N8N-FEASIBILITY.md` — Architecture analysis and design decisions
- `INSTALL.md` — Installation guide with n8n section
- `~/.gstackplusplus/n8n/SETUP.md` — Detailed setup guide
- [n8n documentation](https://docs.n8n.io)
- [MCP protocol specification](https://modelcontextprotocol.io)

## License

MIT License — same as gstack++ core

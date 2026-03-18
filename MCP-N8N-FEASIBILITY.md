# gstack++ as MCP Server with n8n Integration

## Executive Summary

**Verdict: Technically feasible, but architecturally misaligned. Not recommended for the browser component. Partial opportunity for workflow skills.**

gstack++ is purpose-built as a **localhost HTTP + plain text** protocol for AI agents (Claude Code, Codex, Qwen, etc.). Converting to MCP adds protocol overhead that the architecture explicitly rejects. However, n8n integration could automate workflow orchestration **alongside** the existing system.

---

## Part 1: What gstack++ Is

### Core Architecture

gstack++ has two main components:

#### 1. Browse Server (Browser Automation)
- **Persistent Chromium daemon** via Playwright
- **HTTP API on localhost** with bearer token auth
- **Plain text command/response** protocol (not JSON-RPC)
- **Sub-100ms latency** after cold start (~3s)
- **Stateful session** with cookies, tabs, localStorage persistence

```
Claude Code                     gstack++
─────────                      ──────
                               ┌──────────────────────┐
  Tool call: $B snapshot -i    │  CLI (compiled binary)│
  ─────────────────────────→   │  • reads state file   │
                               │  • POST /command      │
                               │    to localhost:PORT   │
                               └──────────┬───────────┘
                                          │ HTTP
                               ┌──────────▼───────────┐
                               │  Server (Bun.serve)   │
                               │  • dispatches command  │
                               │  • talks to Chromium   │
                               │  • returns plain text  │
                               └──────────┬───────────┘
                                          │ CDP
                               ┌──────────▼───────────┐
                               │  Chromium (headless)   │
                               └───────────────────────┘
```

#### 2. Workflow Skills (Specialist Agents)
13 specialist roles as slash commands:
- `/plan-ceo-review` — Product strategy
- `/plan-eng-review` — Architecture planning
- `/review` — Pre-landing code review
- `/qa` — Build → test → analyze → fix
- `/ship` — CI/CD automation
- `/design-consultation` — API design
- etc.

Each skill is a **Markdown template** read by Claude Code, not executable code.

### Design Philosophy (from ARCHITECTURE.md)

> **No MCP protocol.** MCP adds JSON schema overhead per request and requires a persistent connection. Plain HTTP + plain text output is lighter on tokens and easier to debug.

Explicit trade-offs:
- **Token efficiency**: Plain text vs. JSON-RPC + schema framing
- **Debug simplicity**: curl-able HTTP vs. JSON-RPC over SSE
- **Zero context bloat**: No protocol overhead in every message

---

## Part 2: MCP Protocol Overview

### Core Architecture

| Role | Description |
|------|-------------|
| **Host** | LLM application (e.g., Claude Desktop, n8n AI agent) |
| **Client** | Connector within the host |
| **Server** | Service exposing tools/resources/prompts |

### Message Format
- **Protocol**: JSON-RPC 2.0
- **Transport**: SSE (Server-Sent Events) or streamable HTTP
- **Capability negotiation**: At connection time

### How Servers Expose Tools

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "browse_snapshot",
    "arguments": { "flags": "-i" }
  }
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "@e1 button: Submit" }]
  }
}
```

### Overhead Comparison

| Operation | gstack++ (current) | MCP equivalent |
|-----------|-------------------|----------------|
| Command | `$B snapshot -i` (~20 bytes) | JSON-RPC envelope (~200 bytes) |
| Response | `@e1 button: Submit\n` (~50 bytes) | `{content:[{type:"text",text:"..."}}]` (~150 bytes) |
| Schema | None (plain text) | ~1500 tokens per tool definition |
| 20-command session | ~1,400 bytes | ~30,000-40,000 tokens (protocol framing) |

---

## Part 3: n8n Integration Patterns

### n8n MCP Nodes

n8n provides two MCP integration points:

#### 1. MCP Server Trigger (n8n as MCP Server)
- Exposes n8n workflows as MCP tools
- Uses **SSE transport** (not stdio)
- External AI agents can call workflows via MCP

**Use case**: AI agent triggers "Run QA workflow" or "Execute build pipeline"

#### 2. MCP Client Tool (n8n as MCP Client)
- Connects n8n to external MCP servers
- n8n workflows can call external tools

**Use case**: n8n workflow calls "browse.goto", "browse.click", etc.

---

## Part 4: Feasibility Analysis

### Option A: Convert Browse Server to MCP

**Technical feasibility**: ✅ Yes

**Implementation approach**:
1. Wrap existing HTTP endpoints with JSON-RPC layer
2. Add MCP capability negotiation
3. Implement SSE transport (or keep HTTP streaming)
4. Define tool schemas for all 40+ browse commands

**Pros**:
- Standard protocol for AI agent integration
- Works with Claude Desktop, Cursor, other MCP hosts
- n8n could directly call browse commands via MCP Client Tool

**Cons**:
- **Violates explicit design decision** (ARCHITECTURE.md rejects MCP)
- **Token overhead**: 20-30x more context per command
- **Latency**: JSON-RPC + SSE adds ~50-100ms per call
- **Complexity**: Schema maintenance, protocol versioning
- **No functional gain**: Same capabilities, more framing

**Verdict**: ❌ **Not recommended** — solves no real problem, adds significant overhead

---

### Option B: n8n Workflow Orchestration (Hybrid Approach)

**Concept**: Use n8n to orchestrate gstack++ workflow skills, not replace them.

**Architecture**:
```
┌─────────────┐
│   n8n       │
│  Workflow   │
│  Engine     │
└──────┬──────┘
       │ HTTP webhook
       ▼
┌─────────────────────────────────┐
│  gstack++ CLI                   │
│  (existing HTTP + plain text)   │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Browse Server / Workflow Skills│
└─────────────────────────────────┘
```

**Implementation**:
1. n8n HTTP Request node calls gstack++ CLI commands
2. n8n workflow defines orchestration logic (if/else, parallel execution)
3. gstack++ skills remain unchanged (Markdown templates for Claude Code)

**Example n8n workflow**:
```
Trigger (GitHub PR) 
  → HTTP: Run `/review` skill 
  → Wait for completion 
  → Parse results 
  → If AUTO-FIX items: post comment 
  → If ASK items: send Slack notification
  → Log metrics to database
```

**Pros**:
- **No changes to gstack++ core** — works with existing architecture
- **Real value add**: Workflow orchestration, notifications, integrations
- **Asynchronous execution**: n8n handles long-running workflows
- **Multi-system integration**: GitHub, Slack, Jira, etc.

**Cons**:
- **Duplicate orchestration**: Claude Code already orchestrates skills
- **Context switching**: Two orchestration layers (n8n + Claude)
- **Limited browser automation**: n8n can't directly control Chromium

**Verdict**: ⚠️ **Conditionally recommended** — only if you need:
  - Asynchronous workflow execution
  - Multi-system integrations (GitHub → Slack → Jira)
  - Scheduled/triggered automation (cron-based QA runs)

---

### Option C: gstack++ Workflow Skills as n8n MCP Tools

**Concept**: Expose `/review`, `/qa`, `/ship` as MCP tools via n8n MCP Server Trigger.

**Architecture**:
```
┌──────────────────┐
│  External AI     │
│  Agent (MCP)     │
└────────┬─────────┘
         │ MCP (JSON-RPC over SSE)
         ▼
┌──────────────────┐
│  n8n MCP Server  │
│  Trigger Node    │
└────────┬─────────┘
         │ Workflow execution
         ▼
┌──────────────────┐
│  n8n Workflow    │
│  (calls gstack++)│
└────────┬─────────┘
         │ HTTP webhook
         ▼
┌──────────────────┐
│  gstack++ CLI    │
└──────────────────┘
```

**Implementation**:
1. Create n8n workflow for each gstack++ skill
2. Expose via MCP Server Trigger node
3. External AI agents discover and call tools via MCP

**Example tool definition**:
```json
{
  "name": "gstack_review",
  "description": "Pre-landing C++ code review for memory safety, UB, data races",
  "inputSchema": {
    "type": "object",
    "properties": {
      "branch": { "type": "string", "description": "Git branch to review" },
      "base": { "type": "string", "description": "Base branch (default: main)" }
    }
  }
}
```

**Pros**:
- **Standard integration**: Works with any MCP-compatible AI agent
- **Composable**: AI agents can call multiple tools in sequence
- **Discoverable**: Tool descriptions guide agent behavior

**Cons**:
- **Indirection**: AI agent → MCP → n8n → gstack++ → Claude Code
- **Loss of context**: Markdown skill templates lose Claude Code integration
- **Complexity**: Three orchestration layers (MCP, n8n, Claude)

**Verdict**: ⚠️ **Niche use case** — only if you need external AI agents (not Claude Code) to trigger gstack++ workflows

---

## Part 5: Implementation Roadmap (If Proceeding)

### Phase 1: n8n HTTP Integration (Low Risk)

**Goal**: Prove n8n can orchestrate gstack++ without modifying core

**Steps**:
1. Install n8n (self-hosted or cloud)
2. Create HTTP Request node to call gstack++ CLI
3. Build simple workflow: "On GitHub PR → Run `/review` → Post comment"
4. Test with real PR flow

**Estimated effort**: 4-8 hours

**Deliverable**: Working n8n workflow, no changes to gstack++ code

---

### Phase 2: MCP Server Wrapper (Optional)

**Goal**: Expose gstack++ workflows as MCP tools

**Steps**:
1. Build MCP server wrapper (Node.js/Bun)
2. Define tool schemas for `/review`, `/qa`, `/ship`
3. Implement JSON-RPC handlers that call gstack++ CLI
4. Test with Claude Desktop MCP integration

**Estimated effort**: 16-24 hours

**Deliverable**: MCP server exposing 3-5 gstack++ workflow tools

---

### Phase 3: n8n MCP Integration (Full Stack)

**Goal**: Bidirectional n8n ↔ gstack++ integration

**Steps**:
1. Configure n8n MCP Server Trigger for workflows
2. Add MCP Client Tool node to call external MCP servers (optional)
3. Build complex workflows: multi-stage QA, scheduled builds
4. Add authentication, rate limiting, observability

**Estimated effort**: 40-60 hours

**Deliverable**: Production-ready n8n + MCP integration

---

## Part 6: Technical Challenges

### 1. Transport Mismatch

**Problem**: n8n MCP nodes use **SSE**, gstack++ uses **plain HTTP**

**Solutions**:
- **Option A**: Add SSE support to gstack++ server (moderate effort)
- **Option B**: Use `mcp-remote` proxy (no code changes, adds dependency)
- **Option C**: Keep HTTP-only, skip MCP (recommended)

---

### 2. State Management

**Problem**: Browse server is **stateful** (tabs, cookies, sessions). MCP is **stateless** request/response.

**Implications**:
- Session ID must be passed in every MCP call
- Concurrent sessions require multiplexing
- Cookie/auth state must persist across MCP calls

**Solution**: Add `sessionId` parameter to all MCP tool calls, maintain session map in server

---

### 3. Schema Maintenance

**Problem**: 40+ browse commands × 3-5 flags each = 120-200 schema definitions

**Implications**:
- Manual schema drift from implementation
- Breaking changes require MCP tool versioning
- Complex flags (e.g., `snapshot -i -c -d 5 -s .foo`) hard to schema-fy

**Solution**: Generate schemas from `commands.ts` metadata (extends existing `gen-skill-docs.ts`)

---

### 4. Error Handling

**Problem**: gstack++ errors are **plain text for agents**. MCP errors are **JSON-RPC error objects**.

**Current**:
```
Ref @e3 is stale — element no longer exists. Run 'snapshot' to get fresh refs.
```

**MCP**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32000,
    "message": "Ref @e3 is stale",
    "data": { "suggestion": "Run 'snapshot' to get fresh refs" }
  }
}
```

**Solution**: Wrap `wrapError()` output in JSON-RPC error format

---

### 5. Long-Running Workflows

**Problem**: `/qa` and `/ship` run for 5-20 minutes. MCP expects **sub-second responses**.

**Implications**:
- MCP timeout (typically 60s) will fire
- AI agent blocks waiting for response
- No progress streaming in standard MCP

**Solutions**:
- **Async pattern**: Return `taskId`, poll for completion
- **SSE streaming**: Stream progress events (non-standard)
- **n8n workflow**: Better suited for long-running orchestration

---

## Part 7: Recommendations

### Recommended Path: **Hybrid HTTP Orchestration**

**Do**:
1. ✅ Keep gstack++ HTTP + plain text protocol (core browse server)
2. ✅ Add n8n HTTP integration for workflow orchestration
3. ✅ Use n8n for multi-system integrations (GitHub, Slack, Jira)
4. ✅ Use n8n for scheduled/triggered automation (cron QA runs)

**Don't**:
1. ❌ Convert browse server to MCP (violates design, adds overhead)
2. ❌ Replace Claude Code orchestration with n8n (duplicate effort)
3. ❌ Add MCP unless external AI agents explicitly need it

**Rationale**:
- Preserves gstack++'s token efficiency and simplicity
- Adds real value (orchestration, integrations) without rewriting core
- MCP remains an option later if needed

---

### Alternative Path: **MCP for External AI Agents**

**If** you need non-Claude-Code AI agents to use gstack++:

1. Build MCP server wrapper (separate from browse server)
2. Expose workflow skills (`/review`, `/qa`, `/ship`) as MCP tools
3. Keep browse server HTTP-only (internal use)
4. Use n8n MCP Server Trigger for workflow orchestration

**Use case**: Cursor, Copilot, or custom AI agents need to trigger gstack++ workflows

---

## Part 8: Comparison Matrix

| Feature | Current (HTTP) | MCP Server | n8n HTTP | n8n + MCP |
|---------|---------------|------------|----------|-----------|
| Token efficiency | ✅ Excellent | ❌ Poor (20-30x overhead) | ✅ Excellent | ⚠️ Moderate |
| Latency | ✅ ~100ms | ⚠️ ~150-200ms | ✅ ~100ms | ⚠️ ~200ms |
| Debug simplicity | ✅ curl | ⚠️ JSON-RPC client | ✅ HTTP client | ⚠️ MCP + HTTP |
| AI agent integration | ✅ Claude Code native | ✅ Any MCP host | ⚠️ HTTP webhook only | ✅ Any MCP host |
| Multi-system integration | ❌ Manual | ❌ Manual | ✅ Native (300+ apps) | ✅ Native |
| Long-running workflows | ⚠️ Blocks agent | ❌ Timeout risk | ✅ Async | ✅ Async |
| Implementation effort | — | 16-24 hours | 4-8 hours | 40-60 hours |
| Architectural fit | ✅ Native | ❌ Violates design | ✅ Complementary | ⚠️ Complex |

---

## Conclusion

**gstack++ is already well-architected for its primary use case (Claude Code + AI agents with direct HTTP access). MCP adds protocol overhead without solving real problems.**

**n8n integration makes sense for:**
- Workflow orchestration beyond Claude Code's capabilities
- Multi-system integrations (GitHub → Slack → Jira)
- Scheduled/triggered automation (nightly QA, pre-merge checks)

**Recommended next step**: Build a simple n8n HTTP workflow to validate the integration pattern before committing to MCP development.

---

## Appendix: Quick Reference

### Current gstack++ Command Flow
```bash
# Claude Code invokes skill
/review

# Skill preamble runs
$ _UPD=$(~/.claude/skills/gstackplusplus/bin/gstackplusplus-update-check)
$ git diff origin/main  # Get diff
$ # Apply checklist, auto-fix, AskUserQuestion...
```

### n8n HTTP Integration (Proposed)
```
GitHub webhook (PR opened)
  → n8n webhook node
  → HTTP Request: POST http://localhost:34567/command
    Body: { "command": "review", "branch": "feature-xyz" }
  → Parse response
  → GitHub comment node: Post review summary
```

### MCP Tool Call (If Implemented)
```json
// AI agent sends
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "gstack_review",
    "arguments": { "branch": "feature-xyz" }
  }
}

// MCP server responds
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

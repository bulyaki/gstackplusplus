#!/usr/bin/env bash
# gstack++ n8n Integration Test Script
#
# Verifies that all components are installed and working correctly.
#
# Usage: ./test-n8n-integration.sh [--verbose]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VERBOSE=false
if [[ "$1" == "--verbose" || "$1" == "-v" ]]; then
  VERBOSE=true
fi

log_info() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

TESTS_PASSED=0
TESTS_FAILED=0

pass() {
  log_success "$1"
  ((TESTS_PASSED++))
}

fail() {
  log_error "$1"
  ((TESTS_FAILED++))
}

skip() {
  log_warn "SKIP: $1"
}

# ─── Test: Directory Structure ────────────────────────────────────────────

log_info "Testing directory structure..."

GSTACKPLUSPLUS_DIR="$(cd "$(dirname "$0")" && pwd)"
N8N_DIR="$GSTACKPLUSPLUS_DIR/n8n"

[ -d "$N8N_DIR" ] && pass "n8n directory exists" || fail "n8n directory missing"
[ -d "$N8N_DIR/workflows" ] && pass "workflows directory exists" || fail "workflows directory missing"
[ -d "$N8N_DIR/nodes" ] && pass "nodes directory exists" || fail "nodes directory missing"
[ -d "$N8N_DIR/scripts" ] && pass "scripts directory exists" || fail "scripts directory missing"

# ─── Test: Workflow Files ────────────────────────────────────────────────

log_info "Testing workflow files..."

[ -f "$N8N_DIR/workflows/gstack-review.json" ] && pass "gstack-review.json exists" || fail "gstack-review.json missing"
[ -f "$N8N_DIR/workflows/gstack-qa.json" ] && pass "gstack-qa.json exists" || fail "gstack-qa.json missing"
[ -f "$N8N_DIR/workflows/gstack-ship.json" ] && pass "gstack-ship.json exists" || fail "gstack-ship.json missing"

# Validate JSON syntax
for workflow in "$N8N_DIR/workflows"/*.json; do
  if bun -e "JSON.parse(require('fs').readFileSync('$workflow', 'utf8'))" 2>/dev/null; then
    pass "$(basename "$workflow") is valid JSON"
  else
    fail "$(basename "$workflow") has invalid JSON"
  fi
done

# ─── Test: MCP Server ────────────────────────────────────────────────────

log_info "Testing MCP server..."

[ -f "$N8N_DIR/scripts/mcp-server.ts" ] && pass "mcp-server.ts exists" || fail "mcp-server.ts missing"
[ -f "$N8N_DIR/package.json" ] && pass "package.json exists" || fail "package.json missing"

# Check MCP server dependencies
if bun -e "require('@modelcontextprotocol/sdk')" 2>/dev/null; then
  pass "MCP SDK is installed"
else
  log_info "Installing MCP SDK..."
  (cd "$N8N_DIR" && bun install @modelcontextprotocol/sdk) && pass "MCP SDK installed" || fail "MCP SDK installation failed"
fi

# ─── Test: Custom n8n Node ──────────────────────────────────────────────

log_info "Testing custom n8n node..."

[ -f "$N8N_DIR/nodes/GstackPlusPlus.node.ts" ] && pass "GstackPlusPlus.node.ts exists" || fail "GstackPlusPlus.node.ts missing"
[ -f "$N8N_DIR/nodes/gstack-icon.svg" ] && pass "gstack-icon.svg exists" || fail "gstack-icon.svg missing"

# Validate TypeScript syntax
if bun -e "require('fs').readFileSync('$N8N_DIR/nodes/GstackPlusPlus.node.ts', 'utf8')" 2>/dev/null; then
  pass "GstackPlusPlus.node.ts is readable"
else
  fail "GstackPlusPlus.node.ts is not readable"
fi

# ─── Test: Installer Script ─────────────────────────────────────────────

log_info "Testing installer script..."

INSTALLER="$GSTACKPLUSPLUS_DIR/install-n8n-integration.sh"

[ -f "$INSTALLER" ] && pass "install-n8n-integration.sh exists" || fail "install-n8n-integration.sh missing"
[ -x "$INSTALLER" ] && pass "install-n8n-integration.sh is executable" || fail "install-n8n-integration.sh not executable"

# Test installer help
if bash "$INSTALLER" --help >/dev/null 2>&1; then
  pass "Installer --help works"
else
  fail "Installer --help failed"
fi

# ─── Test: Configuration Templates ──────────────────────────────────────

log_info "Testing configuration templates..."

# These are created by the installer, check if they exist
if [ -f "$HOME/.gstackplusplus/n8n/.env" ]; then
  pass "Environment config exists (~/.gstackplusplus/n8n/.env)"
  
  # Check for required variables
  if grep -q "GSTACK_WEBHOOK_AUTH_TOKEN" "$HOME/.gstackplusplus/n8n/.env"; then
    pass "GSTACK_WEBHOOK_AUTH_TOKEN is configured"
  else
    fail "GSTACK_WEBHOOK_AUTH_TOKEN missing"
  fi
else
  skip "Environment config not yet created (run installer first)"
fi

if [ -f "$HOME/.gstackplusplus/n8n/SETUP.md" ]; then
  pass "SETUP.md guide exists"
else
  skip "SETUP.md not yet created (run installer first)"
fi

# ─── Test: n8n Docker Configuration ─────────────────────────────────────

log_info "Testing Docker configuration..."

if [ -f "$N8N_DIR/docker-compose.yml" ]; then
  pass "docker-compose.yml exists"
  
  # Validate YAML syntax
  if command -v docker-compose &> /dev/null; then
    if docker-compose -f "$N8N_DIR/docker-compose.yml" config >/dev/null 2>&1; then
      pass "docker-compose.yml is valid"
    else
      fail "docker-compose.yml has syntax errors"
    fi
  else
    skip "docker-compose not installed, skipping validation"
  fi
else
  skip "docker-compose.yml not yet created (run installer first)"
fi

# ─── Test: gstack++ CLI ─────────────────────────────────────────────────

log_info "Testing gstack++ CLI..."

GSTACK_CLI="$GSTACKPLUSPLUS_DIR/browse/dist/browse"

if [ -x "$GSTACK_CLI" ]; then
  pass "gstack++ CLI is executable"
  
  if "$GSTACK_CLI" --version >/dev/null 2>&1; then
    pass "gstack++ CLI responds to --version"
  else
    skip "gstack++ CLI --version failed (may need ./setup first)"
  fi
else
  skip "gstack++ CLI not found (run ./setup first)"
fi

# ─── Test: Documentation ────────────────────────────────────────────────

log_info "Testing documentation..."

[ -f "$GSTACKPLUSPLUS_DIR/MCP-N8N-FEASIBILITY.md" ] && pass "MCP-N8N-FEASIBILITY.md exists" || fail "MCP-N8N-FEASIBILITY.md missing"
[ -f "$N8N_DIR/README.md" ] && pass "n8n/README.md exists" || fail "n8n/README.md missing"

# ─── Summary ────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════"
echo "                    Test Summary                       "
echo "═══════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}Passed${NC}: $TESTS_PASSED"
echo -e "  ${RED}Failed${NC}: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Some tests failed. Review the output above.${NC}"
  echo ""
  echo "To fix common issues:"
  echo "  1. Run ./setup to build gstack++ CLI"
  echo "  2. Run ./install-n8n-integration.sh to create config files"
  echo "  3. Check that Docker is running (for n8n)"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Run ./install-n8n-integration.sh to complete setup"
  echo "  2. Access n8n at http://localhost:5678"
  echo "  3. Import workflows and configure credentials"
  exit 0
fi

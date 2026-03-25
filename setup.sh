#!/usr/bin/env bash
# ==============================================================================
# OmniAI v4 — Master Setup Script
# ==============================================================================
# Usage: bash setup.sh
# Or:    chmod +x setup.sh && ./setup.sh
#
# This script checks prerequisites and then delegates to the Node.js
# orchestrator (scripts/run-setup.js) which handles all automation.
# ==============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Helpers ───────────────────────────────────────────────────────────────────
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; }
info() { echo -e "${BLUE}  ℹ️  $1${NC}"; }

header() {
  echo ""
  echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
}

# ── Check prerequisites ───────────────────────────────────────────────────────
header "OmniAI v4 — Prerequisites Check"

MISSING=0

# Node.js (>=18)
if command -v node &>/dev/null; then
  NODE_VER=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js $NODE_VER"
  else
    err "Node.js $NODE_VER is too old — requires >=18"
    info "Install from: https://nodejs.org/en/download"
    MISSING=1
  fi
else
  err "Node.js not found"
  info "Install from: https://nodejs.org/en/download"
  MISSING=1
fi

# npm
if command -v npm &>/dev/null; then
  ok "npm $(npm --version)"
else
  err "npm not found — usually installed with Node.js"
  MISSING=1
fi

# git
if command -v git &>/dev/null; then
  ok "git $(git --version | awk '{print $3}')"
else
  err "git not found"
  info "Install from: https://git-scm.com/downloads"
  MISSING=1
fi

if [ "$MISSING" -eq 1 ]; then
  echo ""
  err "Please install the missing prerequisites and re-run this script."
  exit 1
fi

# ── Install Node.js dependencies ──────────────────────────────────────────────
header "Installing dependencies"

if [ ! -d "node_modules" ]; then
  echo "  Running npm install..."
  npm install
  ok "Dependencies installed"
else
  ok "Dependencies already installed"
fi

# ── Run the Node.js setup wizard ──────────────────────────────────────────────
header "Starting OmniAI Setup Wizard"

node scripts/run-setup.js

echo ""
ok "Setup complete! See the summary above for next steps."
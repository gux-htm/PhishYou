#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() { printf '\n[%s] %s\n' "PhishYou setup" "$1"; }
fail() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required. Install Node.js 20+ and run setup.sh again."
command -v npm >/dev/null 2>&1 || fail "npm is required. Install npm with Node.js and run setup.sh again."

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
[ "$NODE_MAJOR" -ge 20 ] || fail "Node.js 20+ is required (found $(node --version))."

log "Installing backend dependencies"
npm install --prefix backend

log "Installing frontend dependencies"
npm install --prefix frontend

if [ ! -f backend/.env ]; then
  log "Creating backend/.env from backend/.env.example"
  cp backend/.env.example backend/.env
else
  log "Keeping existing backend/.env"
fi

log "Initializing SQLite database"
npm --prefix backend run init-db

log "Building backend"
npm --prefix backend run build

log "Building frontend"
npm --prefix frontend run build

cat <<'EOF'

PhishYou setup is complete.

Database:
  backend/data/phishyou.sqlite

Next:
  ./run.sh

Then open:
  http://localhost:5173

LLM configuration:
  Register a user, sign in, open Tool Settings, choose LLM, and enter the provider/model/endpoint/API key.

Email configuration is also available in Tool Settings. Leaving it unconfigured keeps the local email workflow from sending real mail.
EOF

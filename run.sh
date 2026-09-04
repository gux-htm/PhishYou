#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

fail() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required. Run ./setup.sh first."
command -v npm >/dev/null 2>&1 || fail "npm is required. Run ./setup.sh first."
[ -d backend/node_modules ] || fail "Backend dependencies are missing. Run ./setup.sh first."
[ -d frontend/node_modules ] || fail "Frontend dependencies are missing. Run ./setup.sh first."
[ -f backend/.env ] || fail "backend/.env is missing. Run ./setup.sh first."

printf '\nStarting PhishYou...\n'
printf '  Backend:  http://localhost:4000\n'
printf '  Frontend: http://localhost:5173\n\n'

cleanup() {
  jobs -pr | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm --prefix backend run dev &
BACKEND_PID=$!
npm --prefix frontend run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

wait -n "$BACKEND_PID" "$FRONTEND_PID"

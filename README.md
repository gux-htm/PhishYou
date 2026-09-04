# PhishYou

PhishYou is an authorized security-awareness simulation platform with an AI campaign agent, SQLite persistence, and configurable LLM/email connectors.

## First-time setup

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/gux-htm/PhishYou.git
cd PhishYou
./setup.sh
./run.sh
```

`setup.sh` installs backend and frontend dependencies, creates `backend/.env` when needed, initializes the SQLite schema, and runs production builds for both applications.

`run.sh` starts the backend and frontend together. Stop both with `Ctrl+C`.

Open `http://localhost:5173` after the servers start. The backend health endpoint is `http://localhost:4000/health`.

## Database

The local application database is SQLite at:

```text
backend/data/phishyou.sqlite
```

Initialization creates the users, campaigns, targets, email interactions, campaign events, and connector settings tables. Connector settings are persisted in the same SQLite database.

The Database connector page keeps PostgreSQL as an optional connection-test target, but the application's operational store is SQLite for this setup.

## LLM setup

No LLM secret is required by `setup.sh`.

After registration and sign-in:

1. Open **Tool Settings → LLM**.
2. Enter the provider, model, endpoint, and API key.
3. Test the connection and save it.
4. Return to **Command** to create a campaign conversation.

LLM credentials entered through the UI are persisted in SQLite. `backend/.env` can still provide host-level LLM values for deployments that manage secrets outside the application.

## Email connector

Email is configured from **Tool Settings → Email**. SMTP is used for outbound messages and IMAP is used for inbound reply monitoring. Leave it unconfigured for local development until you are ready to connect a real mailbox.

## Useful commands

```bash
# Re-run database initialization
npm --prefix backend run init-db

# Build backend only
npm --prefix backend run build

# Build frontend only
npm --prefix frontend run build

# Start backend only
npm --prefix backend run dev

# Start frontend only
npm --prefix frontend run dev
```

## Project structure

```text
backend/   Express API, SQLite persistence, campaign agent, LLM/email services
frontend/  React/Vite application
PHISHYOU_SPECS/  product and architecture specifications
setup.sh   first-time installation and initialization
run.sh     local full-stack runner
```

## Security note

PhishYou is intended for authorized security-awareness simulations. Use only with explicit permission from the organization and participants covered by the simulation scope. Do not use the platform to collect real passwords, OTPs, payment credentials, or unrelated secrets.

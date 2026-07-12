#!/usr/bin/env bash
# One-command dev startup: SQL Server (Docker) + backend (Spring Boot) + frontend (Vite).
# Ctrl+C stops backend and frontend; the DB container keeps running (it's cheap to
# leave up — `docker compose down` separately if you want to stop it too).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "==> Starting SQL Server + db-init (Docker)..."
docker compose up -d sqlserver
docker compose up db-init

echo "==> Starting backend (Spring Boot)..."
(cd etrm-backend && mvn spring-boot:run) &
BACKEND_PID=$!

echo "==> Starting frontend (Vite)..."
(cd etrm-frontend && npm run dev) &
FRONTEND_PID=$!

trap 'echo "==> Stopping backend and frontend..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT INT TERM

wait $BACKEND_PID $FRONTEND_PID

#!/usr/bin/env bash
# Kills any locally-running backend (Spring Boot, port 8080) and frontend
# (Vite, port 5173) processes started by start-all.sh or run manually.
# Does NOT touch the SQL Server Docker container — it's cheap to leave up;
# run `docker compose down` separately if you want to stop that too.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "==> Stopping backend (port 8080) and frontend (port 5173)..."

# Kill by port first (catches anything bound there, however it was started).
for port in 8080 5173; do
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "    killing PID(s) $pids on port $port"
        kill -9 $pids 2>/dev/null || true
    fi
done

# Belt-and-suspenders: kill by process name too, in case a process is
# starting up and hasn't bound its port yet.
pkill -f "com.etrm.system.EtrmBackendApplication" 2>/dev/null || true
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "==> Done."

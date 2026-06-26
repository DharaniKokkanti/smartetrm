# ETRM System

Open `etrm.code-workspace` in VS Code — that's the entry point, not this folder
directly (`code etrm.code-workspace` or File → Open Workspace from File…).

## Structure

```
etrm-system/
  etrm.code-workspace   <- open THIS in VS Code
  etrm-frontend/        React 18 + TS + Ant Design + AG Grid
  etrm-backend/         Spring Boot 3.3 + Java 21
  database/             All 15 SQL scripts in execution order (also Flyway
                          migrations inside etrm-backend/src/main/resources/db/migration —
                          these are the same files, kept here too for easy
                          browsing/editing without digging into the backend tree)
  docs/                 Schema reference docs, technical design doc, project handoff
```

## First time setup

1. **Open the workspace**, not the folder: `etrm.code-workspace`. VS Code will
   prompt to install the recommended extensions (ESLint, Prettier, Java
   Extension Pack, Spring Boot tools, MSSQL) — accept that prompt.

2. **Frontend** — run the task `Frontend: Install` (⇧⌘P → "Run Task"), or
   from a terminal:
   ```bash
   cd etrm-frontend && npm install
   ```

3. **Backend** — needs a real SQL Server instance before it'll fully work.
   See `etrm-backend/README.md` for full setup (creating the DB, a
   least-privilege login, running Flyway). Copy `etrm-backend/.env.example`
   to `etrm-backend/.env` and fill in your real connection details — the
   "real SQL Server" launch config reads from that file automatically.

## Running things

**Via the Run/Debug panel** (⇧⌘D), pick one of:
- **Frontend: Launch Chrome** — starts the Vite dev server and opens Chrome
  attached to it, with breakpoints working in your `.tsx` source directly
- **Backend: Debug (H2 dev profile, no SQL Server needed)** — quick smoke
  test, no setup required, but Tier 2's reference-data metadata endpoint
  won't work (it needs real SQL Server system catalogs — see the backend
  README for why)
- **Backend: Debug (real SQL Server, reads etrm-backend/.env)** — the real
  thing, once `.env` is filled in
- **Full Stack: Frontend + Real Backend + Chrome** — both at once, with
  breakpoints working in both TypeScript and Java simultaneously

**Via Tasks** (⇧⌘P → "Run Task") if you just want processes running without
attaching a debugger: `Frontend: Dev Server`, `Backend: Run (H2 dev profile)`,
`Backend: Run (real SQL Server)`, or the bundled `Full Stack: Start (...)`
tasks that launch frontend + backend together.

## The one real gap right now

**There's no login page in the frontend yet.** The backend's `/api/v1/auth/login`
endpoint works (see `etrm-backend/README.md` for testing it directly via
`curl`), but nothing in the UI calls it. Until that's built, point the
frontend at the mock backend (`VITE_USE_MOCKS=true` in
`etrm-frontend/.env.development`, the default) for normal UI work, or
manually set `sessionStorage.setItem('etrm_token', '<jwt from curl>')` in
the browser console after starting the real backend, as a temporary
workaround.

## Verification status

| | Status |
|---|---|
| Frontend | Type-checked, linted, 0 `npm audit` vulnerabilities, production build verified, served and smoke-tested |
| Backend | **Not compile-verified.** Maven Central isn't reachable from the sandbox this was built in (network policy, same as Docker Hub would be) — every file was hand-reviewed but never run through `mvn compile`. See `etrm-backend/README.md`'s "Verification status" section before assuming anything here just works. |

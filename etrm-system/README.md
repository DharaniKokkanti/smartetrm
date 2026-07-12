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
   **See [`docs/RUNNING_LOCALLY.md`](docs/RUNNING_LOCALLY.md) for the fastest
   path — a free, one-command Docker Compose setup** (SQL Server Developer
   edition, no license cost). It also covers `etrm-backend/README.md`'s
   manual setup steps and confirms every layer of this stack (DB, backend,
   frontend) has a free tier suitable for local dev.

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

## Connecting to the database directly

Once the Docker SQL Server is up (see `docs/RUNNING_LOCALLY.md`), it's
reachable on `localhost,1433` from any SQL client — useful for poking at
data outside the app. Credentials are in `etrm-system/.env` (copied from
`.env.example`, not committed).

**VS Code (mssql extension, already in this workspace's recommended list):**
- Command Palette → `MS SQL: Connect` (or the SQL Server icon in the sidebar → `Add Connection`)
- Server: `localhost,1433`
- Authentication: SQL Login
- User: `sa` (full admin) or `etrm_app` (least-privilege — the same account the backend itself connects as)
- Password: `MSSQL_SA_PASSWORD` or `ETRM_APP_DB_PASSWORD` from `.env`
- Database: `ETRM_DB`
- **Trust server certificate: Yes** — the container uses a self-signed cert; the connection fails without this.

**Azure Data Studio or SSMS** (SSMS is Windows-only; Azure Data Studio is
free and cross-platform — the closest equivalent on macOS/Linux):
- Server name: `localhost,1433` (comma, not colon)
- Authentication: SQL Server Authentication
- Login / password: same as above
- Under "Advanced" / connection properties: enable **Trust server certificate**

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
| Backend | `mvn compile` / `mvn clean install` verified clean. All 96 Flyway migrations verified end-to-end against a real, freshly-created SQL Server 2022 container — not just reviewed (~40 real migration bugs found and fixed; see `docs/RUNNING_LOCALLY.md`). `mvn spring-boot:run` now boots successfully against the real Dockerized SQL Server (root cause of the earlier failure was Spring Framework's own bundled ASM not parsing Java 25 bytecode — fixed by targeting Java 21 in `pom.xml`, see `docs/RUNNING_LOCALLY.md`). One separate, still-open issue found once it booted: a JPA entity/schema type mismatch (`Address.addressId`) trips Hibernate's schema validation — documented as a follow-up in `docs/RUNNING_LOCALLY.md`, not yet fixed. |

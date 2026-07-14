---
name: verify
description: How to actually run and drive SmartETRM to verify a change, instead of just typechecking/compiling.
---

# Verifying a change in SmartETRM

The frontend defaults to MSW mocks, but **a real Spring Boot backend + SQL
Server DB can be runnable here** — don't assume otherwise without
checking. `docker ps` first: if `etrm-sqlserver` is `Up`/`healthy`, there's
a real `ETRM_DB` reachable at `localhost:1433`, and backend/DB changes can
be verified end-to-end, not just compiled. (This was wrongly documented as
never-possible in an earlier revision of this file — confirmed working
2026-07-14: a live container with a real, migrated `ETRM_DB` was already
running, just needed `.env` sourced correctly — see "Backend / DB changes"
below.) If `docker ps` shows nothing, then yes, fall back to mocks-only as
described for the frontend below.

## Launch

```bash
cd etrm-system/etrm-frontend
(lsof -ti:5183 | xargs -r kill -9) 2>/dev/null   # pick a port not used by a dev session
nohup npm run dev -- --port 5183 --strictPort > /tmp/verify-dev.log 2>&1 & disown
sleep 5 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5183
```

Use a port distinct from whatever the user's own dev server (usually 5173)
might be running on — don't kill their session.

## Drive it (Playwright)

Playwright must run from `etrm-frontend/` (or anywhere `node_modules`
resolves) — a script in `/tmp` or the scratchpad fails with
`ERR_MODULE_NOT_FOUND: playwright`. Write `.tmp_*.mjs` scripts directly in
`etrm-frontend/`, run with plain `node`, delete when done.

Login shortcut: `page.locator('text=Sign in as dev.admin').click()` — no
credentials needed in dev mode.

Sidebar nav: many admin pages are nested under a collapsible "Admin" group.
Pattern that survives whether it's already expanded or not:
```js
async function openAdmin(itemText) {
  const target = page.locator('text=' + itemText).first();
  if (!(await target.isVisible().catch(() => false))) {
    await page.locator('text=Admin').first().click();
  }
  await target.click();
}
```

## Gotchas specific to this codebase

- **ag-grid pinned columns split each row into multiple DOM nodes** sharing
  the same `row-id` — `.ag-row[row-id="2"]` resolves to 2-3 elements
  (pinned-left / center / pinned-right containers). Target a specific column
  with `[col-id="..."]`, or `.first()` if you just need any cell's text, not
  `.innerText()` on the bare row locator (strict-mode violation).
- **`Modal ... forceRender` mounts hidden modals into the DOM**, so a
  generic `table tbody tr` or `.ant-modal` selector can match content in a
  *different*, currently-closed modal (e.g. `RolesPage.tsx` has both a
  `RoleFormModal` with a raw HTML `<table>` inside `FunctionMatrix`, and an
  `AssignRoleModal` — both `forceRender`). Scope selectors to the visible
  container: `.ant-modal-content:has-text("<this modal's title>")`,
  `.ant-tabs-tabpane-active .ant-table` for the active tab's table, `.ant-table-row`
  (not bare `tr`) to count only real antd Table rows.
- **antd `message.error()` + TanStack Query v5 mutations**: `useMutation`
  awaits `onError`/`onSuccess` before settling `isPending`. antd's
  `message.xxx()` returns a promise that resolves only after the toast's
  `duration` (default 3s) elapses. Combined, every `onError: (e) =>
  message.error(...)` mutation in this app keeps its triggering button in a
  `loading` state for ~3 extra seconds after a failure actually completes —
  this is a real, app-wide UX quirk (not a script bug) if you see a button
  stuck "loading" for a few seconds after an error. Confirmed once via network
  request/response timestamps (response in <50ms) vs. when the UI actually
  reacted (~3s later) — don't assume a slow backend without checking both.
- Also: `admin/roles/api.ts`'s `json()` helper throws a plain `Error(text)`,
  not a `ProblemDetail`-shaped object, so `e.detail`/`e.title` are always
  `undefined` in that file's `onError` handlers — real backend error detail
  never reaches the toast, only the hardcoded fallback string does.

## Backend / DB changes

**Check `docker ps` for `etrm-sqlserver` first.** If it's up, verify DB
changes for real — this is far stronger than compile-only checking and has
caught real bugs compile-checking alone missed (Hibernate `ddl-auto:
validate` catches column-type mismatches like `CHAR` vs `VARCHAR` or
`TINYINT`/`SMALLINT` vs `Integer` that `mvn compile` can't see at all,
since Java doesn't know the DB's real column types).

The real, closed-loop process for any migration + entity change:

1. `cd etrm-system/etrm-backend && mvn -q -o compile && mvn -q -o test-compile`
   — as of 2026-07-14 this module compiles clean with no pre-existing
   errors (an earlier revision of this file wrongly claimed
   `CounterpartyController`/`ReferenceDataController` had unrelated
   compile errors — not reproduced, don't assume it without checking).
2. Mirror the migration byte-identical into both
   `etrm-backend/src/main/resources/db/migration/VNN__*.sql` and
   `database/NN_*.sql` (project convention, both must match).
3. **Start the real backend against the live DB** — this is what actually
   runs Flyway and Hibernate's schema validation:
   ```bash
   cd etrm-system/etrm-backend
   (lsof -ti:8080 | xargs -r kill -9) 2>/dev/null
   set -a; source .env; set +a   # .env is NOT auto-loaded by plain `mvn spring-boot:run`
   nohup mvn -q -o spring-boot:run > /tmp/backend-boot.log 2>&1 &
   ```
   Wait for `Started EtrmBackendApplication` (success) or
   `APPLICATION FAILED TO START`/a Flyway or Hibernate exception (failure)
   in the log — `grep -qE` in a loop, don't sleep-guess.
4. **Read the actual failure, don't guess.** Flyway errors name the exact
   SQL error (e.g. `Error Code 2714: object already exists` — usually
   orphaned state from a prior failed migration attempt; verify with a
   direct `sqlcmd` query before touching anything, and never drop/alter
   live data without explicit user confirmation first). Hibernate
   `SchemaManagementException` names the exact column and both the found
   vs. expected type — fix the entity, recompile, restart, repeat until
   `Started EtrmBackendApplication` appears with zero errors.
5. **Smoke-test the actual endpoint(s) you built**, not just that boot
   succeeded:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"<see below>"}' \
     | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
   curl -s http://localhost:8080/api/v1/<your-new-endpoint> \
     -H "Authorization: Bearer $TOKEN"
   ```
6. Kill the backend when done (`lsof -ti:8080 | xargs -r kill -9`) unless
   the user is actively using it against the real frontend — ask if
   unsure, don't silently kill a session they may be relying on.

**Querying/mutating the live DB directly** (`docker exec etrm-sqlserver
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$(grep
MSSQL_SA_PASSWORD .env | cut -d= -f2)" -C -d ETRM_DB -Q "..."`, password
piped directly into the command, never echoed on its own) is fine for
read-only diagnostics. Any destructive action (DROP, DELETE, UPDATE
touching real rows) needs the same care as any other risky action — narrow
scope, confirm nothing depends on it first, and get explicit user
confirmation before running it, exactly as for any other irreversible
change in this codebase.

**Login credentials**: real accounts exist in `ETRM_DB` already (separate
from — and more complete than — `database/test-data/`'s fictional
"Meridian Trading" seed data, which targets a from-scratch DB). Check
`dbo.app_user` for what's actually there
(`SELECT user_id, username FROM dbo.app_user` — never select
`password_hash` itself into output) before assuming any particular
username/password combination works.

## Cleanup

Always kill the dev server and delete `.tmp_*.mjs` scripts from
`etrm-frontend/` when done — don't leave stray processes or files.

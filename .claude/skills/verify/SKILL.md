---
name: verify
description: How to actually run and drive SmartETRM to verify a change, instead of just typechecking/compiling.
---

# Verifying a change in SmartETRM

The app is **100% MSW-mock-driven today** — the real Spring Boot backend
(`etrm-system/etrm-backend`) and SQL Server DB are not runnable in this
environment (no docker-compose, no reachable `localhost:1433`). The actual
user-facing runtime surface is the frontend against its MSW mocks.

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

Cannot be runtime-verified here (no live DB). Instead:
- `cd etrm-system/etrm-backend && mvn -q -o compile` — but the module has
  **pre-existing, unrelated compile errors** in `CounterpartyController.java`
  and `ReferenceDataController.java` (confirmed via `git stash` that these
  fail identically on a clean checkout). A clean `mvn compile` is not
  achievable at all right now — check that *your* touched files produce no
  *new* errors in the output, not that the whole build is green.
- SQL migrations: verify structurally (full `CREATE TABLE` re-read, byte-diff
  the `database/NN_*.sql` and `etrm-backend/.../VNN__*.sql` copies) — there's
  no SQL Server to actually run Flyway against.

## Cleanup

Always kill the dev server and delete `.tmp_*.mjs` scripts from
`etrm-frontend/` when done — don't leave stray processes or files.

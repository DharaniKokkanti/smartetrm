# SmartETRM GUI Architecture — Frontend Conventions Reference

> **Persona for this doc:** You are an expert GUI/UX engineer building the GUI for a multi-commodity ETRM (Energy/Commodity Trading and Risk Management) enterprise trading system — dense trader blotters, master-data grids, entitlement-gated forms, and real-time-adjacent workflows. Apply that expertise to every page, component, and interaction pattern described here, and to any new GUI work on this platform.

**Status: describes the real, currently-built frontend** (distinct from [`event-architecture-plan/architecture/03-streaming-layer.md`](event-architecture-plan/architecture/03-streaming-layer.md), which is the *planned*, not-yet-built live-streaming layer). Everything below exists in the codebase today. For the full session-by-session history of how each pattern was introduced or fixed, see [`ETRM_Project_Handoff_v1_0.md`](ETRM_Project_Handoff_v1_0.md) — this doc is the consolidated reference; the handoff doc is the detailed build log.

## Stack

- **React 18 + TypeScript**, Vite build
- **Ant Design (antd)** — primary component library (forms, modals, drawers, tables' chrome, notifications)
- **AG Grid Community** (`ag-grid-react`) — the actual data-grid engine behind `SmartGrid`, not antd's own `Table`, for anything with real row volume
- **TanStack Query** — server-state fetching/caching/mutations
- **Zustand** — client-side UI state (drafts, panel state, etc.)
- **ExcelJS** — bulk-upload template generation/parsing
- **dayjs** — date handling throughout (see `AppDatePicker`)

## Directory layout (`etrm-frontend/src/`)

```
components/
  layout/     AppShell, PageHeader, MinimizedDraftsDock, ApiLogDrawer — app chrome, present on every page
  smart/      shared, reusable building blocks — see below, this is the vocabulary to reach for first
features/     one folder per business domain (trade, credit, counterparties, logistics, markets,
              pricing, master-data, organization, admin, environmental, rins, voyage-ops, tier1, tier2, ...)
pages/        route-level page components
permissions/  RBAC-aware UI gating (mirrors backend role_function grants — see the handoff doc's
              RBAC entries, V138-V140)
services/     API clients
store/        Zustand stores
theme/        antd theme tokens
mocks/        MSW mock data (inert in real dev — VITE_USE_MOCKS=false — but kept in the same
              TS project, so mock seed shapes must still match real types or `tsc -b` breaks)
```

## `components/smart/` — the shared vocabulary (reach for these before building a one-off)

| Component | What it's for |
|---|---|
| `SmartGrid.tsx` | The standard data grid — wraps AG Grid, has built-in search. Used on ~75/85 pages. **Default choice for any tabular data.** Only reach for bare antd `Table` if you have a specific, deliberate reason (as of the last audit, only 4 pages still use bare `Table` and it's flagged as a gap, not a pattern to copy). |
| `AuditInfo.tsx` | Read-only "Created {date} by {user}" footer for an edit Drawer/form — explicitly never a `Form.Item`, never editable. Rollout is incremental (55/69 candidate pages as of the last count) — if a page you're touching has `createdAt`/`createdBy` in its type and no `<AuditInfo>` footer, that's a known gap worth closing, not a pattern to avoid. |
| `optimisticLock.tsx` | `isOptimisticLockConflict()` + `showOptimisticLockConflict()` — a **persistent** (`duration: 0`) antd `notification.error` with a "Reload" button for a 409 `OPTIMISTIC_LOCK_CONFLICT` response. Never let a version conflict fall through to a generic toast — it must be this specific, non-auto-dismissing notification, or the conflict is effectively silent. Every save-mutation hook's `onError` must check this before falling back to a generic error message. |
| `OwnershipPanel.tsx` | Polymorphic ownership editor (legal entity / counterparty / external owner), shared between entity-level and book-level ownership. |
| `FieldHint.tsx` | Inline field-level help text — ~90% rolled out across forms; a handful of voyage-ops/logistics pages are still missing it (known gap, not intentional). |
| `StatusTag.tsx`, `ExpiryBadge.tsx` | Small status/expiry visual indicators, reused across grids and detail views. |
| `AppDatePicker.tsx` | Standard date input — use this, not a raw antd `DatePicker`, for consistent formatting. |
| `formDraft.ts` / `draftMeta.ts` + `MinimizedDraftsDock.tsx` (in `layout/`) | Minimize-and-resume pattern for in-progress forms: navigating away from an open drawer/modal/routed form pins it in a persistent bottom-left dock instead of losing the work. Restore is **explicit only** (click the pin) — never auto-fires on page load; a past bug where it did caused data loss and page hijacking. Drafts are keyed per-record (`key:new` vs `key:edit:<snapshot>`), so a new-item draft and an edit-in-progress draft don't clobber each other. |
| `fieldValidation.ts` | Shared validation helpers — `maxLength` enforcement in particular has historically been inconsistent (rule-only vs. hard-cap vs. missing entirely); check this file's helpers before hand-rolling a length check. |

## Layout (`components/layout/`)

- `AppShell.tsx` — the persistent sidebar/nav shell. Currently a fixed-width (210px), single-level-collapse 2-level accordion (~31 directly-reachable routes) — noted as comparatively under-built next to this app's own density patterns elsewhere (`Tier2HomePage`'s resizable panel, `BookTreeExplorer`'s multi-level collapse). Most of the ~175 master-data tables are reached via Master Data Hub / Static Data, not the sidebar directly.
- `PageHeader.tsx` — standard page title/breadcrumb/actions row.
- `ApiLogDrawer.tsx` — dev-facing API call log drawer.

## Established conventions (learned the hard way — don't re-litigate these)

1. **Density by default, not toggles.** When a screen has "too much space" feedback, the fix is redesigning the screen dense-by-default (tooltips for help text, no card chrome) — not adding another collapse/expand button. Repeated feedback on this exact point means the instinct to reach for a toggle is wrong; reach for a denser layout instead.
2. **antd's `fontSize` doesn't cascade through some internals.** `Descriptions`, `Breadcrumb`, and `Typography.Title` don't reliably inherit an ancestor's inline/inherited `font-size` — their internals override it. Use scoped CSS, hand-roll the element, or `Typography.Text` instead of fighting the cascade.
3. **Two-catalog gotcha for any new Tier2/master-data table.** A table registered in `master_data_table_registry` is **not automatically visible** on the `/master-data` landing page — `MasterDataHub.tsx` is a second, separately-maintained hardcoded catalog. A new Tier2 table needs **three** places touched: the registry row, a mock seed (if applicable), and a `MasterDataHub.tsx` entry. This exact mistake has recurred more than once — verify by clicking through the real navigation a user would use, not just by hitting the known-correct `/static-data/{table}` URL directly.
4. **Verify the real end-to-end path, not the mechanism in isolation.** "It renders when I navigate straight to the URL I already know is correct" and "a user can actually find and use it" are different claims. Click through from the real entry point (sidebar → Master Data Hub → table, not a typed URL) before calling a GUI change done.
5. **Optimistic-lock conflicts are always the persistent notification + Reload pattern** (see `optimisticLock.tsx` above), never a generic toast — this is a correctness/data-loss-prevention requirement, not styling.
6. **RBAC-aware rendering must mirror real backend grants**, not just hide a button cosmetically — a hidden-but-still-callable action is not real enforcement (see the handoff doc's RBAC entries for the backend side of this contract).
7. **Excel bulk-upload** (where `allow_excel_upload=1` on a table's registry row) follows one shared pattern: `ExcelUploadModal.tsx` + `excelUpload.ts` — metadata-driven template download, per-row validation/preview, partial-failure-tolerant import through the existing create endpoint. Don't hand-roll a new upload flow per table; extend the shared one.

## Verifying GUI changes

Don't consider a GUI change done from `tsc -b`/lint passing alone. Actually drive it in a browser — the `/verify` skill exists for exactly this (drives the real running app, not just a known-correct URL). For anything touching live-update/version-conflict behavior, a two-browser-context test (two independent sessions editing the same record) is the only way to actually prove the conflict UX works, not just that the code compiles.

## Known, tracked gaps (don't silently "fix" these without checking the handoff doc first — some are deliberately deferred)

- No backend pagination on ~82 dedicated Tier1 controllers' list endpoints (Tier2's generic grid has opt-in pagination as of V141; dedicated pages don't yet).
- `<AuditInfo>` footer not yet on all 69 candidate pages (55/69 as of the last count).
- `FieldHint` missing on ~8 voyage-ops/logistics pages.
- Sidebar (`AppShell.tsx`) IA is comparatively under-built vs. this app's own better density patterns elsewhere.

See `ETRM_Project_Handoff_v1_0.md` §0 for the current, authoritative state of each — this list can drift; that doc is kept current every session.

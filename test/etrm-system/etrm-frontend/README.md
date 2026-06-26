# ETRM Frontend

React 18 + TypeScript scaffold for the ETRM master data / trade / position frontend.
No feature screens yet — this is foundation only (per the build plan): config,
folder structure, design tokens, app shell, routing skeleton.

## Stack

| Layer | Choice |
|---|---|
| Build tool | Vite 8 (Rolldown-based) |
| Framework | React 18 + TypeScript 6 |
| UI library | Ant Design 5.x |
| Data grid | AG Grid (Community), current Theming API (v33+) |
| Server state | TanStack Query (React Query) v5 |
| Client/UI state | Zustand |
| HTTP | Axios, single configured instance |
| Routing | React Router v7 |
| Fonts | IBM Plex Sans / IBM Plex Mono, self-hosted via `@fontsource` (no external CDN) |

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173 — proxies /api/v1 to localhost:8080
npm run build      # type-checks (tsc -b) then builds to dist/
npm run lint
npm run format
```

The dev server proxies `/api/v1/*` to `http://localhost:8080` (the Spring Boot
backend) — see `vite.config.ts`. Change the proxy target there if the backend
runs elsewhere.

## Folder structure

```
src/
  app/            App-level wiring: providers, router. Not feature code.
  components/
    layout/       Shared chrome: AppShell (header/sidebar/content), PageHeader.
  features/
    tier1/        Custom screens, one per core entity (legal_entity, counterparty, ...).
    tier2/        The generic metadata-driven reference-data screen + its hooks.
  pages/          Top-level routed pages that aren't a "feature" (Dashboard, 404).
  services/       API clients. api.ts is the single Axios instance everything uses.
  store/          Zustand stores. UI/client state ONLY — server data goes through
                   React Query, never Zustand. Keeping that line firm matters as
                   more screens get added.
  theme/          tokens.ts (raw design tokens) -> antd-theme.ts / ag-grid-theme.ts
                   (framework-specific mappings). Components should never hardcode
                   a hex value; pull from here.
  types/          Shared TypeScript types used across features.
  utils/          Pure helper functions.
```

Path aliases (`@/`, `@app/`, `@components/`, `@features/`, `@pages/`,
`@services/`, `@store/`, `@theme/`, `@models/`, `@utils/`) are configured in
both `tsconfig.app.json` and `vite.config.ts` — keep them in sync if either
changes.

## Design tokens

`src/theme/tokens.ts` is the single source of truth for color, type, spacing.
The palette carries forward the identity already established in the project's
schema reference documents — navy/blue primary, teal for Tier 2 reference
data, violet for Tier 1 core entities — so the docs and the live app read as
one product.

The one signature device in the UI is the **module color rail**: a thin
colored left border on page headers (see `PageHeader.tsx`), colored by
`moduleGroup`. With 135 master data tables split across many modules, this
gives a constant, low-effort visual answer to "which part of the system am I
in," the same job color already does across the schema docs.

Typography is IBM Plex Sans (body/UI) + IBM Plex Mono (numeric/ID columns,
via the `.cell-mono` / `.text-mono` utility classes in `index.css`) — chosen
for genuine tabular lining figures (grid alignment matters a lot in this
app) and because it reads as deliberately technical/engineering rather than
the generic Inter-everywhere SaaS look.

## What's built

**Counterparties** (`/tier1/counterparty`) — this is the "associated data added
immediately" pattern from the original prototype, rebuilt properly:
- Full-page tabbed form (Core, Credit & KYC, Contacts, Bank Accounts,
  Addresses) — not a cramped drawer, since there's real depth here
- Contacts/bank accounts/addresses are added, edited, and removed **inline**,
  with zero network calls per row — they're staged in local state via one
  reusable `<ChildRecordSection>` component (used three times, not
  copy-pasted three times) and only flushed to the API as a batch when you
  click the single **Save Counterparty** button at the top
- That flush respects the real nested REST contract underneath
  (`POST/PUT /counterparties/{id}/contacts`, `/bank-accounts`, `/addresses`)
  — the parent saves first to get a real id, then every staged child gets
  created or updated against that id, matching exactly what the original
  prototype's documented endpoints expected
- Soft-remove for children too: removing an already-saved contact flags
  `isActive: false` and persists that on save; removing a never-saved
  (still-staged) one just drops it from the array — nothing to deactivate
  server-side
- KYC status filter on the list page (Pending/Approved/Review/
  Suspended/Rejected), matching the original prototype
- The Counterparty form's "Internal Legal Entity" picker (shown when
  "Intercompany" is toggled on) pulls live from `useLegalEntities()` —
  reusing the Legal Entity feature built earlier rather than duplicating it

`credit_rating_id`, `currency_id` (on bank accounts and counterparty default
currency) are genuine FKs to surrogate integer keys, not codes — there's no
live Tier 2 endpoint yet to look those up from, so `staticLookups.ts` holds
a small hardcoded placeholder list, clearly commented as temporary. Replace
with a real reference-data call once Tier 2 exists.

### API Activity Log

A header icon (badge shows total calls this session) opens a right-side
drawer listing every request made through `services/api.ts` — method,
endpoint, status, duration, and an expandable row showing the actual
request/response JSON. This captures real network traffic via Axios
interceptors (`services/api.ts`), not a simulated log — it works identically
whether you're hitting the MSW mock backend or a real Spring Boot instance,
which makes it genuinely useful for verifying the mock/real backend swap
behaves as expected. Capped at 100 entries (oldest dropped).

### Dark mode

Toggle in the header (sun/moon icon), persisted to `localStorage` so it
survives a reload. `theme/tokens.ts` holds both palettes (`color` / `darkColor`)
as the single source of truth; `theme/antd-theme.ts` and `theme/ag-grid-theme.ts`
are both mode-aware builder *functions* now (`buildAntdTheme(mode)`,
`buildAgGridTheme(mode)`), not static exports — every screen using AG Grid
needs `const gridTheme = useMemo(() => buildAgGridTheme(mode), [mode])`
rather than importing a static theme object. AG Grid's dark mode composes
the official `colorSchemeDark` part as a base rather than hand-tuning every
dark grid color independently. A `data-theme` attribute on `<html>` (set in
`AppProviders.tsx`) drives the handful of things that live outside antd's
theming system, like the API log's JSON code block background
(`--etrm-code-bg` in `index.css`).

### Mock backend (no Spring Boot required yet)

`src/mocks/` uses MSW (Mock Service Worker) to intercept `/api/v1/legal-entities/*`
and `/api/v1/counterparties/*` (including the nested children endpoints)
and serve them from in-memory stores, seeded with sample data — 3 legal
entities, 2 counterparties each with contacts/bank accounts/addresses.
This is **on by default in dev** (`VITE_USE_MOCKS=true` in `.env.development`)
so the app is fully clickable without any backend running. It intercepts at
the network level — `services/api.ts` and the feature code don't know or
care that the backend is mocked.

**Once the real Spring Boot API exists**, set `VITE_USE_MOCKS=false` (or
delete `.env.development`) and nothing else needs to change, as long as the
backend matches the contract in `src/features/tier1/legal-entity/api.ts`
(standard CRUD + a `/bulk` endpoint + RFC 7807 error bodies).

### Parent Company Guarantees (PCG)

A "Guarantees" tab on both the Counterparty form and the Legal Entity
drawer, backed by `features/tier1/guarantee/`. Models the real two-way
nature of PCGs rather than assuming a counterparty's parent is always the
guarantor:

- **RECEIVED** — a counterparty's parent (itself a counterparty in the
  system) guarantees that counterparty's obligations to us.
  `principal = COUNTERPARTY`, `guarantor = COUNTERPARTY`, `beneficiary = LEGAL_ENTITY`
- **ISSUED** — we (the booking company) guarantee one of our own entities'
  obligations to a counterparty, extending them credit support.
  `principal = LEGAL_ENTITY`, `guarantor = LEGAL_ENTITY`, `beneficiary = COUNTERPARTY`

`direction` is stored explicitly (not inferred from the role types) so
unusual combinations — cross-guarantees within a group, for instance —
aren't hard-blocked; it only drives the form's sensible defaults. Each of
the three roles (guarantor/principal/beneficiary) is independently a
Legal Entity or a Counterparty via a `Segmented` toggle, matching the DB's
three-times-polymorphic design (`ETRM_Parent_Company_Guarantee_Patch_v1_0.sql`).
One guarantor can back many principals at different amounts — there's no
uniqueness constraint forcing one PCG per guarantor.

`EntityGuaranteesPanel` is the one shared component embedded in both forms
— it takes `entityType`/`entityId`/`defaultRole` and fetches every PCG
where that entity appears in *any* of the three roles
(`useGuaranteesForEntity`), so a counterparty's Guarantees tab shows both
guarantees backing it and (if applicable) guarantees it has itself issued
to others.



- No other Tier 1 entity screens (counterparty, trader, book, product, ...).
- No Tier 2 generic reference-data screen / `master_data_table_registry` API.
- No auth — the token-attaching interceptor in `services/api.ts` is wired
  but nothing populates `sessionStorage` yet.
- No permission/role enforcement — explicitly deferred per the Master Data
  Entry Technical Design doc, Section 6.
- No tests.

## Notes on tooling versions

Dependency versions were resolved to latest-compatible at scaffold time
(June 2026) rather than pinned to older known-good versions, per the stated
stack (React 18.x, Ant Design 5.x specifically pinned — npm resolved Ant
Design 6.x by default and was downgraded back to 5.x to match). Vite 8 uses
Rolldown (Rust-based) instead of classic Rollup; `vite.config.ts`'s
`manualChunks` uses the function form rather than the object-record form for
compatibility with this version.

The npm `xlsx` (SheetJS) package has an unpatched high-severity vulnerability
(prototype pollution + ReDoS) — `exceljs` is used instead for Excel
read/write. `exceljs` itself pulled in a vulnerable `uuid` transitive
dependency; pinned to a patched version via `overrides` in `package.json`
rather than downgrading `exceljs`. `npm audit` is clean (0 vulnerabilities).

AG Grid registers `AllCommunityModule` (every Community-tier feature) for
now, in `src/theme/ag-grid-setup.ts` — narrow this to only the specific
modules in use once there are enough real grids to know the footprint cost
is worth trimming. Heavy per-feature dependencies (`exceljs`, ~1MB) are kept
out of the main bundle via `React.lazy` route-level code-splitting — see
`AppRouter.tsx` — so visiting `/` doesn't download Excel-handling code that
only the legal-entity screen needs.


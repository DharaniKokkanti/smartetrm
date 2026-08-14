# SmartETRM Master / Reference / Static Data Architecture

> **Persona for this doc:** You are a senior ETRM systems architect responsible for master-data governance across a multi-commodity trading platform — table design, CRUD delivery mechanism, provenance/audit, and entitlement. Apply that expertise to every new master-data or static-data table added to this platform.

**Status: describes the real, currently-built architecture** (distinct from [`event-architecture-plan/`](event-architecture-plan/), which is the *planned*, not-yet-built event/streaming layer sitting on top of this data). Everything below exists in the codebase today. For the session-by-session history of how each piece was introduced or fixed, see [`ETRM_Project_Handoff_v1_0.md`](ETRM_Project_Handoff_v1_0.md) §0 — this doc is the consolidated reference, the handoff doc is the detailed build log.

## 1. The three delivery tiers

Every non-transactional table in the platform is delivered through exactly one of three mechanisms. Which one a table uses is a build-cost/business-logic tradeoff, not a data-modeling distinction — the same table could theoretically be served by any of the three.

| Tier | What it is | How many tables | When it's used |
|---|---|---|---|
| **Tier 1 — dedicated** | Real JPA `@Entity` + `@Repository` + `@Service` + `@RestController`, own REST resource, own frontend feature folder/page | ~158 | Table needs real business logic: FK resolution from a human-readable code, cross-table validation, sub-resources, cascade behavior, bespoke UI (e.g. `Location`, `Book`, `Counterparty`, `LegalEntity`, `Broker`, `Vessel`) |
| **Tier 2 — generic registry-driven CRUD** | One shared backend engine + one shared frontend grid, driven entirely by a row in `dbo.master_data_table_registry` | ~294 | Table is a flat code/lookup list with no special behavior — plain columns, simple validation, no bespoke workflow |
| **Lookup values** | A single physical table, `dbo.lookup_value` (`category`/`code`/`display_name`/`sort_order`/`is_active`), holding many small enum-like code lists distinguished by `category` | dozens of logical lists in one table | Smallest, cheapest form of Tier 2 — a value set too small/simple to deserve its own physical table (e.g. `base_date_event_type`, `gas_day_type`, `power_load_type`) |

**Nothing enforces which tier a new table should use** — it's a judgment call made per-table (see §6). A table can also *start* Tier 2 and be promoted to Tier 1 later once it needs real logic (this has happened repeatedly — see the handoff doc's `license_registration`, `ticker_mapping` entries).

### Tier 1 — dedicated entities

Standard shape (see `Location.java`, `LocationRoleAssignment.java` for a canonical recent example):
- JPA entity with `@Id`/`@GeneratedValue(IDENTITY)`, `@Version rowVersion`, governance columns (§3)
- FK columns resolved server-side from a companion `@Transient @JsonProperty` code field (e.g. `locationTypeCode` → `locationTypeId` via a `resolveForeignKeys()` step in the service) — **the FK id column itself must never be `@NotNull`** when it's populated this way, because Bean Validation on the raw `@RequestBody` runs before that resolution/assignment. This exact bug class has recurred (`Location.locationTypeId`, `LocationRoleAssignment.locationId`) — the DB's own `NOT NULL` constraint is the real backstop, not the entity annotation.
- Dedicated `Repository`/`Service`/`Controller`, own REST path (`/api/v1/<resource>`), sub-resources as nested paths (`/api/v1/locations/{id}/roles`) mirroring `ClearingAccountController`'s `/{id}/bank-accounts` precedent
- Dedicated frontend feature folder (`features/<domain>/<table>/`: `types.ts`, `api.ts`, `hooks.ts`, `<Table>Page.tsx`), reached via a direct sidebar link or through the Master Data Hub

### Tier 2 — generic registry-driven CRUD

One backend engine serves every registered table dynamically:
- `MasterDataTableRegistryRepository` — reads `dbo.master_data_table_registry`; a table name not found there (or `is_enabled = 0`) 404s **before any SQL is built** — this is what makes it safe for the next layer to build dynamic SQL from a path variable
- `ReferenceDataMetadataService` — introspects the live SQL Server schema (`sys.columns`) for a table to drive auto-generated form fields and to know which optional columns (governance, `row_version`) actually exist
- `ReferenceDataCrudService` — raw-JDBC generic CRUD (`listRows`/`listRowsPaged`/`createRow`/`updateRow`/`deleteRow`), building SQL from the introspected column set; only stamps `created_by`/`updated_by`/`created_src_id`/`updated_src_id`/`row_version = row_version + 1` when the table actually has those columns
- `ReferenceDataController` — `/api/v1/reference-data/{table}` REST surface, path/verb shape kept in sync with `etrm-frontend/src/features/tier2/api.ts`

One frontend engine consumes it: `ReferenceDataTable.tsx` (the generic grid, driven by the same metadata) + `Tier2HomePage` at `/static-data/{table}` + `useTableRows(table)` hook for any form elsewhere that needs the table's rows as dropdown options.

**Adding a Tier 2 table needs zero dedicated Java or TypeScript** — just a `master_data_table_registry` row (plus a matching mock seed when mocks are in use). See §7 for the full checklist, including the dual-catalog gotcha.

### Lookup values

`dbo.lookup_value` is itself one Tier 2 table, but logically holds many independent value sets via its `category` column. Wired into the Static Data UI through a `PARENT_LOOKUP_TABLES` entry in `referenceData.ts`, resolved by `LookupResolutionService` on the backend. Use this instead of a new physical table when the value set is small, flat, and unlikely to ever need its own extra columns.

**Columns are fixed**: `(lookup_id, category, code, display_name, sort_order, is_active, notes)` (defined in migration 01) — never assume a `table_name`/`type_code`/`type_name`/`description` shape; that bug (V36/V37/V38/V44/V46) was fixed in place 2026-07-03. Guards use `WHERE category = '...'`.

## 2. The registry: `dbo.master_data_table_registry`

Drives the entire Tier 2 mechanism and doubles as a whole-schema governance catalog.

Key columns:
- `table_name` (unique), `display_name`, `module_group` (sidebar/Hub grouping)
- `allow_create`/`allow_edit`/`allow_delete` (delete defaults **off** — most reference tables should deactivate via `is_active`, not hard-delete), `allow_excel_upload`
- `is_enabled` — hides a table from the Static Data screen **without dropping the registry row**; used both for "not built yet" placeholders and for tables that are deliberately never end-user-editable
- `data_category` (V143) — `MASTER_CONFIG` / `MASTER_DATA` / `TRANSACTIONAL` / `DERIVED`, a whole-schema classification independent of whether the table is actually Tier 2-served
- `display_order`, `notes`

**Catalog-only rows exist for Tier 1 tables too.** V143 backfilled `is_enabled = 0`, all-CRUD-flags-`0` registry rows for ~186 dedicated tables that have real Tier 1 controllers and were never meant to be Static-Data-editable — purely so governance queries (`row_version`/audit-column sweeps, `data_category` audits) can run one query across *every* table in the schema, Tier 1 and Tier 2 alike, instead of needing a separate code-grep pass for Tier 1. **`is_enabled = 0` therefore does not mean "not built"** — check whether a dedicated controller exists before assuming a disabled registry row is a genuine gap.

**SYSTEM-locked tables** (V157): 51 tables have `allow_create/edit/delete = 0` deliberately — ISO codes, internal enum vocabulary, externally-standardized registries that a regular master-data editor should never be able to mutate through the generic grid.

## 3. Governance columns (every table, both tiers)

Every table reachable/editable via either tier — Tier 1 dedicated or Tier 2 generic — carries:
- `row_version INT NOT NULL DEFAULT 0` (or `BIGINT` for genuinely high-write-frequency tables — confirmed per-table, not assumed) — optimistic locking
- `created_at` / `created_by` / `updated_at` / `updated_by` — the standard 4-column audit shape
- `created_src_id` / `updated_src_id` (`SMALLINT`, FK to `dbo.source_system`) — provenance: which channel wrote/last-touched the row (§4)

**Enforcement, not just convention**: every `row_version`-bearing table gets a `trg_<table>_row_version_guard` AFTER UPDATE trigger (the V153 pattern, no exceptions for new tables) that `ROLLBACK`s and `RAISERROR`s if an `UPDATE` didn't include `row_version` in its `SET` list (bypass-write rejection) or reused/went-backward on the version number (stale-write rejection). This closes the gap where direct SQL — outside the Java service layer entirely — could silently corrupt optimistic-locking state.

Both tiers enforce optimistic locking on save: Tier 1 via JPA `@Version`, Tier 2 via `ReferenceDataCrudService`'s explicit `WHERE row_version = ?` check on `updateRow`, returning a 409 the frontend renders via the shared `optimisticLock.tsx` persistent notification (never a generic toast).

**Verification method matters**: governance-column gaps have repeatedly been undercounted by code-grep audits (Tier 2-only tables have no Java entity to grep) — the reliable check is a direct `sys.columns` query cross-referenced against `master_data_table_registry`, not a search over `.java` files.

## 4. Provenance: `dbo.source_system`

`dbo.source_system` (`source_system_id` TINYINT PK, `source_code`, `source_name`, `category` — `UI_SCREEN`/`BULK_LOAD`/`EXTERNAL_API`/`EXCHANGE_FEED`/`SYSTEM`) is the lookup every table's `created_src_id`/`updated_src_id` points at. Every Tier 1 entity and every Tier 2 table across the schema (454 tables total) stamps these on write — Tier 1 via `SourceSystemDefaults` helper methods called from `@PrePersist`/`@PreUpdate`, Tier 2 via the same introspect-then-populate approach used for the rest of the governance columns.

Currently two interim "bucket" rows cover broad swaths pending finer granularity: `STATIC_DATA_ADMIN` (all ~294 Tier 2 screens share one value) and `TIER1_APPLICATION_SCREEN` (all Tier 1 JPA modules share one value). Per-screen granularity is a known, deliberately deferred future refinement, not an oversight.

Deliberately separate from `dbo.external_system` — that table is an ID-mapping crosswalk to outside systems, a different concern from "which internal channel wrote this row."

## 5. Entitlement / RBAC

Every controller — Tier 1 and Tier 2 alike — is gated by `SecurityConfig` + `UserPermissionService`, which loads a user's real `role_function` grants as Spring Security authorities per request: `GET` requires the module's `_VIEW` grant, mutations require the specific `_CREATE`/`_EDIT`/`_DELETE` grant. Frontend RBAC-aware rendering (hiding buttons a user can't use) must mirror these real backend grants — a hidden-but-still-callable action is not real enforcement, only cosmetic.

## 6. Choosing a tier for a new table

- **Default to Tier 2** if the table is a flat code list with simple validation and no cross-table business logic — it's zero incremental backend/frontend code.
- **Use lookup_value** instead of a new Tier 2 physical table if the value set is small and unlikely to grow extra columns.
- **Go Tier 1** as soon as any of these apply: the table needs FK resolution from a human-entered code, cross-table validation beyond a CHECK constraint, sub-resources (a child collection hanging off the record, e.g. `location_role_assignment` off `Location`), bespoke workflow/UI, or optimistic-lock semantics beyond the generic engine's.
- **Prefer additive over remodeling** when extending an existing entity's data model (e.g. V216's `location_role_assignment`: a new junction table layered on top of `location.location_type_id`, rather than moving `location_type_id` itself into a multi-row shape) — keeps blast radius to zero for every existing FK consumer, filter, and dropdown built against the original column.

## 7. Checklist — adding a new table

**Tier 2:**
1. **Physical table name carries its category prefix** (`mst_`/`ref_`/`tran_`/`usr_` — see §8) — decide the category *before* writing DDL, not after.
2. `master_data_table_registry` row (SQL) — `table_name` (prefixed), `display_name`, `module_group`, `data_category`, CRUD flags, `is_enabled = 1`
3. Governance columns on the physical table: `row_version` + 4 audit columns + `created_src_id`/`updated_src_id` + the V153 guard trigger
4. Matching mock seed (`registrySeed`/`metadataSeed`/`rowSeed` in `referenceData.ts`) if the frontend still runs against MSW mocks for this table
5. **A `MasterDataHub.tsx` `Entry`** — the registry row alone only makes the table reachable via `/static-data/{table}` (the generic sidebar); `/master-data` (the Hub landing page most users actually browse from) is a **second, independently-maintained hardcoded catalog**. This exact miss has recurred more than once — verify by clicking through the real navigation path, not by hitting the known-correct URL directly.

**Tier 1:**
1. **Physical table name carries its category prefix** (`mst_`/`ref_`/`tran_`/`usr_` — see §8), matched in the entity's `@Table(name = ...)` from the start.
2. Migration with governance columns + guard trigger from the start
3. Entity (governance columns, `SourceSystemDefaults` stamping, FK-code `@Transient` fields not `@NotNull` on their resolved id column), Repository, Service, Controller
4. Frontend feature folder + page, reached via sidebar or Hub
5. RBAC grants if the module doesn't already have applicable `_VIEW`/`_CREATE`/`_EDIT`/`_DELETE` function codes
6. A catalog-only `master_data_table_registry` row (`is_enabled = 0`, all CRUD flags `0`) so whole-schema governance sweeps can still find it

## 8. Table naming convention: `mst_` / `ref_` / `tran_` / `usr_` prefixes

**Standing rule, no exceptions: every table's physical name carries a category prefix, decided before the DDL is written.** Introduced 2026-08-14 (Dharani) after a live audit found `master_data_table_registry.module_group` — the *metadata* record of what category a table belongs to — silently wrong for 26 tables (23 Trade Capture tables, plus `product`/`market`/`legal_entity`, all mistagged under a generic "Organization & Users" catch-all since whenever they were first registered, unnoticed until this session). A registry row can drift out of sync with reality and nobody sees it happen. A table's own physical name cannot — it's in every migration file, every `@Table` annotation, every `sys.tables` listing, forever. The prefix makes the category self-evident to a human *or a model* reading the schema cold, with no extra lookup and no risk of trusting a stale row.

That last part matters specifically for AI/agent tooling (MCP servers, text-to-SQL, any LLM given schema access): an agent reasoning from `tran_trade` vs `ref_counterparty` vs `mst_currency` gets the mutability/governance category for free from the one thing it's guaranteed to see — the table name — rather than needing to correctly join a side table that has already proven it can be wrong. It's the same "explicit, inspectable rule" principle already stated in `event-architecture-plan/architecture/04-ai-governance.md`'s transparency row, applied one level lower, directly in the schema.

| Prefix | Category | Who writes it | Concrete criterion | Examples |
|---|---|---|---|---|
| **`mst_`** | Master data | Only the vendor (platform team) — **not** end business users, and not even a client-side super admin/System Administrator role | System-controlled code lists and enum vocabulary the rest of the schema's CHECK constraints/business logic assume are fixed. Concretely: the existing "SYSTEM-locked" set (§2, V157) — `allow_create/edit/delete = 0` — is the candidate list. **Known enforcement gap (2026-08-14, flagged not yet fixed)**: `ReferenceDataTable.tsx` currently does `canCreate = table.allowCreate \|\| isSystemAdmin` (same for edit/delete) — any client-side `isSystemAdmin` user can bypass the `allow_create/edit/delete=0` lock today via the "Admin override" UI affordance. The DB-level naming/registry is correct; app-level enforcement doesn't yet match "vendor-only, never a client admin" — needs a distinct vendor-only flag, separate from client `isSystemAdmin`, before this criterion is actually enforced end-to-end. | ISO codes, internal enum vocabulary, externally-standardized registries |
| **`ref_`** | Reference data | Business users, through normal app workflows | Descriptive data about real business entities — populated as the business operates (onboarding a counterparty, adding a product), not fixed at build time. | `ref_counterparty`, `ref_product`, `ref_market`, `ref_legal_entity`, `ref_commodity`, and everything renamed in the 2026-08-14 session (see handoff doc §0) |
| **`tran_`** | Transaction data | The application, as a side effect of real business events | Actual business events — trades, and eventually positions/P&L/pricing/costs as those get built. Unbounded growth, different retention/archival/audit needs than either of the above. | `tran_trade`, `tran_trade_order`, `tran_trade_item`, and every commodity-detail/order-support table under it |
| **`usr_`** | System users / security / admin infrastructure | The platform itself (auth, RBAC, audit machinery) | **Narrower than "anything RBAC touches."** Only tables that *are* user/permission data — accounts, role definitions, role-to-user assignment, permission grants, the user audit trail. **Not** tables RBAC merely *references* (a catalog of permissionable functions/modules, a UI field registry, generic data-provenance/integration/config registries, the platform-wide table governance catalog) — those stay unprefixed pending their own real classification, not defaulted into `usr_` just because they shared a registry bucket with real user tables (V233 initially over-scoped to 18, corrected to 9 in V234 — see handoff doc §0 for the full before/after). | `usr_app_user`(+history), `usr_user_role`, `usr_user_role_assignment`, `usr_role_function`, `usr_field_permission_profile`, `usr_field_permission_rule`, `usr_role_field_profile`, `usr_user_audit_log` (done, V233/V234). Explicitly **not** `usr_`: `app_function`/`app_module`/`screen_field_registry` (permissionable-thing catalogs, not user data), `object_lock_rule` (workflow governance), `master_data_table_registry` (whole-platform governance catalog), `source_system`/`external_system`(+mapping)/`system_config` (provenance/integration/config registries) — all reverted to unprefixed in V234, still pending real classification. |

**Status as of 2026-08-14**: `tran_` done for 28 tables (25 Trade Capture, V221; `rin_transaction`, V228; `pricing_dispute`/`pricing_event`, V235). `ref_` done for 116 tables: 71 from earlier batches, plus Pricing & Rates (14, V235, including the temporal `pricing_rule`+history pair), Power & Energy (11, V236, 2 reclassified up from an initial mst_ guess after checking real FK consumption by `tran_trade_power_detail`/`tran_trade_transmission_right_detail`), and 4 of 5 confirmed market/pricing leftovers (V237 — `market_product`'s registry row is orphaned, no physical table exists, left untouched). Includes the platform's 4 most-referenced entities (`product`: 38 incoming FKs, `counterparty`/`legal_entity`: 34 each, `market`: 8) and `holiday_calendar`/`period` (25 combined incoming FKs). `mst_` — 32 tables total (24 from V227-V232, plus `pricing_type`/`pricing_window_rule` from V235 and 3 Power & Energy tables from V236). `usr_` — 9 tables (V233/V234). **Classification method refined in V235/V236**: raw `allow_create/edit=0` is no longer taken as sufficient evidence for `mst_` on its own — checked first whether a table has a real dedicated Tier1 page with working create/edit endpoints (registry flag can be stale, e.g. `pricing_rule`/`ticker_mapping`/`formula_template`/`option_index_link`/`volatility_point` all had `allow=0` but real POST/PUT), and whether it's directly FK'd by a `tran_*` transaction-capture table (e.g. `balancing_authority`/`transmission_right_type`) — either signal overrides a stale lock flag toward `ref_`. `dbo.trade_repository` (Sanctions & Regulatory Reporting) and `market_product` (orphaned registry row, no physical table) remain deliberately unprefixed. See `ETRM_Project_Handoff_v1_0.md` §0 for the live batch-by-batch tracker and exact pending table lists (~250 tables remain across the untouched module_groups, plus the 9 reverted-pending-classification tables from V234 and the rest of "Organization & Users").

**Renaming a live table's real mechanics** (established across the 2026-08-14 batches, reusable for every future batch):
- `sp_rename` is safe for FKs (they bind by `object_id`, not name) — but check for **native/raw SQL** referencing the old name first. **`grep -rl nativeQuery` is not enough** — plain `JdbcTemplate` calls with a hardcoded `"...FROM dbo.tablename..."` string (no `@Query`/`nativeQuery` annotation at all) are invisible to that grep and will crash the app at bean-construction time (found live in V233: `SourceSystemDefaults`, `UserPermissionService`, `AuditLogService`, `ReferenceDataCrudService` all had raw JdbcTemplate SQL against renamed tables). The reliable sweep is `grep -rn "FROM dbo\.\|INTO dbo\.\|UPDATE dbo\.\|JOIN dbo\."` across the whole backend — broader than nativeQuery, and it also caught a real, silent, since-V225 bug unrelated to this batch (`MarginOffsetRuleService` still querying `dbo.market`, renamed to `ref_market` weeks earlier, never exercised by any prior verification pass).
- System-versioned temporal tables (`counterparty`, `legal_entity`, `trade`, `trade_pricing_schedule`, and 3 more per V200) need `SYSTEM_VERSIONING = OFF` → rename both main and history table → `SYSTEM_VERSIONING = ON (HISTORY_TABLE = ...)` re-link.
- `ReferenceDataMetadataService`'s FK-target resolution is fully dynamic (`sys.foreign_keys`-driven) — renaming a table other tables FK into needs **zero backend code changes**, the metadata just resolves correctly on the next request.
- The one place that *isn't* dynamic: `ReferenceDataTable.tsx`'s `DEDICATED_ENTITY_FK_TABLES` escape-hatch set + `dedicatedEntityFkOptions` map hardcode table names as literal keys, for the ~10 dedicated (Tier 1) entities that back a generic Tier 2 table's FK dropdown. Check this file specifically whenever renaming a table in that set (`counterparty`, `product`, `legal_entity`, `location`, `storage_facility`, `vessel`, `exchange`, `payment_term`, `transport_route`, `market_product_link`, `unit_of_measure`, `holiday_calendar`).
- Grep both the live frontend (`grep -rn "'tablename'" src --exclude-dir=mocks`) and `mocks/referenceData.ts` for every FK-target literal (`col(..., 'tablename')`) — Tier 2 forms carry the target table as a plain string, not a dynamic lookup, on both the mock and the metadata-driven live path's escape hatches.
- **Verify front-to-back, not just curl/boot**: `npx tsc -b`, then drive the actual page in a browser (Playwright against the real, non-mocked dev server if one's running) — a clean Hibernate boot and a `200` from curl only prove the API layer is internally consistent, not that the page a user actually clicks into still renders real data. This caught nothing wrong in the 2026-08-14 batches, but the check itself is the point, not the result.

## 9. Known, tracked gaps

- No backend pagination on ~82 dedicated Tier 1 controllers' list endpoints (Tier 2's generic grid has opt-in pagination as of V141).
- `TIER1_APPLICATION_SCREEN`/`STATIC_DATA_ADMIN` source-system granularity is bucket-level, not per-screen.
- `country`/`unit_of_measure`/`exchange`/`mst_holiday_calendar`/`payment_term` are dedicated Tier 1 controllers not gated through the registry-driven lock mechanism the rest of Tier 2 gets.
- `ref_legal_entity_history`'s `module_group` was corrected in V226 (Counterparties & Agreements, matching `legal_entity` itself) — resolved, kept here as the record of what was fixed.
- `ref_pipeline_product_approval` is tagged `data_category = TRANSACTIONAL` (an approval workflow, not really reference data) but got the `ref_` prefix anyway in V225 for consistency with the batch it shipped in — candidate to move to `tran_` in a future pass instead.
- `dbo.trade_repository` (Sanctions & Regulatory Reporting) has no category prefix at all — deliberately excluded from both the V221 Trade Capture batch and the V227 batch that covered the rest of its module_group, per explicit instruction; still needs a final decision on where it belongs.
- **`market_product`'s registry row is orphaned** — `master_data_table_registry` has a `market_product` row (`module_group='Organization & Users'`, `is_enabled=0`) but no physical `dbo.market_product` table exists (only `market_product_link` does; confirmed via `sys.tables`). Found when V237 failed on `sp_rename` against a nonexistent table. `is_enabled=0` so it's not live in any UI — not urgent, but the row should either be repointed at `market_product_link` or deleted, not left dangling.
- **`mst_` is not actually vendor-only enforced yet** — the DB naming/registry criterion is right (`allow_create/edit/delete=0`), but `ReferenceDataTable.tsx`'s `isSystemAdmin` override lets any client-side System Administrator bypass it in the live UI today. Needs a real vendor-only flag distinct from client `isSystemAdmin` before "only the vendor can touch `mst_`" is actually true end-to-end, not just documented as intent.
- 9 tables reverted to unprefixed by V234 after being incorrectly swept into `usr_` by V233 (`master_data_table_registry`, `source_system`, `external_system`, `external_system_mapping`, `system_config`, `app_function`, `app_module`, `screen_field_registry`, `object_lock_rule`) — still need their own real classification, not yet decided.

See `ETRM_Project_Handoff_v1_0.md` §0 for the current, authoritative state of each — this list can drift; that doc is kept current every session.

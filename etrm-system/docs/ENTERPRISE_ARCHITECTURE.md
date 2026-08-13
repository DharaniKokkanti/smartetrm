# SmartETRM Enterprise Architecture

> **Persona for this doc:** You are a senior enterprise architect applying a TOGAF-style layered framework (Business / Application / Data / Technology / Integration / Security / Governance / Roadmap) to a multi-commodity ETRM platform. Each section below states what SmartETRM actually has today, grounded in real code/schema, and what is explicitly planned-but-not-built — never blur the two.

**Status: a mix.** Most of this doc describes the real, currently-built system. Anywhere a capability is planned rather than built, it's labeled **PLANNED** and points at the doc that owns that plan ([`event-architecture-plan/`](event-architecture-plan/) for the event/streaming layer, the handoff doc's Implementation Phases for the quant engine). Companion docs, each the deeper reference for its own slice:
- [`ETRM_Project_Handoff_v1_0.md`](ETRM_Project_Handoff_v1_0.md) — the authoritative build log, session-by-session, and current migration frontier (§0)
- [`GUI_ARCHITECTURE.md`](GUI_ARCHITECTURE.md) — frontend conventions in depth
- [`MASTER_DATA_ARCHITECTURE.md`](MASTER_DATA_ARCHITECTURE.md) — the Tier 1/Tier 2/lookup-value data-delivery model in depth (this doc's Data Architecture section summarizes and points here)
- [`event-architecture-plan/`](event-architecture-plan/) — the planned event/outbox/streaming layer (not built), including its own `architecture/decisions/` ADR folder

---

## 1. Business Architecture

**Business capability map** — the platform is organized around these technology-agnostic capabilities, each with a real slice of the codebase behind it:

| Capability | What it does | Where it lives today |
|---|---|---|
| Deal/Trade Capture | Record physical and financial deals across oil, gas/power, LNG, metals, agri, freight | `trade`, `trade_order`, `trade_item` three-tier hierarchy + per-commodity detail tables (`trade_oil_detail`, `trade_swap_detail`, `trade_storage_agreement_detail`, `trade_transport_agreement_detail`, ...) |
| Master/Reference Data | Establish the shared vocabulary every trade references — counterparties, products, locations, currencies, calendars | Tier 1/Tier 2 architecture, see [`MASTER_DATA_ARCHITECTURE.md`](MASTER_DATA_ARCHITECTURE.md) |
| Credit & Risk | Counterparty credit limits, exposure tracking, margin/collateral | `credit_limit`, `margin_account`, `margin_call`, clearing-account family (V202-V211) |
| Logistics/Scheduling | Ports, pipelines, storage, vessels, voyages, nominations | `location`, `storage_facility`, `pipeline`, voyage/charter/bunker backbone (V108-V110), `nomination`/`delivery_instruction` |
| Pricing & Curves | Price indices, forward curves, formula-driven pricing | `price_index`, `settlement_price`, `formula_template`/`formula_component`, `volatility_point` |
| Settlement | *Not yet built* — no invoicing/payment-instruction module exists in the schema today | — |
| Regulatory Reporting | *Not yet built* — no reporting-engine module exists today | — |

**Value chain position**: SmartETRM sits at **Origination → Trading → Logistics/Operations**, with **Settlement** and **Accounting** downstream and currently out of scope (no GL posting, no invoice generation — `gl_account`/`cost_center`/`profit_center` exist as chart-of-accounts master data, V142, but nothing posts to them yet). This tells you what SmartETRM must produce as output for a future/external settlement system: confirmed trade + delivery + pricing data, which is exactly what the `trade`/`trade_order`/`trade_item` + pricing tables already carry.

**Capability vs. function**: the design deliberately organizes code by capability (a `logistics` feature folder, a `credit` feature folder) rather than by org-chart role, so a future reorg (e.g. splitting the Risk desk from Middle Office) doesn't require restructuring the codebase.

**RACI / ownership — not formally documented.** Capability ownership (who's Responsible/Accountable for, e.g., cost-creation on a trade vs. on a storage agreement) is implicit in the code's module boundaries but has never been written down as an explicit matrix. **Gap.**

**Deliverables that exist**: the capability table above (informal), the module_group taxonomy in `master_data_table_registry` (a de facto capability grouping used for navigation). **Deliverables that don't**: a formal Business Capability Map artifact, Value Stream Map, BPMN process models, RACI matrix, Business Motivation Model.

---

## 2. Application (Functional) Architecture

**Application portfolio**:

| Application | Role | Status |
|---|---|---|
| `etrm-frontend` (React 18 + TS, Vite) | System of Engagement — all user interaction | Built |
| `etrm-backend` (Spring Boot 3.x) | System of Record for trade/master data; API gateway; business logic | Built |
| Python Quant Engine (FastAPI) | MTM valuation, VaR, curve building, formula pricing — internal-only, called by Spring Boot | **PLANNED, not built** — no Python source exists in the repo; endpoints are speced in the handoff doc §8 (`/internal/v1/pricing/mtm`, `/internal/v1/risk/var`, `/internal/v1/curves/build`, `/internal/v1/pricing/formula`) but unimplemented |
| SQL Server 2022 | Physical data store | Built (local dev via `docker-compose.yml`; Developer edition, explicitly not production-licensed) |
| ERP/GL, Planning, external market-data feeds, external regulatory-reporting engine | Would sit outside this platform in a real deployment | **Out of scope** — no integration exists or is planned yet; `dbo.external_system` exists as an ID-mapping crosswalk table for future use but has no live integration behind it |

**Application function decomposition (within `etrm-backend`)** — by Java package, mirroring the capability map above: `trade` (capture), `location`/`logistics` (scheduling), `credit`/`clearingaccount` (risk), `pricing`/`referencedata` (pricing & master data), `security` (auth/RBAC), `referencedata` (the generic Tier 2 engine described in `MASTER_DATA_ARCHITECTURE.md`). There is no separate Position/Exposure Engine or MTM/Valuation module yet — those are exactly the pieces the (unbuilt) Python Quant Engine is speced to own.

**System of Record**: `etrm-backend` + SQL Server is SoR for every trade, position, and master-data entity in the platform — there is no competing system (no Anaplan-style planning tool, no separate MDM hub) that could contest ownership today. This is architecturally simpler than a real trading house's landscape (where SoR disputes like Anaplan-vs-ETRM for cost data are common) precisely because SmartETRM is currently the *only* system in its own landscape — worth flagging explicitly if/when a second system (a planning tool, an external settlement engine) is ever integrated, since that's exactly when SoR needs to be decided deliberately rather than assumed.

**Application interaction/interface matrix**:

| From | To | Mechanism | Sync/Async |
|---|---|---|---|
| `etrm-frontend` | `etrm-backend` | REST/JSON over HTTPS, JWT bearer | Sync |
| `etrm-backend` | Python Quant Engine | Internal REST | **PLANNED** — sync, per handoff doc §8 |
| `etrm-backend` | SQL Server | JDBC (Hibernate for Tier 1, raw JDBC for Tier 2's generic engine) | Sync |
| `etrm-frontend` | MSW (mock service worker) | In-browser interception, dev/demo mode only | N/A (mock) |

No batch files, no message queue, no ESB anywhere in the current build — every real integration in the platform today is a direct synchronous REST/JDBC call. See §5 for what changes under the planned event layer.

---

## 3. Data Architecture

Fully covered in [`MASTER_DATA_ARCHITECTURE.md`](MASTER_DATA_ARCHITECTURE.md); summarized here for completeness against this framework.

**Conceptual → Logical → Physical**: no separate conceptual/logical model artifact exists independent of the physical schema — the physical schema (216+ Flyway migrations) *is* the model of record. This is a real gap if the platform ever needs to onboard a non-technical stakeholder or align with an external data standard before implementation; it hasn't caused a problem yet because schema changes have consistently gone through design discussion with the user before being built (see the handoff doc's repeated "design reviewed with user before building" pattern — informally serving the conceptual-model-first discipline without a dedicated artifact).

**MDM**: the Tier 1/Tier 2 registry system (`master_data_table_registry`) *is* SmartETRM's MDM mechanism — single authoritative table per master entity (Counterparty, Product, Legal Entity, Location, Book), governed centrally, with `data_category = 'MASTER_DATA'` as the formal classification (V143). There is no cross-system identity reconciliation problem yet (no DUNS-to-LEI-style mapping need) because, per §2, there's only one system of record today.

**Reference vs. Master vs. Transactional**: this exact three-way split is what `data_category` encodes (`MASTER_CONFIG`/`MASTER_DATA`/`TRANSACTIONAL`/`DERIVED`) — see `MASTER_DATA_ARCHITECTURE.md` §2.

**Data lineage/provenance**: `created_src_id`/`updated_src_id` on every table (§4 of the master-data doc) traces *which channel* wrote a row. This is channel-level provenance, not full value-level lineage (it doesn't yet answer "what upstream values produced this derived number," e.g. how an MTM figure was calculated) — that finer-grained lineage is one of the explicit open design goals of the planned event/outbox layer (`event-architecture-plan/architecture/04-ai-governance.md`'s confidence/audit-trail-in-the-event-schema idea), not yet built.

**Data lifecycle/retention**: no formal retention/archival/purge policy exists for any table. **Gap** — relevant once regulatory retention requirements (EMIR-style) are ever in scope.

**Slowly Changing Dimensions**: the platform uses **both** patterns depending on the table, deliberately:
- **Type 1 (overwrite)** is the default — most master data has no history table, an `UPDATE` simply overwrites, protected only by `row_version` optimistic locking (not history preservation).
- **Type 2 (preserve history via effective-dated rows)** appears where the business semantics genuinely need it — `location_role_assignment` (V216)'s `effective_date`/`expiry_date` per role, `ticker_mapping`'s `effective_from`/`effective_to`, `price_index`/`settlement_price`'s period-based structure. This is the same pattern as the estimated-at-booking-vs-confirmed-at-BL problem in QP/assay-style commodity data — SmartETRM already applies Type 2 wherever a value needs to be traceable to a point in time, not just its current state, but this hasn't been formalized as an explicit *rule* for when a new table should get effective-dating — currently a per-table judgment call. **Worth formalizing** if this keeps coming up.

---

## 4. Technology Architecture

**Stack**: React 18 + TypeScript/Vite (frontend), Spring Boot 3.x (backend), SQL Server 2022 (database), Python/FastAPI (quant engine, **PLANNED**).

**Deployment topology**: **local single-instance only.** `docker-compose.yml` runs SQL Server (Developer edition, dev/test license only, explicitly not production-licensed) plus a one-shot DB-init job; `start-all.sh`/`stop-all.sh` run the frontend/backend as local processes. There is no containerized backend/frontend image, no multi-region deployment, no cloud target defined anywhere in the repo. **This is the single biggest gap between "what's built" and "an actual production trading-desk deployment."**

**HA/DR**: **not designed.** No RTO/RPO target has ever been defined for this platform. Given the domain (can't lose trade data), an eventual RPO target would need to be near-zero — but this is entirely undecided today, not just unimplemented.

**IaC**: none — no Terraform/CloudFormation; `docker-compose.yml` is the only infrastructure-as-config artifact, and it's dev-only.

**Containerization**: SQL Server runs in Docker for local dev only; the Spring Boot and Vite apps run as bare local processes (`mvn spring-boot:run`, `npm run dev`), not containerized. No Kubernetes/orchestration anywhere.

**Bottom line**: SmartETRM's technology architecture today is "single-developer local stack," full stop. Every item in this section beyond that is a real, currently-undesigned gap, not a documented-but-deferred decision — worth being explicit about that distinction before anyone assumes a deployment story exists.

---

## 5. Integration Architecture

**Current state — all synchronous, all direct, no broker.** Every integration in the built system today is either a direct REST call (`etrm-frontend` ↔ `etrm-backend`) or direct JDBC (`etrm-backend` ↔ SQL Server). No ESB, no point-to-point web (only one real internal integration exists, so "spaghetti integration" isn't a risk yet), no event mesh, no Kafka.

**Idempotency**: enforced at the database level via the V153 `trg_<table>_row_version_guard` trigger pattern (rejects a write that doesn't correctly advance `row_version`) rather than via an idempotency-key/ledger pattern at the API layer. There is no `matched_bols`-style dedup ledger anywhere in this codebase yet — the closest analogue is the `nomination`/`delivery_instruction` composite-FK tables (V93), which prevent duplicate linkage via unique constraints, not an idempotency-key mechanism per se.

**API Gateway**: `etrm-backend` itself is the single entry point for all frontend traffic — `SecurityConfig` centralizes authentication/authorization for every controller, functioning as a lightweight in-process gateway. There's no separate API gateway product (Kong, AWS API Gateway) because there's only one backend service; this would need to be introduced if the backend ever splits into multiple services.

**PLANNED (not built) — the event/streaming layer**, fully speced in [`event-architecture-plan/`](event-architecture-plan/):
- **Async, event-driven integration** via a transactional outbox (`sys_event_outbox`, diffed in the Java service layer against `meta_field_change_rule`, dispatched by a polling worker to Kafka/a message broker) — see `architecture/02-event-outbox.md`
- **Message ordering / delivery guarantees** for the outbox dispatcher — not yet decided (`event-architecture-plan/tasks/open-questions.md`)
- **A UI live-streaming layer** (`sys_stream_registry` → WebSocket push → targeted React state updates) — see `architecture/03-streaming-layer.md`, with topic-level authorization, payload-contract-per-render-strategy, batching/backpressure, and reconnect/catch-up all flagged as open gaps in that plan, not yet resolved even at the design level

None of this exists in the running system today — no `meta_*` table, no `sys_event_outbox`, no `sys_stream_registry` (confirmed as of migration V151/current frontier, see `CLAUDE.md` at the repo root).

---

## 6. Security Architecture

**Authentication**: JWT-based — `JwtService` issues tokens, `JwtAuthenticationFilter` validates them per request; `SecurityConfig` wires this into Spring Security. Login is username/password against `dbo.app_user` (dev-seeded credentials documented in `dev-seed.sql`).

**Authorization**: RBAC, not ABAC. `dbo.app_function` (function codes like `TRADE_CREATE`, `MD_EDIT`) + `dbo.role_function` (grants) define what each role can do; `UserPermissionService` loads a user's grants as Spring Security authorities per request, and `SecurityConfig` gates every one of ~96 controllers by module, requiring the module's `_VIEW` grant for `GET` and the specific `_CREATE`/`_EDIT`/`_DELETE` grant for mutations (V138-V140 — this was retrofitted; earlier, RBAC was fully modeled but not enforced, every logged-in user could call any endpoint). There is no attribute-based layer on top (e.g. "this trader can only touch deals for portfolios they're assigned to") — access is role-wide, not scoped by book/desk/portfolio membership at the data-row level. **Gap**, if desk/book-level data scoping is ever required beyond `book_access_grant`'s existing (but separately-modeled, not woven into the general RBAC authority check) book-level grants.

**Segregation of Duties**: **not formally implemented.** No maker-checker/approval workflow exists for trade booking vs. settlement, or for any other capability pairing. `trade` does carry a `creditApprovalStatus` header field (credit-side gate, not a SoD workflow), and `book_access_grant`/`cp_location`'s role columns hint at access segmentation, but there is no general "the person who creates X cannot also approve X" enforcement mechanism anywhere in the platform. **Real gap** — worth flagging before this platform is treated as audit-ready for any live trading use.

**Encryption**: not audited as part of this doc — SQL Server connection config and JWT secret handling exist (`.env`-based secrets, never committed — see `.env.example`) but at-rest encryption (TDE) and in-transit TLS configuration have not been reviewed/documented here. **Needs its own pass if this becomes relevant.**

**Audit logging**: `dbo.user_audit_log` (migration 01, renamed from `audit_log` in V217) has the right shape for user-action auditing — `entity_type`/`entity_id`/`action` (CREATE/UPDATE/DELETE/APPROVE/REJECT/SUBMIT/CANCEL/AMEND/LOGIN/LOGOUT/EXPORT/VIEW_SENSITIVE/OTHER)/`user_id`/`ip_address`/`old_values`/`new_values`/`changed_fields`/`request_id`. **Now live for LOGIN/LOGOUT**: `AuthController` writes a row on every successful login and on `POST /api/v1/auth/logout` (via `AuditLogService`), including the idle-session auto-logout (client-driven, see below). The other action types (CREATE/UPDATE/DELETE/...) are still schema-only — no service writes them yet. This is distinct from data lineage (§3) — audit logging traces *user actions*, lineage traces *derived values* — lineage is still fully open.

**Session timeout**: JWTs are stateless, so there's no server-side session to expire — idle-logout is enforced client-side. `etrm.security.session-timeout-seconds` (default 120, `SESSION_TIMEOUT_SECONDS` env override) is reported in the login response and drives a frontend idle timer (`useIdleLogout.ts`, resets on mouse/keyboard/scroll activity) that calls `/auth/logout` and clears local auth state on expiry. This closes the "no SoD/session-monitoring" gap partially — logins and logouts are now attributable and timestamped — but note it's still not server-enforced: a captured JWT remains valid for its full expiry window regardless of client-side idle logout, since there is no token-revocation/blacklist mechanism. **Residual gap**, worth flagging if this platform is ever treated as audit-ready for real trading use.

---

## 7. Governance

**Architecture Review Board**: no formal ARB. In practice, every non-trivial schema/architecture change in this project has gone through an informal version of the same discipline — design proposed, researched (including real-world/vendor-pattern grounding when asked, e.g. the location-multi-role design), reviewed with the user, explicit go-ahead required before building. This has been consistent enough across sessions that it functions as governance even without a named body or a written charter.

**Architecture Decision Records**: partially present — `event-architecture-plan/architecture/decisions/` is a real ADR folder for the planned event layer. The *built* system has no equivalent ADR trail; its decisions live instead in the handoff doc's §0 session log (narrative, not ADR-formatted) and in dedicated one-off docs (`docs/*_gap_pending_*.md`, `docs/*_gaps_pending_*.md`). **Gap**: worth deciding whether to retrofit key built-system decisions (the Tier 1/Tier 2 split, the row_version-guard-trigger pattern, the source_system provenance model) into real ADRs, or accept the handoff doc as the de facto record.

**Standards / golden paths — real and enforced, several of them**:
- Every governance-bearing table gets `row_version` + 4 audit columns + `created_src_id`/`updated_src_id`, no exceptions (stated as a standing rule at the top of the handoff doc)
- Every `row_version`-bearing table gets the V153 guard trigger, no exceptions, applies to all future migrations
- Flyway migration files must be byte-mirrored into both `database/NN_*.sql` and `etrm-backend/.../db/migration/VNN__*.sql`
- No vendor/competitor names (Endur, OpenLink, SAP, Bloomberg, ...) in actual implementation — research/comment references only

**Technical debt register**: distributed rather than centralized — the `docs/*_pending_*.md` family (`masterdata_pending_project_01.md`, `dedicated_table_governance_gap_pending_03.md`, `row_version_trigger_pending_04.md`, `tradeblotter_dropdown_wiring_pending_05.md`, `masterdata_curve_derivative_asset_gaps_pending_06.md`, `discount_premium_interest_rate_gaps_pending_08.md`, `fx_trade_capture_gap_pending_09.md`, etc.) functions exactly as a technical debt register — each document is a tracked, named gap with status, rather than a shortcut taken and forgotten. There's no single index of all of them though — a reader has to know to look in `docs/` for the `*pending*` naming convention. **Minor gap**: a one-page index linking all open pending-docs would close this cheaply.

**Change Advisory Board**: no formal CAB — no separate production-release gate exists because there is no production deployment yet (§4). The closest analogue is the "live-verify before calling anything done" discipline (the `verify` skill, backend boot + curl + Playwright checks before a change is considered complete) — a quality gate on individual changes, not a release-level gate.

---

## 8. Roadmap / Migration Planning

**Baseline (current) architecture**: everything marked "Built" throughout this doc — the full Tier 1/Tier 2 master-data platform, trade capture across 6+ commodities, credit/margin, logistics/location master data, RBAC-enforced REST API, React frontend. No production deployment, no quant engine, no event/streaming layer, no settlement/reporting module.

**Target architecture**: two separate, independently-tracked target states exist today, not one:
1. The **event/streaming layer** target described in `event-architecture-plan/` — outbox-based event generation, live UI streaming, AI-governance principles baked in from day one.
2. The **quant engine + full trade lifecycle** target described in the handoff doc's Implementation Phases (§9 there) — Phase 2 (Risk & Pricing: curves, MTM, P&L, VaR) is the next unbuilt phase after the current state, Phase 0/1 (Foundation, Oil Trade Capture) being substantially where the built system already is.

There is no single unified target-state document that merges both — **worth doing**, since the event layer's `sys_stream_registry` is explicitly designed to push MTM/valuation updates to trader UIs, meaning the two plans are meant to compose, not run independently.

**Transition architecture**: none formally defined between today's baseline and either target. No interim/bridge state has been designed (e.g. no "batch-polling MTM updates before the streaming layer exists" transition step is documented) — when the quant engine gets built, that gap will need an explicit answer.

**Strangler Fig applicability**: not directly relevant yet — SmartETRM is a greenfield build with no legacy system being replaced. It would become relevant only if SmartETRM itself later needs to replace pieces of a real trading house's existing legacy CTRM platform (the "Endur/Amphora" comparison class named in this project's own no-vendor-names rule) — worth keeping in mind as a *future* migration pattern, not a current one.

**Work packages**: the handoff doc's §9 Implementation Phases table is the closest existing artifact to a work-package breakdown (Phase 0 Foundation → Phase 1 Oil Trade Capture → Phase 2 Risk & Pricing), but it predates much of what's actually been built (which now goes well beyond "Oil Trade Capture" into 6+ commodities, credit, logistics, RBAC) — **stale, worth refreshing** against current reality rather than treated as the live plan.

**Gap analysis**: this is exactly what the `docs/*_pending_*.md` family already is (§7) — each one is a structured baseline-vs-target comparison for a specific slice (curve/derivative data, discount/premium pricing, FX trade capture, dedicated-table governance). No single whole-platform gap analysis exists that rolls all of them up alongside this doc's own per-layer gap callouts (Settlement/Reporting capabilities, HA/DR, SoD, audit-log wiring, ADR retrofit, unified target-state doc) — **the honest single list of open items across all eight layers is scattered across this doc and the pending-docs family, not consolidated anywhere.**

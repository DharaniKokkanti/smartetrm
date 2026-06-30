# ETRM System — Project Handoff Document
**Version:** 1.1 | **Date:** June 2026 | **Status:** Trade Capture + Credit & Risk Module Complete

---

## 1. Project Overview

Enterprise multi-commodity Energy Trading & Risk Management (ETRM) system built from scratch. Covers Oil & Petroleum, Power & Gas, Agricultural, and Metals & Mining.

**Core strategy:** Design for all commodities, implement Oil first. The architecture is commodity-agnostic at its core — commodity-specific logic lives in extension/plugin modules. This is non-negotiable and must be enforced at every architecture decision.

**Team:** Small dev team (2–5 developers) + 5–10 domain experts across all commodity types.

**Estimated timeline:** 14–20 months to full production with domain experts embedded from day one.

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Backend framework | Spring Boot | 3.3.x | Java 21 LTS, virtual threads |
| ORM | Spring Data JPA + Hibernate | 6.x | Native SQL for complex reporting |
| Security | Spring Security + JWT | 6.x | RS256, 15-min access tokens |
| API docs | SpringDoc OpenAPI | 2.x | Auto-generated REST docs |
| Build | Maven | 3.9.x | |
| Logging | SLF4J + Logback → ELK | Latest | Structured JSON logs |
| Quant engine | Python + FastAPI | 3.11 / 0.111.x | Internal REST, stateless |
| Numerical | NumPy + SciPy + Pandas | Latest | Curve interpolation, stats |
| Quant library | QuantLib-Python | 1.34 | Industry-standard pricing primitives |
| Frontend | React + TypeScript | 18.x / 5.x | |
| State management | Zustand | Latest | RTK if complexity grows |
| UI library | Ant Design | 5.x | Enterprise data tables/forms |
| Data grid | AG Grid | Community/Enterprise | Trade blotter, 100k+ rows |
| Charts | Recharts + D3.js | Latest | Curve viz, P&L, risk heat maps |
| API client | React Query (TanStack) | 5.x | Caching, polling, optimistic updates |
| Build tool | Vite | 5.x | |
| Database | SQL Server | 2022 | |
| Migrations | Flyway | Latest | Schema as code |
| Audit | SQL Server Temporal Tables | — | Auto-historised, no app code needed |

**API style:** REST only (JSON). Versioned via URL path (/v1/). RFC 7807 error format.

**Spring → Python communication:** Internal REST/HTTP calls. Python never initiates calls to Spring. Python is a pure calculation service — stateless, no direct DB access.

**Deployment target:** Not yet decided — architecture is deployment-agnostic (Azure/AWS/GCP/on-premise). Terraform from day one regardless.

---

## 3. Architecture Overview

```
React 18 + TypeScript (UI)
        ↓ REST/JSON HTTPS JWT
Spring Boot 3.x (API Gateway + Business Services)
        ↓ Internal REST          ↓ JDBC/JPA
Python FastAPI (Quant Engine)    SQL Server 2022
```

**Multi-entity / multi-book:** Every trade traces through book → legal entity. Full P&L segregation per company, per book, per desk.

**Commodity-agnostic core + commodity plugin modules:**
```
CORE (shared by all commodities)
├── Trade lifecycle engine
├── Counterparty & entity model
├── Pricing & curve framework
├── Position & risk engine
├── Settlement & invoicing
└── Reporting & audit

COMMODITY MODULES (plug in one at a time)
├── Oil & Petroleum ← implement first
├── Power & Gas     ← second
├── Agricultural    ← third
└── Metals & Mining ← fourth
```

---

## 4. Database Schema — Complete Table Inventory

**Base schema: 116 tables across 9 legacy scripts; extended by V28–V35 Flyway migrations (see §13)**

### Script 1: Master Data v2.0 (42 tables)
`etrm_master_data_v2.0.sql`

**GROUP 1 — Pure reference**
- `lookup_value` — generic key-value store for all system picklists
- `currency` — ISO 4217 currency reference (seeded: 12 currencies)
- `commodity` — top-level commodity classification (seeded: 5 commodities)
- `unit_of_measure` — all units across all commodities (seeded: 14 UOMs)
- `location_type` — location classifications (seeded: 11 types)
- `credit_rating` — S&P + internal ratings (seeded: 22 ratings)
- `incoterm` — ICC Incoterms 2020 (seeded: 11 terms)
- `pricing_type` — FLAT, INDEX, DIFFERENTIAL, FORMULA, FLOATING, TBN
- `price_index` — benchmark references (Dated Brent, WTI, TTF etc.)
- `holiday_calendar` — settlement/trading calendars (seeded: 9 calendars)

**GROUP 2 — Polymorphic shared (entity_type + entity_id pattern)**
- `address` — covers legal_entity, counterparty, location, storage_facility, contact
- `tax_registration` — VAT, GST, EIN, UTR etc. covers legal_entity, counterparty
- `bank_account` — SETTLEMENT, COLLATERAL, FEE accounts for legal_entity, counterparty
- `contact` — covers legal_entity and counterparty

**GROUP 3 — Organisation**
- `legal_entity` — internal trading companies (temporal table, self-ref for group hierarchy)
- `app_user` — all system users (temporal table)
- `user_role` — time-bounded RBAC role assignments
- `desk` — trading desks within legal entity
- `book` — trading books, P&L segregation unit (temporal table)

**GROUP 4 — Counterparty**
- `counterparty` — external trading counterparties (temporal table)
- `netting_agreement` — ISDA/EFET master netting agreements
- `cp_legal_entity_link` — authorised trading pairs with per-pair credit limits

**GROUP 5 — Commodity & product**
- `commodity` — top-level commodity (OIL, GAS, POWER, METALS, AGRICULTURAL). Added V23: `commodity_subtype` (23 enum values), `default_uom_id`, `default_currency_id`
- `product` — tradeable products. Added V23: `grade_code`, `product_family` (17 families), `bloomberg_ticker`, `reuters_ric`, `platts_code`, `is_exchange_traded`, `is_otc`. Added V24: `is_blend BIT`, `blend_notes VARCHAR(500)`. Added V25: 7 pricing basis fields — `density_estimate_kg_m3` / `density_base_kg_m3` (OIL BBL↔MT), `cv_gross_mj_scm` / `cv_net_mj_scm` (GAS vol↔energy), `purity_basis_pct` (METALS grade), `moisture_basis_pct` / `protein_basis_pct` (AGRI quality adjustments)
- `product_blend_component` — (V24) M:M bridge for blended products; stores min/target/max/tolerance % per component
- `product_spec_template` — (V4 schema, V24 seeded) named quality spec per product, linked to issuing body and standard reference
- `product_spec_value` — (V4 schema, V24 seeded) parameter bounds (min/max/typical/exact) within a spec template
- `spec_parameter` — (V4 schema, V24 added 13 new rows, V25 added 24 more) complete catalogue of measurable quality parameters across all commodity types: OIL (28 params incl. TAN, CCR, WAX, asphaltene, ULSD-specific), GAS (16 incl. composition + energy), METALS (11 incl. LME purity, impurity limits), AGRICULTURAL (12 incl. moisture, protein, starch, oil content), POWER (5 incl. CO₂ intensity, renewable cert)
- `uom_conversion` — explicit conversion factors between any two units. V25 seeded 29 rows: universal weight (MT↔KG, MT↔LB), precious metals (Troy Oz↔KG/MT), OIL volume (BBL↔GAL, BBL↔CBM, BBL↔MT defaults), GAS energy (MWH↔MMBTU/GJ/THERM, SCM↔MWH/MMBTU), POWER (GWH↔MWH), AGRI (BUSHEL↔MT). Product-level density/GCV fields override default commodity-level factors
- `product_price_index` — M:M bridge: products ↔ price indices with `role` (PRIMARY_MTM / SETTLEMENT / BACKUP / REFERENCE) and `is_primary` flag

**GROUP 6 — Commercial terms**
- `payment_term` — redesigned V22: `term_code`, `base_date_event` (11 values), `month_offset`, `offset_days`, `fixed_day_of_month`, `business_day_convention` (5 values), `holiday_calendar_id`, `discount_days`, `discount_pct`, `payment_method`, `invoice_lead_days`, `is_default`. Seeded: 20 commodity-representative terms
- `credit_term` — credit period, collateral, netting (seeded: 8 terms)
- `gtc` — master General Terms & Conditions
- `gtc_version` — versioned GTC documents
- `cp_commercial_terms` — default payment/credit terms per counterparty/entity pair
- `cp_gtc_agreement` — signed GTC per counterparty

**GROUP 7 — Location & geography**
- `location` — ports, hubs, grid nodes, warehouses
- `pipeline` — pipeline infrastructure (thin version — replaced in later script)
- `storage_facility` — tanks, warehouses, LNG terminals
- `cp_location` — counterparty ↔ location operating roles

**GROUP 8 — Currency & calendar**
- `fx_rate` — daily FX rates
- `holiday` — individual holiday dates per calendar
- `settlement_calendar` — product ↔ calendar links

**GROUP 9 — System & audit**
- `audit_log` — immutable application-level audit (partitioned by date)
- `document_store` — document metadata (files in blob/S3/NAS)
- `system_config` — key-value config store (seeded: 10 defaults)

---

### Script 2: Trader Patch v2.1 (2 tables)
`etrm_trader_patch_v2.1.sql`

Replaces flat trader table — splits into person identity and commodity-specific limits.

- `trader` — who the person is: identity, desk, global approver (temporal table)
- `trader_commodity_limit` — limits per commodity, fully independent per trader. One row per trader per commodity (OIL and POWER get separate rows with different limits, different approvers). Temporal table.

**Key design:** A trader authorised for OIL and POWER gets two `trader_commodity_limit` rows — completely independent daily limits, position limits, tenor limits, and approvers per commodity.

---

### Script 3: Market / Price Source / Period (11 tables)
`etrm_market_source_period_v1.0.sql`

- `exchange` — ICE, NYMEX, LME, EEX, CBOT, SGX, ICAP, Tradition (seeded: 9)
- `market` — individual trading markets (exchange or OTC)
- `market_hours` — open/close per day per market with session types
- `market_holiday_calendar` — market ↔ calendar links
- `market_product` — products tradeable on each market with market-specific overrides
- `price_source` — Platts, Argus, Bloomberg, ICE Data etc. (seeded: 10 sources)
- `price_index_source` — which source serves which index with role (PRIMARY_MTM, SETTLEMENT, BACKUP)
- `market_product_source` — which source serves which product on which market
- `period` — unified trading + risk period table (seeded: rolling + concrete 2026–2031)
- `market_product_period` — valid periods per market/product
- `period_mapping` — hierarchical period decomposition (Cal→12 months, Q→3 months)

---

### Script 4: MPP Dates Patch v1.1 (ALTER TABLE only)
`etrm_mpp_dates_patch_v1.1.sql`

Adds to `market_product_period`:
- Concrete dates: `last_trading_date`, `first_notice_date`, `settlement_price_date`, `delivery_start_date`, `delivery_end_date`, `expiry_date`, `cash_settlement_date`
- Offset rules: `ltd_offset_days/type`, `fnd_offset_days/type`, `settlement_offset_days/type`, `offset_calendar_id`, `ltd_reference_date_rule`

---

### Script 5: Product Spec / MOT / Pipeline (29 tables)
`etrm_product_spec_mot_pipeline_v1.0.sql`

**GROUP A — Product specifications**
- `spec_parameter` — measurable quality parameters per commodity (seeded: 37 params across Oil/Gas/Agri/Metals/Power)
- `spec_parameter_uom` — valid UOMs per parameter
- `product_spec_template` — named specification per product (e.g. "North Sea Forties Standard")
- `product_spec_value` — min/max/typical values per parameter per template (Option A: separate columns)
- `spec_override` — polymorphic tighter specs for pipeline/vessel/tank/location

**GROUP B — MOT core**
- `mot_type` — VESSEL, BARGE, PIPELINE, TRUCK, RAILCAR, ISO_CONTAINER, FLEXIBAG, WAREHOUSE_TRANSFER, BOOK_TRANSFER (seeded: 9)
- `transport_operator` — shipping lines, hauliers, rail operators, TSOs
- `transport_route` — generic origin → destination for any MOT type
- `transport_document_type` — BOL, CMR, rail waybill, pipeline ticket etc. (seeded: 16 types)

**GROUP C — Vessel**
- `vessel` — IMO number, type (VLCC/Suezmax/Aframax/LNG Carrier etc.), vetting status
- `vessel_certificate` — SIRE, CDI, P&I, hull, class, MARPOL, RightShip

**GROUP D — Land transport**
- `truck` — registration, ADR certification, capacity
- `railcar` — DOT classification, approved commodities, cert expiry
- `container` — ISO tank, flexibag, CSC plate

**GROUP E — Storage & tanks**
- `tank` — individual tank within facility: type (fixed roof/floating roof/cryogenic etc.), capacity, status
- `tank_calibration` — strapping tables (height → volume), innage/ullage
- `tank_status` — operational status history log

**GROUP F — Inspection**
- `inspection_type` — SIRE, CDI, API_653, DOT, ADR, CSC etc. (seeded: 12)
- `inspection` — polymorphic: covers vessel, truck, railcar, container, tank, pipeline

**GROUP G — Pipeline (full version replaces thin v1)**
- `pipeline` — full: type, commodity, TSO code, regulatory body, flow direction, fungibility, batch scheduling
- `pipeline_point` — entry/exit/interconnect/storage_link/metering/compressor points
- `pipeline_segment` — segments between points, capacity per segment, outage status
- `pipeline_cycle` — KEY table: nomination/confirmation/scheduling cycles (INTRADAY/DAILY/MONTHLY)
- `pipeline_tariff` — firm/interruptible tariff rates per point pair per season
- `pipeline_operator_agreement` — our shipper agreements with TSOs

**GROUP H — Product approvals (three-level)**
- `pipeline_product_approval` — pipeline level: what products allowed + which spec template
- `pipeline_point_product` — point level: product restrictions at specific entry/exit points
- `pipeline_segment_product` — segment level: older/smaller segments may restrict products
- `mot_asset_product_approval` — polymorphic: product approvals for vessel/truck/railcar/container/tank

---

### Script 6: Financial & Operational Master Data (22 tables)
`etrm_financial_operational_md_v1.0.sql`

**GROUP A — Events**
- `event_category` — 9 categories: TRADE, DELIVERY, SETTLEMENT, RISK, CREDIT, MARKET_DATA, REGULATORY, SYSTEM, USER
- `event_type` — 42 event types seeded across all workflows with severity, SLA, regulatory flag

**GROUP B — Formula**
- `formula_template` — reusable pricing formula patterns (INDEX, DIFFERENTIAL, AVERAGE, WEIGHTED_AVERAGE, BLEND, SPREAD, FORMULA)
- `formula_component` — individual index/differential components within a formula

**GROUP C — Interest rates**
- `interest_rate_index` — SOFR, EURIBOR, SONIA, €STR, TONAR, FEDFUNDS etc. (seeded: 12)
- `interest_rate` — daily rate values per index
- `rate_fixing` — official fixing values (ISDA fallback, ECB reference)

**GROUP D — Insurance**
- `insurance_provider` — P&I clubs, underwriters, Lloyd's syndicates
- `insurance_policy` — P&I, hull, cargo, trade credit, political risk, storage
- `insurance_policy_coverage` — specific coverage clauses and endorsements

**GROUP E — Credit instruments**
- `letter_of_credit` — full LC lifecycle: IRREVOCABLE/STANDBY/REVOLVING/TRANSFERABLE. Computed `amount_available` column
- `bank_guarantee` — PERFORMANCE/PAYMENT/ADVANCE_PAYMENT/BID_BOND
- `lc_amendment` — all amendments to each LC
- `bg_amendment` — all amendments to each bank guarantee

**GROUP F — Margin & collateral**
- `margin_account` — exchange margin accounts per legal entity per market
- `margin_call` — individual calls: INITIAL/VARIATION/INTRADAY/EXCESS_RETURN
- `collateral_type` — CASH, GOV_BOND, CORP_BOND, LC, BG with standard haircuts (seeded: 9)
- `collateral` — posted or received collateral with computed `eligible_value`

**GROUP G — Regulatory**
- `regulatory_report_type` — EMIR, REMIT, UK EMIR, CFTC, MiFID II, SFTR (seeded: 9)
- `regulatory_obligation` — which entities must report under which regulation
- `trade_repository` — DTCC, ICAP, UnaVista, REGIS-TR etc.
- `reporting_counterparty` — which trade repository each entity uses per regulation

---

### Script 7: Pricing Triggers, Window Rules & Pricing Rules (4 tables)
`etrm_pricing_triggers_rules_v1.0.sql`

- `pricing_trigger_event_type` — 30 trigger types seeded:
  - Documentary: BL, NOR, COD, COL, EOL, EOD_DISCHARGE, OUTTURN, PIPELINE_ENTRY/EXIT, TRUCK_LOADING, TRUCK_DELIVERY, RAIL_DEPARTURE, RAIL_ARRIVAL
  - Deemed/fallback: DEEMED_BL, DEEMED_ARRIVAL, DEEMED_DELIVERY, CONTRACTUAL_DATE
  - Time-based: ACTUAL_DATE, PRICING_PERIOD_START/END, DELIVERY_MONTH_START/END
  - Exchange: EXPIRY_DATE, FIXING_DATE, LME_CASH, LME_3MONTH, PUBLICATION_DATE
  - Settlement/inspection: INVOICE_DATE, INSPECTION_DATE

- `pricing_window_rule` — 14 standard windows seeded:
  - SINGLE_DAY, 3DAY_SYMMETRIC (BL-1/0/+1), 5DAY_SYMMETRIC, 5DAY_FORWARD_COD, 3DAY_FORWARD_NOR, 5DAY_BACKWARD_BL, MONTHLY_AVG_ALL, GAS_MONTHLY_BIZ, POWER_MONTHLY_PEAK, LME_CASH_SINGLE, LME_QP_MONTHLY, CBOT_SINGLE, AGRI_5DAY_BL, FULL_DELIVERY_PERIOD

- `pricing_trigger_product` — valid triggers per product/market with fallback trigger linkage and deadline days

- `pricing_rule` — complete assembled pricing rule: product + market + incoterm + pricing_type + price_index + formula_template + primary/fallback triggers + window rule + FX handling + late pricing + invoice timing. **Temporal table.**

---

### Script 8: Pricing Lifecycle (6 tables)
`etrm_pricing_lifecycle_v1.0.sql`

**Flow:** trade → schedule → pricing events → staging (raw feed) → validation → formula evaluation → dispute → confirmed price → invoice

- `trade_pricing_schedule` — master pricing record per trade. Status: PENDING → TRIGGER_SET → FIXING_IN_PROGRESS → FIXINGS_COMPLETE → DISPUTED → CONFIRMED → INVOICED → CLOSED. **Temporal table.** NOTE: trade_id FK added via ALTER after trade table created.
- `pricing_event` — one row per fixing date per index. Tracks raw/actual/fallback/value_used. Override audit preserved.
- `pricing_event_staging` — raw feed values before validation. Option B two-step gate: feed → staging → validation → pricing_event. Cross-source deviation % + spike detection.
- `formula_evaluation_log` — immutable audit. JSON `component_values` captures full input snapshot. Types: PROVISIONAL/INTERIM/FINAL/POST_DISPUTE.
- `pricing_dispute` — SINGLE_FIXING/MULTIPLE_FIXINGS/FORMULA_RESULT/TRIGGER_DATE/WINDOW_DEFINITION. Resolution: AGREED/FALLBACK/ARBITRATION/SPLIT_DIFFERENCE.
- `missing_fixing_rule` — per-index fallback rules. PRIOR_DAY/BACKUP_SOURCE/INTERPOLATE/EXCLUDE/SUSPEND. Max consecutive missing days before escalation.

---

### Script 9: Product Spec / MOT / Pipeline (combined with Script 5 above)

---

## 5. Key Design Decisions

### Polymorphic shared tables
`address`, `tax_registration`, `bank_account`, `contact` all use `entity_type + entity_id` pattern. Enforced via CHECK constraint + application layer. Covers legal_entity, counterparty, location, storage_facility.

### Temporal tables (SQL Server system versioning)
Applied to: `legal_entity`, `app_user`, `book`, `counterparty`, `trader`, `trader_commodity_limit`, `pricing_rule`, `trade_pricing_schedule`. Every change auto-historised by SQL Server — zero application code required. Regulatory requirement.

### Trader limits split
`trader` = person identity only. `trader_commodity_limit` = authorisation per commodity. One trader covering OIL and POWER gets two limit rows — independent daily limits, position limits, approvers per commodity. Time-bounded for temporary limit changes.

### Product specs
Three-level spec hierarchy: `product_spec_template` → `product_spec_value` (min/max/typical per parameter). `spec_override` for pipeline/vessel/tank tighter requirements. Option A chosen: separate min/max/typical columns (not range table).

### Pipeline product approval — three levels
1. Pipeline level: `pipeline_product_approval` (what products allowed on this pipeline)
2. Point level: `pipeline_point_product` (restrictions at specific entry/exit points)
3. Segment level: `pipeline_segment_product` (older segments may restrict certain products)

### MOT asset product approval
`mot_asset_product_approval` is polymorphic covering vessel, truck, railcar, container, tank — same concept as pipeline approval but for individual physical assets.

### Pricing lifecycle (Option B two-step validation)
Raw feed → `pricing_event_staging` (with spike detection + cross-source check) → validation gate → `pricing_event.actual_value`. Gives clean audit trail and prevents bad data hitting formula calculation.

### Period table (unified)
Single `period` table serves both trading periods and risk buckets via `is_trading_period` and `is_risk_period` flags. Rolling periods (M+1, Q+1, CAL+1) use offset rules resolved at runtime. Concrete periods pre-generated 2026–2031.

---

## 6. RBAC Roles

| Role | Permissions |
|---|---|
| TRADER | Create/amend own trades, view own positions, view market data |
| SENIOR_TRADER | All TRADER + approve trades up to credit limit |
| RISK_MANAGER | Read-only all trades, full risk reports, set limits |
| BACK_OFFICE | Settlement, invoicing, counterparty management |
| COMPLIANCE | Read-only all data, regulatory reports, audit log |
| ADMIN | Full system access, user management, reference data |
| APPROVER | Approve trades above trader threshold |
| SYSTEM | Internal service-to-service only |

---

## 7. REST API Endpoints (core)

Base URL: `/api/v1/`

| Method | Endpoint | Description |
|---|---|---|
| POST | /legal-entities | Create legal entity |
| GET | /legal-entities | List (paginated) |
| PUT | /legal-entities/{id} | Update |
| DELETE | /legal-entities/{id} | Deactivate |
| POST | /counterparties | Create counterparty |
| GET | /counterparties | List with filters |
| POST | /traders | Create trader |
| POST | /traders/{id}/limits | Add commodity limit |
| POST | /trades | Create trade |
| GET | /trades | List trades |
| PATCH | /trades/{id} | Amend trade |
| DELETE | /trades/{id} | Cancel trade |
| GET | /positions | Net positions |
| POST | /pricing/mtm | Request MTM (→ Python) |
| GET | /risk/var | VaR calculation |
| GET | /risk/exposure | Credit exposure |
| GET | /settlements | Settlement list |
| GET | /reports/pnl | Daily P&L |
| GET | /reports/regulatory | Regulatory report |

---

## 8. Python Quant Engine Endpoints

Internal only — not exposed externally. Called by Spring Boot.

| Endpoint | Input | Output |
|---|---|---|
| POST /internal/v1/pricing/mtm | tradeId, commodity, quantity, price, curve[], valuationDate | mtmValue, currency, calculatedAt |
| POST /internal/v1/risk/var | portfolioId, positions[], curves[], confidenceLevel, horizon | var95, var99, expectedShortfall |
| POST /internal/v1/curves/build | commodity, marketQuotes[], interpolationMethod | curvePoints[], buildDate |
| POST /internal/v1/pricing/formula | scheduleId, components[], fixings[], windowRule | calculatedPrice, steps[], evaluation_id |

---

## 9. Implementation Phases

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 0 — Foundation | Weeks 1–4 | CI/CD, DB schema, auth, audit, Spring skeleton, Python skeleton, React shell |
| Phase 1 — Oil Trade Capture | Months 2–5 | Full trade lifecycle for oil, counterparty mgmt, trade blotter UI, basic position calc |
| Phase 2 — Risk & Pricing | Months 6–9 | Curve management, MTM, P&L, VaR, credit exposure, risk dashboards |
| Phase 3 — Settlement & Ops | Months 10–13 | Settlement workflow, invoicing, reconciliation, oil delivery mgmt |
| Phase 4 — Regulatory & Reporting | Months 14–16 | EMIR/REMIT/CFTC reporting, management dashboards |
| Phase 5 — Commodity Expansion | Months 17+ | Gas & Power, then Agricultural, then Metals |

---

## 10. What's Been Built

### Master data GUI (React / TypeScript full-stack prototype)

**SmartETRM full application** running on Vite + React 18, Ant Design 5, AG Grid, React Query, Zustand, MSW (Mock Service Worker).

**Organization & Reference:**
- Legal entity, counterparty (with KYC status), trader management
- Desks, books, brokers with fee agreement setup
- Currencies, UoM, UoM conversions, countries, incoterms

**Markets & Products:**
- Markets, exchanges, price indices, price sources
- Products — with quality spec tabs (blend recipe + spec template accordion), pricing basis fields

**Logistics & Calendar:**
- Locations, vessels, pipelines, trucks, storage facilities
- Holiday calendars, trading periods

**Pricing:**
- Pricing rules (assembled: product + market + trigger + window + FX handling)
- Price sources

**Contracts:**
- Payment terms (redesigned: base date event, month offset, business day convention, discount %)
- Payment methods, GTCs, broker fee agreements

**Credit & Risk (V35):**
- **Margin Agreements** — CSA/pledge setup per counterparty: threshold, MTA, independent amount, eligible collateral, valuation frequency, governing law
- **Credit Limits** — pre-settlement, settlement, delivery, MTM limits per counterparty with real-time utilisation % bar
- **Letters of Credit** — standby/documentary/revolving/transferable LCs: face value, drawdown tracking, evergreen/auto-renewal provisions, expiry alert index; summary stats band (total face value, total available, total drawdown, active count)
- **Credit Hub** — hub card page at `/credit` linking to all three sections

**Trade Capture:**
- **Trade Blotter** — redesigned Trade → Order/Leg → Item three-tier hierarchy:
  - Trade = contract header only (counterparty, trader, trade date, contract number, term type SPOT/RFP, deal indicator INTERNAL/EXTERNAL)
  - RFP fields (min/max qty, start/end dates, frequency) shown conditionally when term_type = RFP
  - Legs panel always visible below trade grid; first leg auto-tagged TEMPLATE, subsequent legs are detail legs; commodity-specific delivery fields (product, market, pricing rule, risk dates, qty, price, settlement, incoterm, delivery location) all on legs only
  - Items section shown when a leg is selected

**Admin:**
- System users, roles & permissions, field-level permissions (EDIT/VIEW/HIDDEN per field per role profile)

**Infrastructure:**
- AppRouter with lazy-loaded routes for all modules
- AppShell with collapsible sidebar, dark/light theme toggle, API activity log drawer
- MSW handlers for all endpoints (crudHandlers helper + custom handlers for suspend/reinstate/cancel)
- React Query cache with `['resource']` keys; useMutation with cache invalidation on success

---

## 11. What's Next

**Phase 2 — Risk & Pricing (Months 6–9):**
- Spring Boot service layer for trades, positions, credit
- Python quant engine: MTM, curve building, VaR
- Position engine: net positions per book per commodity, base-UoM normalisation (V28)
- Credit exposure engine: real-time utilisation against `dbo.credit_limit`, breach alerts
- Margin call workflow: link to `dbo.margin_agreement` thresholds

**Phase 3 — Settlement & Ops (Months 10–13):**
- Settlement workflow, invoicing, reconciliation
- LC drawdown processing: link trade invoices to `dbo.letter_of_credit` drawdown_amount
- Delivery management

**Immediate next (frontend prototype):**
- Position & P&L page (route `/position` already exists, placeholder)
- Pricing lifecycle UI (pricing schedule, fixing events)

---

## 12. Open Decisions

| Item | Decision needed | Impact |
|---|---|---|
| Deployment target | Cloud (Azure/AWS/GCP) vs On-Premise vs Hybrid | Infrastructure design, CI/CD, DR |
| Market data vendor | Bloomberg, Platts, Argus, ICE — which primary? | Curve building timeline |
| Regulatory jurisdictions | EU (EMIR/REMIT) vs US (CFTC) vs both | Reporting module scope |
| Message queue | Kafka vs RabbitMQ for async position calc | Needed before Phase 2 |
| ERP integration | SAP vs Oracle vs other | Settlement/GL interface |
| Multi-tenancy | Single client vs SaaS multi-tenant | Major data isolation change |

---

## 13. Flyway Migration History

All migrations live in `etrm-backend/src/main/resources/db/migration/` and are mirrored for reference to `etrm-system/database/`.

| Version | File | Summary |
|---------|------|---------|
| V1–V8 | `V1__...` – `V8__...` | Initial schema: master data, trader, market/price, product spec, MOT/pipeline, pricing |
| V9 | `V9__trade_schema.sql` | Trade blotter tables + commodity extension tables (oil/gas/power/metals/agri) |
| V10 | `V10__position_schema.sql` | Position ledger |
| V11 | `V11__power_schema.sql` | Power-specific: grid nodes, transmission rights, balancing |
| V12 | `V12__power_transmission_rights.sql` | Transmission right detail |
| V13 | `V13__parent_company_guarantee.sql` | PCG for counterparty credit |
| V14 | `V14__master_data_table_registry.sql` | `md_table_registry` — powers Static Data admin UI |
| V15 | `V15__temporal_tables_fix.sql` | Temporal table DDL corrections |
| V17 | `V17__parent_lookup_tables.sql` | First wave of parent lookup tables (commodity type, UoM class, etc.) |
| V18 | `V18__address_phone_contact_entity_type.sql` | Polymorphic contact/address entity types |
| V19 | `V19__entity_address_contact_link_tables.sql` | Entity ↔ address/contact junction tables |
| V20 | `V20__rbac_roles_functions.sql` | RBAC: `app_function`, `app_role`, `role_function_grant`, `user_role` |
| V21 | `V21__address_contact_rbac_user_profile.sql` | `user_profile` table; address/contact linking |
| V22 | `V22__payment_term_redesign.sql` | **Payment Term redesign** — adds `base_date_event`, `month_offset`, `business_day_convention`, `holiday_calendar_id`, `discount_pct`, `payment_method`, `invoice_lead_days`, `is_default`. Re-seeds 20 commodity-representative terms |
| V23 | `V23__base_date_event_commodity_product_fields.sql` | **Lookup tables + commodity/product enrichment**: creates `base_date_event_type` (11 rows) and `business_day_convention_type` (5 rows) as managed static data; adds `commodity_subtype`, `default_uom_id`, `default_currency_id` to commodity; adds `grade_code`, `product_family`, `bloomberg_ticker`, `reuters_ric`, `platts_code`, `is_exchange_traded`, `is_otc` to product |
| V24 | `V24__product_blend_spec_seeds.sql` | **Product blend model + quality spec seeds**: adds `is_blend BIT` and `blend_notes VARCHAR(500)` to `product`; adds 13 new `spec_parameter` rows (ULSD/diesel quality, gas composition, metals purity, agri); creates `product_blend_component` M:M bridge table (parent_product_id, component_product_id, min/target/max_pct, tolerance_pct); seeds 3 products (ULSD-10PPM, ETHANOL, GAS97-BLEND); seeds 2 blend component rows for GAS97-BLEND recipe (97% ULSD + 3% Ethanol); seeds 6 `product_spec_template` rows (Brent/BFOE, WTI/NYMEX, TTF/EFET, LME Grade A Copper, EN590 ULSD, GAS97 internal); seeds 32 `product_spec_value` rows with industry-standard min/max/typical bounds |
| V25 | `V25__pricing_basis_uom_conversion_spec_additions.sql` | **Pricing basis fields + UoM conversion seeds + extended spec catalogue**: adds 7 pricing basis columns to `product` (`density_estimate_kg_m3`, `density_base_kg_m3`, `cv_gross_mj_scm`, `cv_net_mj_scm`, `purity_basis_pct`, `moisture_basis_pct`, `protein_basis_pct`); adds 6 UoM rows (GJ commodity_type=NULL, SCM/MMSCM with self-referential VOLUME base, LB commodity_type=NULL, GAL, CBM); seeds 21 `uom_conversion` rows covering universal weight, precious metals, OIL volume (VOLUME↔VOLUME only — no BBL↔MT as these require per-product density), GAS energy (ENERGY↔ENERGY only — no SCM↔MWH as these require per-product GCV), POWER, and AGRI; adds 24 more `spec_parameter` rows; UPDATEs 16 products with pricing basis values (including ETHANOL density 794/789 kg/m³) |
| V26 | `V26__field_level_permissions.sql` | **Field-level permission system**: creates `screen_field_registry` (developer-owned catalogue of configurable fields per screen), `field_permission_profile` (client-admin-named role profiles), `field_permission_rule` (per-field EDIT/VIEW/HIDDEN setting per profile), `object_lock_rule` (Layer 1 lifecycle-state locks); seeds 63 `screen_field_registry` rows for TRADE_BLOTTER screen across 10 field groups; seeds 3 sample profiles (Trader Full Access, Credit Manager, Read-Only Viewer) |
| V27 | `V27__blend_component_needs_position_gen.sql` | **Blend component position flag**: adds `needs_position_gen BIT NOT NULL DEFAULT 1` to `product_blend_component`; when TRUE, the position engine generates individual sub-positions for that component in addition to the blended product position; backfills existing rows to TRUE |
| V28 | `V28__position_base_uom_columns.sql` | **Position base-UoM normalisation**: adds `quantity_base_uom` and `base_uom_code` to `position` and `position_eod_snapshot`; position engine stores both traded quantity and commodity-normalised quantity (OIL/METALS/AGRI → MT; GAS/POWER → MWH). Conversion factors sourced from `product.density_estimate_kg_m3` and `product.cv_gross_mj_scm` |
| V29 | `V29__trade_blotter_field_expansion.sql` | **Trade field expansion**: adds `contract_type` (SPOT/DAILY/WEEKLY/MONTHLY/QUARTERLY/ANNUAL/TERM), `risk_start_date`, `risk_end_date`, `broker_id` (FK to new `dbo.broker` table), `broker_fee_type/fee/currency`, `credit_term_code`, `credit_approval_status`, `credit_limit_used`, `gtc_reference` to `dbo.trade`; adds `mot_type` and other MOT fields to `trade_oil_detail` |
| V30 | `V30__freight_trade_detail.sql` | **Freight trade detail table**: `dbo.trade_freight_detail` for FREIGHT commodity trades; covers voyage charters, time charters and COA; stores vessel_type (VLCC/SUEZMAX/AFRAMAX/LR2/LR1/MR/CAPE/PANAMAX/SUPRAMAX/HANDYSIZE), charter_type, route_code (TD3C, TC2, C3…), cargo_size_mt, freight_rate_type (WORLDSCALE/FLAT_RATE/LUMPSUM/TCE), rate, laycan_start/end |
| V31 | `V31__broker_type_description.sql` | **Broker table enhancement**: adds `broker_type` (VOICE/ELECTRONIC/HYBRID), `description`, `contact_name/email/phone`, `website`, `country_code` to `dbo.broker`. Clarifies that `broker` holds IDB (inter-dealer broker) firms only — FCM and Prime Brokers are managed in `dbo.counterparty` |
| V32 | `V32__broker_fee_agreement.sql` | **Broker fee agreement table**: `dbo.broker_fee_agreement` — standing rate cards between the firm and each IDB; stores fee_type (PER_LOT/PCT_NOTIONAL/FLAT_PER_TRADE/FLAT_MONTHLY), rate, currency, effective/expiry dates, pay_period (PER_TRADE/MONTHLY); supports multi-commodity/multi-product override rows per broker |
| V33 | `V33__trade_order_item.sql` | **Three-tier deal structure**: creates `dbo.trade_order` (delivery legs — product, market, pricing_rule, risk dates, qty, price, settlement, incoterm, delivery_location, commodity detail) and `dbo.trade_item` (sub-line items within a leg); `order_sequence=1` is the TEMPLATE leg; subsequent legs are detail legs |
| V34 | `V34__trade_userdata_tables.sql` | **Trade header refactor**: ALTERs `dbo.trade` — adds `contract_number`, `term_type` (SPOT/RFP, NOT NULL DEFAULT 'SPOT'), `deal_indicator` (INTERNAL/EXTERNAL, auto-set from CP type), `rfp_min_qty`, `rfp_max_qty`, `rfp_start_date`, `rfp_end_date`, `rfp_frequency` (DAILY/WEEKLY/MONTHLY/QUARTERLY); adds CHECK constraint requiring rfp_* fields when `term_type='RFP'`; ALTERs `dbo.trade_order` — adds `is_template BIT DEFAULT 0`; DROPs old delivery columns (product_id, market_id, quantity, price, settlement_type, etc.) that are now on trade_order only |
| V35 | `V35__credit_margin_lc.sql` | **Credit & Risk master data tables**: `dbo.margin_agreement` — CSA/pledge parameters per counterparty (threshold, MTA, independent amount, eligible collateral, valuation frequency, governing law); `dbo.credit_limit` — pre-settlement/settlement/delivery/MTM limits per counterparty with used_amount tracking; `dbo.letter_of_credit` — standby/documentary/revolving/transferable LCs with face value, drawdown tracking, evergreen/auto-renewal provisions, place of expiry, applicable law (UCP 600/ISP98) |

---

## 14. Static Data Admin UI — Lookup Table Design

Payment term dropdowns (Base Date Event and Business Day Convention) are driven by managed lookup tables, not hardcoded TypeScript enums. This means operations teams can add new event types without code changes.

**Pattern:**
1. Lookup table in SQL (e.g. `base_date_event_type`) with `type_code` matching the CHECK constraint on the data column
2. Entry in `PARENT_LOOKUP_TABLES` array in `referenceData.ts` — auto-registers the table in the Tier 2 Static Data UI
3. Frontend uses `useTableRows('base_date_event_type')` hook to load options at runtime
4. Form select uses grouped options (`applicableCommodity` as group header) with search enabled

**Tables managed via Static Data UI:**
- `base_date_event_type` — 11 payment date anchors (BL_DATE, DELIVERY_DATE, END_OF_DELIVERY_MONTH, etc.)
- `business_day_convention_type` — 5 BD rolling rules (MOD_FOLLOWING, FOLLOWING, etc.)
- `crude_grade_type` — 14 named crude grades (BRENT, WTI, FORTIES, URALS, DUBAI, ESPO, etc.) with region and benchmark index
- `metal_shape` — 9 physical metal forms (CATHODE, INGOT, BILLET, COIL, ROD, SLAB, WIRE, POWDER, T_BAR)
- `gas_day_type` — 3 gas day boundary types (STANDARD 06:00–06:00, MIDNIGHT, EXTENDED)
- `nomination_type` — 3 gas nomination types (FIRM, INTERRUPTIBLE, RENOMINATABLE)
- `lng_price_basis` — 6 LNG price linkages (JCC, HH, TTF, NBP, DES_SPOT, HYBRID)
- `power_load_type` — 4 power load profiles (BASELOAD, PEAK, OFF_PEAK, SHAPED)
- All other `PARENT_LOOKUP_TABLES` entries (commodity type, pricing type, UoM class, etc.)

**TradeBlotter dropdowns** — all formerly-hardcoded option arrays replaced with `useTableRows()` hooks and `useUom()`:
| Previously hardcoded | Now served by |
|---|---|
| `UOM_OPTIONS` | `useUom()` → `/api/v1/uom` |
| `CURRENCY_OPTIONS` | `useTableRows('currency')` |
| `CRUDE_GRADES` | `useTableRows('crude_grade_type')` |
| `METALS_SHAPES` | `useTableRows('metal_shape')` |
| `LNG_PRICE_BASES` | `useTableRows('lng_price_basis')` |
| inline `nominationType` options | `useTableRows('nomination_type')` |
| inline `gasDayType` options | `useTableRows('gas_day_type')` |
| inline `loadType` options | `useTableRows('power_load_type')` |

## 14a. Product Blend & Quality Spec Data Model

### Blend Products
A product can be flagged `is_blend = true` to indicate it is manufactured by blending component products. The recipe is stored in `product_blend_component`:

```
product_blend_component
├── parent_product_id    → blended product (e.g. GAS97-BLEND)
├── component_product_id → a constituent (e.g. ULSD-10PPM, ETHANOL)
├── sequence_no          → display order
├── min_pct / target_pct / max_pct  → volume-basis blending recipe
├── tolerance_pct        → allowable variance from target
└── needs_position_gen   → (V27) BIT; TRUE = position engine creates a sub-position for this
                           component in addition to the parent blend position;
                           FALSE = component tracked only within the blended product position
```

**Example**: GAS97-BLEND = Component 1: ULSD-10PPM (target 97%vol ±0.5%) + Component 2: ETHANOL (target 3%vol ±0.25%).

### Quality Spec Templates
Spec data flows through three linked tables:

```
spec_parameter (parameter catalogue — API gravity, sulphur %, GCV, purity %, etc.)
    └── product_spec_template (named spec per product — e.g. EN590_10PPM for ULSD)
            └── product_spec_value (min/max/typical bounds per parameter)
                    └── spec_override (pipeline or vessel tighter requirements) [future]
```

**Seeded standards** (V24):
| Template Code | Product | Standard |
|---|---|---|
| DTBRT_BFOE_STD | BRENT-CRUDE | BFOE MoU 2023 |
| WTI_NYMEX_STD | WTI-CRUDE | NYMEX Rule 200 |
| TTF_EFET_2020 | TTF-GAS | NTA 8000 / EFET 2020 |
| LME_CU_GRADE_A | LME-COPPER | LME Annex A / BS EN 1978 |
| EN590_10PPM | ULSD-10PPM | EN 590:2022+A1 |
| GAS97_INTERNAL | GAS97-BLEND | EN 228:2012 / Internal |

### Frontend — ProductsPage Quality Specs Tab
The `ProductsPage.tsx` drawer now has 4 tabs:
- **Details** — all product fields including `isBlend` switch and `blendNotes` (shown when blend enabled)
- **Price Indices** — link/unlink price index relationships
- **Markets** — read-only view of market listings
- **Quality Specs** — blend recipe (when `isBlend=true`) + spec template accordion with parameter bounds table

---

## 14b. UoM Conversion Architecture — Cross-Type Constraint

**Only same-type conversions belong in `uom_conversion`.**

| Same-type (stored in `uom_conversion`) | Cross-type (product-specific only) |
|---|---|
| VOLUME → VOLUME (BBL→GAL, BBL→CBM) | VOLUME → WEIGHT (BBL→MT requires density) |
| WEIGHT → WEIGHT (MT→KG, MT→LB) | VOLUME → ENERGY (SCM→MWH requires GCV) |
| ENERGY → ENERGY (MWH→MMBTU, MWH→GJ) | WEIGHT → ENERGY (not currently traded) |

Cross-type conversions (e.g. BBL↔MT, SCM↔MWH) are **not** stored as commodity-level defaults because the conversion factor differs for every product:

| Product | density (kg/m³) | 1 BBL → MT |
|---|---|---|
| Brent crude | ~833 | 0.13240 |
| WTI crude | ~825 | 0.13113 |
| ULSD | ~845 | 0.13432 |
| Fuel Oil 380 | ~990 | 0.15741 |

Instead, the position engine reads from the `product` table pricing basis fields:
- **OIL**: `density_estimate_kg_m3` / `density_base_kg_m3` → `MT = BBL × 0.158987 × density / 1000`
- **GAS**: `cv_gross_mj_scm` / `cv_net_mj_scm` → `MWH = SCM × cv_gross / 3600`; `MMBTU = SCM × cv_gross / 1055.056`

`density_estimate_kg_m3` is used for daily MTM; `density_base_kg_m3` is the reference/contract value for invoice settlement.

---

## 14c. Field-Level Permission Architecture (V26)

Two-layer model. Layer 1 always wins over Layer 2.

### Layer 1 — Object Lifecycle Locks (`object_lock_rule`)
Developer-owned, deployed via Flyway only. When an entity reaches a lifecycle state (CONFIRMED, MATURED, CLOSED, CANCELLED, INVOICED), specified fields are automatically locked to READ_ONLY or HIDDEN regardless of user role. Examples:
- Trade CONFIRMED → price, quantity, currency → READONLY
- Trade CLOSED → all fields → READONLY

### Layer 2 — Field Permission Profiles (`field_permission_profile` + `field_permission_rule`)
Client-admin-configurable via the **Field-Level Permissions** admin page. Profiles are scoped to one screen. Each profile assigns per-field access (EDIT / VIEW / HIDDEN) to a role. `is_required_field=1` fields cannot be set below VIEW by either layer.

**Merge rule**: `effective = min(Layer1, Layer2)` where HIDDEN < VIEW < EDIT.

### Frontend Hook
`useFieldPermissions(screenCode, roleIds)` → returns a map `fieldKey → AccessLevel`. Used by `PermissionField` wrapper component which renders fields as editable/read-only/hidden based on effective access level.

---

## 15. Script Execution Order (Legacy)

```
1.  etrm_master_data_v2.0.sql
2.  etrm_trader_patch_v2.1.sql
3.  etrm_market_source_period_v1.0.sql
4.  etrm_mpp_dates_patch_v1.1.sql
5.  etrm_product_spec_mot_pipeline_v1.0.sql
6.  etrm_financial_operational_md_v1.0.sql
7.  etrm_pricing_triggers_rules_v1.0.sql
8.  etrm_pricing_lifecycle_v1.0.sql
-- All now superseded by Flyway migrations V1–V23 above
```

---

*Document generated June 2026 — ETRM System Build Project*

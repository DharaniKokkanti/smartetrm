# ETRM System — Project Handoff Document
**Version:** 1.0 | **Date:** June 2026 | **Status:** Master Data Phase Complete

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

**Total: 116 tables across 9 scripts**

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
- `product` — tradeable products
- `uom_conversion` — explicit conversion factors between any two units
- `product_price_index` — valid price indices per product

**GROUP 6 — Commercial terms**
- `payment_term` — Net 30, Net 45, LC, prepayment etc. (seeded: 11 terms)
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

## 10. What's Been Built (Prototype)

**Master data GUI prototype** (React artifact) — tabbed interface covering:
- Legal entity management (add/edit/delete + Excel upload)
- Counterparty management with KYC status filter
- Trader management linked to legal entities
- Excel upload with duplicate rejection and row-level validation
- API call log panel showing all POST/PUT/DELETE calls
- Download template functionality

**Export files created:**
- `src/App.tsx` — main React app shell
- `src/services/api.ts` — complete API service layer with logging
- `src/services/upload.ts` — Excel parsing, validation, duplicate detection, template generation

---

## 11. What's Next (Trade Tables)

The immediate next step is the trade schema:

**`trade`** — base trade record (commodity-agnostic):
```
trade_id, trade_reference, trade_date, commodity_type, direction (BUY/SELL),
quantity, uom_id, price, currency_id, status, counterparty_id, trader_id,
book_id, legal_entity_id, product_id, market_id, pricing_rule_id,
incoterm_id, delivery_location_id, period_id, settlement_type,
trade_type (PHYSICAL/FINANCIAL/OPTION), parent_trade_id (for amendments)
```

**`trade_oil_detail`** — oil extension:
```
trade_id (FK, 1:1), crude_grade, api_gravity, sulphur_pct,
load_location_id, discharge_location_id, vessel_id,
laycan_start, laycan_end, bl_date, nors_tendered_date,
cod_date, pipeline_id, pipeline_point_id
```

**After trade tables:**
- Position engine schema
- Settlement / invoicing schema
- Spring Boot service layer (trade, position, risk)
- Python quant engine (curve building, MTM, VaR)
- React trade blotter UI

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

## 13. Script Execution Order

```
1.  etrm_master_data_v2.0.sql
2.  etrm_trader_patch_v2.1.sql
3.  etrm_market_source_period_v1.0.sql
4.  etrm_mpp_dates_patch_v1.1.sql
5.  etrm_product_spec_mot_pipeline_v1.0.sql
6.  etrm_financial_operational_md_v1.0.sql
7.  etrm_pricing_triggers_rules_v1.0.sql
8.  etrm_pricing_lifecycle_v1.0.sql
-- Next:
9.  etrm_trade_schema.sql              (not yet built)
10. etrm_position_schema.sql           (not yet built)
11. etrm_settlement_schema.sql         (not yet built)
```

---

*Document generated June 2026 — ETRM System Build Project*

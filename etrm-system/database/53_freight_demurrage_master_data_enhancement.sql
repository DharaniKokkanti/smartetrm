-- =============================================================================
-- V53 — Freight / Demurrage master data enhancement
-- =============================================================================
-- User audit request: "check the freight and demurrage master data, we're
-- missing a few key fields — build it clearly that works for all commodities
-- (oil, LNG, metals, power etc.)". Researched real-world charter party /
-- laytime / demurrage practice (BIMCO laytime definitions, NOR tendering
-- clauses, LNG heel/boil-off conventions, dry bulk stowage factor) and
-- compared against the existing V8 freight reference data + V4 vessel table.
--
-- Gaps found and fixed here:
--   1. freight_rate_index had NO CHECK constraint on commodity_type at all,
--      and its Baltic dry-bulk index seed rows (BDI/BPI/BSI/BHSI) were
--      wrongly tagged commodity_type = 'AGRICULTURAL' only — Baltic dry
--      indices price ANY dry-bulk cargo (iron ore/coal/grain), not just
--      agricultural. Added the canonical 11-value commodity_type CHECK
--      (same vocabulary as V47's book/desk/gl_account extension) and
--      broadened those 4 rows to NULL (= all applicable commodities).
--      Added an LNG freight assessment index (Spark Commodities' Spark30S)
--      since LNG had no freight benchmark at all.
--   2. laytime_term_template had no way to express the NOR-tendering
--      clauses (WIPON/WIBON/WIFPON/WCCON — "whether in port/berth/free
--      pratique/customs cleared or not") that determine WHEN laytime
--      actually starts counting — a well-documented, frequently-negotiated
--      charter party term that was simply missing. Also missing: the
--      notice period between NOR tender and laytime commencement (commonly
--      6 hours, or a fixed turn-time like "1300/0800 rule"), and any way to
--      flag a template as commodity-specific (LNG laytime conventions
--      differ materially from oil/dry-bulk — continuous SHINC counting and
--      boil-off-gas allowances during port stays are LNG-specific).
--   3. demurrage_dispatch_rate had no commodity_type at all — demurrage
--      rates vary by an order of magnitude between an LNG carrier
--      (~$100k+/day) and a dry-bulk carrier (~$15-20k/day), so a single
--      "vessel_type" dimension without commodity couldn't safely default
--      the right rate. Also missing two well-known, frequently-disputed
--      clause terms: the demurrage claim time-bar (claims are contractually
--      barred if not submitted with supporting laytime documents within an
--      agreed number of days — typically 90) and the despatch basis
--      (whether despatch money is paid on ALL laytime saved or only
--      WORKING-time saved — a real, commonly negotiated variance).
--   4. vessel had no dry-bulk stowage attributes (grain vs. bale capacity —
--      the two different capacity figures used for free-flowing vs. packed
--      dry cargo, which determine whether a vessel can lift the contractual
--      metals/agri cargo quantity) and no LNG-specific boil-off/heel
--      attributes (guaranteed daily boil-off rate and minimum heel volume
--      retained between voyages to avoid recooling the tanks).
--   5. No reference table existed for laytime exception reasons (weather,
--      strike, awaiting berth, breakdown, etc.) — the standard categories
--      laytime/demurrage calculations and disputes are built around,
--      commodity-agnostic. Added laytime_exception_type.
--   6. trade_freight_detail (the one transactional table that actually
--      captures a fixture) had a free-text charter_type enum totally
--      disconnected from the charter_party_type master table, and no link
--      to laytime_term_template or fixture-specific demurrage/dispatch
--      rates (which commonly override the standard defaults). Added the
--      FK + override columns so the master data added above is actually
--      usable from a real freight trade, not just decorative reference data.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 0. CHARTER_PARTY_TYPE — note LNG's standard voyage charter form (LNGVOY)
-- alongside the existing oil/dry-bulk forms, so the reference note doesn't
-- read as oil-only.
-- =============================================================================
UPDATE dbo.charter_party_type SET standard_form_reference = 'ASBATANKVOY / GENCON / LNGVOY (BIMCO)'
WHERE type_code = 'VOYAGE' AND standard_form_reference NOT LIKE '%LNGVOY%';
GO

-- =============================================================================
-- 1. FREIGHT_RATE_INDEX — commodity_type CHECK + seed corrections
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_fri_commodity_type')
  ALTER TABLE dbo.freight_rate_index ADD CONSTRAINT chk_fri_commodity_type
    CHECK (commodity_type IS NULL OR commodity_type IN (
      'OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'
    ));
GO

-- Baltic dry-bulk indices price any dry-bulk cargo, not agriculture specifically —
-- broaden to NULL (= applies across all dry-bulk commodities: metals/ore, coal, grain).
UPDATE dbo.freight_rate_index SET commodity_type = NULL WHERE index_code IN ('BDI','BPI','BSI','BHSI');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.freight_rate_index WHERE index_code = 'SPARK30S')
INSERT INTO dbo.freight_rate_index (index_code, index_name, index_type, vessel_type, route_description, commodity_type, publication_source, publication_frequency, description, created_by, updated_by)
VALUES
    ('SPARK30S', 'Spark30S — LNG Freight Assessment (Atlantic)', 'ASSESSED', 'LNG_CARRIER', 'US Gulf-Continent / Atlantic LNG routes', 'LNG', 'Spark Commodities', 'DAILY', 'Daily-assessed LNG spot freight rate in USD/day for a 174,000cbm 2-stroke LNG carrier — the LNG market''s equivalent of a Baltic index.', 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 2. LAYTIME_TERM_TEMPLATE — NOR tendering basis, notice period, commodity
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.laytime_term_template') AND name = 'nor_wipon_allowed')
  ALTER TABLE dbo.laytime_term_template ADD
    nor_wipon_allowed   BIT             NOT NULL DEFAULT 0,  -- Whether In Port Or Not
    nor_wibon_allowed   BIT             NOT NULL DEFAULT 0,  -- Whether In Berth Or Not
    nor_wifpon_allowed  BIT             NOT NULL DEFAULT 0,  -- Whether In Free Pratique Or Not
    nor_wccon_allowed   BIT             NOT NULL DEFAULT 0,  -- Whether Customs Cleared Or Not
    notice_period_hours DECIMAL(5,2)    NULL,                -- hours from NOR tender/acceptance to laytime commencement
    commodity_type      VARCHAR(20)     NULL;                -- NULL = generic/all commodities
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_ltt_commodity_type')
  ALTER TABLE dbo.laytime_term_template ADD CONSTRAINT chk_ltt_commodity_type
    CHECK (commodity_type IS NULL OR commodity_type IN (
      'OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'
    ));
GO

-- Typical tanker/dry-bulk NOR practice: WIPON+WIBON+WIFPON+WCCON commonly bundled
-- in modern voyage charters (ASBATANKVOY/GENCON riders); 6-hour notice is standard.
UPDATE dbo.laytime_term_template
SET nor_wipon_allowed = 1, nor_wibon_allowed = 1, nor_wifpon_allowed = 1, nor_wccon_allowed = 1, notice_period_hours = 6
WHERE term_code IN ('SHEX','SHEXEIU','SHEXUU','WWDSHEXUU','WWD_REV');
GO
-- SHINC (no exclusions) and plain WWD are more commonly used on stricter/older
-- forms without the full WWWW bundle — leave their NOR flags at the default 0.

IF NOT EXISTS (SELECT 1 FROM dbo.laytime_term_template WHERE term_code = 'LNG_SHINC')
INSERT INTO dbo.laytime_term_template (term_code, term_name, exclusion_basis, is_reversible, nor_wipon_allowed, nor_wibon_allowed, nor_wifpon_allowed, nor_wccon_allowed, notice_period_hours, commodity_type, description, created_by, updated_by)
VALUES
    ('LNG_SHINC', 'LNG Standard — SHINC, Non-Reversible', 'SHINC', 0, 1, 1, 1, 1, 6, 'LNG', 'Standard LNG carrier laytime convention: continuous SHINC counting (LNG terminals operate 24/7 year-round) with the full WIPON/WIBON/WIFPON/WCCON NOR bundle and a 6-hour notice period. Laytime/demurrage calculations must additionally account for boil-off gas during port stays per the charter party''s BOG clause.', 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 3. DEMURRAGE_DISPATCH_RATE — commodity_type, claim time-bar, despatch basis
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.demurrage_dispatch_rate') AND name = 'commodity_type')
  ALTER TABLE dbo.demurrage_dispatch_rate ADD
    commodity_type       VARCHAR(20)     NULL,               -- NULL = generic/all commodities
    claim_time_bar_days  SMALLINT        NULL,                -- days to submit a demurrage claim with full supporting docs before it is time-barred
    despatch_basis       VARCHAR(30)     NULL;                -- ALL_TIME_SAVED | WORKING_TIME_SAVED_ONLY
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_ddr_commodity_type')
  ALTER TABLE dbo.demurrage_dispatch_rate ADD CONSTRAINT chk_ddr_commodity_type
    CHECK (commodity_type IS NULL OR commodity_type IN (
      'OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'
    ));
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_ddr_despatch_basis')
  ALTER TABLE dbo.demurrage_dispatch_rate ADD CONSTRAINT chk_ddr_despatch_basis
    CHECK (despatch_basis IS NULL OR despatch_basis IN ('ALL_TIME_SAVED','WORKING_TIME_SAVED_ONLY'));
GO

-- Existing 5 rows are all oil tanker classes — backfill commodity_type + the
-- BIMCO/Gencon-standard 90-day claim time bar and all-time-saved despatch basis.
UPDATE dbo.demurrage_dispatch_rate
SET commodity_type = 'OIL', claim_time_bar_days = 90, despatch_basis = 'ALL_TIME_SAVED'
WHERE vessel_type IN ('VLCC','SUEZMAX','AFRAMAX','PANAMAX','MR_TANKER') AND commodity_type IS NULL;
GO

INSERT INTO dbo.demurrage_dispatch_rate (vessel_type, charter_party_type_id, demurrage_rate_per_day, dispatch_rate_per_day, currency_id, commodity_type, claim_time_bar_days, despatch_basis, effective_from, notes, created_by, updated_by)
SELECT v.vessel_type, cpt.charter_party_type_id, v.demurrage, v.dispatch, c.currency_id, v.commodity_type, 90, 'ALL_TIME_SAVED', '2026-01-01', 'Indicative default — confirm against fixture recap before use.', 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('LNG_CARRIER',  'TC',     'LNG',    100000.00, 50000.00),
    ('BULK_CARRIER', 'VOYAGE', 'METALS', 18000.00,  9000.00)
) AS v(vessel_type, cp_code, commodity_type, demurrage, dispatch)
CROSS JOIN (SELECT charter_party_type_id, type_code FROM dbo.charter_party_type) cpt
CROSS JOIN (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD') c
WHERE cpt.type_code = v.cp_code
  AND NOT EXISTS (SELECT 1 FROM dbo.demurrage_dispatch_rate d WHERE d.vessel_type = v.vessel_type AND d.commodity_type = v.commodity_type);
GO

-- =============================================================================
-- 4. VESSEL — dry-bulk stowage capacity + LNG boil-off/heel attributes
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.vessel') AND name = 'grain_capacity_cbm')
  ALTER TABLE dbo.vessel ADD
    grain_capacity_cbm                  DECIMAL(12,2)  NULL,  -- dry-bulk: capacity for free-flowing cargo (grain, most ores)
    bale_capacity_cbm                    DECIMAL(12,2)  NULL,  -- dry-bulk: capacity for packed/bagged cargo (always <= grain capacity)
    guaranteed_boil_off_rate_pct_per_day DECIMAL(5,3)   NULL,  -- LNG: contractually guaranteed max daily boil-off, e.g. 0.100 = 0.10%/day
    heel_capacity_cbm                    DECIMAL(10,2)  NULL;  -- LNG: minimum LNG volume retained on board between voyages to keep cargo tanks cold
GO

-- =============================================================================
-- 5. LAYTIME_EXCEPTION_TYPE — new reference table
-- Standard categories used to classify time during laytime/demurrage
-- calculation and disputes. Whether a given category actually counts against
-- laytime is set per-fixture in the charter party — the flag here is only an
-- indicative default. Commodity-agnostic: applies identically to oil, LNG,
-- dry bulk (metals/agri) and any other vessel-carried commodity.
-- =============================================================================
IF OBJECT_ID('dbo.laytime_exception_type', 'U') IS NOT NULL DROP TABLE dbo.laytime_exception_type;
GO

CREATE TABLE dbo.laytime_exception_type (
    exception_type_id                INT             NOT NULL IDENTITY(1,1),
    exception_code                     VARCHAR(30)     NOT NULL,
    exception_name                       VARCHAR(150)    NOT NULL,
    default_counts_against_laytime         BIT             NOT NULL DEFAULT 1,
    -- Indicative default only — the actual answer is negotiated per fixture
    -- and depends on the laytime_term_template in force (e.g. WWD excludes
    -- weather delays entirely; SHINC counts everything regardless).
    is_weather_related                       BIT             NOT NULL DEFAULT 0,
    description                                VARCHAR(300)    NULL,
    is_active                                    BIT             NOT NULL DEFAULT 1,
    created_at                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                       VARCHAR(100)    NOT NULL,
    updated_at                                         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                           VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_laytime_exception_type   PRIMARY KEY (exception_type_id),
    CONSTRAINT uq_let_code                   UNIQUE      (exception_code)
);
GO

INSERT INTO dbo.laytime_exception_type (exception_code, exception_name, default_counts_against_laytime, is_weather_related, description, created_by, updated_by)
VALUES
    ('WEATHER',               'Adverse Weather',            0, 1, 'Cargo work suspended due to weather (rain, high seas, wind) — excepted under Weather Working Days (WWD) templates.', 'SYSTEM', 'SYSTEM'),
    ('STRIKE',                'Strike / Labour Action',     0, 0, 'Cargo work stopped by a strike at the port, terminal, or aboard the vessel.', 'SYSTEM', 'SYSTEM'),
    ('BREAKDOWN',              'Equipment Breakdown',        0, 0, 'Ship''s gear, shore crane, pump, or loading arm breakdown halting cargo operations.', 'SYSTEM', 'SYSTEM'),
    ('AWAITING_BERTH',          'Awaiting Berth',              1, 0, 'Vessel waiting for a berth to become available after NOR tender — counts against laytime unless the charter party is berth (not port) charter.', 'SYSTEM', 'SYSTEM'),
    ('AWAITING_INSTRUCTIONS',    'Awaiting Charterer Instructions', 1, 0, 'Vessel idle awaiting discharge/loading instructions from the charterer or receiver.', 'SYSTEM', 'SYSTEM'),
    ('HOLIDAY',                   'Sunday / Holiday',             0, 0, 'Sunday or officially recognised holiday — excepted under SHEX-family templates, counts under SHINC.', 'SYSTEM', 'SYSTEM'),
    ('PORT_CONGESTION',            'Port Congestion',              1, 0, 'General port congestion delaying berthing or cargo operations, not attributable to either party.', 'SYSTEM', 'SYSTEM'),
    ('INSPECTION_DELAY',             'Inspection / Survey Delay',     0, 0, 'Delay for customs, quality, quantity, or regulatory inspection/survey before cargo work can proceed.', 'SYSTEM', 'SYSTEM'),
    ('BOG_MANAGEMENT',                 'Boil-Off Gas Management',       0, 0, 'LNG-specific: time spent managing boil-off gas beyond the guaranteed rate, cooldown, or heel adjustment at the load/discharge port.', 'SYSTEM', 'SYSTEM'),
    ('FORCE_MAJEURE',                    'Force Majeure',                 0, 0, 'War, blockade, pandemic-related port closure, or other force majeure event outside either party''s control.', 'SYSTEM', 'SYSTEM'),
    ('OTHER',                              'Other',                         1, 0, 'Other exception reason — see notes on the specific laytime/demurrage record.', 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 6. TRADE_FREIGHT_DETAIL — connect the master data to the real fixture record
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_freight_detail') AND name = 'charter_party_type_id')
  ALTER TABLE dbo.trade_freight_detail ADD
    charter_party_type_id   INT             NULL,
    laytime_term_id           INT             NULL,
    demurrage_rate_per_day      DECIMAL(14,2)   NULL,  -- fixture-negotiated rate; overrides demurrage_dispatch_rate default when set
    dispatch_rate_per_day         DECIMAL(14,2)   NULL,
    CONSTRAINT fk_tfd_charter_party_type FOREIGN KEY (charter_party_type_id) REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_tfd_laytime_term       FOREIGN KEY (laytime_term_id)       REFERENCES dbo.laytime_term_template(laytime_term_id);
GO

-- =============================================================================
-- 7. MASTER DATA TABLE REGISTRY — register the newly-surfaced tables
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'freight_rate_index')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('freight_rate_index', 'Freight Rate Indices', 'Freight & Shipping', 1, 1, 1, 0, 2, 'SYSTEM', 'SYSTEM');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'laytime_term_template')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('laytime_term_template', 'Laytime Term Templates', 'Freight & Shipping', 1, 1, 1, 0, 3, 'SYSTEM', 'SYSTEM');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'demurrage_dispatch_rate')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('demurrage_dispatch_rate', 'Demurrage & Dispatch Rates', 'Freight & Shipping', 1, 1, 1, 0, 4, 'SYSTEM', 'SYSTEM');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'laytime_exception_type')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('laytime_exception_type', 'Laytime Exception Types', 'Freight & Shipping', 1, 1, 1, 0, 5, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V53 — FREIGHT / DEMURRAGE MASTER DATA ENHANCEMENT APPLIED';
PRINT '  freight_rate_index      — commodity_type CHECK added; BDI/BPI/BSI/BHSI';
PRINT '                            broadened to all-dry-bulk (not agri-only);';
PRINT '                            SPARK30S LNG freight index added.';
PRINT '  laytime_term_template   — NOR WIPON/WIBON/WIFPON/WCCON flags,';
PRINT '                            notice_period_hours, commodity_type added;';
PRINT '                            LNG_SHINC template added.';
PRINT '  demurrage_dispatch_rate — commodity_type, claim_time_bar_days,';
PRINT '                            despatch_basis added; LNG_CARRIER +';
PRINT '                            BULK_CARRIER(METALS) rows added.';
PRINT '  vessel                  — grain/bale capacity (dry bulk), guaranteed';
PRINT '                            boil-off rate + heel capacity (LNG) added.';
PRINT '  laytime_exception_type  — NEW reference table, 11 rows seeded.';
PRINT '  trade_freight_detail    — charter_party_type_id + laytime_term_id FKs,';
PRINT '                            fixture-level demurrage/dispatch overrides.';
PRINT '  master_data_table_registry — freight_rate_index, laytime_term_template,';
PRINT '                            demurrage_dispatch_rate, laytime_exception_type';
PRINT '                            registered under Freight & Shipping.';
PRINT '============================================================';
GO

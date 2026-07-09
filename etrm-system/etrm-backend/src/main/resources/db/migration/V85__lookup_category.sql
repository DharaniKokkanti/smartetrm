-- =============================================================================
-- V85 — dbo.lookup_category: a real category master for dbo.lookup_value,
-- replacing its free-text, unconstrained category column with a proper FK
-- =============================================================================
-- dbo.lookup_value has always stored `category` as a plain VARCHAR — nothing
-- stopped a typo'd category string, and there was no place to list "what
-- categories exist" independent of scanning distinct values in the value
-- table itself. This migration:
--   0a. Redirects dbo.book.book_type off dbo.lookup_value and onto the real,
--       pre-existing dedicated dbo.book_type table (V17) it should always
--       have used. V17 built book_type as a proper dedicated table, but V55
--       wired the actual book.book_type column to dbo.lookup_value instead —
--       book_type is the one exception among V17's 13 pairs (the other 12
--       finished pointing at their real dedicated tables in V78); the
--       dedicated table has sat orphaned/unused ever since, duplicating the
--       same 6 values (TRADING/HEDGING/ARBITRAGE/PROP/CLIENT/RISK_MGMT) that
--       lookup_value's 'book_type' category also carried.
--   0b. Builds a new dedicated dbo.commodity_type table and redirects all 11
--       tables that reference commodity_type off dbo.lookup_value onto it
--       (desk, book, gl_account, period, period_mapping, unit_of_measure,
--       location_type, trader_commodity_limit, freight_rate_index,
--       laytime_term_template, demurrage_dispatch_rate). Reverses V58's
--       prior decision to leave this one in lookup_value — user's explicit
--       call this time: heavy reuse across many tables doesn't disqualify a
--       concept from having its own dedicated table, it was just never one
--       of V17's original 13. Unlike book_type there was no orphaned
--       competing table sitting around; this one is built fresh.
--       Both 0a and 0b run before step 1's backfill, so 'book_type' and
--       'commodity_type' are never picked up as lookup_categories at all.
--   1. Creates dbo.lookup_category (the category master — code, name,
--      description, manageable from the Static Data GUI).
--   2. Converts dbo.lookup_value.category from free text to a real FK
--      (category_id -> lookup_category).
--   3. Removes 4 dead category's worth of lookup_value rows
--      (emission_scheme_type, carbon_registry_type, environmental_
--      product_type, emission_obligation_status) seeded back in V36. V83
--      later built dedicated tables for those same 4 concepts and rewired
--      the real consuming columns (emission_scheme.scheme_type etc.) to
--      point at the new dedicated tables instead — so these 4 categories'
--      lookup_value rows have had nothing referencing them since V83 ran.
--      NOTE: V83's dedicated tables themselves are NOT touched by this
--      migration — this only removes the now-unreferenced leftover rows in
--      lookup_value, the general-purpose table, not any dedicated table.
--   4. Creates dbo.lookup_category_binding — a registry of which
--      table.column consumes which category. One category can be bound to
--      many different tables; a given table.column is bound to exactly one
--      category. This lets the generic reference-data GUI know which
--      category to filter lookup_value by when populating a dropdown for a
--      given FK column, since lookup_value is a shared target for many
--      categories.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 0a. dbo.book.book_type: redirect lookup_value -> dbo.book_type ───────────
ALTER TABLE dbo.book ADD book_type_new INT NULL;
GO
UPDATE b
SET    b.book_type_new = bt.book_type_id
FROM   dbo.book b
JOIN   dbo.lookup_value lv ON lv.lookup_id = b.book_type
JOIN   dbo.book_type bt    ON bt.type_code = lv.code
WHERE  lv.category = 'book_type';
GO
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS fk_book_book_type;
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS df_book_book_type;
ALTER TABLE dbo.book DROP COLUMN book_type;
GO
EXEC sp_rename 'dbo.book.book_type_new', 'book_type', 'COLUMN';
GO
ALTER TABLE dbo.book ALTER COLUMN book_type INT NOT NULL;
GO
ALTER TABLE dbo.book ADD CONSTRAINT fk_book_book_type FOREIGN KEY (book_type) REFERENCES dbo.book_type(book_type_id);
GO
-- Now-orphaned lookup_value rows for the category — delete before step 1's
-- backfill so 'book_type' never becomes a lookup_category at all.
DELETE FROM dbo.lookup_value WHERE category = 'book_type';
GO

-- ── 0b. dbo.commodity_type: new dedicated table, pulled OUT of lookup_value ──
CREATE TABLE dbo.commodity_type (
    commodity_type_id INT          NOT NULL IDENTITY(1,1),
    type_code          VARCHAR(50)  NOT NULL,
    type_name          VARCHAR(100) NOT NULL,
    description        VARCHAR(500) NULL,
    sort_order         SMALLINT     NOT NULL DEFAULT 0,
    is_active          BIT          NOT NULL DEFAULT 1,
    created_at         DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         VARCHAR(100) NOT NULL,
    updated_at         DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by         VARCHAR(100) NOT NULL,
    CONSTRAINT pk_commodity_type      PRIMARY KEY (commodity_type_id),
    CONSTRAINT uq_commodity_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_commodity_type_active ON dbo.commodity_type (is_active, sort_order);
GO
INSERT INTO dbo.commodity_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('OIL',           'Oil',             'Crude oil and refined petroleum products.',        1,  'SYSTEM', 'SYSTEM'),
    ('GAS',           'Gas',             'Pipeline natural gas.',                            2,  'SYSTEM', 'SYSTEM'),
    ('POWER',         'Power',           'Wholesale electricity.',                           3,  'SYSTEM', 'SYSTEM'),
    ('LNG',           'LNG',             'Liquefied natural gas.',                           4,  'SYSTEM', 'SYSTEM'),
    ('AGRICULTURAL',  'Agricultural',    'Grains, oilseeds, and soft commodities.',          5,  'SYSTEM', 'SYSTEM'),
    ('METALS',        'Metals',          'Base and precious metals.',                        6,  'SYSTEM', 'SYSTEM'),
    ('FREIGHT',       'Freight',         'Vessel charter and freight contracts.',            7,  'SYSTEM', 'SYSTEM'),
    ('RINS',          'RINs',            'Renewable Identification Numbers (RFS).',          8,  'SYSTEM', 'SYSTEM'),
    ('ENVIRONMENTAL', 'Environmental',   'Emissions, carbon, and environmental products.',   9,  'SYSTEM', 'SYSTEM'),
    ('MULTI',         'Multi-Commodity', 'Spans more than one commodity sector.',            10, 'SYSTEM', 'SYSTEM'),
    ('OTHER',         'Other',           'Sector not covered by the classifications above.', 11, 'SYSTEM', 'SYSTEM');
GO

-- unit_of_measure.commodity_type (nullable)
ALTER TABLE dbo.unit_of_measure ADD commodity_type_new INT NULL;
GO
UPDATE u SET u.commodity_type_new = ct.commodity_type_id
FROM   dbo.unit_of_measure u
JOIN   dbo.lookup_value lv ON lv.lookup_id = u.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.unit_of_measure DROP CONSTRAINT IF EXISTS fk_uom_commodity_type;
ALTER TABLE dbo.unit_of_measure DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.unit_of_measure.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.unit_of_measure ADD CONSTRAINT fk_uom_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- location_type.commodity_type (nullable)
ALTER TABLE dbo.location_type ADD commodity_type_new INT NULL;
GO
UPDATE t SET t.commodity_type_new = ct.commodity_type_id
FROM   dbo.location_type t
JOIN   dbo.lookup_value lv ON lv.lookup_id = t.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.location_type DROP CONSTRAINT IF EXISTS fk_loctype_commodity_type;
ALTER TABLE dbo.location_type DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.location_type.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.location_type ADD CONSTRAINT fk_loctype_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- desk.commodity_type (nullable)
ALTER TABLE dbo.desk ADD commodity_type_new INT NULL;
GO
UPDATE d SET d.commodity_type_new = ct.commodity_type_id
FROM   dbo.desk d
JOIN   dbo.lookup_value lv ON lv.lookup_id = d.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.desk DROP CONSTRAINT IF EXISTS fk_desk_commodity_type;
ALTER TABLE dbo.desk DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.desk.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.desk ADD CONSTRAINT fk_desk_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- book.commodity_type (NOT NULL; ix_book_entity indexes it, drop/recreate)
ALTER TABLE dbo.book ADD commodity_type_new INT NULL;
GO
UPDATE b SET b.commodity_type_new = ct.commodity_type_id
FROM   dbo.book b
JOIN   dbo.lookup_value lv ON lv.lookup_id = b.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
DROP INDEX IF EXISTS ix_book_entity ON dbo.book;
GO
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS fk_book_commodity_type;
ALTER TABLE dbo.book DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.book.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.book ALTER COLUMN commodity_type INT NOT NULL;
GO
ALTER TABLE dbo.book ADD CONSTRAINT fk_book_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO
CREATE INDEX ix_book_entity ON dbo.book (legal_entity_id, commodity_type, is_active);
GO

-- gl_account.commodity_type (nullable)
ALTER TABLE dbo.gl_account ADD commodity_type_new INT NULL;
GO
UPDATE g SET g.commodity_type_new = ct.commodity_type_id
FROM   dbo.gl_account g
JOIN   dbo.lookup_value lv ON lv.lookup_id = g.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.gl_account DROP CONSTRAINT IF EXISTS fk_gl_account_commodity_type;
ALTER TABLE dbo.gl_account DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.gl_account.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.gl_account ADD CONSTRAINT fk_gl_account_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- trader_commodity_limit.commodity_type (NOT NULL; UNIQUE(trader_id, commodity_type))
ALTER TABLE dbo.trader_commodity_limit ADD commodity_type_new INT NULL;
GO
UPDATE t SET t.commodity_type_new = ct.commodity_type_id
FROM   dbo.trader_commodity_limit t
JOIN   dbo.lookup_value lv ON lv.lookup_id = t.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.trader_commodity_limit DROP CONSTRAINT IF EXISTS fk_tcl_commodity_type;
ALTER TABLE dbo.trader_commodity_limit DROP CONSTRAINT IF EXISTS uq_tcl_trader_commodity;
ALTER TABLE dbo.trader_commodity_limit DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.trader_commodity_limit.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.trader_commodity_limit ALTER COLUMN commodity_type INT NOT NULL;
GO
ALTER TABLE dbo.trader_commodity_limit ADD CONSTRAINT fk_tcl_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
ALTER TABLE dbo.trader_commodity_limit ADD CONSTRAINT uq_tcl_trader_commodity UNIQUE (trader_id, commodity_type);
GO

-- freight_rate_index.commodity_type (nullable)
ALTER TABLE dbo.freight_rate_index ADD commodity_type_new INT NULL;
GO
UPDATE f SET f.commodity_type_new = ct.commodity_type_id
FROM   dbo.freight_rate_index f
JOIN   dbo.lookup_value lv ON lv.lookup_id = f.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.freight_rate_index DROP CONSTRAINT IF EXISTS fk_fri_commodity_type;
ALTER TABLE dbo.freight_rate_index DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.freight_rate_index.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.freight_rate_index ADD CONSTRAINT fk_fri_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- laytime_term_template.commodity_type (nullable)
ALTER TABLE dbo.laytime_term_template ADD commodity_type_new INT NULL;
GO
UPDATE l SET l.commodity_type_new = ct.commodity_type_id
FROM   dbo.laytime_term_template l
JOIN   dbo.lookup_value lv ON lv.lookup_id = l.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.laytime_term_template DROP CONSTRAINT IF EXISTS fk_ltt_commodity_type;
ALTER TABLE dbo.laytime_term_template DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.laytime_term_template.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.laytime_term_template ADD CONSTRAINT fk_ltt_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- demurrage_dispatch_rate.commodity_type (nullable)
ALTER TABLE dbo.demurrage_dispatch_rate ADD commodity_type_new INT NULL;
GO
UPDATE d SET d.commodity_type_new = ct.commodity_type_id
FROM   dbo.demurrage_dispatch_rate d
JOIN   dbo.lookup_value lv ON lv.lookup_id = d.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
ALTER TABLE dbo.demurrage_dispatch_rate DROP CONSTRAINT IF EXISTS fk_ddr_commodity_type;
ALTER TABLE dbo.demurrage_dispatch_rate DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.demurrage_dispatch_rate.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.demurrage_dispatch_rate ADD CONSTRAINT fk_ddr_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id);
GO

-- period.commodity_type (nullable; UNIQUE(period_code, commodity_type) + 5 indexes)
ALTER TABLE dbo.period ADD commodity_type_new INT NULL;
GO
UPDATE p SET p.commodity_type_new = ct.commodity_type_id
FROM   dbo.period p
JOIN   dbo.lookup_value lv ON lv.lookup_id = p.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
DROP INDEX IF EXISTS ix_period_comm_type ON dbo.period;
DROP INDEX IF EXISTS ix_period_dates     ON dbo.period;
DROP INDEX IF EXISTS ix_period_rolling   ON dbo.period;
DROP INDEX IF EXISTS ix_period_trading   ON dbo.period;
DROP INDEX IF EXISTS ix_period_risk      ON dbo.period;
GO
ALTER TABLE dbo.period DROP CONSTRAINT IF EXISTS fk_period_commodity_type;
ALTER TABLE dbo.period DROP CONSTRAINT IF EXISTS uq_period_code_comm;
ALTER TABLE dbo.period DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.period.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.period ADD
    CONSTRAINT fk_period_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id),
    CONSTRAINT uq_period_code_comm      UNIQUE (period_code, commodity_type);
GO
CREATE INDEX ix_period_comm_type ON dbo.period (commodity_type, period_type, is_active);
CREATE INDEX ix_period_dates     ON dbo.period (period_start, period_end, commodity_type)
    WHERE period_start IS NOT NULL;
CREATE INDEX ix_period_rolling   ON dbo.period (is_rolling, commodity_type, is_active)
    WHERE is_rolling = 1;
CREATE INDEX ix_period_trading   ON dbo.period (is_trading_period, commodity_type, is_active)
    WHERE is_trading_period = 1;
CREATE INDEX ix_period_risk      ON dbo.period (is_risk_period, commodity_type, is_active)
    WHERE is_risk_period = 1;
GO

-- period_mapping.commodity_type (nullable; composite UNIQUE + index)
ALTER TABLE dbo.period_mapping ADD commodity_type_new INT NULL;
GO
UPDATE m SET m.commodity_type_new = ct.commodity_type_id
FROM   dbo.period_mapping m
JOIN   dbo.lookup_value lv ON lv.lookup_id = m.commodity_type
JOIN   dbo.commodity_type ct ON ct.type_code = lv.code
WHERE  lv.category = 'commodity_type';
GO
DROP INDEX IF EXISTS ix_pm_parent ON dbo.period_mapping;
GO
ALTER TABLE dbo.period_mapping DROP CONSTRAINT IF EXISTS fk_pm_commodity_type;
ALTER TABLE dbo.period_mapping DROP CONSTRAINT IF EXISTS uq_period_mapping;
ALTER TABLE dbo.period_mapping DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.period_mapping.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.period_mapping ADD
    CONSTRAINT fk_pm_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id),
    CONSTRAINT uq_period_mapping    UNIQUE (parent_period_id, child_period_id, commodity_type, effective_from);
GO
CREATE INDEX ix_pm_parent ON dbo.period_mapping (parent_period_id, is_active, commodity_type);
GO

-- Now-orphaned lookup_value rows for the category — delete before step 1's
-- backfill so 'commodity_type' never becomes a lookup_category at all.
DELETE FROM dbo.lookup_value WHERE category = 'commodity_type';
GO

-- Register the new dedicated table in the Static Data GUI
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('commodity_type', 'Commodity Types', 'Products & Markets', 1, 1, 0, 0, 9, 'SYSTEM', 'SYSTEM');
GO

-- ── 1. lookup_category ───────────────────────────────────────────────────────
CREATE TABLE dbo.lookup_category (
    category_id   INT          NOT NULL IDENTITY(1,1),
    category_code VARCHAR(100) NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    description   VARCHAR(500) NULL,
    sort_order    SMALLINT     NOT NULL DEFAULT 0,
    is_active     BIT          NOT NULL DEFAULT 1,
    created_at    DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    VARCHAR(100) NOT NULL,
    updated_at    DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by    VARCHAR(100) NOT NULL,
    CONSTRAINT pk_lookup_category      PRIMARY KEY (category_id),
    CONSTRAINT uq_lookup_category_code UNIQUE      (category_code)
);
GO
CREATE INDEX ix_lookup_category_active ON dbo.lookup_category (is_active, sort_order);
GO

-- Codes are always stored UPPER_SNAKE_CASE, matching every other code/
-- type_code column in this schema (source data has mixed casing —
-- REPORTING_CLASSIFICATION_TYPE was already upper, the rest were lower —
-- UPPER() normalizes both onto the same convention).
INSERT INTO dbo.lookup_category (category_code, category_name, created_by, updated_by)
SELECT DISTINCT UPPER(category), UPPER(category), 'SYSTEM', 'SYSTEM'
FROM dbo.lookup_value;
GO

-- Friendlier category_name + description for the 10 categories with real,
-- active FK consumers today (see lookup_category_binding, step 4 below). The
-- 7 V49/V50 backlog categories (BREACH_ACTION, COUNTRY_RISK_RATING,
-- CREDIT_ALERT_TYPE, INSTRUMENT_CLASS, LIMIT_BASIS, REVIEW_OUTCOME,
-- GL_NORMAL_BALANCE) keep name = code, same as before — not yet wired to any
-- FK column, so a curated label isn't worth writing until they are.
UPDATE dbo.lookup_category SET category_name = 'Reporting Classification Type', description = 'Independent per-report classification axes for Reporting Groups — Position, VaR, Settlement/GL.'                          WHERE category_code = 'REPORTING_CLASSIFICATION_TYPE';
UPDATE dbo.lookup_category SET category_name = 'Operator Type',                 description = 'Transport operator roles — shipping line, ship manager, haulier, rail/pipeline/terminal operator.'                    WHERE category_code = 'OPERATOR_TYPE';
UPDATE dbo.lookup_category SET category_name = 'Instrument Type',               description = 'Trade instrument classification — physical, forward, futures, swap, option, storage/transport agreement.'              WHERE category_code = 'INSTRUMENT_TYPE';
UPDATE dbo.lookup_category SET category_name = 'Storage Agreement Type',        description = 'Storage deal sub-types — tank lease, throughput, terminalling, working/cushion gas, LNG slot.'                            WHERE category_code = 'STORAGE_AGREEMENT_TYPE';
UPDATE dbo.lookup_category SET category_name = 'Transport Agreement Type',      description = 'Transport deal sub-types — voyage/time/bareboat charter, COA, pipeline capacity, truck/rail/barge spot.'                    WHERE category_code = 'TRANSPORT_AGREEMENT_TYPE';
UPDATE dbo.lookup_category SET category_name = 'Price Adjustment Type',         description = 'Order-level price adjustments — quality differentials, treatment/refining charges, tax, markup, FX.'                      WHERE category_code = 'PRICE_ADJUSTMENT_TYPE';
UPDATE dbo.lookup_category SET category_name = 'Demurrage Basis',               description = 'How demurrage/dispatch is calculated across multiple load/discharge ports — reversible, non-reversible, averaged.'         WHERE category_code = 'DEMURRAGE_BASIS';
UPDATE dbo.lookup_category SET category_name = 'GL Account Type',               description = 'General ledger account classification — revenue, cost, asset, liability, equity, P&L.'                                    WHERE category_code = 'GL_ACCOUNT_TYPE';
UPDATE dbo.lookup_category SET category_name = 'RIN Transaction Type',          description = 'RFS RIN lifecycle transaction types — generate, separate, transfer, retire.'                                              WHERE category_code = 'RIN_TRANSACTION_TYPE';
UPDATE dbo.lookup_category SET category_name = 'RIN Obligation Status',         description = 'RVO compliance obligation status — open, partially satisfied, satisfied, overdue.'                                         WHERE category_code = 'RIN_OBLIGATION_STATUS';
GO

-- ── 2. dbo.lookup_value.category: free text -> real FK ───────────────────────
ALTER TABLE dbo.lookup_value ADD category_id INT NULL;
GO
UPDATE lv
SET    lv.category_id = lc.category_id
FROM   dbo.lookup_value lv
JOIN   dbo.lookup_category lc ON lc.category_code = UPPER(lv.category);
GO
ALTER TABLE dbo.lookup_value DROP COLUMN category;
GO
ALTER TABLE dbo.lookup_value ALTER COLUMN category_id INT NOT NULL;
GO
ALTER TABLE dbo.lookup_value
    ADD CONSTRAINT fk_lookup_value_category FOREIGN KEY (category_id) REFERENCES dbo.lookup_category(category_id);
GO
CREATE INDEX ix_lookup_value_category ON dbo.lookup_value (category_id, is_active, sort_order);
GO

-- ── 3. Dead-row cleanup — 4 categories fully superseded by V83's dedicated
--    tables (real duplication found via review of 36_carbon_environmental.sql;
--    V83 itself is untouched, only these now-unreferenced lookup_value rows
--    and their empty category headers are removed) ───────────────────────────
DELETE lv
FROM   dbo.lookup_value lv
JOIN   dbo.lookup_category lc ON lc.category_id = lv.category_id
WHERE  lc.category_code IN ('emission_scheme_type', 'carbon_registry_type', 'environmental_product_type', 'emission_obligation_status');
GO
DELETE FROM dbo.lookup_category
WHERE  category_code IN ('emission_scheme_type', 'carbon_registry_type', 'environmental_product_type', 'emission_obligation_status');
GO

-- ── 4. lookup_category_binding — which table.column consumes which category ──
CREATE TABLE dbo.lookup_category_binding (
    binding_id  INT          NOT NULL IDENTITY(1,1),
    category_id INT          NOT NULL,
    table_name  VARCHAR(128) NOT NULL,
    column_name VARCHAR(128) NOT NULL,
    is_active   BIT          NOT NULL DEFAULT 1,
    created_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  VARCHAR(100) NOT NULL,
    updated_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by  VARCHAR(100) NOT NULL,
    CONSTRAINT pk_lookup_category_binding PRIMARY KEY (binding_id),
    CONSTRAINT uq_lookup_category_binding UNIQUE (table_name, column_name),
    CONSTRAINT fk_lcb_category FOREIGN KEY (category_id) REFERENCES dbo.lookup_category(category_id)
);
GO
CREATE INDEX ix_lookup_category_binding_category ON dbo.lookup_category_binding (category_id, is_active);
GO

-- Seed with every column that is still a real FK to lookup_value today
-- (V63, V77, V81, V84 — V55/V57's commodity_type/book_type columns are gone
-- from this list, redirected to their own dedicated tables in steps 0a/0b
-- above). Categories seeded in V49/V50 (BREACH_ACTION, COUNTRY_RISK_RATING,
-- CREDIT_ALERT_TYPE, INSTRUMENT_CLASS, LIMIT_BASIS, REVIEW_OUTCOME,
-- GL_NORMAL_BALANCE) have no bindings yet — those columns haven't been
-- converted from free text to FK yet, tracked separately as part of the
-- existing CHECK-constraint backlog, not touched here.
INSERT INTO dbo.lookup_category_binding (category_id, table_name, column_name, created_by, updated_by)
SELECT lc.category_id, v.table_name, v.column_name, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('REPORTING_CLASSIFICATION_TYPE','reporting_group',                  'classification_type_id'),
    ('REPORTING_CLASSIFICATION_TYPE','product_reporting_group',          'classification_type_id'),
    ('OPERATOR_TYPE',                'transport_operator',               'operator_type'),
    ('INSTRUMENT_TYPE',              'trade',                            'instrument_type'),
    ('STORAGE_AGREEMENT_TYPE',       'trade_storage_agreement_detail',   'storage_agreement_type'),
    ('TRANSPORT_AGREEMENT_TYPE',     'trade_transport_agreement_detail', 'transport_agreement_type'),
    ('PRICE_ADJUSTMENT_TYPE',        'trade_order_price_adjustment',     'adjustment_type'),
    ('DEMURRAGE_BASIS',              'trade_order',                      'demurrage_basis'),
    ('RIN_TRANSACTION_TYPE',         'rin_transaction',                  'transaction_type'),
    ('RIN_OBLIGATION_STATUS',        'rin_obligation',                   'status'),
    ('GL_ACCOUNT_TYPE',              'gl_account',                       'account_type')
) AS v(category_code, table_name, column_name)
JOIN dbo.lookup_category lc ON lc.category_code = v.category_code;
GO

-- ── 5. Register lookup_category in the Static Data GUI ───────────────────────
-- lookup_category_binding is deliberately NOT registered — it's plumbing for
-- the reference-data GUI to resolve dropdown sources, not something an admin
-- browses/edits directly.
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('lookup_category', 'Lookup Categories', 'Products & Markets', 1, 1, 1, 0, 8, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V85 — LOOKUP_CATEGORY BUILT; LOOKUP_VALUE.CATEGORY NOW A REAL FK';
PRINT '  lookup_value.category (free text VARCHAR) -> category_id FK';
PRINT '  lookup_category_binding: 11 table.column -> category bindings seeded';
PRINT '  book.book_type redirected to the real dedicated dbo.book_type table;';
PRINT '  new dbo.commodity_type table built, 11 tables redirected onto it;';
PRINT '  both categories'' lookup_value rows removed — no longer lookup_categories.';
PRINT '  4 dead categories removed (superseded by V83 dedicated tables) —';
PRINT '  V82/V83/V84 dedicated tables themselves are untouched.';
PRINT '============================================================';
GO

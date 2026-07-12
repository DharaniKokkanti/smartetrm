-- =============================================================================
-- V55 — commodity_type / book_type: hardcoded CHECK strings → FK on lookup_value
-- =============================================================================
-- User supplied a reference spec proposing dbo.commodity, dbo.unit_of_measure,
-- dbo.location_type, dbo.desk, dbo.book (commodity_type) and dbo.book
-- (book_type) be converted from VARCHAR+CHECK to INT FK on
-- dbo.lookup_value(lookup_id), so new commodities (Carbon, Biomass, etc.) or
-- book types can be added via a data insert instead of a destructive ALTER.
--
-- Reviewed the actual schema first: the same commodity_type VARCHAR+CHECK
-- pattern (11-value vocabulary from V47/V53/V54) is ALSO duplicated on
-- dbo.gl_account, dbo.trader_commodity_limit, dbo.freight_rate_index,
-- dbo.laytime_term_template and dbo.demurrage_dispatch_rate — not just the 4
-- tables originally named. Converting only 4 of the 9 would leave two
-- incompatible representations of the same concept in the schema (INT FK on
-- some tables, VARCHAR CHECK on others) — confirmed with the user to do all 9
-- for consistency.
--
-- Deliberately NOT touched here (separate, much larger blast radius, not part
-- of the agreed scope): dbo.trade.commodity_type, dbo.location.commodity_type,
-- dbo.pipeline.commodity_type, dbo.holiday_calendar.commodity_type, and the
-- counterparty commercial-terms commodity_type column. These are core
-- transactional/operational tables with heavy trade-capture and reporting
-- surface area — a candidate for a dedicated follow-up, not bundled in here.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. Seed the lookup_value categories this migration will FK against
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'commodity_type')
INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
VALUES
    ('commodity_type', 'OIL',           'Oil',              1,  1),
    ('commodity_type', 'GAS',           'Gas',              2,  1),
    ('commodity_type', 'POWER',         'Power',            3,  1),
    ('commodity_type', 'LNG',           'LNG',              4,  1),
    ('commodity_type', 'AGRICULTURAL',  'Agricultural',     5,  1),
    ('commodity_type', 'METALS',        'Metals',           6,  1),
    ('commodity_type', 'FREIGHT',       'Freight',          7,  1),
    ('commodity_type', 'RINS',          'RINs',             8,  1),
    ('commodity_type', 'ENVIRONMENTAL', 'Environmental',    9,  1),
    ('commodity_type', 'MULTI',         'Multi-Commodity', 10,  1),
    ('commodity_type', 'OTHER',         'Other',            11, 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'book_type')
INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
VALUES
    ('book_type', 'TRADING',   'Trading',         1, 1),
    ('book_type', 'HEDGING',   'Hedging',         2, 1),
    ('book_type', 'ARBITRAGE', 'Arbitrage',       3, 1),
    ('book_type', 'PROP',      'Proprietary',     4, 1),
    ('book_type', 'CLIENT',    'Client',          5, 1),
    ('book_type', 'RISK_MGMT', 'Risk Management', 6, 1);
GO

-- =============================================================================
-- Pattern repeated per table/column below:
--   1. add a nullable INT staging column
--   2. backfill it by joining the old VARCHAR value to lookup_value.code
--   3. drop the old CHECK constraint (if any) and the old VARCHAR column
--   4. rename the staging column into the old column's name
--   5. re-apply NOT NULL (only for columns that were NOT NULL before)
--   6. add the FK constraint
-- =============================================================================

-- =============================================================================
-- 2. dbo.commodity.commodity_type (NOT NULL)
-- =============================================================================
ALTER TABLE dbo.commodity ADD commodity_type_new INT NULL;
GO
UPDATE c SET c.commodity_type_new = lv.lookup_id
FROM dbo.commodity c JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = c.commodity_type;
GO
ALTER TABLE dbo.commodity DROP CONSTRAINT IF EXISTS chk_commodity_type;
ALTER TABLE dbo.commodity DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.commodity.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.commodity ALTER COLUMN commodity_type INT NOT NULL;
ALTER TABLE dbo.commodity ADD CONSTRAINT fk_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 3. dbo.unit_of_measure.commodity_type (nullable, no prior CHECK)
-- =============================================================================
ALTER TABLE dbo.unit_of_measure ADD commodity_type_new INT NULL;
GO
UPDATE u SET u.commodity_type_new = lv.lookup_id
FROM dbo.unit_of_measure u JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = u.commodity_type;
GO
ALTER TABLE dbo.unit_of_measure DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.unit_of_measure.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.unit_of_measure ADD CONSTRAINT fk_uom_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 4. dbo.location_type.commodity_type (nullable, no prior CHECK)
-- =============================================================================
ALTER TABLE dbo.location_type ADD commodity_type_new INT NULL;
GO
UPDATE t SET t.commodity_type_new = lv.lookup_id
FROM dbo.location_type t JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = t.commodity_type;
GO
ALTER TABLE dbo.location_type DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.location_type.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.location_type ADD CONSTRAINT fk_loctype_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 5. dbo.desk.commodity_type (nullable; V43/V47 added ck_desk_commodity_type,
--    must be dropped before the column, same as book/gl_account/trader_commodity_limit)
-- =============================================================================
ALTER TABLE dbo.desk ADD commodity_type_new INT NULL;
GO
UPDATE d SET d.commodity_type_new = lv.lookup_id
FROM dbo.desk d JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = d.commodity_type;
GO
ALTER TABLE dbo.desk DROP CONSTRAINT IF EXISTS ck_desk_commodity_type;
GO
ALTER TABLE dbo.desk DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.desk.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.desk ADD CONSTRAINT fk_desk_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 6. dbo.book.commodity_type (NOT NULL) and dbo.book.book_type (NOT NULL DEFAULT 'TRADING')
-- =============================================================================
ALTER TABLE dbo.book ADD commodity_type_new INT NULL;
ALTER TABLE dbo.book ADD book_type_new INT NULL;
GO
UPDATE b SET b.commodity_type_new = lv.lookup_id
FROM dbo.book b JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = b.commodity_type;
GO
UPDATE b SET b.book_type_new = lv.lookup_id
FROM dbo.book b JOIN dbo.lookup_value lv ON lv.category = 'book_type' AND lv.code = b.book_type;
GO

-- book_type has an unnamed inline DEFAULT ('TRADING') — find and drop it dynamically
-- before dropping the column (SQL Server auto-names default constraints).
DECLARE @bookTypeDefault NVARCHAR(200);
SELECT @bookTypeDefault = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.book') AND c.name = 'book_type';
IF @bookTypeDefault IS NOT NULL
    EXEC('ALTER TABLE dbo.book DROP CONSTRAINT ' + @bookTypeDefault);
GO

ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS ck_book_commodity_type;
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS chk_book_commodity;
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS chk_book_type;
-- ix_book_entity (V1) is dependent on commodity_type — must drop before the
-- column drop; recreated below once the new commodity_type is in place.
DROP INDEX IF EXISTS ix_book_entity ON dbo.book;
ALTER TABLE dbo.book DROP COLUMN commodity_type, book_type;
GO
EXEC sp_rename 'dbo.book.commodity_type_new', 'commodity_type', 'COLUMN';
EXEC sp_rename 'dbo.book.book_type_new', 'book_type', 'COLUMN';
GO
ALTER TABLE dbo.book ALTER COLUMN commodity_type INT NOT NULL;
ALTER TABLE dbo.book ALTER COLUMN book_type INT NOT NULL;
GO
ALTER TABLE dbo.book ADD CONSTRAINT fk_book_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

DECLARE @tradingLookupId INT = (SELECT lookup_id FROM dbo.lookup_value WHERE category = 'book_type' AND code = 'TRADING');
DECLARE @sql NVARCHAR(MAX) = N'ALTER TABLE dbo.book ADD CONSTRAINT df_book_book_type DEFAULT (' + CAST(@tradingLookupId AS NVARCHAR(10)) + N') FOR book_type;';
EXEC sp_executesql @sql;
GO
ALTER TABLE dbo.book ADD CONSTRAINT fk_book_book_type FOREIGN KEY (book_type) REFERENCES dbo.lookup_value(lookup_id);
GO
CREATE INDEX ix_book_entity ON dbo.book (legal_entity_id, commodity_type, is_active);
GO

-- =============================================================================
-- 7. dbo.gl_account.commodity_type (nullable)
-- =============================================================================
ALTER TABLE dbo.gl_account ADD commodity_type_new INT NULL;
GO
UPDATE g SET g.commodity_type_new = lv.lookup_id
FROM dbo.gl_account g JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = g.commodity_type;
GO
ALTER TABLE dbo.gl_account DROP CONSTRAINT IF EXISTS ck_gl_account_commodity_type;
ALTER TABLE dbo.gl_account DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.gl_account.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.gl_account ADD CONSTRAINT fk_gl_account_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 8. dbo.trader_commodity_limit.commodity_type (NOT NULL)
-- =============================================================================
ALTER TABLE dbo.trader_commodity_limit ADD commodity_type_new INT NULL;
GO
UPDATE t SET t.commodity_type_new = lv.lookup_id
FROM dbo.trader_commodity_limit t JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = t.commodity_type;
GO
ALTER TABLE dbo.trader_commodity_limit DROP CONSTRAINT IF EXISTS ck_tcl_commodity_type;
-- uq_tcl_trader_commodity is a UNIQUE(trader_id, commodity_type) — drop and recreate against the new column
ALTER TABLE dbo.trader_commodity_limit DROP CONSTRAINT IF EXISTS uq_tcl_trader_commodity;
ALTER TABLE dbo.trader_commodity_limit DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.trader_commodity_limit.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.trader_commodity_limit ALTER COLUMN commodity_type INT NOT NULL;
ALTER TABLE dbo.trader_commodity_limit ADD CONSTRAINT fk_tcl_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
ALTER TABLE dbo.trader_commodity_limit ADD CONSTRAINT uq_tcl_trader_commodity UNIQUE (trader_id, commodity_type);
GO

-- =============================================================================
-- 9. dbo.freight_rate_index.commodity_type (nullable)
-- =============================================================================
ALTER TABLE dbo.freight_rate_index ADD commodity_type_new INT NULL;
GO
UPDATE f SET f.commodity_type_new = lv.lookup_id
FROM dbo.freight_rate_index f JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = f.commodity_type;
GO
ALTER TABLE dbo.freight_rate_index DROP CONSTRAINT IF EXISTS chk_fri_commodity_type;
ALTER TABLE dbo.freight_rate_index DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.freight_rate_index.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.freight_rate_index ADD CONSTRAINT fk_fri_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 10. dbo.laytime_term_template.commodity_type (nullable)
-- =============================================================================
ALTER TABLE dbo.laytime_term_template ADD commodity_type_new INT NULL;
GO
UPDATE l SET l.commodity_type_new = lv.lookup_id
FROM dbo.laytime_term_template l JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = l.commodity_type;
GO
ALTER TABLE dbo.laytime_term_template DROP CONSTRAINT IF EXISTS chk_ltt_commodity_type;
ALTER TABLE dbo.laytime_term_template DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.laytime_term_template.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.laytime_term_template ADD CONSTRAINT fk_ltt_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- =============================================================================
-- 11. dbo.demurrage_dispatch_rate.commodity_type (nullable)
-- =============================================================================
ALTER TABLE dbo.demurrage_dispatch_rate ADD commodity_type_new INT NULL;
GO
UPDATE d SET d.commodity_type_new = lv.lookup_id
FROM dbo.demurrage_dispatch_rate d JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = d.commodity_type;
GO
ALTER TABLE dbo.demurrage_dispatch_rate DROP CONSTRAINT IF EXISTS chk_ddr_commodity_type;
ALTER TABLE dbo.demurrage_dispatch_rate DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.demurrage_dispatch_rate.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.demurrage_dispatch_rate ADD CONSTRAINT fk_ddr_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id);
GO

PRINT '============================================================';
PRINT 'V55 — COMMODITY_TYPE / BOOK_TYPE FK REFACTOR APPLIED';
PRINT '  lookup_value seeded: 11 commodity_type rows, 6 book_type rows.';
PRINT '  Converted VARCHAR+CHECK -> INT FK on lookup_value(lookup_id) for:';
PRINT '    commodity.commodity_type, unit_of_measure.commodity_type,';
PRINT '    location_type.commodity_type, desk.commodity_type,';
PRINT '    book.commodity_type, book.book_type, gl_account.commodity_type,';
PRINT '    trader_commodity_limit.commodity_type, freight_rate_index.commodity_type,';
PRINT '    laytime_term_template.commodity_type, demurrage_dispatch_rate.commodity_type.';
PRINT '  NOT touched (separate, larger follow-up): trade.commodity_type,';
PRINT '    location.commodity_type, pipeline.commodity_type,';
PRINT '    holiday_calendar.commodity_type, counterparty commercial terms.';
PRINT '============================================================';
GO

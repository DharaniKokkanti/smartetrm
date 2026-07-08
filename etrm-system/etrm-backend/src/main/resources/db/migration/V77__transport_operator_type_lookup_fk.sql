-- =============================================================================
-- V77 — transport_operator.operator_type: VARCHAR+CHECK → FK on lookup_value
-- =============================================================================
-- User asked why operator_type is a CHECK constraint rather than going through
-- the same generic dbo.lookup_value mechanism already used for commodity_type/
-- book_type/load_type/gas_day_type/classification_type/instrument_type/
-- storage_agreement_type/transport_agreement_type (V55/V57/V63). Reviewed the
-- schema first: unlike mot_type/location_type/inspection_type (which have
-- their own dedicated tables because OTHER tables FK against them, and
-- mot_type in particular carries its own business-rule columns —
-- requires_physical_asset/requires_routing — that lookup_value's flat shape
-- can't hold), operator_type is single-parent (nothing else in the schema FKs
-- to it) and flat (just 8 codes, no extra columns). That makes it a genuine
-- candidate either way; converted since the same list-may-grow-without-a-
-- deploy reasoning already applied to every other lookup_value conversion in
-- this codebase applies here too — a client adding a new operator category
-- (e.g. a future DRONE_OPERATOR) shouldn't need a migration.
--
-- Same staging-column-and-rename pattern as V55/V63.
-- =============================================================================

USE ETRM_DB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'operator_type')
INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
VALUES
    ('operator_type', 'SHIPPING_LINE', 'Shipping Line',   1, 1),
    ('operator_type', 'SHIP_MANAGER',  'Ship Manager',    2, 1),
    ('operator_type', 'HAULIER',       'Haulier',         3, 1),
    ('operator_type', 'RAIL_OPERATOR', 'Rail Operator',   4, 1),
    ('operator_type', 'PIPELINE_TSO',  'Pipeline TSO',    5, 1),
    ('operator_type', 'TERMINAL_OP',   'Terminal Operator', 6, 1),
    ('operator_type', 'MULTI_MODAL',   'Multi-Modal',     7, 1),
    ('operator_type', 'OTHER',         'Other',           8, 1);
GO

ALTER TABLE dbo.transport_operator ADD operator_type_new INT NULL;
GO
UPDATE t SET t.operator_type_new = lv.lookup_id
FROM dbo.transport_operator t JOIN dbo.lookup_value lv ON lv.category = 'operator_type' AND lv.code = t.operator_type;
GO
ALTER TABLE dbo.transport_operator DROP CONSTRAINT IF EXISTS chk_to_type;
ALTER TABLE dbo.transport_operator DROP COLUMN operator_type;
GO
EXEC sp_rename 'dbo.transport_operator.operator_type_new', 'operator_type', 'COLUMN';
GO
ALTER TABLE dbo.transport_operator ALTER COLUMN operator_type INT NOT NULL;
ALTER TABLE dbo.transport_operator ADD CONSTRAINT fk_to_operator_type FOREIGN KEY (operator_type) REFERENCES dbo.lookup_value(lookup_id);
GO

PRINT '============================================================';
PRINT 'V77 — TRANSPORT_OPERATOR.OPERATOR_TYPE NOW A LOOKUP_VALUE FK';
PRINT '  8 rows seeded under category = ''operator_type''.';
PRINT '  New operator categories can now be added via data insert,';
PRINT '  no migration required.';
PRINT '============================================================';
GO

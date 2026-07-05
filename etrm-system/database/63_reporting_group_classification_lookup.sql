-- =============================================================================
-- V63 — dbo.reporting_group.classification_type: convert from free text to
-- dbo.lookup_value FK; drop group_code (unused — group assignment happens by
-- picking a named reporting_group directly, not by a short code)
-- =============================================================================
-- V60 left classification_type as a plain, unconstrained VARCHAR (POSITION/
-- VAR/SETTLEMENT) — same "no fixed vocabulary" treatment as commodity_family
-- .family_type. User reconsidered: since more classification types (axes)
-- will likely be added over time, the type itself should be a proper lookup
-- reference, not free text, so the list is centrally managed and reusable —
-- dbo.lookup_value (category = 'REPORTING_CLASSIFICATION_TYPE') is the right
-- fit here (a genuine many-to-one categorization reused only within this one
-- table, matching the pattern already used for desk/book/gl_account.commodity
-- _type in V55 — not a case like commodity.commodity_type's 1:1 tautology
-- that V58 removed).
--
-- Also: group_code is dropped. It was carried over from the original design
-- (a short code alongside group_name), but the actual usage — a user assigns
-- a product directly to a named reporting_group row from a list — never
-- needs a separate short code; group_name plus classification_type fully
-- identifies the row.
-- =============================================================================

USE ETRM_DB;
GO

INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
VALUES
    ('REPORTING_CLASSIFICATION_TYPE', 'POSITION',   'Position Reporting', 1, 1),
    ('REPORTING_CLASSIFICATION_TYPE', 'VAR',        'VaR / Risk',         2, 1),
    ('REPORTING_CLASSIFICATION_TYPE', 'SETTLEMENT', 'Settlement / GL',    3, 1);
GO

ALTER TABLE dbo.reporting_group ADD classification_type_id INT NULL;
GO

UPDATE rg
SET    rg.classification_type_id = lv.lookup_id
FROM   dbo.reporting_group rg
JOIN   dbo.lookup_value lv ON lv.category = 'REPORTING_CLASSIFICATION_TYPE' AND lv.code = rg.classification_type;
GO

ALTER TABLE dbo.reporting_group ALTER COLUMN classification_type_id INT NOT NULL;
GO
ALTER TABLE dbo.reporting_group
    ADD CONSTRAINT fk_reporting_group_classification_type FOREIGN KEY (classification_type_id) REFERENCES dbo.lookup_value(lookup_id);
GO

DROP INDEX ix_reporting_group_type ON dbo.reporting_group;
GO
ALTER TABLE dbo.reporting_group DROP CONSTRAINT uq_reporting_group_code;
GO
ALTER TABLE dbo.reporting_group DROP COLUMN classification_type;
GO
ALTER TABLE dbo.reporting_group DROP COLUMN group_code;
GO

ALTER TABLE dbo.reporting_group
    ADD CONSTRAINT uq_reporting_group_name UNIQUE (classification_type_id, group_name);
GO
CREATE INDEX ix_reporting_group_type ON dbo.reporting_group (classification_type_id, is_active);
GO

PRINT '============================================================';
PRINT 'V63 — REPORTING_GROUP_CLASSIFICATION_LOOKUP APPLIED';
PRINT '  reporting_group.classification_type_id — new FK to lookup_value';
PRINT '    (category REPORTING_CLASSIFICATION_TYPE), replacing the old';
PRINT '    free-text classification_type column (now dropped).';
PRINT '  reporting_group.group_code — dropped (unused).';
PRINT '============================================================';
GO

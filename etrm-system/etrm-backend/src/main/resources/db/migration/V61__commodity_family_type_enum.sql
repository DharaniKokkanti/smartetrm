-- =============================================================================
-- V61 — dbo.commodity_family.family_type: convert from free text to a fixed,
-- constrained list (reverses part of the V59 design decision)
-- =============================================================================
-- V59 deliberately left family_type as a plain, unconstrained VARCHAR — no
-- CHECK, no lookup_value FK — reasoning it was a low-risk descriptive tag and
-- avoiding a migration every time a new value was needed. User reconsidered:
-- family_type should be a closed list the user picks from, not free-typed
-- text, to prevent typos/drift (e.g. "CRUDE" vs "Crude" vs "crude_oil").
--
-- Given the value set is genuinely small and slow-changing (commodity
-- sub-classification tags), a CHECK constraint enum is the right fit here —
-- not a new lookup table, which would be over-normalizing a 9-value tag.
-- The frontend's Static Data mechanism already has first-class support for
-- CHECK-derived enums (ColumnDataKind 'enum' + enumValues, rendered as a
-- <Select> automatically) — no new UI code needed, just a metadata change.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.commodity_family
    ADD CONSTRAINT chk_commodity_family_type CHECK (family_type IN (
        'CRUDE', 'REFINED', 'PETROCHEMICAL', 'PIPELINE_GAS', 'LNG',
        'BASE_METAL', 'PRECIOUS_METAL', 'GRAIN', 'ELECTRICITY'
    ));
GO

PRINT '============================================================';
PRINT 'V61 — COMMODITY_FAMILY_TYPE_ENUM APPLIED';
PRINT '  dbo.commodity_family.family_type — CHECK constraint added,';
PRINT '    restricting to the 9 values already seeded in V59.';
PRINT '============================================================';
GO

-- =============================================================================
-- V62 — legal_entity/counterparty parent-company consistency
-- =============================================================================
-- User flagged legal_entity as "something wrong" — investigation found no bad
-- data, but two real, missing safeguards:
--   1. dbo.legal_entity.parent_entity_id (self-referencing FK, added in
--      01_master_data_foundation.sql) has no CHECK preventing an entity from
--      being its own parent, and nothing ties a boolean "has a parent" signal
--      to whether parent_entity_id is actually populated.
--   2. dbo.counterparty has NO parent-company linkage at all — only
--      is_intercompany/internal_entity_id (marks a counterparty as an
--      internal affiliate of one of our own legal entities, a different
--      concept from one counterparty being a subsidiary of another).
-- Fix: add parent_ind (BIT) to both tables as the explicit "this row has a
-- parent" flag, add the missing self-parent CHECK on legal_entity, and add
-- a full self-referencing parent_counterparty_id + CHECK on counterparty
-- (net new — didn't exist before). Both tables are system-versioned temporal
-- tables — SYSTEM_VERSIONING must be OFF for the ALTER, then back ON,
-- matching the exact pattern already used for both tables in
-- 17_parent_lookup_tables.sql (ADD legal_entity_type_id / counterparty_type_id).
--
-- Note: a separate request for a VAT/organization-id field on counterparty is
-- NOT handled here — dbo.tax_registration already exists (V1) as the correct,
-- polymorphic home for VAT/tax IDs on both LEGAL_ENTITY and COUNTERPARTY
-- (tax_type already includes 'VAT'); it was just never wired into the
-- frontend. See the frontend changes in this same session for that fix
-- instead of adding a duplicate flat column here.
-- =============================================================================

USE ETRM_DB;
GO

-- ── dbo.legal_entity ──────────────────────────────────────────────────────────
ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = OFF);
GO

ALTER TABLE dbo.legal_entity ADD parent_ind BIT NOT NULL DEFAULT 0;
GO

-- Backfill from existing parent_entity_id before the consistency CHECK goes on.
UPDATE dbo.legal_entity SET parent_ind = 1 WHERE parent_entity_id IS NOT NULL;
GO

ALTER TABLE dbo.legal_entity
    ADD CONSTRAINT chk_le_no_self_parent CHECK (parent_entity_id IS NULL OR parent_entity_id <> legal_entity_id);
GO
ALTER TABLE dbo.legal_entity
    ADD CONSTRAINT chk_le_parent_ind_consistency CHECK (
        (parent_ind = 0 AND parent_entity_id IS NULL) OR
        (parent_ind = 1 AND parent_entity_id IS NOT NULL)
    );
GO

ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.legal_entity_history));
GO

-- ── dbo.counterparty ──────────────────────────────────────────────────────────
ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = OFF);
GO

ALTER TABLE dbo.counterparty ADD parent_ind BIT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.counterparty ADD parent_counterparty_id INT NULL;
GO

ALTER TABLE dbo.counterparty
    ADD CONSTRAINT fk_cp_parent FOREIGN KEY (parent_counterparty_id) REFERENCES dbo.counterparty(counterparty_id);
GO
ALTER TABLE dbo.counterparty
    ADD CONSTRAINT chk_cp_no_self_parent CHECK (parent_counterparty_id IS NULL OR parent_counterparty_id <> counterparty_id);
GO
ALTER TABLE dbo.counterparty
    ADD CONSTRAINT chk_cp_parent_ind_consistency CHECK (
        (parent_ind = 0 AND parent_counterparty_id IS NULL) OR
        (parent_ind = 1 AND parent_counterparty_id IS NOT NULL)
    );
GO

ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.counterparty_history));
GO

PRINT '============================================================';
PRINT 'V62 — LEGAL_ENTITY_COUNTERPARTY_PARENT_IND APPLIED';
PRINT '  legal_entity — parent_ind added, backfilled, self-parent +';
PRINT '    consistency CHECKs added.';
PRINT '  counterparty — parent_ind + parent_counterparty_id (new self-FK)';
PRINT '    added, same CHECKs added.';
PRINT '============================================================';
GO

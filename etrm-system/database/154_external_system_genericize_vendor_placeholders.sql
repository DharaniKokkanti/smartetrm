-- =============================================================================
-- V154 — genericize vendor-named placeholder rows in dbo.external_system.
--
-- User instruction (2026-07-23): real competitor/vendor product names must
-- never appear in this platform's own DB objects, GUI copy, or backend
-- business logic — only in research/comparative-analysis commentary. V8's
-- external_system seed data named specific market-data/ERP/regulatory
-- vendors (Bloomberg, S&P Global Platts, Argus, ICE, SAP, DTCC) as inactive
-- "pending vendor decision" placeholder rows — these are real DB object
-- values (not comments), so they're in scope for that rule.
--
-- Explicitly NOT in scope: the pricing/index domain model's use of
-- "Platts"/"Argus"/"ICE" as publicationSource values and in index names
-- like "Platts Dated Brent" (dbo.product_index and friends) — those are the
-- actual real-world names of the price-reporting agencies that publish
-- those specific benchmarks, not vendor design references; genericizing
-- those would make the pricing data factually wrong. Confirmed with the
-- user to leave that domain untouched — this migration only touches the
-- external_system integration-target placeholder rows.
--
-- Row identities (external_system_id 1-8) and all other columns
-- (connection_type_id, is_active, created_at/created_by) are preserved —
-- this is a data UPDATE, not a row replacement, so any future FK reference
-- to these ids from external_system_mapping stays valid.
--
-- row_version = row_version + 1 in every SET clause below is not optional
-- — V153's guard trigger on this exact table rejects any UPDATE that
-- doesn't advance row_version itself, so this migration has to comply with
-- its own platform's rule just like any other writer would.
-- =============================================================================

UPDATE dbo.external_system
SET system_code = 'MKT_DATA_VENDOR_A', system_name = 'Market Data Vendor A (TBD)', vendor_name = NULL,
    notes = 'Pending vendor decision — see Open Decisions.', row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(), updated_by = 'SYSTEM'
WHERE system_code = 'BLOOMBERG';
GO

UPDATE dbo.external_system
SET system_code = 'MKT_DATA_VENDOR_B', system_name = 'Market Data Vendor B (TBD)', vendor_name = NULL,
    notes = 'Pending vendor decision — see Open Decisions.', row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(), updated_by = 'SYSTEM'
WHERE system_code = 'PLATTS';
GO

UPDATE dbo.external_system
SET system_code = 'MKT_DATA_VENDOR_C', system_name = 'Market Data Vendor C (TBD)', vendor_name = NULL,
    notes = 'Pending vendor decision — see Open Decisions.', row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(), updated_by = 'SYSTEM'
WHERE system_code = 'ARGUS';
GO

UPDATE dbo.external_system
SET system_code = 'MKT_DATA_VENDOR_D', system_name = 'Market Data Vendor D (TBD)', vendor_name = NULL,
    notes = 'Pending vendor decision — see Open Decisions.', row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(), updated_by = 'SYSTEM'
WHERE system_code = 'ICE';
GO

UPDATE dbo.external_system
SET system_code = 'ERP_SYSTEM', system_name = 'ERP System (TBD)', vendor_name = NULL,
    notes = 'Pending ERP integration decision — see Open Decisions.', row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(), updated_by = 'SYSTEM'
WHERE system_code = 'SAP_ERP';
GO

UPDATE dbo.external_system
SET system_code = 'REGULATORY_REPOSITORY', system_name = 'Regulatory Trade Repository (TBD)', vendor_name = NULL,
    notes = 'Pending regulatory jurisdiction decision (EMIR/CFTC) — see Open Decisions.', row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(), updated_by = 'SYSTEM'
WHERE system_code = 'DTCC_GTR';
GO

PRINT '============================================================';
PRINT 'V154 APPLIED — external_system vendor-named placeholder rows';
PRINT '  genericized (Bloomberg/Platts/Argus/ICE/SAP/DTCC removed).';
PRINT '============================================================';
GO

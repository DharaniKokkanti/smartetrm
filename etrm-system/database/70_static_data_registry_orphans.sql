-- =============================================================================
-- V70 — Register more genuine Static Data registry orphans; fix a real
-- frontend/backend registry mismatch on lookup_value
-- =============================================================================
-- Continuing the whole-project master data review. A registry sweep (every
-- CREATE TABLE in database/*.sql vs every master_data_table_registry INSERT)
-- found ~26 candidate orphans; cross-checking each against the actual
-- frontend (dedicated feature pages, MasterDataHub.tsx's live:true/false
-- backlog) narrowed that to a small number of genuine simple reference
-- tables with no dedicated page and no existing frontend representation:
-- insurance_provider, interest_rate_index, regulatory_report_type,
-- transport_operator — all four already appear in MasterDataHub.tsx's
-- curated `live: false` backlog, confirming they were planned but never
-- built, not accidentally overlooked scope.
--
-- Also fixes a real, separate discrepancy found while doing this: V63 added
-- `lookup_value` to the FRONTEND mock's registrySeed (registryId 212) but
-- never actually inserted the corresponding row into the real backend SQL's
-- master_data_table_registry — the prototype and the intended real schema
-- had quietly diverged.
-- =============================================================================

USE ETRM_DB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'lookup_value')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('lookup_value', 'Lookup Values', 'Products & Markets', 1, 1, 1, 0, 5, 'SYSTEM', 'SYSTEM');
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('insurance_provider',    'Insurance Providers',     'Credit & Collateral', 1, 1, 1, 0, 8, 'SYSTEM', 'SYSTEM'),
    ('interest_rate_index',   'Interest Rate Indices',   'Pricing & Rates',     1, 1, 0, 0, 7, 'SYSTEM', 'SYSTEM'),
    ('regulatory_report_type','Regulatory Report Types', 'Sanctions & Regulatory Reporting', 1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('transport_operator',    'Transport Operators',     'Logistics & Delivery', 1, 1, 1, 0, 9, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V70 — STATIC DATA REGISTRY ORPHANS FIXED';
PRINT '  lookup_value registered (was frontend-only since V63).';
PRINT '  insurance_provider, interest_rate_index, regulatory_report_type,';
PRINT '  transport_operator — NEW registry rows, previously backend-only.';
PRINT '============================================================';
GO

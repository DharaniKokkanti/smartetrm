-- =============================================================================
-- V72 — Register dbo.credit_term as Static Data
-- =============================================================================
-- Part of building out MasterDataHub.tsx's live:false backlog (Counterparty
-- Agreements group). credit_term (V1) is NOT counterparty-scoped itself —
-- it has no counterparty_id column — it's a reusable reference template
-- (term_code, credit_period_days, collateral_type, margin_call_threshold,
-- netting_eligible, requires_isda), the same shape/role as the already-built
-- dbo.payment_term. It's referenced BY dbo.cp_commercial_terms.credit_term_id
-- (the actual per-counterparty assignment), so credit_term itself is a
-- simple Static Data table, not a full entity page.
-- =============================================================================

USE ETRM_DB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'credit_term')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('credit_term', 'Credit Terms', 'Counterparties & Agreements', 1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V72 — CREDIT_TERM REGISTERED AS STATIC DATA';
PRINT '============================================================';
GO

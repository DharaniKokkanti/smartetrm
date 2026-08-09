-- V212: margin_offset_rule, margin_valuation, and margin_call now have
-- real hand-built pages/tabs (margin_offset_rule: standalone page at
-- /credit/margin-offset-rules; margin_valuation: "Margin Valuations" tab
-- on the Clearing Accounts page; margin_call: "Margin Calls" tab on the
-- Margin Accounts page) — update their master_data_table_registry
-- descriptions, which said "Schema-only, no backend CRUD yet" (or, for
-- margin_call, the 2026-07-21 catalog-sweep placeholder).

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET description = 'Inter-commodity margin offset/netting rules (spark/dark/crack spreads), published per exchange. Hand-built page at /credit/margin-offset-rules, not generic Tier2 CRUD.',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'margin_offset_rule';
GO

UPDATE dbo.master_data_table_registry
SET description = 'Daily/intraday EOD margin computation and FCM-statement-reconciliation run per clearing account. Hand-built "Margin Valuations" tab on the Clearing Accounts page (/credit/clearing-accounts), not generic Tier2 CRUD.',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'margin_valuation';
GO

UPDATE dbo.master_data_table_registry
SET description = 'Per-margin-account pay-or-receive margin demand ledger entry (initial/variation/intraday call, excess return). Hand-built "Margin Calls" tab on the Margin Accounts page (/credit/margin-accounts), not generic Tier2 CRUD.',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'margin_call';
GO

-- =============================================================================
-- V128 — Optimistic locking (row_version), Batch A: Credit/Guarantees
--
-- Continuation of the V127 rollout (legal_entity, counterparty, book,
-- credit_limit, margin_agreement) — same real gap, same fix: every
-- update() in this backend does findById() -> overwrite -> save() with no
-- check that the record hasn't changed since the client last read it, so
-- two concurrent edits silently last-write-wins with zero warning.
--
-- This batch covers the credit/guarantees domain: bank guarantees, brokers
-- and their fee agreements, collateral, counterparty commercial terms and
-- GTC agreements, credit limit sub-tables (alerts/line items), credit
-- terms, insurance (policies/providers), letters of credit, margin
-- accounts, netting agreements, parent company guarantees, and
-- trader-level commodity limits.
--
-- Same plain, Hibernate-managed row_version INT column as V127 (not SQL
-- Server's native ROWVERSION/TIMESTAMP binary type) — starts at 0,
-- incremented by Hibernate's @Version on every UPDATE with a
-- `WHERE row_version = ?` clause; a stale write matches zero rows and
-- throws ObjectOptimisticLockingFailureException (-> 409,
-- GlobalExceptionHandler) instead of silently succeeding.
--
-- Some tables in this batch (credit_limit_alert, credit_limit_line_item,
-- trader_commodity_limit) are never individually updated in practice
-- (system-generated read-only history, or wholesale delete-and-recreate
-- sub-resources) — row_version is added for schema consistency across the
-- batch even though there's no real stale-write scenario to protect there
-- today. credit_term and insurance_provider are read-only lookup entities
-- with no write path through their JPA entity today either; added for the
-- same consistency reason, not because optimistic locking is enforced
-- through them yet.
--
-- Single-statement ADD COLUMN ... NOT NULL DEFAULT — same safe pattern as
-- V127 (works fine on both plain and temporal tables).
-- =============================================================================

ALTER TABLE dbo.bank_guarantee         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.broker                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.broker_fee_agreement   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.collateral             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.cp_commercial_terms    ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.cp_gtc_agreement       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_limit_alert     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_limit_line_item ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_term            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.insurance_policy       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.insurance_provider     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.letter_of_credit       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.margin_account         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.netting_agreement      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.parent_company_guarantee ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.trader_commodity_limit ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V128 APPLIED — row_version added to bank_guarantee, broker,';
PRINT '  broker_fee_agreement, collateral, cp_commercial_terms,';
PRINT '  cp_gtc_agreement, credit_limit_alert, credit_limit_line_item,';
PRINT '  credit_term, insurance_policy, insurance_provider,';
PRINT '  letter_of_credit, margin_account, netting_agreement,';
PRINT '  parent_company_guarantee, trader_commodity_limit. Batch A';
PRINT '  (Credit/Guarantees) of the optimistic locking rollout — see';
PRINT '  the handoff doc for remaining batches.';
PRINT '============================================================';
GO

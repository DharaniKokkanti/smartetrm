-- =============================================================================
-- V78 — finish V17's deferred parent-lookup-table cutover (12 of 13 pairs)
-- =============================================================================
-- User asked why several "type" columns that already have a dedicated Static
-- Data table still aren't FK'd. Answer, found in V17__parent_lookup_tables.sql's
-- own header: V17 (June 2026) deliberately built this in two phases — it added
-- 13 parent lookup tables + FK columns, backfilled them, but explicitly kept
-- the original VARCHAR+CHECK columns "for backward-compat", stating: "drop
-- them in a future migration once all application code has been migrated to
-- use the FK columns." That follow-up migration never happened for 12 of the
-- 13 pairs — only book.book_type was ever finished (V55, via a different
-- staging-column pattern that points at lookup_value instead of V17's
-- dedicated book_type table). The other 12 have sat as orphaned/unused FK
-- columns next to their still-live CHECK-constrained originals ever since.
--
-- Verified before writing this: every parent table's seed data already
-- exactly matches its child column's live CHECK value list (spot-checked all
-- 12 against V1/V9/V47) — storage_facility_type in particular was kept in
-- sync by V47's own "Refresh dbo.storage_facility_type parent lookup to the
-- canonical 14" step, so no reseeding is needed here, only the final cutover
-- V17 always intended: backfill any straggler rows, drop the old column, and
-- rename the FK column into the original column's name — the same convention
-- every other completed conversion in this codebase uses (V55/V63/V77:
-- commodity_type, book_type, load_type, gas_day_type, classification_type,
-- operator_type all keep the FK under the ORIGINAL bare column name, not an
-- "_id" suffix).
--
-- Temporal tables (legal_entity, counterparty, trade) require
-- SYSTEM_VERSIONING toggled off/around each change, mirrored onto their
-- _history tables — same requirement V17 itself documented and handled.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- Pattern per non-temporal pair:
--   1. backfill any straggler rows (safe no-op if V17's backfill already covered them)
--   2. drop the old CHECK constraint + VARCHAR column
--   3. rename the orphaned FK column into the original column's name
--   4. re-apply NOT NULL to match the original column's nullability
-- =============================================================================

-- ── 1. dbo.contact.contact_role → contact_role ─────────────────────────────
-- ix_contact_entity includes contact_role — drop/recreate around the change
-- (same class of index-blocks-DROP-COLUMN issue V57 hit with period.commodity_type).
UPDATE c SET c.contact_role_id = cr.contact_role_id
FROM dbo.contact c JOIN dbo.contact_role cr ON cr.type_code = c.contact_role
WHERE c.contact_role_id IS NULL AND c.contact_role IS NOT NULL;
GO
DROP INDEX ix_contact_entity ON dbo.contact;
GO
ALTER TABLE dbo.contact DROP CONSTRAINT IF EXISTS chk_contact_role;
ALTER TABLE dbo.contact DROP COLUMN contact_role;
GO
EXEC sp_rename 'dbo.contact.contact_role_id', 'contact_role', 'COLUMN';
GO
ALTER TABLE dbo.contact ALTER COLUMN contact_role INT NOT NULL;
GO
CREATE INDEX ix_contact_entity ON dbo.contact (entity_type, entity_id, contact_role, is_active);
GO

-- ── 2. dbo.address.address_type → address_type ─────────────────────────────
-- ix_address_entity includes address_type — drop/recreate around the change.
UPDATE a SET a.address_type_id = at.address_type_id
FROM dbo.address a JOIN dbo.address_type at ON at.type_code = a.address_type
WHERE a.address_type_id IS NULL AND a.address_type IS NOT NULL;
GO
DROP INDEX ix_address_entity ON dbo.address;
GO
ALTER TABLE dbo.address DROP CONSTRAINT IF EXISTS chk_addr_type;
ALTER TABLE dbo.address DROP COLUMN address_type;
GO
EXEC sp_rename 'dbo.address.address_type_id', 'address_type', 'COLUMN';
GO
ALTER TABLE dbo.address ALTER COLUMN address_type INT NOT NULL;
GO
CREATE INDEX ix_address_entity ON dbo.address (entity_type, entity_id, address_type, is_active);
GO

-- ── 3. dbo.bank_account.account_type → bank_account_type ───────────────────
-- ix_bank_acct_entity includes account_type — drop/recreate around the change.
UPDATE b SET b.bank_account_type_id = bat.bank_account_type_id
FROM dbo.bank_account b JOIN dbo.bank_account_type bat ON bat.type_code = b.account_type
WHERE b.bank_account_type_id IS NULL AND b.account_type IS NOT NULL;
GO
DROP INDEX ix_bank_acct_entity ON dbo.bank_account;
GO
ALTER TABLE dbo.bank_account DROP CONSTRAINT IF EXISTS chk_bank_acct_type;
ALTER TABLE dbo.bank_account DROP COLUMN account_type;
GO
EXEC sp_rename 'dbo.bank_account.bank_account_type_id', 'account_type', 'COLUMN';
GO
ALTER TABLE dbo.bank_account ALTER COLUMN account_type INT NOT NULL;
GO
CREATE INDEX ix_bank_acct_entity ON dbo.bank_account (entity_type, entity_id, account_type, is_active);
GO

-- ── 4. dbo.payment_term.payment_method → payment_method ────────────────────
UPDATE p SET p.payment_method_id = pm.payment_method_id
FROM dbo.payment_term p JOIN dbo.payment_method pm ON pm.type_code = p.payment_method
WHERE p.payment_method_id IS NULL AND p.payment_method IS NOT NULL;
GO
ALTER TABLE dbo.payment_term DROP CONSTRAINT IF EXISTS chk_pt_method;
ALTER TABLE dbo.payment_term DROP COLUMN payment_method;
GO
EXEC sp_rename 'dbo.payment_term.payment_method_id', 'payment_method', 'COLUMN';
GO
ALTER TABLE dbo.payment_term ALTER COLUMN payment_method INT NOT NULL;
GO

-- ── 5. dbo.product.settlement_type → settlement_type ───────────────────────
UPDATE p SET p.settlement_type_id = st.settlement_type_id
FROM dbo.product p JOIN dbo.settlement_type st ON st.type_code = p.settlement_type
WHERE p.settlement_type_id IS NULL AND p.settlement_type IS NOT NULL;
GO
ALTER TABLE dbo.product DROP CONSTRAINT IF EXISTS chk_prod_settlement;
ALTER TABLE dbo.product DROP COLUMN settlement_type;
GO
EXEC sp_rename 'dbo.product.settlement_type_id', 'settlement_type', 'COLUMN';
GO
ALTER TABLE dbo.product ALTER COLUMN settlement_type INT NOT NULL;
GO

-- ── 6. dbo.storage_facility.facility_type → storage_facility_type ──────────
-- (parent table already refreshed to the canonical 14 codes by V47 — no reseed needed)
UPDATE s SET s.storage_facility_type_id = sft.storage_facility_type_id
FROM dbo.storage_facility s JOIN dbo.storage_facility_type sft ON sft.type_code = s.facility_type
WHERE s.storage_facility_type_id IS NULL AND s.facility_type IS NOT NULL;
GO
ALTER TABLE dbo.storage_facility DROP CONSTRAINT IF EXISTS chk_fac_type;
ALTER TABLE dbo.storage_facility DROP COLUMN facility_type;
GO
EXEC sp_rename 'dbo.storage_facility.storage_facility_type_id', 'facility_type', 'COLUMN';
GO
ALTER TABLE dbo.storage_facility ALTER COLUMN facility_type INT NOT NULL;
GO

-- ── 7. dbo.netting_agreement.agreement_type → netting_agreement_type ───────
-- uq_netting (legal_entity_id, counterparty_id, agreement_type) includes this
-- column — drop/recreate around the change.
UPDATE n SET n.netting_agreement_type_id = nat.netting_agreement_type_id
FROM dbo.netting_agreement n JOIN dbo.netting_agreement_type nat ON nat.type_code = n.agreement_type
WHERE n.netting_agreement_type_id IS NULL AND n.agreement_type IS NOT NULL;
GO
ALTER TABLE dbo.netting_agreement DROP CONSTRAINT uq_netting;
ALTER TABLE dbo.netting_agreement DROP CONSTRAINT IF EXISTS chk_netting_type;
ALTER TABLE dbo.netting_agreement DROP COLUMN agreement_type;
GO
EXEC sp_rename 'dbo.netting_agreement.netting_agreement_type_id', 'agreement_type', 'COLUMN';
GO
ALTER TABLE dbo.netting_agreement ALTER COLUMN agreement_type INT NOT NULL;
ALTER TABLE dbo.netting_agreement ADD CONSTRAINT uq_netting UNIQUE (legal_entity_id, counterparty_id, agreement_type);
GO

-- ── 8. dbo.tax_registration.tax_type → tax_type ─────────────────────────────
-- uq_tax_reg (entity_type, entity_id, tax_type, jurisdiction) includes this
-- column — drop/recreate around the change.
UPDATE t SET t.tax_type_id = tt.tax_type_id
FROM dbo.tax_registration t JOIN dbo.tax_type tt ON tt.type_code = t.tax_type
WHERE t.tax_type_id IS NULL AND t.tax_type IS NOT NULL;
GO
ALTER TABLE dbo.tax_registration DROP CONSTRAINT uq_tax_reg;
ALTER TABLE dbo.tax_registration DROP CONSTRAINT IF EXISTS chk_tax_type;
ALTER TABLE dbo.tax_registration DROP COLUMN tax_type;
GO
EXEC sp_rename 'dbo.tax_registration.tax_type_id', 'tax_type', 'COLUMN';
GO
ALTER TABLE dbo.tax_registration ALTER COLUMN tax_type INT NOT NULL;
ALTER TABLE dbo.tax_registration ADD CONSTRAINT uq_tax_reg UNIQUE (entity_type, entity_id, tax_type, jurisdiction);
GO

-- =============================================================================
-- Temporal tables — SYSTEM_VERSIONING toggled off/around each change,
-- mirrored onto the _history table, same requirement V17 documented.
-- =============================================================================

-- ── 9. dbo.legal_entity.entity_type → legal_entity_type ────────────────────
UPDATE l SET l.legal_entity_type_id = let.legal_entity_type_id
FROM dbo.legal_entity l JOIN dbo.legal_entity_type let ON let.type_code = l.entity_type
WHERE l.legal_entity_type_id IS NULL AND l.entity_type IS NOT NULL;
GO
ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.legal_entity DROP CONSTRAINT IF EXISTS chk_le_type;
ALTER TABLE dbo.legal_entity DROP COLUMN entity_type;
ALTER TABLE dbo.legal_entity_history DROP COLUMN entity_type;
GO
EXEC sp_rename 'dbo.legal_entity.legal_entity_type_id', 'entity_type', 'COLUMN';
GO
ALTER TABLE dbo.legal_entity ALTER COLUMN entity_type INT NOT NULL;
ALTER TABLE dbo.legal_entity_history ADD entity_type INT NULL;
GO
ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.legal_entity_history));
GO

-- ── 10/11. dbo.counterparty.cp_type + kyc_status → counterparty_type / kyc_status ──
-- ix_cp_type / ix_cp_kyc index these columns directly — drop/recreate around the change.
UPDATE cp SET cp.counterparty_type_id = ct.counterparty_type_id
FROM dbo.counterparty cp JOIN dbo.counterparty_type ct ON ct.type_code = cp.cp_type
WHERE cp.counterparty_type_id IS NULL AND cp.cp_type IS NOT NULL;
GO
UPDATE cp SET cp.kyc_status_id = ks.kyc_status_id
FROM dbo.counterparty cp JOIN dbo.kyc_status ks ON ks.type_code = cp.kyc_status
WHERE cp.kyc_status_id IS NULL AND cp.kyc_status IS NOT NULL;
GO
DROP INDEX ix_cp_type ON dbo.counterparty;
DROP INDEX ix_cp_kyc ON dbo.counterparty;
GO
ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.counterparty DROP CONSTRAINT IF EXISTS chk_cp_type;
ALTER TABLE dbo.counterparty DROP CONSTRAINT IF EXISTS chk_kyc_status;
ALTER TABLE dbo.counterparty DROP COLUMN cp_type, kyc_status;
ALTER TABLE dbo.counterparty_history DROP COLUMN cp_type, kyc_status;
GO
EXEC sp_rename 'dbo.counterparty.counterparty_type_id', 'cp_type', 'COLUMN';
EXEC sp_rename 'dbo.counterparty.kyc_status_id', 'kyc_status', 'COLUMN';
GO
ALTER TABLE dbo.counterparty ALTER COLUMN cp_type INT NOT NULL;
ALTER TABLE dbo.counterparty ALTER COLUMN kyc_status INT NOT NULL;
ALTER TABLE dbo.counterparty_history ADD cp_type INT NULL, kyc_status INT NULL;
GO
ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.counterparty_history));
GO
CREATE INDEX ix_cp_type ON dbo.counterparty (cp_type, is_active) INCLUDE (cp_code, legal_name);
CREATE INDEX ix_cp_kyc  ON dbo.counterparty (kyc_status, is_active) INCLUDE (cp_code, kyc_expiry_date);
GO

-- ── 12/13. dbo.trade.trade_type + settlement_type → deal_type / settlement_type ──
UPDATE t SET t.deal_type_id = dt.deal_type_id
FROM dbo.trade t JOIN dbo.deal_type dt ON dt.type_code = t.trade_type
WHERE t.deal_type_id IS NULL AND t.trade_type IS NOT NULL;
GO
UPDATE t SET t.trade_settlement_type_id = st.settlement_type_id
FROM dbo.trade t JOIN dbo.settlement_type st ON st.type_code = t.settlement_type
WHERE t.trade_settlement_type_id IS NULL AND t.settlement_type IS NOT NULL;
GO
ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.trade DROP CONSTRAINT IF EXISTS chk_trade_type;
ALTER TABLE dbo.trade DROP CONSTRAINT IF EXISTS chk_trade_settlement;
ALTER TABLE dbo.trade DROP COLUMN trade_type, settlement_type;
ALTER TABLE dbo.trade_history DROP COLUMN trade_type, settlement_type;
GO
EXEC sp_rename 'dbo.trade.deal_type_id', 'trade_type', 'COLUMN';
EXEC sp_rename 'dbo.trade.trade_settlement_type_id', 'settlement_type', 'COLUMN';
GO
ALTER TABLE dbo.trade ALTER COLUMN trade_type INT NOT NULL;
ALTER TABLE dbo.trade ALTER COLUMN settlement_type INT NOT NULL;
ALTER TABLE dbo.trade_history ADD trade_type INT NULL, settlement_type INT NULL;
GO
ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history));
GO

PRINT '============================================================';
PRINT 'V78 — FINISHED V17''S DEFERRED PARENT-LOOKUP CUTOVER';
PRINT '  12 of the 13 V17 pairs completed (book.book_type was already';
PRINT '  finished separately by V55). Each old CHECK+VARCHAR column is';
PRINT '  dropped; its orphaned FK column is renamed into the original';
PRINT '  bare column name (contact_role, address_type, account_type,';
PRINT '  payment_method, settlement_type x2, facility_type, agreement_type,';
PRINT '  tax_type, entity_type, cp_type, kyc_status, trade_type) and';
PRINT '  NOT NULL re-applied. Temporal tables (legal_entity, counterparty,';
PRINT '  trade) had SYSTEM_VERSIONING toggled off/around the change and';
PRINT '  their _history tables kept in step.';
PRINT '============================================================';
GO

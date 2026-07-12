-- =============================================================================
-- V81 — Seven CHECK-constrained columns converted to lookup_value FK
-- =============================================================================
-- User asked for a review of static data table references that are wrong or
-- missing. Following up on the ~26-entry orphan sweep (V80's GUI reconciliation
-- covered the registry/Hub mismatches): 5 of those orphans turned out to
-- already have their lookup_value category rows seeded — V44
-- (instrument_type/storage_agreement_type/transport_agreement_type) and V46
-- (price_adjustment_type/demurrage_basis) both explicitly comment "for UI
-- dropdowns / reference data" — but the actual consuming column on the real
-- table was never converted from its original CHECK+VARCHAR to an FK against
-- those rows. Same story for 2 more found separately: V38 seeded
-- rin_transaction_type/rin_obligation_status under dbo.lookup_value, but
-- rin_transaction.transaction_type and rin_obligation.status are still plain
-- CHECK+VARCHAR too. All seven are half-finished V77-style conversions —
-- this migration is the same staging-column pattern V77 already established
-- (add new INT column, backfill via category+code JOIN, drop the old CHECK
-- column, rename the new one into its place, add the FK), just finishing
-- what was already started rather than deciding anything new.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 1. dbo.trade.instrument_type ──────────────────────────────────────────────
ALTER TABLE dbo.trade ADD instrument_type_new INT NULL;
GO
UPDATE t SET t.instrument_type_new = lv.lookup_id
FROM dbo.trade t JOIN dbo.lookup_value lv ON lv.category = 'instrument_type' AND lv.code = t.instrument_type;
GO
ALTER TABLE dbo.trade DROP CONSTRAINT IF EXISTS ck_trade_instrument_type;
ALTER TABLE dbo.trade DROP COLUMN instrument_type;
GO
EXEC sp_rename 'dbo.trade.instrument_type_new', 'instrument_type', 'COLUMN';
GO
ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_instrument_type FOREIGN KEY (instrument_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── 2. dbo.trade_storage_agreement_detail.storage_agreement_type ─────────────
ALTER TABLE dbo.trade_storage_agreement_detail ADD storage_agreement_type_new INT NULL;
GO
UPDATE t SET t.storage_agreement_type_new = lv.lookup_id
FROM dbo.trade_storage_agreement_detail t JOIN dbo.lookup_value lv ON lv.category = 'storage_agreement_type' AND lv.code = t.storage_agreement_type;
GO
ALTER TABLE dbo.trade_storage_agreement_detail DROP CONSTRAINT IF EXISTS ck_storage_agr_type;
ALTER TABLE dbo.trade_storage_agreement_detail DROP COLUMN storage_agreement_type;
GO
EXEC sp_rename 'dbo.trade_storage_agreement_detail.storage_agreement_type_new', 'storage_agreement_type', 'COLUMN';
GO
ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_tsad_storage_agr_type FOREIGN KEY (storage_agreement_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── 3. dbo.trade_transport_agreement_detail.transport_agreement_type ─────────
ALTER TABLE dbo.trade_transport_agreement_detail ADD transport_agreement_type_new INT NULL;
GO
UPDATE t SET t.transport_agreement_type_new = lv.lookup_id
FROM dbo.trade_transport_agreement_detail t JOIN dbo.lookup_value lv ON lv.category = 'transport_agreement_type' AND lv.code = t.transport_agreement_type;
GO
ALTER TABLE dbo.trade_transport_agreement_detail DROP CONSTRAINT IF EXISTS ck_transport_agr_type;
ALTER TABLE dbo.trade_transport_agreement_detail DROP COLUMN transport_agreement_type;
GO
EXEC sp_rename 'dbo.trade_transport_agreement_detail.transport_agreement_type_new', 'transport_agreement_type', 'COLUMN';
GO
ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_transport_agr_type FOREIGN KEY (transport_agreement_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── 4. dbo.trade_order_price_adjustment.adjustment_type (NOT NULL) ───────────
ALTER TABLE dbo.trade_order_price_adjustment ADD adjustment_type_new INT NULL;
GO
UPDATE t SET t.adjustment_type_new = lv.lookup_id
FROM dbo.trade_order_price_adjustment t JOIN dbo.lookup_value lv ON lv.category = 'price_adjustment_type' AND lv.code = t.adjustment_type;
GO
ALTER TABLE dbo.trade_order_price_adjustment DROP CONSTRAINT IF EXISTS ck_pa_type;
ALTER TABLE dbo.trade_order_price_adjustment DROP COLUMN adjustment_type;
GO
EXEC sp_rename 'dbo.trade_order_price_adjustment.adjustment_type_new', 'adjustment_type', 'COLUMN';
GO
ALTER TABLE dbo.trade_order_price_adjustment ALTER COLUMN adjustment_type INT NOT NULL;
ALTER TABLE dbo.trade_order_price_adjustment ADD CONSTRAINT fk_topa_adjustment_type FOREIGN KEY (adjustment_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── 5. dbo.trade_order.demurrage_basis ────────────────────────────────────────
ALTER TABLE dbo.trade_order ADD demurrage_basis_new INT NULL;
GO
UPDATE t SET t.demurrage_basis_new = lv.lookup_id
FROM dbo.trade_order t JOIN dbo.lookup_value lv ON lv.category = 'demurrage_basis' AND lv.code = t.demurrage_basis;
GO
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS ck_to_demurrage_basis;
ALTER TABLE dbo.trade_order DROP COLUMN demurrage_basis;
GO
EXEC sp_rename 'dbo.trade_order.demurrage_basis_new', 'demurrage_basis', 'COLUMN';
GO
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_demurrage_basis FOREIGN KEY (demurrage_basis) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── 6. dbo.rin_transaction.transaction_type (NOT NULL) ───────────────────────
ALTER TABLE dbo.rin_transaction ADD transaction_type_new INT NULL;
GO
UPDATE t SET t.transaction_type_new = lv.lookup_id
FROM dbo.rin_transaction t JOIN dbo.lookup_value lv ON lv.category = 'rin_transaction_type' AND lv.code = t.transaction_type;
GO
ALTER TABLE dbo.rin_transaction DROP CONSTRAINT IF EXISTS chk_rin_txn_type;
ALTER TABLE dbo.rin_transaction DROP COLUMN transaction_type;
GO
EXEC sp_rename 'dbo.rin_transaction.transaction_type_new', 'transaction_type', 'COLUMN';
GO
ALTER TABLE dbo.rin_transaction ALTER COLUMN transaction_type INT NOT NULL;
ALTER TABLE dbo.rin_transaction ADD CONSTRAINT fk_rin_txn_type FOREIGN KEY (transaction_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── 7. dbo.rin_obligation.status (NOT NULL DEFAULT 'OPEN') ───────────────────
ALTER TABLE dbo.rin_obligation ADD status_new INT NULL;
GO
UPDATE t SET t.status_new = lv.lookup_id
FROM dbo.rin_obligation t JOIN dbo.lookup_value lv ON lv.category = 'rin_obligation_status' AND lv.code = t.status;
GO
-- status has an unnamed inline DEFAULT ('OPEN', V38) — find and drop it
-- dynamically before dropping the column (same pattern V55/V78 already used).
DECLARE @rinStatusDefault NVARCHAR(200);
SELECT @rinStatusDefault = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.rin_obligation') AND c.name = 'status';
IF @rinStatusDefault IS NOT NULL
    EXEC('ALTER TABLE dbo.rin_obligation DROP CONSTRAINT ' + @rinStatusDefault);
GO
ALTER TABLE dbo.rin_obligation DROP CONSTRAINT IF EXISTS chk_rin_obl_status;
ALTER TABLE dbo.rin_obligation DROP COLUMN status;
GO
EXEC sp_rename 'dbo.rin_obligation.status_new', 'status', 'COLUMN';
GO
ALTER TABLE dbo.rin_obligation ALTER COLUMN status INT NOT NULL;
ALTER TABLE dbo.rin_obligation ADD CONSTRAINT fk_rin_obl_status FOREIGN KEY (status) REFERENCES dbo.lookup_value(lookup_id);
GO

PRINT '============================================================';
PRINT 'V81 — 7 CHECK COLUMNS FINISHED THEIR LOOKUP_VALUE CONVERSION';
PRINT '  trade.instrument_type, trade_storage_agreement_detail.storage_agreement_type,';
PRINT '  trade_transport_agreement_detail.transport_agreement_type,';
PRINT '  trade_order_price_adjustment.adjustment_type, trade_order.demurrage_basis,';
PRINT '  rin_transaction.transaction_type, rin_obligation.status —';
PRINT '  all now FK dbo.lookup_value(lookup_id), lookup rows already existed.';
PRINT '============================================================';
GO

-- =============================================================================
-- V258 — Insert a real Order tier above Leg in trade capture
-- =============================================================================
-- DRAFT staged for review next session — NOT yet verified against a running
-- database. See docs/trade_order_leg_tier_pending_10.md for full rationale,
-- the complete FK inventory this touches, and the backfill decision.
--
-- Problem: dbo.tran_trade_order is named "order" but has always been shaped
-- as a LEG (one row per delivery/risk period). There is no tier anywhere
-- holding real order-level facts (the one quantity a trader actually agreed,
-- the one execution date, order-level status) that a multi-leg order
-- decomposes into. Confirmed with Dharani 2026-08-19: this is physical
-- deal-capture domain modeling, not exchange/OMS execution connectivity
-- (that stays explicitly out of scope).
--
-- This migration:
--   1. Renames dbo.tran_trade_order -> dbo.tran_leg, order_id -> leg_id
--   2. Renames dbo.tran_trade_item  -> dbo.tran_leg_item
--   3. Renames the V219 governance triggers/indexes still carrying the old
--      trade_order/trade_item names (debris left over from V221's table
--      rename, which didn't touch dependent trigger/index names)
--   4. Creates dbo.tran_order (new order header tier)
--   5. Adds tran_leg.order_id FK -> tran_order, backfilled 1:1 (one order
--      per existing leg — see pending doc for why 1:1, not a guessed grouping)
--   6. Renames the 6 tables whose name literally contains "trade_order"
--      (tran_trade_order_cost/assay_result/price_adjustment/balmo/tas/
--      custom_field_value) to tran_leg_*, order_id -> leg_id on each, plus
--      their FK/index objects — these are unambiguously leg-level data, the
--      name should say so.
--
-- Deliberately NOT renamed: tran_nomination, tran_delivery_instruction,
-- tran_trade_swap_detail, tran_trade_option_detail,
-- tran_trade_storage_agreement_detail, tran_trade_transport_agreement_detail,
-- tran_charter_party. These FK to the leg via an order_id/trade_order_id
-- column too, but none of them carry "trade_order" in their own table name
-- (no naming confusion to fix), so renaming just the column is lower-value
-- cosmetic churn — left for a later pass, see pending doc.
--
-- Also NOT done here: tran_trade_pricing_schedule's separate
-- UNIQUE(trade_id) issue; any Java/frontend/MSW changes.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. RENAME dbo.tran_trade_order -> dbo.tran_leg
-- =============================================================================
EXEC sp_rename 'dbo.tran_trade_order', 'tran_leg', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg.order_id', 'leg_id', 'COLUMN';
GO
-- order_sequence/order_reference are the leg's OWN sequence/reference within
-- the trade (e.g. 'TRD-2026-00001-01') — same naming issue as order_id was,
-- caught on a second pass while building the frontend types against this
-- table. Not to be confused with tran_order's own order_sequence/
-- order_reference, which are genuinely order-level and stay as-is.
EXEC sp_rename 'dbo.tran_leg.order_sequence', 'leg_sequence', 'COLUMN';
GO
EXEC sp_rename 'dbo.tran_leg.order_reference', 'leg_reference', 'COLUMN';
GO

-- Governance trigger + indexes still carry the pre-V258 name — rename while
-- already touching this table. NOTE: V221 already dropped+recreated this
-- trigger as trg_tran_trade_order_row_version_guard (not left at its
-- original trg_trade_order_row_version_guard name as this migration first
-- assumed from a static read of V219 alone — confirmed against a real
-- SQL Server instance, which caught this exact mismatch: sp_rename against
-- the wrong source name fails with error 15248, not a silent no-op).
EXEC sp_rename 'dbo.trg_tran_trade_order_row_version_guard', 'trg_tran_leg_row_version_guard', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg.ix_trade_order_trade_id', 'ix_tran_leg_trade_id', 'INDEX';
GO
EXEC sp_rename 'dbo.tran_leg.ix_trade_order_status', 'ix_tran_leg_status', 'INDEX';
GO
EXEC sp_rename 'dbo.tran_leg.uq_trade_order_seq', 'uq_tran_leg_seq', 'INDEX';
GO

-- =============================================================================
-- 2. RENAME dbo.tran_trade_item -> dbo.tran_leg_item
-- =============================================================================
EXEC sp_rename 'dbo.tran_trade_item', 'tran_leg_item', 'OBJECT';
GO
-- Same V221-already-renamed-this-trigger correction as tran_leg's trigger above.
EXEC sp_rename 'dbo.trg_tran_trade_item_row_version_guard', 'trg_tran_leg_item_row_version_guard', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_item.ix_trade_item_order_id', 'ix_tran_leg_item_leg_id', 'INDEX';
GO
EXEC sp_rename 'dbo.tran_leg_item.ix_trade_item_trade_id', 'ix_tran_leg_item_trade_id', 'INDEX';
GO
EXEC sp_rename 'dbo.tran_leg_item.uq_trade_item_seq', 'uq_tran_leg_item_seq', 'INDEX';
GO

-- =============================================================================
-- 3. CREATE dbo.tran_order — the new order header tier
-- One row per negotiated order. A multi-leg order (e.g. a term deal split
-- into monthly delivery windows) has one tran_order row and multiple
-- tran_leg rows sharing its order_id.
-- =============================================================================
CREATE TABLE dbo.tran_order (
    order_id              INT           NOT NULL IDENTITY(1,1),
    trade_id              INT           NOT NULL,
    order_sequence        INT           NOT NULL DEFAULT 1,
    order_reference       VARCHAR(60)   NOT NULL,
    status                VARCHAR(20)   NOT NULL DEFAULT 'WORKING',

    -- The commercial facts actually agreed for this order, as a whole —
    -- individual legs slice order_quantity across their own delivery periods,
    -- and may sum to more or less than it (tolerance, optionality).
    -- uom_id/currency_id, not _code columns: confirmed against the real DB
    -- that tran_leg (and tran_trade) carry FK ids only, code resolved via
    -- join — V94/V95 converted every such column platform-wide, well before
    -- this migration; the original draft's uom_code/currency_code columns
    -- (matching V33's decade-old design, not the current one) were caught
    -- and fixed here by an actual SQL Server run, not by static reading.
    order_execution_date  DATE          NOT NULL,
    order_quantity        DECIMAL(18,4) NOT NULL,
    uom_id                 INT           NOT NULL,
    price                  DECIMAL(18,6) NULL,   -- flat order-level price, if legs don't price independently
    currency_id              INT           NOT NULL,

    -- Deal-structure classification: OUTRIGHT = single leg, SPREAD = crack/
    -- spark/dark spread or other paired-commodity structure, TERM = strip of
    -- delivery periods (the July/August TTF example). NOT an OMS fill state —
    -- see note below on why status stays WORKING/CONFIRMED/SETTLED/CANCELLED.
    order_type                VARCHAR(20)   NOT NULL DEFAULT 'OUTRIGHT'
        CONSTRAINT chk_tran_order_type CHECK (order_type IN ('OUTRIGHT','SPREAD','TERM')),

    notes                     NVARCHAR(2000) NULL,

    row_version               INT            NOT NULL CONSTRAINT df_tran_order_row_version DEFAULT (0),
    created_at                DATETIME2      NOT NULL CONSTRAINT df_tran_order_created_at DEFAULT (GETDATE()),
    created_by                VARCHAR(100)   NOT NULL,
    updated_at                DATETIME2      NOT NULL CONSTRAINT df_tran_order_updated_at DEFAULT (GETDATE()),
    updated_by                VARCHAR(100)   NOT NULL,

    CONSTRAINT pk_tran_order          PRIMARY KEY (order_id),
    CONSTRAINT fk_tran_order_trade    FOREIGN KEY (trade_id) REFERENCES dbo.tran_trade(trade_id),
    CONSTRAINT fk_tran_order_uom      FOREIGN KEY (uom_id) REFERENCES dbo.ref_unit_of_measure(uom_id),
    CONSTRAINT fk_tran_order_currency FOREIGN KEY (currency_id) REFERENCES dbo.ref_currency(currency_id),
    CONSTRAINT chk_tran_order_status  CHECK (status IN ('WORKING','CONFIRMED','SETTLED','CANCELLED')),
    CONSTRAINT uq_tran_order_seq      UNIQUE (trade_id, order_sequence)
);
GO

CREATE INDEX ix_tran_order_trade_id ON dbo.tran_order (trade_id);
CREATE INDEX ix_tran_order_status   ON dbo.tran_order (status);
GO

CREATE TRIGGER dbo.trg_tran_order_row_version_guard ON dbo.tran_order AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.tran_order (bypass write rejected by trg_tran_order_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.[order_id] = d.[order_id]
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.tran_order (stale or reused version rejected by trg_tran_order_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

-- =============================================================================
-- 4. BACKFILL — one tran_order row per existing tran_leg row (1:1)
-- No existing data records which legs belong to the same negotiated order,
-- so this does not fabricate groupings. See pending doc: if any existing
-- multi-leg trade should actually collapse to one order, that's a manual
-- data call to make after this migration, not something to infer here.
-- =============================================================================
ALTER TABLE dbo.tran_leg ADD order_id INT NULL;
GO

INSERT INTO dbo.tran_order
    (trade_id, order_sequence, order_reference, status,
     order_execution_date, order_quantity, uom_id, price, currency_id,
     row_version, created_by, updated_by)
SELECT
    l.trade_id, l.leg_sequence, l.leg_reference, l.status,
    t.trade_date, l.quantity, l.uom_id, l.price, l.currency_id,
    0, l.created_by, l.updated_by
FROM dbo.tran_leg l
INNER JOIN dbo.tran_trade t ON t.trade_id = l.trade_id;
GO

-- Bumps row_version too: the platform's row_version_guard trigger (V219/
-- V221) rejects any UPDATE that doesn't explicitly advance it — confirmed
-- against a real SQL Server instance, which caught this omission outright.
UPDATE l
SET    l.order_id = o.order_id,
       l.row_version = l.row_version + 1
FROM   dbo.tran_leg l
INNER JOIN dbo.tran_order o
        ON o.trade_id = l.trade_id AND o.order_sequence = l.leg_sequence;
GO

ALTER TABLE dbo.tran_leg ALTER COLUMN order_id INT NOT NULL;
GO
ALTER TABLE dbo.tran_leg ADD CONSTRAINT fk_tran_leg_order FOREIGN KEY (order_id) REFERENCES dbo.tran_order(order_id);
GO
CREATE INDEX ix_tran_leg_order_id ON dbo.tran_leg (order_id);
GO

-- =============================================================================
-- 5. RENAME the 6 tables whose name literally contains "trade_order" —
-- unambiguously leg-level data (cost, assay, price adjustment, BALMO, TAS,
-- custom fields). order_id already means "which leg", now the column says so.
-- =============================================================================

-- ── tran_trade_order_cost -> tran_leg_cost ──────────────────────────────────
EXEC sp_rename 'dbo.tran_trade_order_cost', 'tran_leg_cost', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_cost.order_id', 'leg_id', 'COLUMN';
GO
EXEC sp_rename 'dbo.fk_toc_order', 'fk_tlc_leg', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_cost.ix_toc_order', 'ix_tlc_leg', 'INDEX';
GO

-- ── tran_trade_order_assay_result -> tran_leg_assay_result ─────────────────
EXEC sp_rename 'dbo.tran_trade_order_assay_result', 'tran_leg_assay_result', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_assay_result.order_id', 'leg_id', 'COLUMN';
GO
EXEC sp_rename 'dbo.fk_assay_order', 'fk_tlar_leg', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_assay_result.ix_assay_order', 'ix_tlar_leg', 'INDEX';
GO

-- ── tran_trade_order_price_adjustment -> tran_leg_price_adjustment ─────────
EXEC sp_rename 'dbo.tran_trade_order_price_adjustment', 'tran_leg_price_adjustment', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_price_adjustment.order_id', 'leg_id', 'COLUMN';
GO
EXEC sp_rename 'dbo.fk_pa_order', 'fk_tlpa_leg', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_price_adjustment.ix_pa_order', 'ix_tlpa_leg', 'INDEX';
GO

-- ── tran_trade_order_balmo -> tran_leg_balmo ────────────────────────────────
EXEC sp_rename 'dbo.tran_trade_order_balmo', 'tran_leg_balmo', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_balmo.order_id', 'leg_id', 'COLUMN';
GO
EXEC sp_rename 'dbo.fk_balmo_order', 'fk_tlb_leg', 'OBJECT';
GO

-- ── tran_trade_order_tas -> tran_leg_tas ────────────────────────────────────
EXEC sp_rename 'dbo.tran_trade_order_tas', 'tran_leg_tas', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_tas.order_id', 'leg_id', 'COLUMN';
GO
EXEC sp_rename 'dbo.fk_order_tas_order', 'fk_tlt_leg', 'OBJECT';
GO

-- ── tran_trade_order_custom_field_value -> tran_leg_custom_field_value ─────
EXEC sp_rename 'dbo.tran_trade_order_custom_field_value', 'tran_leg_custom_field_value', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_custom_field_value.order_id', 'leg_id', 'COLUMN';
GO
EXEC sp_rename 'dbo.fk_tocfv_order', 'fk_tlcfv_leg', 'OBJECT';
GO
EXEC sp_rename 'dbo.tran_leg_custom_field_value.ix_tocfv_order', 'ix_tlcfv_leg', 'INDEX';
GO

PRINT '============================================================';
PRINT 'V258 APPLIED — tran_order tier inserted above tran_leg';
PRINT '  tran_trade_order -> tran_leg (order_id -> leg_id)';
PRINT '  tran_trade_item  -> tran_leg_item';
PRINT '  tran_order created, tran_leg.order_id backfilled 1:1';
PRINT '  6 leg-child tables renamed tran_trade_order_* -> tran_leg_* (order_id -> leg_id)';
PRINT '  Deferred: order_id rename on 7 non-"trade_order"-named leg-children (cosmetic)';
PRINT '  Deferred: tran_trade_pricing_schedule UNIQUE(trade_id) leg-grain fix';
PRINT '============================================================';
GO

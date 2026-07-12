-- =============================================================================
-- V69 — commodity_grade_standard: rescope from commodity_family to product;
-- link trade_order_price_adjustment back to the grade standard it came from
-- =============================================================================
-- User question after V67: is a grade standard's discount/premium schedule
-- shared across a whole commodity_family, or specific to one product/contract
-- — and should the actual grade delivered be captured per trade, driving the
-- price adjustment automatically?
--
-- Researched real practice: CBOT's own rulebook (Chapter 10 Corn, Chapter 14
-- Wheat) publishes a SEPARATE grade/class differential schedule per listed
-- contract — Corn's differentials (cents/bushel by shipping station and
-- grade) are not the same schedule as Wheat's (different cents/bushel,
-- different vomitoxin-ppm grade classes), even though both list under the
-- same GRAINS commodity_family here. V67's `commodity_family_id` FK was
-- therefore the wrong scope — it would have implied Corn and Wheat share one
-- differential schedule, which is factually wrong. Rescoped to `product_id`
-- (the specific exchange contract / product row), matching how the real
-- schedules are actually published and how this system's own `product.
-- grade_code` already represents one fixed base/par grade per product.
--
-- Separately: crude oil's real-world equivalent (pipeline "quality bank"
-- adjustments — RBN Energy / Allocation Specialists LLC methodology) is
-- computed PER CARGO from the actual assay (API gravity, sulfur) vs. a
-- reference, not read off a static published schedule — that per-trade
-- capture already exists here as dbo.trade_order_price_adjustment (V46,
-- adjustment_type already includes QUALITY_PREMIUM/QUALITY_DISCOUNT/ASSAY).
-- What was missing was the link between the two: a trader picking a
-- published grade standard for a specific order should be able to
-- auto-populate a price adjustment from it, while still leaving fully
-- manual/assay-computed adjustments (crude, LNG cargo) untouched. Adds a
-- nullable grade_standard_id FK on trade_order_price_adjustment for that
-- traceability — NULL for manually-entered/assay-computed adjustments,
-- populated when derived from a published commodity_grade_standard row.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 1. Rescope commodity_grade_standard to product_id ──────────────────────
ALTER TABLE dbo.commodity_grade_standard ADD product_id INT NULL;
GO

-- CBOT-CORN was never seeded anywhere in this migration chain (only
-- referenced by harmless no-op UPDATEs in V25/V60) — same gap V24/V39 hit
-- for other benchmark products. Seeded here since this is the first place
-- that actually needs it to exist (a real FK, not just a backfill match).
IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'CBOT-CORN')
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_uom_id, default_currency_id, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'AGRI'),
    'CBOT-CORN', 'CBOT Corn No. 2 Yellow', 'PHYSICAL',
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'BUSHEL'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    1, 'SYSTEM';
GO

UPDATE cgs
SET    cgs.product_id = p.product_id
FROM   dbo.commodity_grade_standard cgs
JOIN   dbo.product p ON p.product_code = 'CBOT-CORN';
GO

ALTER TABLE dbo.commodity_grade_standard ALTER COLUMN product_id INT NOT NULL;
GO
ALTER TABLE dbo.commodity_grade_standard
    ADD CONSTRAINT fk_cgs_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id);
GO

DROP INDEX ix_cgs_family ON dbo.commodity_grade_standard;
GO
ALTER TABLE dbo.commodity_grade_standard DROP CONSTRAINT uq_cgs_code;
GO
ALTER TABLE dbo.commodity_grade_standard DROP CONSTRAINT fk_cgs_commodity_family;
GO
ALTER TABLE dbo.commodity_grade_standard DROP COLUMN commodity_family_id;
GO

ALTER TABLE dbo.commodity_grade_standard
    ADD CONSTRAINT uq_cgs_code UNIQUE (product_id, grade_code);
GO
CREATE INDEX ix_cgs_product ON dbo.commodity_grade_standard (product_id, is_active);
GO

-- ── 2. Link trade_order_price_adjustment back to the grade standard used ───
ALTER TABLE dbo.trade_order_price_adjustment ADD grade_standard_id INT NULL;
GO
ALTER TABLE dbo.trade_order_price_adjustment
    ADD CONSTRAINT fk_topa_grade_standard FOREIGN KEY (grade_standard_id) REFERENCES dbo.commodity_grade_standard(grade_standard_id);
GO

PRINT '============================================================';
PRINT 'V69 — GRADE STANDARD RESCOPED TO PRODUCT + BLOTTER LINK ADDED';
PRINT '  commodity_grade_standard.product_id replaces commodity_family_id.';
PRINT '  trade_order_price_adjustment.grade_standard_id — NEW nullable FK, traces';
PRINT '  an adjustment row back to the published grade standard it was derived from.';
PRINT '============================================================';
GO

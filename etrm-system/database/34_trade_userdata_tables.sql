-- ============================================================
-- V34 — Trade user-data table changes
--       Adds term_type, deal_indicator, rfp_* fields to dbo.trade
--       Adds is_template to dbo.trade_order
--       "User data" = operational/transactional tables (NOT master data)
-- ============================================================

-- ── dbo.trade — new header fields ────────────────────────────────────────────

ALTER TABLE dbo.trade
    ADD contract_number        NVARCHAR(100)  NULL,          -- external / CP contract reference
        term_type              NVARCHAR(10)   NOT NULL DEFAULT 'SPOT'
            CONSTRAINT chk_trade_term_type CHECK (term_type IN ('SPOT', 'RFP')),
        deal_indicator         NVARCHAR(10)   NOT NULL DEFAULT 'EXTERNAL'
            CONSTRAINT chk_trade_deal_indicator CHECK (deal_indicator IN ('INTERNAL', 'EXTERNAL')),
        rfp_min_qty            DECIMAL(18,6)  NULL,          -- RFP only
        rfp_max_qty            DECIMAL(18,6)  NULL,          -- RFP only
        rfp_start_date         DATE           NULL,          -- RFP only
        rfp_end_date           DATE           NULL,          -- RFP only
        rfp_frequency          NVARCHAR(15)   NULL           -- DAILY/WEEKLY/MONTHLY/QUARTERLY
            CONSTRAINT chk_trade_rfp_frequency CHECK (rfp_frequency IS NULL OR rfp_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'));

-- RFP constraint: when term_type = 'RFP', frequency and dates must be provided
ALTER TABLE dbo.trade
    ADD CONSTRAINT chk_trade_rfp_fields CHECK (
        term_type <> 'RFP'
        OR (rfp_frequency IS NOT NULL AND rfp_start_date IS NOT NULL AND rfp_end_date IS NOT NULL)
    );

-- ── dbo.trade_order — template leg flag ──────────────────────────────────────

ALTER TABLE dbo.trade_order
    ADD is_template BIT NOT NULL DEFAULT 0;

-- First leg per trade = template leg
UPDATE to_
SET    to_.is_template = 1
FROM   dbo.trade_order to_
WHERE  to_.order_sequence = 1;

-- ── Remove delivery columns from dbo.trade (now live on dbo.trade_order) ─────
-- These columns were captured on the trade header before the redesign.
-- All values have been migrated to trade_order rows as part of this release.

ALTER TABLE dbo.trade DROP COLUMN IF EXISTS product_id;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS market_id;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS pricing_rule_id;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS period_code;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS risk_start_date;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS risk_end_date;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS quantity;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS price;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS currency_code;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS incoterm_code;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS delivery_location_code;
ALTER TABLE dbo.trade DROP COLUMN IF EXISTS settlement_type;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE NONCLUSTERED INDEX IX_trade_term_type
    ON dbo.trade (term_type)
    INCLUDE (deal_indicator);

CREATE NONCLUSTERED INDEX IX_trade_order_is_template
    ON dbo.trade_order (trade_id, is_template);

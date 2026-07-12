-- ============================================================
-- V42 — Trade header enhancements + order tolerance + broker legal/commission
--
-- Phase 1 of the extended trade capture pipeline:
--   • Trade header: hedge flag, CIN, payment calendar,
--                   contract periodicity, contract status, special contract flag
--   • Trade order:  tolerance type/plus/minus, tolerance-for-scheduling flag
--   • Broker master: legal doc ID, commission UoM, commission notes
-- ============================================================

-- ── trade — add contract control columns ─────────────────────
ALTER TABLE dbo.trade ADD
    hedge_flag              BIT           NOT NULL DEFAULT 0,
    cin                     VARCHAR(50)   NULL,     -- Contract Identification Number (internal)
    payment_calendar_code   VARCHAR(30)   NULL,     -- holiday calendar for payment date calc
    contract_periodicity    VARCHAR(20)   NULL,     -- DAILY | WEEKLY | MONTHLY | QUARTERLY
    contract_status         VARCHAR(20)   NULL      -- DRAFT | ACTIVE | SUSPENDED | TERMINATED
                                                    --   (separate from trade workflow status)
;

ALTER TABLE dbo.trade ADD
    special_contract_flag   BIT           NOT NULL DEFAULT 0;
GO

-- Separate batch: SQL Server resolves a table-level CHECK's column
-- references at parse time, and can't see columns added earlier in the
-- same batch (same gotcha already fixed in V34).
ALTER TABLE dbo.trade ADD
    CONSTRAINT ck_trade_contract_periodicity
        CHECK (contract_periodicity IS NULL OR
               contract_periodicity IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY')),
    CONSTRAINT ck_trade_contract_status
        CHECK (contract_status IS NULL OR
               contract_status IN ('DRAFT','ACTIVE','SUSPENDED','TERMINATED'));
GO

CREATE INDEX ix_trade_cin              ON dbo.trade (cin) WHERE cin IS NOT NULL;
CREATE INDEX ix_trade_contract_status  ON dbo.trade (contract_status) WHERE contract_status IS NOT NULL;
CREATE INDEX ix_trade_hedge_flag       ON dbo.trade (hedge_flag) WHERE hedge_flag = 1;

-- ── trade_order — add tolerance columns ──────────────────────
-- tolerance_type:
--   RATE  = tolerance_plus / tolerance_minus expressed as % of contracted qty
--   FLAT  = tolerance_plus / tolerance_minus expressed as absolute volume in order UoM
--
-- tolerance_for_scheduling:
--   0 (default) = tolerance is operational only; risk position always = contract qty
--   1           = schedulable qty may range contract_qty ± tolerance; risk stays at contract qty
ALTER TABLE dbo.trade_order ADD
    tolerance_type             VARCHAR(10)   NULL,     -- RATE | FLAT
    tolerance_plus             DECIMAL(12,4) NULL,
    tolerance_minus            DECIMAL(12,4) NULL,
    tolerance_for_scheduling   BIT           NOT NULL DEFAULT 0;
GO

ALTER TABLE dbo.trade_order ADD
    CONSTRAINT ck_to_tolerance_type
        CHECK (tolerance_type IS NULL OR tolerance_type IN ('RATE','FLAT'));

-- ── broker — add legal doc and commission metadata ───────────
ALTER TABLE dbo.broker ADD
    legal_doc_id         VARCHAR(100)   NULL,     -- OBA / master agreement reference
    commission_uom_code  VARCHAR(20)    NULL,     -- UoM for per-unit commission (BBL, MT, MWH…)
    commission_notes     NVARCHAR(1000) NULL;     -- free-text fee schedule / tiered rates
GO

-- ── Migrate existing rows — set safe defaults ─────────────────
-- No data to migrate for new trade/order columns (defaults handle it).
-- Broker legal doc codes populated where known:
UPDATE dbo.broker SET legal_doc_id = 'OBA-ICAP-2024-001',   commission_uom_code = 'BBL', commission_notes = 'Standard rate $0.02/BBL crude oil, $0.015/BBL products. Vol rebate >1M BBL/month.' WHERE broker_code = 'ICAP';
UPDATE dbo.broker SET legal_doc_id = 'OBA-GFI-2023-007',    commission_uom_code = 'MWH', commission_notes = '$0.015/MWH gas, EUR 0.01/MWH power. Emissions: 0.02 EUR/EUA.'                        WHERE broker_code = 'GFI';
UPDATE dbo.broker SET legal_doc_id = 'OBA-BGC-2024-003',    commission_uom_code = 'BBL', commission_notes = '$0.03/BBL crude, $0.025/BBL distillates. Freight: $2,500 flat per VLCC voyage.'      WHERE broker_code = 'BGC';
UPDATE dbo.broker SET legal_doc_id = 'OBA-TRAD-2023-012',   commission_uom_code = NULL,  commission_notes = 'Freight: $2,000–$3,500 per voyage by route/size. LNG: $1,500 per cargo.'             WHERE broker_code = 'TRADITION';
UPDATE dbo.broker SET legal_doc_id = 'OBA-TPICAP-2024-002', commission_uom_code = 'MWH', commission_notes = 'Gas: EUR 0.01/MWH. Power: EUR 0.008/MWH electronic, EUR 0.012/MWH voice.'           WHERE broker_code = 'TP-ICAP';
UPDATE dbo.broker SET legal_doc_id = 'OBA-TULLETT-2023-008',commission_uom_code = 'MT',  commission_notes = 'LME base metals: $1.50/MT. Precious metals: 0.02% of notional.'                     WHERE broker_code = 'TULLETT';
UPDATE dbo.broker SET legal_doc_id = 'SPARK-AGREE-2024-001',commission_uom_code = NULL,  commission_notes = 'LNG: $0.50/MMBTU per cargo. Freight: 0.10% of worldscale notional.'                 WHERE broker_code = 'SPARK';

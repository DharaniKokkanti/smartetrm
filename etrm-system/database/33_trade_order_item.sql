-- ============================================================
-- V33: Trade Order & Item — three-tier deal structure
-- Trade (master contract header) → TradeOrder (delivery leg)
--                                → TradeItem  (line items)
-- ============================================================

-- ─── dbo.trade_order ─────────────────────────────────────────────────────────
-- One row per delivery leg. For SPOT trades there is a single order.
-- For TERM/MONTHLY contracts each period (monthly cargo, quarterly delivery)
-- gets its own order row.

CREATE TABLE dbo.trade_order (
  order_id             INT IDENTITY(1,1) PRIMARY KEY,
  trade_id             INT          NOT NULL REFERENCES dbo.trade(trade_id),
  order_sequence       INT          NOT NULL DEFAULT 1,
  order_reference      VARCHAR(60)  NOT NULL,
  status               VARCHAR(20)  NOT NULL DEFAULT 'WORKING',
  -- Risk / delivery period
  period_code          VARCHAR(20)  NULL,
  risk_start_date      DATE         NOT NULL,
  risk_end_date        DATE         NOT NULL,
  -- Product & market (per-leg, can vary under one deal)
  product_id           INT          NULL REFERENCES dbo.product(product_id),
  market_id            INT          NULL REFERENCES dbo.market(market_id),
  pricing_rule_id      INT          NULL REFERENCES dbo.pricing_rule(pricing_rule_id),
  -- Quantity & pricing
  quantity             DECIMAL(18,4) NOT NULL,
  uom_code             VARCHAR(20)  NOT NULL,
  price                DECIMAL(18,6) NULL,
  currency_code        VARCHAR(3)   NOT NULL,
  -- Delivery
  incoterm_code        VARCHAR(10)  NULL,
  delivery_location_code VARCHAR(20) NULL,
  settlement_type      VARCHAR(20)  NOT NULL DEFAULT 'PHYSICAL',
  notes                NVARCHAR(2000) NULL,
  created_at           DATETIME2    NOT NULL DEFAULT GETDATE(),
  updated_at           DATETIME2    NOT NULL DEFAULT GETDATE(),

  CONSTRAINT chk_order_status     CHECK (status          IN ('WORKING','CONFIRMED','SETTLED','CANCELLED')),
  CONSTRAINT chk_order_settlement CHECK (settlement_type IN ('PHYSICAL','FINANCIAL','NETTED')),
  CONSTRAINT chk_order_dates      CHECK (risk_end_date   >= risk_start_date),
  CONSTRAINT uq_trade_order_seq   UNIQUE (trade_id, order_sequence)
);

-- Commodity-specific detail is stored as JSON on the order row
-- (mirrors the existing approach but avoids per-commodity child tables).
-- In a production schema these would be normalised into separate tables.
ALTER TABLE dbo.trade_order ADD commodity_detail NVARCHAR(MAX) NULL;

CREATE INDEX ix_trade_order_trade_id ON dbo.trade_order(trade_id);
CREATE INDEX ix_trade_order_status   ON dbo.trade_order(status);

-- ─── dbo.trade_item ──────────────────────────────────────────────────────────
-- Optional sub-line items under an order — multiple products per delivery,
-- pricing components, or partial shipments under one leg.

CREATE TABLE dbo.trade_item (
  item_id         INT IDENTITY(1,1) PRIMARY KEY,
  order_id        INT          NOT NULL REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE,
  item_sequence   INT          NOT NULL DEFAULT 1,
  product_id      INT          NULL REFERENCES dbo.product(product_id),
  description     NVARCHAR(500) NOT NULL,
  quantity        DECIMAL(18,4) NOT NULL,
  uom_code        VARCHAR(20)  NOT NULL,
  unit_price      DECIMAL(18,6) NULL,
  currency_code   VARCHAR(3)   NOT NULL DEFAULT 'USD',
  notes           NVARCHAR(1000) NULL,
  created_at      DATETIME2    NOT NULL DEFAULT GETDATE(),

  CONSTRAINT uq_trade_item_seq UNIQUE (order_id, item_sequence)
);

CREATE INDEX ix_trade_item_order_id ON dbo.trade_item(order_id);

-- ─── Seed orders (one per existing seed trade) ───────────────────────────────
-- Each existing trade is migrated to have exactly one order leg.
-- The delivery-level fields from dbo.trade are reproduced here.

INSERT INTO dbo.trade_order
  (trade_id, order_sequence, order_reference, status,
   period_code, risk_start_date, risk_end_date,
   product_id, market_id, pricing_rule_id,
   quantity, uom_code, price, currency_code,
   incoterm_code, delivery_location_code, settlement_type, notes,
   commodity_detail)
VALUES
-- TRD-2026-00001: OIL Physical BUY, Shell, 500k BBL Brent Forties
(1, 1, 'TRD-2026-00001-01', 'CONFIRMED', 'M2026-07', '2026-07-10', '2026-07-12',
 1, 5, 1, 500000, 'BBL', 82.45, 'USD', 'FOB', 'SULLOM-VOE', 'PHYSICAL',
 'Forties blend cargo',
 '{"oilDetail":{"crudeGrade":"FORTIES","apiGravity":40.7,"sulphurPct":0.26,"motType":"TANKER","loadLocationCode":"SULLOM-VOE","dischargeLocationCode":"ROTTERDAM","titleTransferLocationCode":"SULLOM-VOE","vesselName":"NORDIC LUNA","laycanStart":"2026-07-10","laycanEnd":"2026-07-12","blDate":null,"norsTenderedDate":null,"codDate":null,"pipelineId":null}}'),

-- TRD-2026-00002: OIL Financial SELL, BP, 100k BBL hedge
(2, 1, 'TRD-2026-00002-01', 'CONFIRMED', 'M2026-07', '2026-07-01', '2026-07-31',
 3, 1, 3, 100000, 'BBL', 83.10, 'USD', NULL, NULL, 'FINANCIAL',
 'Hedge against physical inventory', NULL),

-- TRD-2026-00003: GAS Physical BUY, Equinor, 50k MWH TTF Jul
(3, 1, 'TRD-2026-00003-01', 'CONFIRMED', 'M2026-07', '2026-07-01', '2026-07-31',
 4, 4, 5, 50000, 'MWH', 34.55, 'EUR', NULL, 'TTF-NL', 'FINANCIAL',
 NULL,
 '{"gasDetail":{"deliveryHub":"TTF-NL","gasDeliveryStart":"2026-07-01","gasDeliveryEnd":"2026-07-31","swingPct":10,"gasDayType":"STANDARD","nominationType":"FIRM"}}'),

-- TRD-2026-00003 second leg — Aug delivery (term contract, 2 orders)
(3, 2, 'TRD-2026-00003-02', 'WORKING', 'M2026-08', '2026-08-01', '2026-08-31',
 4, 4, 5, 50000, 'MWH', NULL, 'EUR', NULL, 'TTF-NL', 'FINANCIAL',
 'Aug leg — price TBD',
 '{"gasDetail":{"deliveryHub":"TTF-NL","gasDeliveryStart":"2026-08-01","gasDeliveryEnd":"2026-08-31","swingPct":10,"gasDayType":"STANDARD","nominationType":"FIRM"}}'),

-- TRD-2026-00004: METALS Physical BUY, Glencore, 250 MT Copper
(4, 1, 'TRD-2026-00004-01', 'CONFIRMED', 'SPOT', '2026-06-13', '2026-06-13',
 6, 3, 6, 250, 'MT', 9845.00, 'USD', NULL, 'LME-WAREHOUSE', 'PHYSICAL',
 'Grade A cathode, LME approved warehouse',
 '{"metalsDetail":{"metalGrade":"GRADE_A","shape":"CATHODE","motType":"TRUCK","lmeDate":"2026-06-13","warehouseLocationCode":"LME-WAREHOUSE","titleTransferLocationCode":"LME-WAREHOUSE","brand":"AURUBIS"}}'),

-- TRD-2026-00005: POWER Financial SELL, RWE, 10k MWH Baseload Jul
(5, 1, 'TRD-2026-00005-01', 'CONFIRMED', 'M2026-07', '2026-07-01', '2026-07-31',
 8, 6, NULL, 10000, 'MWH', 68.75, 'EUR', NULL, NULL, 'FINANCIAL',
 'Baseload monthly',
 '{"powerDetail":{"loadType":"BASELOAD","mwCapacity":50,"mwhVolume":37200,"gridNodeCode":"DE-AT-LU","interconnector":null,"deliveryStart":"2026-07-01","deliveryEnd":"2026-07-31"}}'),

-- TRD-2026-00006: GAS Physical SELL, Centrica, 75k THERM NBP Jul
(6, 1, 'TRD-2026-00006-01', 'WORKING', 'M2026-07', '2026-07-01', '2026-07-31',
 5, 8, NULL, 75000, 'THERM', 92.30, 'GBP', NULL, 'NBP-UK', 'PHYSICAL',
 'NBP physical day-ahead swing',
 '{"gasDetail":{"deliveryHub":"NBP-UK","gasDeliveryStart":"2026-07-01","gasDeliveryEnd":"2026-07-31","swingPct":15,"gasDayType":"STANDARD","nominationType":"INTERRUPTIBLE"}}'),

-- TRD-2026-00007: OIL Physical SELL, Vitol, 750k BBL Urals
(7, 1, 'TRD-2026-00007-01', 'CONFIRMED', 'M2026-07', '2026-07-15', '2026-07-17',
 1, 5, 2, 750000, 'BBL', 79.95, 'USD', 'CIF', 'ROTTERDAM', 'PHYSICAL',
 'Urals Med grade, 5-day BWAVE pricing',
 '{"oilDetail":{"crudeGrade":"URALS","apiGravity":31.8,"sulphurPct":1.35,"motType":"TANKER","loadLocationCode":"RAS-TANURA","dischargeLocationCode":"ROTTERDAM","titleTransferLocationCode":"ROTTERDAM","vesselName":"FRONT ALTAIR","laycanStart":"2026-07-15","laycanEnd":"2026-07-18","blDate":null,"norsTenderedDate":null,"codDate":null,"pipelineId":null}}'),

-- TRD-2026-00008: AGRI Physical BUY, Cargill, 5k MT EU Wheat
(8, 1, 'TRD-2026-00008-01', 'WORKING', 'M2026-08', '2026-08-01', '2026-08-31',
 16, NULL, NULL, 5000, 'MT', 225.50, 'EUR', 'FOB', 'ROTTERDAM', 'PHYSICAL',
 'EU milling wheat, protein min 12%',
 '{"agriDetail":{"cropYear":2026,"gradeQuality":"EU MILLING WHEAT MIN 12% PROTEIN","originCountry":"FR","deliveryBasis":"FOB ROUEN","motType":"SHIP"}}'),

-- TRD-2026-00009: FREIGHT, Tradition, VLCC TD3C
(9, 1, 'TRD-2026-00009-01', 'WORKING', NULL, '2026-07-10', '2026-07-15',
 NULL, NULL, NULL, 280000, 'MT', 15.50, 'USD', 'FOB', 'RAS-TANURA', 'FINANCIAL',
 'TD3C VLCC voyage, Ras Tanura to Chiba Japan',
 '{"freightDetail":{"vesselType":"VLCC","routeCode":"TD3C","loadLocationCode":"RAS-TANURA","dischargeLocationCode":"CHIBA-JP","cargoSizeMT":280000,"freightRateType":"WORLDSCALE","freightRate":75.00,"laycanStart":"2026-07-10","laycanEnd":"2026-07-13","charterType":"VOYAGE"}}');

-- ─── Seed items (TRD-001 cargo has two product components) ───────────────────
INSERT INTO dbo.trade_item (order_id, item_sequence, product_id, description, quantity, uom_code, unit_price, currency_code)
SELECT o.order_id, 1, 1, 'Forties Crude — Main Cargo', 490000, 'BBL', 82.45, 'USD'
FROM dbo.trade_order o WHERE o.order_reference = 'TRD-2026-00001-01';

INSERT INTO dbo.trade_item (order_id, item_sequence, product_id, description, quantity, uom_code, unit_price, currency_code)
SELECT o.order_id, 2, NULL, 'Operational Tolerance (±2%)', 10000, 'BBL', 82.45, 'USD'
FROM dbo.trade_order o WHERE o.order_reference = 'TRD-2026-00001-01';

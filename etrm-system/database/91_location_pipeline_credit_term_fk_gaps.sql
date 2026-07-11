-- =============================================================================
-- V91 — Whole-project FK integrity sweep (batch 2): location/pipeline/route/
-- storage-facility code family, credit_term_code, payment_calendar_code, and
-- trade_swap_detail's floating index codes
-- =============================================================================
-- Continuation of the V90 sweep. These are all the same class of gap: a
-- *_code column that semantically references a master-data table's unique
-- code but was left as a bare VARCHAR with no FK. Column lengths were also
-- normalized to match their target exactly where they didn't already
-- (narrowed or widened as appropriate) — safe because none of these columns
-- carry real seed data yet (location/pipeline/transport_route/storage_facility
-- have zero seed rows in this schema; trade/trade_order/trade_swap_detail
-- values only exist in the frontend MSW mocks, not the real DB).
--
-- NOTE: the frontend mock trades' creditTermCode ('NET_30') and
-- paymentCalendarCode ('LON-USD') values do NOT match the real backend seed
-- codes in dbo.credit_term ('OPEN_30', ...) / dbo.holiday_calendar
-- ('UK_BANK', ...) — a pre-existing mock/backend data-parity gap, logged here
-- but out of scope for this migration (DB-schema FK correctness only).
-- =============================================================================
USE ETRM_DB;
GO

-- ── Column length normalization (align *_code columns to their FK target) ──────
ALTER TABLE dbo.trade_transport_agreement_detail ALTER COLUMN load_location_code       VARCHAR(30) NULL;
ALTER TABLE dbo.trade_transport_agreement_detail ALTER COLUMN discharge_location_code  VARCHAR(30) NULL;
ALTER TABLE dbo.trade_transport_agreement_detail ALTER COLUMN route_code               VARCHAR(30) NULL;
ALTER TABLE dbo.bolmo_agreement                  ALTER COLUMN delivery_location_code   VARCHAR(30) NULL;
ALTER TABLE dbo.trade_order                      ALTER COLUMN delivery_location_code   VARCHAR(30) NULL;
ALTER TABLE dbo.trade                            ALTER COLUMN credit_term_code         VARCHAR(30) NULL;
ALTER TABLE dbo.trade                            ALTER COLUMN payment_calendar_code    VARCHAR(20) NULL;
ALTER TABLE dbo.trade_swap_detail                ALTER COLUMN floating_index_code      VARCHAR(30) NULL;
ALTER TABLE dbo.trade_swap_detail                ALTER COLUMN floating_index2_code     VARCHAR(30) NULL;
GO

-- ── location_code family → dbo.location(location_code) ─────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_ttad_load_location')
  ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_load_location FOREIGN KEY (load_location_code) REFERENCES dbo.location(location_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_ttad_discharge_location')
  ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_discharge_location FOREIGN KEY (discharge_location_code) REFERENCES dbo.location(location_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_oil_title_transfer_location')
  ALTER TABLE dbo.trade_oil_detail ADD CONSTRAINT fk_trade_oil_title_transfer_location FOREIGN KEY (title_transfer_location_code) REFERENCES dbo.location(location_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_lng_title_transfer_location')
  ALTER TABLE dbo.trade_lng_detail ADD CONSTRAINT fk_trade_lng_title_transfer_location FOREIGN KEY (title_transfer_location_code) REFERENCES dbo.location(location_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_metals_title_transfer_location')
  ALTER TABLE dbo.trade_metals_detail ADD CONSTRAINT fk_trade_metals_title_transfer_location FOREIGN KEY (title_transfer_location_code) REFERENCES dbo.location(location_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_bolmo_delivery_location')
  ALTER TABLE dbo.bolmo_agreement ADD CONSTRAINT fk_bolmo_delivery_location FOREIGN KEY (delivery_location_code) REFERENCES dbo.location(location_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_order_delivery_location')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_trade_order_delivery_location FOREIGN KEY (delivery_location_code) REFERENCES dbo.location(location_code);
GO

-- ── pipeline_code / route_code / storage_facility_code ──────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_ttad_pipeline')
  ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_pipeline FOREIGN KEY (pipeline_code) REFERENCES dbo.pipeline(pipeline_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_ttad_route')
  ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_route FOREIGN KEY (route_code) REFERENCES dbo.transport_route(route_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_tsad_storage_facility')
  ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_tsad_storage_facility FOREIGN KEY (storage_facility_code) REFERENCES dbo.storage_facility(facility_code);
GO

-- ── trade.credit_term_code / trade.payment_calendar_code ────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_credit_term')
  ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_credit_term FOREIGN KEY (credit_term_code) REFERENCES dbo.credit_term(term_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_payment_calendar')
  ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_payment_calendar FOREIGN KEY (payment_calendar_code) REFERENCES dbo.holiday_calendar(calendar_code);
GO

-- ── trade_swap_detail floating leg index codes → dbo.price_index(index_code) ────
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_swap_floating_index')
  ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_swap_floating_index FOREIGN KEY (floating_index_code) REFERENCES dbo.price_index(index_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_swap_floating_index2')
  ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_swap_floating_index2 FOREIGN KEY (floating_index2_code) REFERENCES dbo.price_index(index_code);
GO

PRINT 'V91 APPLIED: 14 FK constraints added for location/pipeline/route/storage_facility/credit_term/payment_calendar/price_index code families; 9 columns normalized to their target length.';

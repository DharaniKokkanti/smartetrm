-- V45: commodity_instrument_type_config
-- Stores which instrument types are valid for each commodity type.
-- Authoritative source — frontend fetches this at runtime.
-- Only DBA / vendor adds rows here (no UI CRUD); changes come via migration scripts.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'commodity_instrument_type_config')
BEGIN
  CREATE TABLE dbo.commodity_instrument_type_config (
    commodity_type  VARCHAR(20) NOT NULL,
    instrument_type VARCHAR(30) NOT NULL,
    sort_order      TINYINT     NOT NULL DEFAULT 0,
    is_active       BIT         NOT NULL DEFAULT 1,
    CONSTRAINT pk_cimc PRIMARY KEY (commodity_type, instrument_type),
    CONSTRAINT ck_cimc_commodity CHECK (commodity_type IN (
      'OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL'
    )),
    CONSTRAINT ck_cimc_instrument CHECK (instrument_type IN (
      'PHYSICAL','CERTIFICATE_TRANSFER','FUTURES','FORWARD',
      'SWAP_FIXED_FLOAT','SWAP_FLOAT_FLOAT',
      'OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_ASIAN','OPTION_OTC_EUROPEAN',
      'STORAGE_AGREEMENT','TRANSPORT_AGREEMENT'
    ))
  );
END;
GO

-- Seed: OIL — full suite
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('OIL','PHYSICAL',1),('OIL','FUTURES',2),('OIL','FORWARD',3),
  ('OIL','SWAP_FIXED_FLOAT',4),('OIL','SWAP_FLOAT_FLOAT',5),
  ('OIL','OPTION_LISTED',6),('OIL','OPTION_OTC_AMERICAN',7),
  ('OIL','OPTION_OTC_ASIAN',8),('OIL','OPTION_OTC_EUROPEAN',9),
  ('OIL','STORAGE_AGREEMENT',10),('OIL','TRANSPORT_AGREEMENT',11);

-- GAS — full suite (TTF/Henry Hub futures, cavern storage, pipeline capacity)
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('GAS','PHYSICAL',1),('GAS','FUTURES',2),('GAS','FORWARD',3),
  ('GAS','SWAP_FIXED_FLOAT',4),('GAS','SWAP_FLOAT_FLOAT',5),
  ('GAS','OPTION_LISTED',6),('GAS','OPTION_OTC_AMERICAN',7),
  ('GAS','OPTION_OTC_ASIAN',8),('GAS','OPTION_OTC_EUROPEAN',9),
  ('GAS','STORAGE_AGREEMENT',10),('GAS','TRANSPORT_AGREEMENT',11);

-- POWER — no TRANSPORT_AGREEMENT (grid ≠ chartering); no APO (not market-standard for power)
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('POWER','PHYSICAL',1),('POWER','FUTURES',2),('POWER','FORWARD',3),
  ('POWER','SWAP_FIXED_FLOAT',4),('POWER','SWAP_FLOAT_FLOAT',5),
  ('POWER','OPTION_LISTED',6),('POWER','OPTION_OTC_AMERICAN',7),
  ('POWER','OPTION_OTC_EUROPEAN',8),('POWER','STORAGE_AGREEMENT',9);

-- LNG — full suite (JKM futures on CME/ICE, LNG tank storage, LNG carrier charters)
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('LNG','PHYSICAL',1),('LNG','FUTURES',2),('LNG','FORWARD',3),
  ('LNG','SWAP_FIXED_FLOAT',4),('LNG','SWAP_FLOAT_FLOAT',5),
  ('LNG','OPTION_LISTED',6),('LNG','OPTION_OTC_AMERICAN',7),
  ('LNG','OPTION_OTC_ASIAN',8),('LNG','OPTION_OTC_EUROPEAN',9),
  ('LNG','STORAGE_AGREEMENT',10),('LNG','TRANSPORT_AGREEMENT',11);

-- AGRICULTURAL — no SWAP_FLOAT_FLOAT (basis swaps not standard); no APO
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('AGRICULTURAL','PHYSICAL',1),('AGRICULTURAL','FUTURES',2),('AGRICULTURAL','FORWARD',3),
  ('AGRICULTURAL','SWAP_FIXED_FLOAT',4),
  ('AGRICULTURAL','OPTION_LISTED',5),('AGRICULTURAL','OPTION_OTC_AMERICAN',6),
  ('AGRICULTURAL','OPTION_OTC_EUROPEAN',7),
  ('AGRICULTURAL','STORAGE_AGREEMENT',8),('AGRICULTURAL','TRANSPORT_AGREEMENT',9);

-- METALS — full suite (LME has options, APO, LME warehouses, sea/truck transport)
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('METALS','PHYSICAL',1),('METALS','FUTURES',2),('METALS','FORWARD',3),
  ('METALS','SWAP_FIXED_FLOAT',4),('METALS','SWAP_FLOAT_FLOAT',5),
  ('METALS','OPTION_LISTED',6),('METALS','OPTION_OTC_AMERICAN',7),
  ('METALS','OPTION_OTC_ASIAN',8),('METALS','OPTION_OTC_EUROPEAN',9),
  ('METALS','STORAGE_AGREEMENT',10),('METALS','TRANSPORT_AGREEMENT',11);

-- FREIGHT — FFA market: FORWARD + SWAP_FIXED_FLOAT; TRANSPORT_AGREEMENT for charters;
--           no storage, no listed or American/Asian options
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('FREIGHT','PHYSICAL',1),('FREIGHT','FORWARD',2),
  ('FREIGHT','SWAP_FIXED_FLOAT',3),('FREIGHT','TRANSPORT_AGREEMENT',4),
  ('FREIGHT','OPTION_OTC_EUROPEAN',5);

-- RINS — electronic EPA EMTS certificates; NOT physical delivery.
--         CME/NYMEX list D3/D4/D5/D6 vintage futures and options.
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('RINS','CERTIFICATE_TRANSFER',1),('RINS','FUTURES',2),('RINS','FORWARD',3),
  ('RINS','OPTION_LISTED',4),('RINS','OPTION_OTC_EUROPEAN',5);

-- ENVIRONMENTAL — electronic allowances/credits; NOT physical delivery.
--                 EUAs: liquid exchange futures+options on ICE/EEX.
--                 VCUs/RECs: primarily OTC spot+forward (covered by CERTIFICATE_TRANSFER+FORWARD).
INSERT INTO dbo.commodity_instrument_type_config (commodity_type, instrument_type, sort_order) VALUES
  ('ENVIRONMENTAL','CERTIFICATE_TRANSFER',1),('ENVIRONMENTAL','FUTURES',2),
  ('ENVIRONMENTAL','FORWARD',3),('ENVIRONMENTAL','OPTION_LISTED',4),
  ('ENVIRONMENTAL','OPTION_OTC_EUROPEAN',5);
GO

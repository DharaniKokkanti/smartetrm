-- =============================================================================
-- V89 — Legal Entity / Book / Broker moved from trade header to leg (trade_order)
-- level, broker gains commodity scoping, and a governed custom-fields registry
-- =============================================================================
-- User's ask, confirmed via research + explicit choice: in real ETRM systems
-- (Endur/Aspect) Legal Entity is almost always deal-header level (one signing
-- entity per contract), but Broker legitimately varies per leg (a multi-leg
-- strip can be executed via different IDBs on different days) and per-leg book
-- allocation is a real (if advanced) capability. User's explicit choice here
-- was the maximal option: all three (Legal Entity, Book, Broker) move to leg
-- level, each leg independent with NO fallback/inheritance from the trade.
--
-- Also: Endur/OpenLink's "User Defined Fields" / "Additional Info" mechanism
-- lets anyone type an untyped single value with zero governance — causes field
-- sprawl, no validation, and values that can't be reliably reported on (see
-- Capco's "Implementation Pitfalls: OpenLink Endur" and Endur's own docs, which
-- describe UDFs as single-value, ungoverned additions). User asked us to fix
-- that drawback: dbo.custom_field_definition is a governed, admin-managed
-- registry (name, data type, TRADE-or-LEG scope, optional commodity scoping) —
-- still "no code to add a new field", but typed/validated/centrally visible,
-- unlike Endur's free-text sprawl.
-- =============================================================================
USE ETRM_DB;
GO

-- ============================================================
-- 1. dbo.broker — add commodity scoping (NULL = all commodities)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.broker') AND name = 'commodity_type')
  ALTER TABLE dbo.broker ADD commodity_type VARCHAR(20) NULL
    CONSTRAINT ck_broker_commodity CHECK (commodity_type IN (
      'OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL'
    ));
GO
-- Real-world naming already hints at specialization — narrow the ones that do, leave generalists NULL.
UPDATE dbo.broker SET commodity_type = 'OIL'  WHERE broker_code = 'ICAP'      AND commodity_type IS NULL;
UPDATE dbo.broker SET commodity_type = 'GAS'  WHERE broker_code = 'TRADITION' AND commodity_type IS NULL;
GO

-- ============================================================
-- 2. dbo.trade_order — add the three fields moving down from dbo.trade
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_order') AND name = 'legal_entity_id')
  ALTER TABLE dbo.trade_order ADD
    legal_entity_id        INT            NULL,   -- backfilled below, then set NOT NULL
    book_id                INT            NULL,   -- backfilled below, then set NOT NULL
    broker_id               INT            NULL,
    broker_fee_type          VARCHAR(20)    NULL
      CONSTRAINT ck_to_broker_fee_type CHECK (broker_fee_type IN ('FIXED','PERCENTAGE','PER_UNIT')),
    broker_fee                 DECIMAL(18,6)  NULL,
    broker_fee_currency_code     CHAR(3)        NULL;
GO

-- Backfill every existing leg from its parent trade's current (about-to-be-dropped) values.
UPDATE o
SET    o.legal_entity_id          = t.legal_entity_id,
       o.book_id                  = t.book_id,
       o.broker_id                = t.broker_id,
       o.broker_fee_type          = t.broker_fee_type,
       o.broker_fee               = t.broker_fee,
       o.broker_fee_currency_code = t.broker_fee_currency_code
FROM   dbo.trade_order o
JOIN   dbo.trade t ON t.trade_id = o.trade_id;
GO

ALTER TABLE dbo.trade_order ALTER COLUMN legal_entity_id INT NOT NULL;
ALTER TABLE dbo.trade_order ALTER COLUMN book_id         INT NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_to_legal_entity')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_to_book')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_book FOREIGN KEY (book_id) REFERENCES dbo.book(book_id);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_to_broker')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_broker FOREIGN KEY (broker_id) REFERENCES dbo.broker(broker_id);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_to_broker_fee_currency')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_broker_fee_currency FOREIGN KEY (broker_fee_currency_code) REFERENCES dbo.currency(currency_code);
GO
CREATE INDEX ix_to_legal_entity ON dbo.trade_order (legal_entity_id);
CREATE INDEX ix_to_book         ON dbo.trade_order (book_id);
GO

-- ============================================================
-- 3. dbo.trade — drop the three fields now owned by trade_order
-- ============================================================
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_entity')
  ALTER TABLE dbo.trade DROP CONSTRAINT fk_trade_entity;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_book')
  ALTER TABLE dbo.trade DROP CONSTRAINT fk_trade_book;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_broker')
  ALTER TABLE dbo.trade DROP CONSTRAINT fk_trade_broker;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_trade_book' AND object_id = OBJECT_ID('dbo.trade'))
  DROP INDEX ix_trade_book ON dbo.trade;
GO
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'legal_entity_id')
  ALTER TABLE dbo.trade DROP COLUMN legal_entity_id, book_id, broker_id, broker_fee_type, broker_fee, broker_fee_currency_code;
GO

-- ============================================================
-- 4. Governed custom-fields registry — fixes Endur/OpenLink's ungoverned,
--    untyped "User Defined Field" sprawl (single free-text value, no
--    validation, nothing centrally visible or reportable).
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'custom_field_definition')
BEGIN
  CREATE TABLE dbo.custom_field_definition (
    definition_id   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    field_code      VARCHAR(40)   NOT NULL,
    field_name      VARCHAR(120)  NOT NULL,
    data_type       VARCHAR(10)   NOT NULL
      CONSTRAINT ck_cfd_data_type CHECK (data_type IN ('TEXT','NUMBER','DATE','BOOLEAN','SELECT')),
    applies_to      VARCHAR(5)    NOT NULL
      CONSTRAINT ck_cfd_applies_to CHECK (applies_to IN ('TRADE','LEG')),
    commodity_type  VARCHAR(20)   NULL   -- NULL = applies to all commodities
      CONSTRAINT ck_cfd_commodity CHECK (commodity_type IN (
        'OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL'
      )),
    select_options  NVARCHAR(MAX) NULL,  -- JSON string array, only for data_type = 'SELECT'
    is_required     BIT           NOT NULL DEFAULT 0,
    is_active        BIT           NOT NULL DEFAULT 1,
    sort_order       TINYINT       NOT NULL DEFAULT 0,
    notes            VARCHAR(300)  NULL,
    created_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_cfd_code UNIQUE (field_code)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_custom_field_value')
BEGIN
  CREATE TABLE dbo.trade_custom_field_value (
    value_id       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    trade_id       INT           NOT NULL,
    definition_id  INT           NOT NULL,
    value_text     NVARCHAR(500) NULL,
    value_number   DECIMAL(18,6) NULL,
    value_date     DATE          NULL,
    value_boolean  BIT           NULL,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_tcfv_trade      FOREIGN KEY (trade_id)      REFERENCES dbo.trade(trade_id) ON DELETE CASCADE,
    CONSTRAINT fk_tcfv_definition FOREIGN KEY (definition_id) REFERENCES dbo.custom_field_definition(definition_id),
    CONSTRAINT uq_tcfv            UNIQUE (trade_id, definition_id)
  );
  CREATE INDEX ix_tcfv_trade ON dbo.trade_custom_field_value (trade_id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_order_custom_field_value')
BEGIN
  CREATE TABLE dbo.trade_order_custom_field_value (
    value_id       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id       INT           NOT NULL,
    definition_id  INT           NOT NULL,
    value_text     NVARCHAR(500) NULL,
    value_number   DECIMAL(18,6) NULL,
    value_date     DATE          NULL,
    value_boolean  BIT           NULL,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_tocfv_order      FOREIGN KEY (order_id)      REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_tocfv_definition FOREIGN KEY (definition_id) REFERENCES dbo.custom_field_definition(definition_id),
    CONSTRAINT uq_tocfv            UNIQUE (order_id, definition_id)
  );
  CREATE INDEX ix_tocfv_order ON dbo.trade_order_custom_field_value (order_id);
END;
GO

-- Demo definitions — one per data type, one per scope, one commodity-scoped.
IF NOT EXISTS (SELECT 1 FROM dbo.custom_field_definition WHERE field_code = 'ESG_SCORE')
BEGIN
  INSERT INTO dbo.custom_field_definition (field_code, field_name, data_type, applies_to, commodity_type, select_options, is_required, sort_order, notes)
  VALUES
    ('ESG_SCORE',    'ESG Score',            'NUMBER',  'TRADE', NULL,  NULL,                                   0, 1, 'Internal ESG scoring, 0-100, set by sustainability desk'),
    ('VESSEL_CLASS', 'Vessel Class',         'SELECT',  'LEG',   'OIL', '["AFRAMAX","SUEZMAX","VLCC","PANAMAX"]', 0, 1, 'Free-form vessel size class beyond the Oil Cargo Details vessel picker'),
    ('BROKER_DESK',  'Broker Desk',          'TEXT',    'LEG',   NULL,  NULL,                                   0, 2, 'Internal desk/office that executed this leg, e.g. London-EU'),
    ('REVIEWED',     'Middle Office Reviewed','BOOLEAN', 'TRADE', NULL,  NULL,                                   0, 2, 'Manual sign-off flag, cleared automatically on amendment');
END;
GO

-- Demo values against trade 1 / order 1.
IF NOT EXISTS (SELECT 1 FROM dbo.trade_custom_field_value WHERE trade_id = 1)
BEGIN
  INSERT INTO dbo.trade_custom_field_value (trade_id, definition_id, value_number)
  SELECT 1, definition_id, 78 FROM dbo.custom_field_definition WHERE field_code = 'ESG_SCORE';
  INSERT INTO dbo.trade_custom_field_value (trade_id, definition_id, value_boolean)
  SELECT 1, definition_id, 1 FROM dbo.custom_field_definition WHERE field_code = 'REVIEWED';
END;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.trade_order_custom_field_value WHERE order_id = 1)
BEGIN
  INSERT INTO dbo.trade_order_custom_field_value (order_id, definition_id, value_text)
  SELECT 1, definition_id, 'AFRAMAX' FROM dbo.custom_field_definition WHERE field_code = 'VESSEL_CLASS';
  INSERT INTO dbo.trade_order_custom_field_value (order_id, definition_id, value_text)
  SELECT 1, definition_id, 'London-EU' FROM dbo.custom_field_definition WHERE field_code = 'BROKER_DESK';
END;
GO

-- V38 — Renewable Fuel Standard (RINs)
-- Creates rin_fuel_category, rin_account, rin_transaction, rin_obligation
-- Supports EPA RFS2 compliance tracking under 40 CFR Part 80

-- ─── RIN Fuel Categories (D-Codes) ───────────────────────────────────────────
CREATE TABLE dbo.rin_fuel_category (
    category_id        INT IDENTITY(1,1) PRIMARY KEY,
    d_code             NVARCHAR(5)    NOT NULL UNIQUE,   -- D3 | D4 | D5 | D6 | D7
    fuel_name          NVARCHAR(100)  NOT NULL,
    fuel_type          NVARCHAR(30)   NOT NULL,          -- CELLULOSIC | BIOMASS_DIESEL | ADVANCED | CONVENTIONAL | CELLULOSIC_DIESEL
    equivalence_value  DECIMAL(5,2)   NOT NULL,          -- RINs generated per gallon (set by EPA in 40 CFR 80.1415)
    energy_sources     NVARCHAR(500)  NULL,              -- typical feedstocks (informational)
    description        NVARCHAR(MAX)  NULL,
    is_active          BIT            NOT NULL DEFAULT 1,
    created_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- Seed the five EPA-defined D-codes
INSERT INTO dbo.rin_fuel_category (d_code, fuel_name, fuel_type, equivalence_value, energy_sources)
VALUES
  ('D3', 'Cellulosic Biofuel',   'CELLULOSIC',        3.0, 'Corn Stover, Switchgrass, Woody Biomass, Municipal Solid Waste'),
  ('D4', 'Biomass-Based Diesel', 'BIOMASS_DIESEL',    1.5, 'Soybean Oil, Animal Fats, Used Cooking Oil, Distillers Corn Oil'),
  ('D5', 'Advanced Biofuel',     'ADVANCED',          1.5, 'Sugarcane Ethanol, Naphtha from Biomass, Biobutanol'),
  ('D6', 'Conventional Biofuel', 'CONVENTIONAL',      1.0, 'Corn Ethanol, Grain Sorghum Ethanol'),
  ('D7', 'Cellulosic Diesel',    'CELLULOSIC_DIESEL', 1.7, 'Cellulosic feedstocks via thermochemical or biochemical conversion');

-- ─── RIN Accounts (EPA EMTS Accounts) ────────────────────────────────────────
CREATE TABLE dbo.rin_account (
    account_id         INT IDENTITY(1,1) PRIMARY KEY,
    legal_entity_id    INT            NOT NULL REFERENCES dbo.legal_entity(legal_entity_id),
    epa_company_id     NVARCHAR(20)   NOT NULL,          -- EPA-assigned company ID (format: CO + 7 digits)
    epa_facility_id    NVARCHAR(20)   NULL,              -- facility-level; NULL for company-level accounts
    account_code       NVARCHAR(30)   NOT NULL UNIQUE,   -- internal reference code
    account_name       NVARCHAR(200)  NOT NULL,
    account_type       NVARCHAR(30)   NOT NULL,          -- OBLIGATED_PARTY | RENEWABLE_FUEL_PRODUCER | TRADING | EXPORTER
    is_active          BIT            NOT NULL DEFAULT 1,
    created_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- ─── RIN Transactions ─────────────────────────────────────────────────────────
-- Append-only ledger. Records never updated after CONFIRMED; only PENDING can be voided.
CREATE TABLE dbo.rin_transaction (
    transaction_id     INT IDENTITY(1,1) PRIMARY KEY,
    transaction_type   NVARCHAR(20)   NOT NULL,          -- GENERATE | SEPARATE | TRANSFER_BUY | TRANSFER_SELL | RETIRE
    transaction_date   DATE           NOT NULL,
    account_id         INT            NOT NULL REFERENCES dbo.rin_account(account_id),
    d_code             NVARCHAR(5)    NOT NULL REFERENCES dbo.rin_fuel_category(d_code),
    vintage_year       SMALLINT       NOT NULL,          -- year RINs were originally generated
    quantity           INT            NOT NULL,          -- number of RINs (positive integer in all cases)
    price_per_rin      DECIMAL(10,6)  NULL,              -- USD/RIN — only for TRANSFER_BUY / TRANSFER_SELL
    total_value        AS (CAST(quantity AS DECIMAL(18,2)) * price_per_rin) PERSISTED,
    counterparty_id    INT            NULL REFERENCES dbo.counterparty(counterparty_id),
    trade_reference    NVARCHAR(100)  NULL,
    batch_number       NVARCHAR(100)  NULL,              -- EPA batch number (YYYYMM-XXXXX-NNNNN)
    epa_transaction_id NVARCHAR(50)   NULL,              -- EMTS confirmation ID
    obligation_id      INT            NULL,              -- FK to rin_obligation (for RETIRE)
    notes              NVARCHAR(MAX)  NULL,
    status             NVARCHAR(20)   NOT NULL DEFAULT 'PENDING', -- PENDING | SUBMITTED | CONFIRMED | VOID
    created_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_rin_txn_type CHECK (transaction_type IN ('GENERATE','SEPARATE','TRANSFER_BUY','TRANSFER_SELL','RETIRE')),
    CONSTRAINT chk_rin_txn_qty  CHECK (quantity > 0)
);

CREATE INDEX ix_rin_txn_account ON dbo.rin_transaction (account_id, transaction_date DESC);
CREATE INDEX ix_rin_txn_dcode   ON dbo.rin_transaction (d_code, vintage_year);

-- ─── RIN Obligations (Renewable Volume Obligations) ───────────────────────────
CREATE TABLE dbo.rin_obligation (
    obligation_id      INT IDENTITY(1,1) PRIMARY KEY,
    legal_entity_id    INT            NOT NULL REFERENCES dbo.legal_entity(legal_entity_id),
    compliance_year    SMALLINT       NOT NULL,
    d_code             NVARCHAR(5)    NOT NULL REFERENCES dbo.rin_fuel_category(d_code),
    required_quantity  INT            NOT NULL,          -- RVO in RINs (calculated from gasoline/diesel volume)
    retired_quantity   INT            NOT NULL DEFAULT 0, -- cumulative RINs submitted to EPA EMTS
    shortfall_quantity AS (required_quantity - retired_quantity) PERSISTED,
    deadline           DATE           NULL,              -- typically March 31 of the year following compliance_year
    status             NVARCHAR(30)   NOT NULL DEFAULT 'OPEN',
    notes              NVARCHAR(MAX)  NULL,
    created_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_at         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_rin_obligation UNIQUE (legal_entity_id, compliance_year, d_code),
    CONSTRAINT chk_rin_obl_status CHECK (status IN ('OPEN','PARTIALLY_SATISFIED','SATISFIED','OVERDUE'))
);

-- Add FK from rin_transaction.obligation_id now that obligation table exists
ALTER TABLE dbo.rin_transaction ADD CONSTRAINT fk_rin_txn_obligation
  FOREIGN KEY (obligation_id) REFERENCES dbo.rin_obligation(obligation_id);

-- ─── Seed lookup values ───────────────────────────────────────────────────────
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('rin_transaction_type', 'GENERATE',      'Generate',         'Renewable fuel producer generates RINs with qualifying fuel batch.', 10, 1),
  ('rin_transaction_type', 'SEPARATE',      'Separate',         'RINs detached from fuel batch for independent trading.',             20, 1),
  ('rin_transaction_type', 'TRANSFER_BUY',  'Transfer — Buy',   'Purchase of separated RINs from another party via EPA EMTS.',        30, 1),
  ('rin_transaction_type', 'TRANSFER_SELL', 'Transfer — Sell',  'Sale of separated RINs to another party via EPA EMTS.',              40, 1),
  ('rin_transaction_type', 'RETIRE',        'Retire (Surrender)','Surrender to EPA EMTS to satisfy annual RVO. Irreversible.',        50, 1);

INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('rin_obligation_status', 'OPEN',                'Open',                 'RVO active, not yet fully satisfied.',                              10, 1),
  ('rin_obligation_status', 'PARTIALLY_SATISFIED', 'Partially Satisfied',  'Some RINs retired, shortfall remains.',                             20, 1),
  ('rin_obligation_status', 'SATISFIED',           'Satisfied',            'All required RINs retired to EPA EMTS.',                            30, 1),
  ('rin_obligation_status', 'OVERDUE',             'Overdue',              'Deadline passed without full compliance — civil penalties apply.',  40, 1);

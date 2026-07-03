-- V36 — Carbon & Environmental module
-- Creates emission_scheme, carbon_registry, environmental_product, emission_obligation

-- ─── Emission Schemes ─────────────────────────────────────────────────────────
CREATE TABLE dbo.emission_scheme (
    scheme_id         INT IDENTITY(1,1) PRIMARY KEY,
    scheme_code       NVARCHAR(30)  NOT NULL UNIQUE,
    scheme_name       NVARCHAR(200) NOT NULL,
    scheme_type       NVARCHAR(30)  NOT NULL,          -- COMPLIANCE | VOLUNTARY
    regulator         NVARCHAR(200) NULL,
    jurisdiction      NVARCHAR(200) NULL,
    description       NVARCHAR(MAX) NULL,
    is_active         BIT           NOT NULL DEFAULT 1,
    created_at        DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at        DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);

-- ─── Carbon Registries ────────────────────────────────────────────────────────
CREATE TABLE dbo.carbon_registry (
    registry_id       INT IDENTITY(1,1) PRIMARY KEY,
    registry_code     NVARCHAR(30)  NOT NULL UNIQUE,
    registry_name     NVARCHAR(200) NOT NULL,
    registry_type     NVARCHAR(30)  NOT NULL,          -- COMPLIANCE | VOLUNTARY
    operator          NVARCHAR(200) NULL,
    website           NVARCHAR(500) NULL,
    is_active         BIT           NOT NULL DEFAULT 1,
    created_at        DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at        DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);

-- ─── Environmental Products ───────────────────────────────────────────────────
CREATE TABLE dbo.environmental_product (
    product_id        INT IDENTITY(1,1) PRIMARY KEY,
    product_code      NVARCHAR(30)  NOT NULL UNIQUE,
    product_name      NVARCHAR(200) NOT NULL,
    product_type      NVARCHAR(30)  NOT NULL,          -- ALLOWANCE | CERTIFICATE | OFFSET
    scheme_id         INT           NULL REFERENCES dbo.emission_scheme(scheme_id),
    registry_id       INT           NULL REFERENCES dbo.carbon_registry(registry_id),
    unit_of_measure   NVARCHAR(30)  NOT NULL DEFAULT 'tCO2e',
    description       NVARCHAR(MAX) NULL,
    is_active         BIT           NOT NULL DEFAULT 1,
    created_at        DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at        DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);

-- ─── Emission Obligations ─────────────────────────────────────────────────────
CREATE TABLE dbo.emission_obligation (
    obligation_id       INT IDENTITY(1,1) PRIMARY KEY,
    legal_entity_id     INT           NOT NULL REFERENCES dbo.legal_entity(legal_entity_id),
    scheme_id           INT           NOT NULL REFERENCES dbo.emission_scheme(scheme_id),
    obligation_year     SMALLINT      NOT NULL,
    verified_emissions  DECIMAL(18,2) NULL,           -- tCO2e verified by accredited verifier
    allowances_held     DECIMAL(18,2) NULL,           -- tCO2e in registry account at surrender
    shortfall_units     AS (verified_emissions - allowances_held) PERSISTED,
    surrender_deadline  DATE          NULL,
    status              NVARCHAR(30)  NOT NULL DEFAULT 'OPEN',
    notes               NVARCHAR(MAX) NULL,
    created_at          DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at          DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_obligation UNIQUE (legal_entity_id, scheme_id, obligation_year)
);

-- ─── Seed lookup tables ───────────────────────────────────────────────────────
-- emission_scheme_type
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('emission_scheme_type', 'COMPLIANCE', 'Compliance', 'Mandatory cap-and-trade scheme imposed by law.', 10, 1),
  ('emission_scheme_type', 'VOLUNTARY',  'Voluntary',  'Market-driven scheme for voluntary offsetting.', 20, 1);

-- environmental_product_type
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('environmental_product_type', 'ALLOWANCE',   'Allowance',   'Cap-and-trade permit — EUA, UKA, CCA, EUAA.',                     10, 1),
  ('environmental_product_type', 'CERTIFICATE', 'Certificate', 'Renewable energy proof — REC (US), GO (EU/UK).',                  20, 1),
  ('environmental_product_type', 'OFFSET',      'Offset',      'Verified emission reduction project credit — VCU, CER, GSVER.',   30, 1);

-- carbon_registry_type
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('carbon_registry_type', 'COMPLIANCE', 'Compliance', 'Regulator-mandated registry — EU Union Registry, UK Registry.',  10, 1),
  ('carbon_registry_type', 'VOLUNTARY',  'Voluntary',  'Private voluntary market registry — Verra, Gold Standard, ACR.', 20, 1);

-- emission_obligation_status
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('emission_obligation_status', 'OPEN',                  'Open',                  'Active obligation, not yet settled.',                           10, 1),
  ('emission_obligation_status', 'SURRENDERED',           'Surrendered',           'All allowances surrendered by deadline.',                        20, 1),
  ('emission_obligation_status', 'PARTIALLY_SURRENDERED', 'Partially Surrendered', 'Shortfall remains — further surrender required.',               30, 1),
  ('emission_obligation_status', 'OVERDUE',               'Overdue',               'Deadline passed without full compliance — penalties apply.',    40, 1);

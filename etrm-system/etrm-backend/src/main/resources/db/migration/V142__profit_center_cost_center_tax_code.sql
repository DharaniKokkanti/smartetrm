-- =============================================================================
-- V142 — Chart of accounts: profit_center, cost_center, tax_code
--
-- gl_account (V37/V50) already had cost_center as a free-text nvarchar(50)
-- column and no tax fields at all. Per SAP's standard model (the reference
-- most CTRM/ERP integrations follow) the real relationship is
-- Cost Center → Profit Center — "the profit center is assigned in the cost
-- center master data" — with the profit center itself scoped to one company
-- code (dbo.legal_entity here, same pattern already used by book.legal_
-- entity_id). Tax is split into a structured tax_code (rate + jurisdiction),
-- not a free-text label, matching SAP's tax_code + tax_jurisdiction_code
-- pattern.
--
-- Deliberately flat (no parent_*_id hierarchy) and no direct profit_center_id
-- on gl_account — every account reaches its profit center by joining through
-- cost_center, per the "don't duplicate a derivable segment" chart-of-
-- accounts best practice. Hierarchy can be added later the same way book's
-- was (V122-V124), once real roll-up reporting needs it.
--
-- Both new tables get the full Tier 2 treatment (registry + governance
-- columns + row_version) from day one, matching the standard already
-- enforced everywhere else (V136/V137).
--
-- Backfill: every one of the 39 existing gl_account rows already uses the
-- same free-text cost_center value ('CC-100') and the same legal_entity_id
-- (3) — so backfill is a single profit_center + cost_center row, no
-- disambiguation needed.
-- =============================================================================

CREATE TABLE dbo.profit_center (
    profit_center_id    INT IDENTITY(1,1) PRIMARY KEY,
    profit_center_code  NVARCHAR(30)   NOT NULL UNIQUE,
    profit_center_name  NVARCHAR(200)  NOT NULL,
    legal_entity_id      INT            NOT NULL,
    is_active            BIT            NOT NULL DEFAULT 1,
    created_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by           VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    updated_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by           VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    row_version          INT            NOT NULL DEFAULT 0,
    CONSTRAINT fk_profit_center_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id)
);
GO

CREATE TABLE dbo.cost_center (
    cost_center_id       INT IDENTITY(1,1) PRIMARY KEY,
    cost_center_code     NVARCHAR(30)   NOT NULL UNIQUE,
    cost_center_name     NVARCHAR(200)  NOT NULL,
    profit_center_id     INT            NOT NULL,
    is_active            BIT            NOT NULL DEFAULT 1,
    created_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by           VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    updated_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by           VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    row_version          INT            NOT NULL DEFAULT 0,
    CONSTRAINT fk_cost_center_profit_center FOREIGN KEY (profit_center_id) REFERENCES dbo.profit_center(profit_center_id)
);
GO

CREATE TABLE dbo.tax_code (
    tax_code_id          INT IDENTITY(1,1) PRIMARY KEY,
    tax_code             NVARCHAR(20)   NOT NULL UNIQUE,
    description           NVARCHAR(200)  NOT NULL,
    rate_percent          DECIMAL(6,3)   NOT NULL,
    tax_type_id           INT            NULL,
    country_id            INT            NULL,
    is_active             BIT            NOT NULL DEFAULT 1,
    created_at            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by            VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    updated_at            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by            VARCHAR(100)   NOT NULL DEFAULT 'SYSTEM',
    row_version           INT            NOT NULL DEFAULT 0,
    CONSTRAINT fk_tax_code_tax_type FOREIGN KEY (tax_type_id) REFERENCES dbo.tax_type(tax_type_id),
    CONSTRAINT fk_tax_code_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id)
);
GO

-- ─── Seed data ────────────────────────────────────────────────────────────
INSERT INTO dbo.profit_center (profit_center_code, profit_center_name, legal_entity_id, created_by, updated_by)
VALUES ('PC-CORP', 'Corporate', 3, 'SYSTEM', 'SYSTEM');
GO

INSERT INTO dbo.cost_center (cost_center_code, cost_center_name, profit_center_id, created_by, updated_by)
VALUES ('CC-100', 'General Trading', (SELECT profit_center_id FROM dbo.profit_center WHERE profit_center_code = 'PC-CORP'), 'SYSTEM', 'SYSTEM');
GO

INSERT INTO dbo.tax_code (tax_code, description, rate_percent, tax_type_id, country_id, created_by, updated_by)
VALUES
  ('VAT-GB-STD', 'UK standard-rate VAT', 20.000, 1, 1, 'SYSTEM', 'SYSTEM'),
  ('VAT-NL-STD', 'Netherlands standard-rate VAT', 21.000, 1, 3, 'SYSTEM', 'SYSTEM'),
  ('ZERO-RATED', 'Zero-rated / exempt', 0.000, 1, NULL, 'SYSTEM', 'SYSTEM');
GO

-- ─── gl_account: FK-ify cost_center, add default_tax_code_id, close the
--     created_by/updated_by governance gap this dedicated (non-registry)
--     entity fell outside of V137's registry-only audit ────────────────────
ALTER TABLE dbo.gl_account ADD
    cost_center_id       INT           NULL,
    default_tax_code_id  INT           NULL,
    created_by            VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM',
    updated_by            VARCHAR(100)  NOT NULL DEFAULT 'SYSTEM';
GO

UPDATE dbo.gl_account
SET cost_center_id = (SELECT cost_center_id FROM dbo.cost_center WHERE cost_center_code = 'CC-100')
WHERE cost_center IS NOT NULL;
GO

ALTER TABLE dbo.gl_account ADD
    CONSTRAINT fk_gl_account_cost_center FOREIGN KEY (cost_center_id) REFERENCES dbo.cost_center(cost_center_id),
    CONSTRAINT fk_gl_account_tax_code    FOREIGN KEY (default_tax_code_id) REFERENCES dbo.tax_code(tax_code_id);
GO

ALTER TABLE dbo.gl_account DROP COLUMN cost_center;
GO

-- ─── Tier 2 registry ──────────────────────────────────────────────────────
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, sub_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('profit_center', 'Profit Centers', 'Finance & Settlement', 'Chart of Accounts', 1, 1, 0, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('cost_center',   'Cost Centers',   'Finance & Settlement', 'Chart of Accounts', 1, 1, 0, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('tax_code',      'Tax Codes',      'Finance & Settlement', 'Chart of Accounts', 1, 1, 0, 0, 3, 'SYSTEM', 'SYSTEM');
GO

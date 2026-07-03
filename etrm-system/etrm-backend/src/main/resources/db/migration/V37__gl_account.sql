-- V37 — Finance: General Ledger Accounts
-- Chart of accounts for trade P&L, fee, and settlement postings

CREATE TABLE dbo.gl_account (
    account_id      INT IDENTITY(1,1) PRIMARY KEY,
    account_code    NVARCHAR(30)   NOT NULL UNIQUE,
    account_name    NVARCHAR(200)  NOT NULL,
    account_type    NVARCHAR(30)   NOT NULL,           -- REVENUE | COST | ASSET | LIABILITY | EQUITY | PNL
    commodity_type  NVARCHAR(30)   NULL,               -- NULL = applies to all commodities
    cost_center     NVARCHAR(50)   NULL,
    description     NVARCHAR(MAX)  NULL,
    is_active       BIT            NOT NULL DEFAULT 1,
    created_at      DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_at      DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- ─── Seed lookup ──────────────────────────────────────────────────────────────
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('gl_account_type', 'REVENUE',   'Revenue',   'Income accounts — trade revenue, realised hedge gains, fee income.',   10, 1),
  ('gl_account_type', 'COST',      'Cost',      'Expense accounts — COGS, transportation, storage, inspection.',        20, 1),
  ('gl_account_type', 'ASSET',     'Asset',     'Balance sheet assets — receivables, margin deposits, prepayments.',   30, 1),
  ('gl_account_type', 'LIABILITY', 'Liability', 'Balance sheet liabilities — payables, deferred revenue, collateral.', 40, 1),
  ('gl_account_type', 'EQUITY',    'Equity',    'Equity and retained earnings accounts.',                               50, 1),
  ('gl_account_type', 'PNL',       'P&L',       'MTM and unrealised P&L — fair value of open positions.',              60, 1);

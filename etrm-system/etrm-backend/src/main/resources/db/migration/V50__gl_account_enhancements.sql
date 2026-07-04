-- V50 — Finance: GL Account enhancements
-- The GL account (chart of accounts) module was missing the links a real
-- chart of accounts needs: which booking company (legal entity) an account
-- belongs to, which trading book/portfolio it's scoped to for P&L
-- attribution, its position in the account hierarchy, and the accounting
-- attributes (normal balance, currency, external ERP mapping, control
-- account flag) standard chart-of-accounts practice expects.
--
-- legal_entity_id and book_id are nullable — NULL means the account is a
-- shared/corporate-level account applying across all entities or books
-- (same "NULL = applies broadly" convention already used by commodity_type
-- on this table), not every account is entity- or book-specific.

ALTER TABLE dbo.gl_account ADD
    legal_entity_id     INT             NULL,
    book_id              INT             NULL,
    parent_account_id   INT             NULL,
    normal_balance       NVARCHAR(10)    NOT NULL DEFAULT 'DEBIT'
        CONSTRAINT ck_gl_account_normal_balance CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    currency_code        CHAR(3)         NULL,
    external_gl_code     NVARCHAR(50)    NULL,
    is_control_account   BIT             NOT NULL DEFAULT 0;
GO

ALTER TABLE dbo.gl_account ADD
    CONSTRAINT fk_gl_account_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_gl_account_book         FOREIGN KEY (book_id)         REFERENCES dbo.book(book_id),
    CONSTRAINT fk_gl_account_parent       FOREIGN KEY (parent_account_id) REFERENCES dbo.gl_account(account_id);
GO

-- ─── Seed lookup ──────────────────────────────────────────────────────────────
INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active)
VALUES
  ('gl_normal_balance', 'DEBIT',  'Debit',  'Assets and expenses — a debit increases the balance.', 10, 1),
  ('gl_normal_balance', 'CREDIT', 'Credit', 'Liabilities, equity, and revenue — a credit increases the balance.', 20, 1);

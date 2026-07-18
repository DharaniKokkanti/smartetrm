-- =============================================================================
-- V119 — multi-trader book ownership + flexible book hierarchy + archival
--
-- Trading book redesign (part 2/3). Three independent changes to dbo.book:
--
--   1. dbo.book_trader — book.responsible_trader_id was a single required
--      FK, so a book could only ever have one trader. Replaced with a join
--      table so a book can be shared across several traders (PRIMARY /
--      SECONDARY / BACKUP), then the old column is dropped — a clean break
--      rather than a parallel field, since this schema has no live trading
--      data yet (V1-V118, pre-production).
--
--   2. book.parent_book_id — self-referencing, nullable, arbitrary depth.
--      Lets a book nest under another book (e.g. a strategy sub-book inside
--      a desk's main book) instead of a hardcoded fixed-depth chain.
--      Matches how OpenLink Endur's portfolio tree works. Cycle prevention
--      and depth limits are enforced at the service layer — SQL Server
--      can't express recursive integrity in a CHECK constraint.
--
--   3. book.archived_at / archived_reason — a year-end archive sweep should
--      be self-documenting rather than an unexplained flip of is_active in
--      book_history. Reuses the existing is_active flag as the archive
--      switch; no new status enum, no per-year book rows.
--
-- dbo.book is already a SQL Server system-versioned temporal table
-- (SYSTEM_VERSIONING ON, HISTORY_TABLE = dbo.book_history, V1). Every move
-- between desk/entity/parent, and every archive/unarchive, is captured
-- automatically in book_history — no separate audit table needed.
-- =============================================================================

-- ── 1. book_trader ────────────────────────────────────────────────────────────
CREATE TABLE dbo.book_trader (
    book_id      INT             NOT NULL,
    trader_id    INT             NOT NULL,
    role         VARCHAR(20)     NOT NULL DEFAULT 'PRIMARY'
        CONSTRAINT chk_book_trader_role CHECK (role IN ('PRIMARY','SECONDARY','BACKUP')),
    is_active    BIT             NOT NULL DEFAULT 1,
    created_at   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by   VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_trader   PRIMARY KEY (book_id, trader_id),
    CONSTRAINT fk_bt_book       FOREIGN KEY (book_id)   REFERENCES dbo.book(book_id),
    CONSTRAINT fk_bt_trader     FOREIGN KEY (trader_id) REFERENCES dbo.trader(trader_id)
);
GO

-- Exactly one active PRIMARY trader per book.
CREATE UNIQUE INDEX ux_book_trader_primary ON dbo.book_trader (book_id)
    WHERE role = 'PRIMARY' AND is_active = 1;
GO

INSERT INTO dbo.book_trader (book_id, trader_id, role, is_active, created_by)
SELECT book_id, responsible_trader_id, 'PRIMARY', 1, 'V119_MIGRATION'
FROM dbo.book
WHERE responsible_trader_id IS NOT NULL;
GO

DROP INDEX IF EXISTS ix_book_trader ON dbo.book;
GO
ALTER TABLE dbo.book DROP CONSTRAINT fk_book_trader;
GO
ALTER TABLE dbo.book DROP COLUMN responsible_trader_id;
GO

-- ── 2. parent_book_id ─────────────────────────────────────────────────────────
ALTER TABLE dbo.book ADD parent_book_id INT NULL;
GO
ALTER TABLE dbo.book
    ADD CONSTRAINT fk_book_parent FOREIGN KEY (parent_book_id) REFERENCES dbo.book(book_id);
GO
CREATE INDEX ix_book_parent ON dbo.book (parent_book_id) WHERE parent_book_id IS NOT NULL;
GO

-- ── 3. archival ───────────────────────────────────────────────────────────────
ALTER TABLE dbo.book ADD
    archived_at      DATE          NULL,
    archived_reason  VARCHAR(200)  NULL;
GO

-- =============================================================================
-- V123 — book_level_type hierarchy + dbo.desk retirement + book_eod_status
--
-- Collapses the rigid legal_entity -> desk -> book two-level chain into one
-- self-referencing dbo.book tree (parent_book_id, V119) where every node
-- (desk, strategy, leaf trading book) is just a book row with a
-- book_level_type telling you what kind of node it is:
--
--   [book_level_type: DESK]         UK Power Desk
--     └─ [book_level_type: STRATEGY]   Continental Interconnector Spreads
--          └─ [book_level_type: TRADING_BOOK]  DayAhead_Physical_Position  (is_leaf_node = 1, trades live here)
--
-- dbo.legal_entity is NOT part of this tree — it keeps its own separate
-- table and its own parent_entity_id corporate-ownership hierarchy (V62),
-- referenced by book.legal_entity_id exactly as before. A legal entity
-- carries LEI/jurisdiction/regulator data that has nothing to do with
-- trading org structure, and 10 other tables already FK to it directly —
-- folding it into this tree would be a much larger, unjustified merge.
--
-- book_level_type is a new, distinct name from the existing book.book_type
-- column (V17/V55/V85 — booking PURPOSE: TRADING/HEDGING/ARBITRAGE/PROP/
-- CLIENT/RISK_MGMT). book_level_type is a different axis: WHERE in the
-- hierarchy this row sits. Kept as two separate columns so neither reading
-- collides with the other.
--
-- is_leaf_node is a plain BIT, independent of book_level_type, so "can this
-- row hold direct trade/cost/assay postings" is a single indexed boolean
-- check rather than an IN-list against a lookup that will grow over time.
-- Only TRADING_BOOK rows are leaf today; DESK/STRATEGY are pure rollup
-- containers. Same non-enforcement caveat as V122's book_role (which this
-- migration supersedes): the DB does not yet block a trade/cost posting
-- against a non-leaf book — no trade table exists in this schema yet: that
-- gate belongs in whatever application layer eventually books trades.
--
-- dbo.desk is retired entirely — its shape (code/name/entity/commodity/
-- head trader/active) was already ~1:1 with what book_classification +
-- book_trader + book itself cover, so keeping it as a second table was
-- duplication, not a distinct concept. Every existing desk row becomes a
-- DESK-level book row: desk.commodity_type -> book_classification (COMMODITY
-- dimension, same map table V122 built), desk.head_trader_id -> book_trader
-- PRIMARY. trader.desk_id and book.desk_id both repoint at the new book
-- rows (trader.desk_id renamed to trader.book_id; book.desk_id's role is
-- fully absorbed by parent_book_id, so the column is dropped outright).
--
-- book_access_grant.scope_type's DESK case (V120) collapses into BOOK — a
-- grant on a DESK-typed book row already cascades to every descendant via
-- the V122 recursive CTE (findDescendantIds), so a separate DESK scope
-- added nothing once desk is just another book row. No live DESK-scoped
-- grants exist to migrate as of this migration (verified against dev DB).
--
-- book_eod_status is new: end-of-day lock/reopen is a fact about one
-- (book, business_date) pair, not a permanent property of a book, so it
-- can't be a single BIT column on book — that would throw away the audit
-- trail of every prior day's lock/unlock. One row per leaf book per
-- business date, same reason-required shape as book.archived_reason
-- (V119)/the ArchiveModal pattern already in the frontend.
-- =============================================================================

-- dbo.book has GENERATED ALWAYS temporal period columns — any DML or index
-- creation against it fails with "SET options incorrect: QUOTED_IDENTIFIER"
-- under sqlcmd's default session options. Matches the ANSI_NULLS/
-- QUOTED_IDENTIFIER requirement SQL Server places on tables with computed
-- columns generally.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ── 1. book_level_type — extensible, not a fixed enum ───────────────────────
CREATE TABLE dbo.book_level_type (
    level_type_id   INT             NOT NULL IDENTITY(1,1),
    level_type_code VARCHAR(30)     NOT NULL,
    level_type_name VARCHAR(100)    NOT NULL,
    sort_order      TINYINT         NOT NULL DEFAULT 0,
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(100)    NOT NULL,
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_level_type     PRIMARY KEY (level_type_id),
    CONSTRAINT uq_book_level_type_code UNIQUE     (level_type_code)
);
GO

INSERT INTO dbo.book_level_type (level_type_code, level_type_name, sort_order, created_by, updated_by) VALUES
    ('DESK',         'Desk',         1, 'V123_MIGRATION', 'V123_MIGRATION'),
    ('STRATEGY',     'Strategy',     2, 'V123_MIGRATION', 'V123_MIGRATION'),
    ('TRADING_BOOK', 'Trading Book', 3, 'V123_MIGRATION', 'V123_MIGRATION');
GO

-- ── 2. book.is_leaf_node / book.book_level_type_id ───────────────────────────
-- Both added as NOT NULL with a DEFAULT (never as nullable-then-ALTER-COLUMN)
-- so SQL Server backfills dbo.book_history for us automatically — no
-- SYSTEM_VERSIONING off/on bracket needed. ALTER COLUMN ... NOT NULL is what
-- actually requires that dance on a system-versioned table (SQL Server
-- rejects it once book_history holds NULLs for the column, error 13531);
-- a same-statement NOT NULL DEFAULT sidesteps the whole problem.
ALTER TABLE dbo.book ADD is_leaf_node BIT NOT NULL CONSTRAINT df_book_is_leaf_node DEFAULT 0;
GO
-- Literal 3, not a lookup subquery — SQL Server DEFAULT constraints can't
-- reference another table ("Subqueries are not allowed in this context").
-- Safe to hardcode: TRADING_BOOK is deterministically the 3rd row inserted
-- into the brand-new book_level_type table two batches above, in this same
-- migration.
ALTER TABLE dbo.book ADD book_level_type_id INT NOT NULL
    CONSTRAINT df_book_level_type_id DEFAULT 3;
GO

-- Backfill from the book_role this migration supersedes, via plain UPDATE
-- (not ALTER COLUMN, so no temporal restrictions apply here either). Every
-- existing book row is TRADING today (verified against dev DB — 0
-- CONSOLIDATION rows), so the DEFAULT above already lands the common case;
-- this UPDATE makes is_leaf_node explicit for it and corrects the
-- CONSOLIDATION branch (a documented best-effort default of STRATEGY, for
-- anyone who adds CONSOLIDATION rows before this migration runs elsewhere).
UPDATE dbo.book SET is_leaf_node = 1 WHERE book_role = 'TRADING';
GO
UPDATE dbo.book SET
    book_level_type_id = (SELECT level_type_id FROM dbo.book_level_type WHERE level_type_code = 'STRATEGY'),
    is_leaf_node = 0
WHERE book_role = 'CONSOLIDATION';
GO

ALTER TABLE dbo.book ADD CONSTRAINT fk_book_level_type FOREIGN KEY (book_level_type_id) REFERENCES dbo.book_level_type(level_type_id);
GO
CREATE INDEX ix_book_level_type ON dbo.book (book_level_type_id, is_leaf_node);
GO

-- ── 3. book_eod_status — per (book, business_date) lock/reopen audit trail ──
CREATE TABLE dbo.book_eod_status (
    book_eod_status_id INT             NOT NULL IDENTITY(1,1),
    book_id             INT             NOT NULL,
    business_date        DATE            NOT NULL,
    status                 VARCHAR(20)     NOT NULL DEFAULT 'OPEN'
        CONSTRAINT chk_bes_status CHECK (status IN ('OPEN','LOCKED','REOPENED')),
    locked_by               VARCHAR(100)    NULL,
    locked_at                 DATETIME2       NULL,
    reopened_by                 VARCHAR(100)    NULL,
    reopened_at                   DATETIME2       NULL,
    reopen_reason                   VARCHAR(500)    NULL,
    created_at                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_eod_status       PRIMARY KEY (book_eod_status_id),
    CONSTRAINT fk_bes_book               FOREIGN KEY (book_id) REFERENCES dbo.book(book_id),
    CONSTRAINT uq_bes_book_date         UNIQUE      (book_id, business_date)
);
GO

CREATE INDEX ix_bes_date_status ON dbo.book_eod_status (business_date, status) INCLUDE (book_id);
GO

-- ── 4. Migrate dbo.desk rows into dbo.book (book_level_type = DESK) ─────────
DECLARE @tradingBookTypeId INT = (SELECT book_type_id FROM dbo.book_type WHERE type_code = 'TRADING');
DECLARE @deskLevelTypeId   INT = (SELECT level_type_id FROM dbo.book_level_type WHERE level_type_code = 'DESK');

INSERT INTO dbo.book (
    legal_entity_id, book_code, book_name, book_type, base_currency_id,
    is_active, description, book_level_type_id, is_leaf_node,
    created_by, updated_by
)
SELECT
    d.legal_entity_id, d.desk_code, d.desk_name, @tradingBookTypeId, 1,
    d.is_active, d.notes, @deskLevelTypeId, 0,
    d.created_by, d.created_by
FROM dbo.desk d;
GO

-- desk_id -> new book_id map, matched on the now-guaranteed-unique code
-- (verified zero desk_code/book_code collisions against dev DB before
-- writing this migration).
SELECT d.desk_id, b.book_id
INTO #desk_book_map
FROM dbo.desk d
JOIN dbo.book b ON b.book_code = d.desk_code AND b.created_by = d.created_by;
GO

-- desk.commodity_type (single-value FK -> dbo.commodity_type) -> book_classification,
-- the exact same decoupling V122 already did for book's own commodity_type.
INSERT INTO dbo.book_classification (book_id, dimension_id, value_code, value_label, is_primary, created_by)
SELECT map.book_id, dim.dimension_id, ct.type_code, ct.type_name, 1, 'V123_MIGRATION'
FROM dbo.desk d
JOIN #desk_book_map map ON map.desk_id = d.desk_id
JOIN dbo.commodity_type ct ON ct.commodity_type_id = d.commodity_type
CROSS JOIN (SELECT dimension_id FROM dbo.book_classification_dimension WHERE dimension_code = 'COMMODITY') dim
WHERE d.commodity_type IS NOT NULL;
GO

-- desk.head_trader_id -> book_trader PRIMARY, same role this migration keeps
-- for every other book.
INSERT INTO dbo.book_trader (book_id, trader_id, role, is_active, created_by)
SELECT map.book_id, d.head_trader_id, 'PRIMARY', 1, 'V123_MIGRATION'
FROM dbo.desk d
JOIN #desk_book_map map ON map.desk_id = d.desk_id
WHERE d.head_trader_id IS NOT NULL;
GO

-- ── 5. trader.desk_id -> trader.book_id, repointed at the new book rows ─────
ALTER TABLE dbo.trader DROP CONSTRAINT fk_trader_desk;
GO
UPDATE t SET t.desk_id = map.book_id
FROM dbo.trader t
JOIN #desk_book_map map ON map.desk_id = t.desk_id;
GO
EXEC sp_rename 'dbo.trader.desk_id', 'book_id', 'COLUMN';
GO
ALTER TABLE dbo.trader ADD CONSTRAINT fk_trader_book FOREIGN KEY (book_id) REFERENCES dbo.book(book_id);
GO

-- ── 6. book.desk_id absorbed into parent_book_id, then dropped ──────────────
-- Only backfills where parent_book_id isn't already explicitly set, so this
-- never clobbers a manually-chosen parent.
UPDATE b SET b.parent_book_id = map.book_id
FROM dbo.book b
JOIN #desk_book_map map ON map.desk_id = b.desk_id
WHERE b.desk_id IS NOT NULL AND b.parent_book_id IS NULL;
GO
ALTER TABLE dbo.book DROP CONSTRAINT fk_book_desk;
GO
ALTER TABLE dbo.book DROP COLUMN desk_id;
GO

DROP TABLE #desk_book_map;
GO

-- ── 7. book_role retired — book_level_type + is_leaf_node fully replace it ──
ALTER TABLE dbo.book DROP CONSTRAINT chk_book_role;
GO
ALTER TABLE dbo.book DROP CONSTRAINT df_book_role;
GO
ALTER TABLE dbo.book DROP COLUMN book_role;
GO

-- ── 8. book_access_grant — DESK scope collapses into BOOK ───────────────────
-- No ACTIVE (or any) DESK-scoped grants existed as of this migration
-- (verified against dev DB) — a straight CHECK swap, no data to migrate.
ALTER TABLE dbo.book_access_grant DROP CONSTRAINT chk_bag_scope_type;
GO
ALTER TABLE dbo.book_access_grant ADD CONSTRAINT chk_bag_scope_type CHECK (scope_type IN ('LEGAL_ENTITY','BOOK'));
GO

-- ── 9. dbo.desk dropped — fully absorbed into dbo.book ───────────────────────
DROP TABLE dbo.desk;
GO

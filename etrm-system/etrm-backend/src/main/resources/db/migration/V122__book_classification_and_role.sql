-- =============================================================================
-- V122 — Book classification decoupling + book_role
--
-- dbo.book.commodity_type pinned every book to exactly one commodity via a
-- direct FK column on the core table — the anti-pattern this migration
-- removes: any future classification axis (product family, region, a
-- strategy tag beyond the existing book_type) would otherwise mean another
-- ALTER TABLE ADD COLUMN on dbo.book. Replaced with a decoupled, N-valued
-- dbo.book_classification map table keyed off an extensible
-- dbo.book_classification_dimension reference table, so a new classification
-- axis (or a book carrying more than one value on the same axis — e.g. a
-- blended-crude book spanning two commodities) is a data insert, not a
-- schema change.
--
-- Also adds book.book_role (TRADING | CONSOLIDATION) — a structural flag on
-- the abstract container itself, not commodity/physical data, so it stays a
-- direct column (same category as book_type/is_active). Lets a book be
-- marked as a pure rollup node with children instead of a direct booking
-- target. See ETRM_Project_Handoff_v1_0.md's 2026-07-18 "Book/EOD hierarchy
-- gap analysis" entry, gap #5 — a desk-group consolidation book (e.g. all US
-- oil desks rolled up under one node) becomes an intentional, typed
-- construct instead of an unmarked side effect of nullable desk_id.
-- book_role does NOT yet block direct trade bookings on a CONSOLIDATION book
-- at the DB layer (no trade table is modeled in this schema at all, a
-- pre-existing scope boundary) — enforcement, if added, belongs in whatever
-- application layer eventually books trades against dbo.book.
-- =============================================================================

-- ── 1. book_classification_dimension — extensible, not a fixed enum ─────────
CREATE TABLE dbo.book_classification_dimension (
    dimension_id      INT             NOT NULL IDENTITY(1,1),
    dimension_code     VARCHAR(30)     NOT NULL,
    dimension_name     VARCHAR(100)    NOT NULL,
    is_multi_valued    BIT             NOT NULL DEFAULT 0,
    sort_order         TINYINT         NOT NULL DEFAULT 0,
    is_active          BIT             NOT NULL DEFAULT 1,
    created_at         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         VARCHAR(100)    NOT NULL,
    updated_at         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by         VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_classification_dimension     PRIMARY KEY (dimension_id),
    CONSTRAINT uq_book_classification_dimension_code UNIQUE      (dimension_code)
);
GO

INSERT INTO dbo.book_classification_dimension
    (dimension_code, dimension_name, is_multi_valued, sort_order, created_by, updated_by)
VALUES
    ('COMMODITY', 'Commodity', 1, 1, 'V122_MIGRATION', 'V122_MIGRATION');
GO

-- ── 2. book_classification — the decoupled map table ─────────────────────────
CREATE TABLE dbo.book_classification (
    book_classification_id INT             NOT NULL IDENTITY(1,1),
    book_id                 INT             NOT NULL,
    dimension_id             INT             NOT NULL,
    value_code                 VARCHAR(50)     NOT NULL,
    value_label                 VARCHAR(200)    NULL,
    is_primary                   BIT             NOT NULL DEFAULT 1,
    created_at                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                    VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_classification      PRIMARY KEY (book_classification_id),
    CONSTRAINT fk_bc_book                  FOREIGN KEY (book_id)      REFERENCES dbo.book(book_id),
    CONSTRAINT fk_bc_dimension              FOREIGN KEY (dimension_id) REFERENCES dbo.book_classification_dimension(dimension_id),
    CONSTRAINT uq_bc_book_dimension_value  UNIQUE      (book_id, dimension_id, value_code)
);
GO

-- Exactly one active PRIMARY value per (book, dimension) — same convention as
-- dbo.book_trader's one-active-PRIMARY-per-book filtered unique index (V119).
CREATE UNIQUE INDEX ux_book_classification_primary
    ON dbo.book_classification (book_id, dimension_id) WHERE is_primary = 1;
GO

-- Reverse lookup — "every book classified as POWER", the query shape a
-- cross-commodity risk aggregation service runs constantly.
CREATE INDEX ix_book_classification_dim_value ON dbo.book_classification (dimension_id, value_code)
    INCLUDE (book_id);
GO

CREATE INDEX ix_book_classification_book ON dbo.book_classification (book_id);
GO

-- ── 3. Backfill existing book.commodity_type into book_classification ───────
INSERT INTO dbo.book_classification (book_id, dimension_id, value_code, value_label, is_primary, created_by)
SELECT b.book_id, d.dimension_id, ct.type_code, ct.type_name, 1, 'V122_MIGRATION'
FROM   dbo.book b
JOIN   dbo.commodity_type ct ON ct.commodity_type_id = b.commodity_type
CROSS JOIN (SELECT dimension_id FROM dbo.book_classification_dimension WHERE dimension_code = 'COMMODITY') d;
GO

-- ── 4. book_role — structural flag, stays a direct column ───────────────────
ALTER TABLE dbo.book ADD book_role VARCHAR(20) NOT NULL
    CONSTRAINT df_book_role   DEFAULT 'TRADING'
    CONSTRAINT chk_book_role  CHECK (book_role IN ('TRADING','CONSOLIDATION'));
GO

-- ── 5. Drop commodity_type off dbo.book — the anti-pattern this migration removes ─
DROP INDEX IF EXISTS ix_book_entity ON dbo.book;
GO
ALTER TABLE dbo.book DROP CONSTRAINT fk_book_commodity_type;
GO
ALTER TABLE dbo.book DROP COLUMN commodity_type;
GO
CREATE INDEX ix_book_entity ON dbo.book (legal_entity_id, is_active);
GO

-- =============================================================================
-- V126 — Book-level ownership: dbo.book_ownership
--
-- V125 modeled joint-venture ownership at the legal_entity level only
-- (dbo.legal_entity_ownership) — a JOINT_VENTURE-typed entity co-owned by
-- 2+ parties. Real-world example surfaced this session (Musket/Circle K-
-- style arrangement): a wholly-normal, single-owner TRADING_COMPANY-typed
-- legal entity can still have ONE specific book economically split with an
-- external partner, while every other book under that same entity stays
-- 100% the entity's own. The two levels are genuinely independent, not
-- nested — book-level participation must NOT be derived from or require
-- the parent entity's own entity_type/ownership rows.
--
-- Same shape/conventions as V125's legal_entity_ownership: a 3-case
-- polymorphic owner (LEGAL_ENTITY/COUNTERPARTY resolve via owner_ref_id,
-- EXTERNAL is a free-text fallback), one active operator per book via a
-- filtered unique index, a per-owner consolidation method, plain
-- effective_from/effective_to dates (not full temporal), and no DB-level
-- sum-to-100% constraint (soft advisory only, same reasoning as V125 — see
-- that migration's header for the full rationale, not repeated here).
--
-- Deliberately does NOT touch dbo.book or dbo.legal_entity at all — no new
-- column, no entity_type dependency. A book under a plain TRADING_COMPANY
-- entity and a book under a JOINT_VENTURE entity use the exact same
-- mechanism; presence of book_ownership rows is the only signal that a
-- book carries a split, same as legal_entity_ownership needs no separate
-- "is this a JV" flag on legal_entity itself.
-- =============================================================================

CREATE TABLE dbo.book_ownership (
    book_ownership_id       INT             NOT NULL IDENTITY(1,1),
    book_id                 INT             NOT NULL,   -- the book itself (FK -> book)

    -- polymorphic owner (3 cases) — LEGAL_ENTITY | COUNTERPARTY | EXTERNAL,
    -- identical mechanism to legal_entity_ownership.owner_type/owner_ref_id.
    owner_type              VARCHAR(20)     NOT NULL,
    owner_ref_id             INT             NULL,
    external_owner_name     VARCHAR(200)    NULL,

    ownership_pct           DECIMAL(6,3)    NOT NULL,    -- scale 3 for fractional stakes e.g. 33.333
    is_operator              BIT             NOT NULL DEFAULT 0,
        -- which PARTY economically operates/manages this split — distinct
        -- from book_trader's PRIMARY role, which identifies a person who
        -- trades the book, not a counterparty/entity that shares its P&L.
    consolidation_method    VARCHAR(20)     NOT NULL DEFAULT 'EQUITY',   -- FULL | PROPORTIONAL | EQUITY | COST
    effective_from          DATE            NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    effective_to            DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                    VARCHAR(500)    NULL,

    created_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_ownership           PRIMARY KEY (book_ownership_id),
    CONSTRAINT fk_bo_book                  FOREIGN KEY (book_id) REFERENCES dbo.book(book_id),

    CONSTRAINT chk_bo_owner_type           CHECK (owner_type IN ('LEGAL_ENTITY','COUNTERPARTY','EXTERNAL')),
    CONSTRAINT chk_bo_consolidation        CHECK (consolidation_method IN ('FULL','PROPORTIONAL','EQUITY','COST')),
    CONSTRAINT chk_bo_pct_range            CHECK (ownership_pct > 0 AND ownership_pct <= 100),
    CONSTRAINT chk_bo_dates                CHECK (effective_to IS NULL OR effective_to >= effective_from),

    -- exactly one of (owner_ref_id) / (external_owner_name) is set, per owner_type
    CONSTRAINT chk_bo_owner_xor            CHECK (
        (owner_type IN ('LEGAL_ENTITY','COUNTERPARTY') AND owner_ref_id IS NOT NULL AND external_owner_name IS NULL)
        OR
        (owner_type = 'EXTERNAL' AND owner_ref_id IS NULL AND external_owner_name IS NOT NULL AND LEN(external_owner_name) > 0)
    )
);
GO

-- Exactly one active operator (managing partner) per book — same convention
-- as legal_entity_ownership's ux_leo_operator_per_jv (V125) and
-- book_trader's one-active-PRIMARY-per-book filtered unique index (V119).
CREATE UNIQUE INDEX ux_bo_operator_per_book
    ON dbo.book_ownership (book_id) WHERE is_operator = 1 AND is_active = 1;
GO

-- Reverse lookup — "every book a given legal entity/counterparty co-owns".
CREATE INDEX ix_bo_owner ON dbo.book_ownership (owner_type, owner_ref_id) INCLUDE (book_id, is_active);
GO

CREATE INDEX ix_bo_book ON dbo.book_ownership (book_id, is_active);
GO

PRINT '============================================================';
PRINT 'V126 APPLIED — dbo.book_ownership created.';
PRINT '  A book can now be co-owned by 2+ parties at %, independent';
PRINT '  of its parent legal entity''s own entity_type/ownership —';
PRINT '  a normal TRADING_COMPANY-owned book can carry a split';
PRINT '  without the entity itself being a Joint Venture.';
PRINT '============================================================';
GO

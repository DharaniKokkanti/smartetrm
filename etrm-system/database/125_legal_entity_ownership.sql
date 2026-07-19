-- =============================================================================
-- V125 — Joint Venture ownership: dbo.legal_entity_ownership + JOINT_VENTURE
-- legal_entity_type
--
-- Real trading houses (Vitol, Trafigura, Glencore, Mercuria) structure joint
-- ventures as separately incorporated legal entities co-owned by 2+
-- shareholders at percentage stakes (e.g. VTTI is ~50% Vitol + IFM Investors
-- + ADNOC) — not as ad-hoc per-trade splits. dbo.legal_entity today only has
-- parent_entity_id, a single self-referencing FK (a tree, one parent) — that
-- cannot represent a JV, which by definition has 2+ co-owners at %. This is
-- the first many-to-many ownership structure in the schema.
--
-- Once a JV exists as its own legal_entity row, its books/trades/positions
-- (all keyed off book.legal_entity_id) already roll up correctly with zero
-- further schema change — this migration only adds the ownership-structure
-- layer above trading, it does not touch trade capture or position logic.
--
-- Deliberately out of scope (see plan): credit exposure allocation by
-- ownership % (dbo.credit_limit has no legal_entity_id dimension today),
-- P&L/position rollup weighted by ownership % (position $ P&L isn't
-- computed anywhere yet), cash call / joint interest billing workflows (a
-- whole separate module in real JV-accounting products). This migration is
-- master data only: who owns what %, who operates, how each owner
-- consolidates the stake in its own books.
-- =============================================================================

-- ── 1. JOINT_VENTURE entity type — data insert, no schema change ────────────
-- dbo.legal_entity_type is already a plain lookup table (not a CHECK), same
-- extensibility precedent as dbo.book_level_type (V124).
INSERT INTO dbo.legal_entity_type (type_code, type_name, description, sort_order, created_by, updated_by)
VALUES ('JOINT_VENTURE', 'Joint Venture',
        'Entity co-owned by two or more parties at percentage stakes — see dbo.legal_entity_ownership.',
        6, 'V125_MIGRATION', 'V125_MIGRATION');
GO

-- ── 2. legal_entity_ownership — the ownership bridge table ──────────────────
CREATE TABLE dbo.legal_entity_ownership (
    ownership_id            INT             NOT NULL IDENTITY(1,1),
    jv_entity_id            INT             NOT NULL,   -- the JV itself (FK -> legal_entity)

    -- polymorphic owner, 3 cases — same reasoning as book_access_grant's
    -- scope_type/scope_id (V120): owner_ref_id points into either
    -- legal_entity or counterparty depending on owner_type, resolved and
    -- validated at the service layer since SQL Server can't express a
    -- conditional FK. EXTERNAL is a free-text fallback for a co-investor
    -- never otherwise modeled here (e.g. a financial investor like IFM in
    -- the VTTI example) rather than forcing a fake counterparty row.
    owner_type              VARCHAR(20)     NOT NULL,
    owner_ref_id            INT             NULL,
    external_owner_name     VARCHAR(200)    NULL,

    ownership_pct           DECIMAL(6,3)    NOT NULL,   -- scale 3 for fractional stakes e.g. 33.333
    is_operator             BIT             NOT NULL DEFAULT 0,
    consolidation_method    VARCHAR(20)     NOT NULL DEFAULT 'EQUITY',   -- how the OWNER consolidates this stake in ITS OWN books
    effective_from          DATE            NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    effective_to            DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,

    created_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_legal_entity_ownership   PRIMARY KEY (ownership_id),
    CONSTRAINT fk_leo_jv_entity            FOREIGN KEY (jv_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),

    CONSTRAINT chk_leo_owner_type          CHECK (owner_type IN ('LEGAL_ENTITY','COUNTERPARTY','EXTERNAL')),
    CONSTRAINT chk_leo_consolidation       CHECK (consolidation_method IN ('FULL','PROPORTIONAL','EQUITY','COST')),
    CONSTRAINT chk_leo_pct_range           CHECK (ownership_pct > 0 AND ownership_pct <= 100),
    CONSTRAINT chk_leo_dates               CHECK (effective_to IS NULL OR effective_to >= effective_from),

    -- exactly one of (owner_ref_id) / (external_owner_name) is set, per owner_type
    CONSTRAINT chk_leo_owner_xor           CHECK (
        (owner_type IN ('LEGAL_ENTITY','COUNTERPARTY') AND owner_ref_id IS NOT NULL AND external_owner_name IS NULL)
        OR
        (owner_type = 'EXTERNAL' AND owner_ref_id IS NULL AND external_owner_name IS NOT NULL AND LEN(external_owner_name) > 0)
    ),

    -- a JV cannot own itself
    CONSTRAINT chk_leo_not_self_owner      CHECK (NOT (owner_type = 'LEGAL_ENTITY' AND owner_ref_id = jv_entity_id))
);
GO

-- Exactly one active operator (managing partner) per JV — same convention as
-- dbo.book_trader's one-active-PRIMARY-per-book filtered unique index (V119)
-- and dbo.book_classification's one-active-PRIMARY-per-dimension (V122).
CREATE UNIQUE INDEX ux_leo_operator_per_jv
    ON dbo.legal_entity_ownership (jv_entity_id) WHERE is_operator = 1 AND is_active = 1;
GO

-- Reverse lookup — "every JV a given legal entity/counterparty co-owns".
CREATE INDEX ix_leo_owner ON dbo.legal_entity_ownership (owner_type, owner_ref_id) INCLUDE (jv_entity_id, is_active);
GO

CREATE INDEX ix_leo_jv ON dbo.legal_entity_ownership (jv_entity_id, is_active);
GO

PRINT '============================================================';
PRINT 'V125 APPLIED — dbo.legal_entity_ownership created;';
PRINT '  JOINT_VENTURE added to dbo.legal_entity_type.';
PRINT '  A legal_entity can now be co-owned by 2+ parties at %,';
PRINT '  with one operator/managing partner and a per-owner';
PRINT '  consolidation method (FULL/PROPORTIONAL/EQUITY/COST).';
PRINT '============================================================';
GO

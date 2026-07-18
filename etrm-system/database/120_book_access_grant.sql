-- =============================================================================
-- V120 — book_access_grant: legal-entity / desk / book scoped data access
--
-- Trading book redesign (part 3/3). Existing RBAC (V20 user_role /
-- role_function / user_role_assignment) governs WHAT actions a role can
-- perform (TRADE_VIEW, TRADE_CREATE, ...) but never WHICH entity's data —
-- any user with TRADE_VIEW can see every legal entity's books today.
--
-- book_access_grant is a single polymorphic grant layered underneath that
-- RBAC to add the missing row-level scoping dimension. Built as a sibling
-- to dbo.user_role_assignment, reusing its exact PENDING_APPROVAL -> ACTIVE
-- | REJECTED -> EXPIRED workflow (same columns, same semantics) so it slots
-- into the existing user/role admin screen as one more tab, not a new tool.
--
-- Resolution (application layer), first match wins, only ACTIVE grants count:
--   1. ACTIVE grant scope_type=LEGAL_ENTITY covering book.legal_entity_id
--      -> access to every desk and book under that entity.
--   2. Else ACTIVE grant scope_type=DESK covering book.desk_id
--      -> access to every book on that desk only.
--   3. Else ACTIVE grant scope_type=BOOK covering book_id directly, or an
--      active dbo.book_trader row for that book (implicit READ_WRITE)
--      -> access to that one book.
--   4. Else -> no access. Default deny.
--
-- access_level reuses READ / READ_WRITE — the same two values role_function
-- (V20) already uses for action permissions, rather than a third
-- vocabulary. A READ_WRITE grant at LEGAL_ENTITY or DESK scope is what
-- gives a desk head / group head access to every book under that scope
-- without a grant row per book.
--
-- scope_id is a plain INT (not three separate nullable FK columns) so it
-- can't carry a real FOREIGN KEY constraint — resolved to legal_entity /
-- desk / book in the application layer, keyed off scope_type. This keeps
-- the table shape identical to user_role_assignment's single-target
-- pattern and avoids "which of these three columns is actually set"
-- ambiguity.
-- =============================================================================

CREATE TABLE dbo.book_access_grant (
    grant_id          INT             IDENTITY(1,1)   NOT NULL,
    user_id           INT             NOT NULL,
    scope_type        VARCHAR(20)     NOT NULL,
    scope_id          INT             NOT NULL,
    access_level      VARCHAR(20)     NOT NULL    DEFAULT 'READ',
    status            VARCHAR(20)     NOT NULL    DEFAULT 'PENDING_APPROVAL',
    --   PENDING_APPROVAL → ACTIVE | REJECTED → EXPIRED
    assigned_by       VARCHAR(100)    NOT NULL,
    assigned_at       DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
    approved_by       VARCHAR(100)    NULL,
    approved_at       DATETIME2       NULL,
    rejection_reason  VARCHAR(500)    NULL,
    valid_from        DATE            NOT NULL    DEFAULT CAST(SYSDATETIME() AS DATE),
    valid_to          DATE            NULL,
    is_active         BIT             NOT NULL    DEFAULT 1,

    CONSTRAINT pk_book_access_grant     PRIMARY KEY (grant_id),
    CONSTRAINT fk_bag_user              FOREIGN KEY (user_id) REFERENCES dbo.app_user(user_id),
    CONSTRAINT chk_bag_scope_type       CHECK (scope_type   IN ('LEGAL_ENTITY','DESK','BOOK')),
    CONSTRAINT chk_bag_access_level     CHECK (access_level IN ('READ','READ_WRITE')),
    CONSTRAINT chk_bag_status           CHECK (status       IN ('PENDING_APPROVAL','ACTIVE','REJECTED','EXPIRED')),
    CONSTRAINT uq_book_access_grant     UNIQUE (user_id, scope_type, scope_id)
);
GO

CREATE INDEX ix_bag_scope ON dbo.book_access_grant (scope_type, scope_id, status) INCLUDE (user_id, access_level);
GO
CREATE INDEX ix_bag_user  ON dbo.book_access_grant (user_id, status);
GO

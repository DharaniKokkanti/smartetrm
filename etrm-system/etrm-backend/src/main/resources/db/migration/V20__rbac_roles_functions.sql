-- =============================================================================
-- ETRM SYSTEM — ROLE-BASED ACCESS CONTROL (RBAC)
-- SQL Server 2022 | V20 | June 2026
-- =============================================================================
-- Run AFTER: V19__entity_address_contact_link_tables.sql
-- =============================================================================
-- DESIGN
--   app_module        — top-level application area (TRADE, COUNTERPARTY, …)
--   app_function      — discrete action within a module (TRADE_VIEW, TRADE_CREATE, …)
--   user_role         — named role; SYSTEM roles are built-in; CUSTOM roles need approval
--   role_function     — which functions a role grants, at READ or READ_WRITE level
--   user_role_assignment — which roles a user holds, pending manager approval
-- =============================================================================

-- V1__master_data_foundation.sql already created dbo.user_role, but as a
-- completely different concept (a flat user_id+role_code CHECK assignment
-- row — superseded by this file's own user_role_assignment table). Never
-- dropped before this file's CREATE TABLE dbo.user_role redefines it from
-- scratch with an unrelated shape (role_id/role_type/status) — would fail
-- outright on a real from-scratch deploy. Found while reviewing the User
-- Management domain's schema; fixed in place here since this is the
-- migration that actually needs the drop, matching how V55's desk CHECK
-- bug was fixed in place rather than patched forward.
IF OBJECT_ID('dbo.user_role', 'U') IS NOT NULL DROP TABLE dbo.user_role;
GO

-- ── app_module ────────────────────────────────────────────────────────────────
CREATE TABLE dbo.app_module (
    module_id       INT             IDENTITY(1,1)   NOT NULL,
    module_code     VARCHAR(50)     NOT NULL,
    module_name     VARCHAR(100)    NOT NULL,
    description     VARCHAR(500)    NULL,
    sort_order      INT             NOT NULL    DEFAULT 0,
    is_active       BIT             NOT NULL    DEFAULT 1,
    CONSTRAINT pk_app_module        PRIMARY KEY (module_id),
    CONSTRAINT uq_app_module_code   UNIQUE (module_code)
);
GO

-- ── app_function ──────────────────────────────────────────────────────────────
CREATE TABLE dbo.app_function (
    function_id     INT             IDENTITY(1,1)   NOT NULL,
    module_id       INT             NOT NULL,
    function_code   VARCHAR(100)    NOT NULL,
    function_name   VARCHAR(200)    NOT NULL,
    description     VARCHAR(500)    NULL,
    sort_order      INT             NOT NULL    DEFAULT 0,
    is_active       BIT             NOT NULL    DEFAULT 1,
    CONSTRAINT pk_app_function          PRIMARY KEY (function_id),
    CONSTRAINT uq_app_function_code     UNIQUE (function_code),
    CONSTRAINT fk_af_module             FOREIGN KEY (module_id) REFERENCES dbo.app_module(module_id)
);
GO

-- ── user_role ─────────────────────────────────────────────────────────────────
CREATE TABLE dbo.user_role (
    role_id             INT             IDENTITY(1,1)   NOT NULL,
    role_code           VARCHAR(50)     NOT NULL,
    role_name           VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    role_type           VARCHAR(10)     NOT NULL    DEFAULT 'CUSTOM',   -- SYSTEM | CUSTOM
    status              VARCHAR(20)     NOT NULL    DEFAULT 'DRAFT',
    --   DRAFT → PENDING_APPROVAL → APPROVED | REJECTED
    rejection_reason    VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL    DEFAULT 1,
    created_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
    created_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
    submitted_at        DATETIME2       NULL,
    approved_by         VARCHAR(100)    NULL,
    approved_at         DATETIME2       NULL,
    updated_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
    CONSTRAINT pk_user_role         PRIMARY KEY (role_id),
    CONSTRAINT uq_user_role_code    UNIQUE (role_code),
    CONSTRAINT chk_role_type        CHECK (role_type IN ('SYSTEM','CUSTOM')),
    CONSTRAINT chk_role_status      CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED'))
);
GO

-- ── role_function ─────────────────────────────────────────────────────────────
CREATE TABLE dbo.role_function (
    role_function_id    INT             IDENTITY(1,1)   NOT NULL,
    role_id             INT             NOT NULL,
    function_id         INT             NOT NULL,
    access_level        VARCHAR(10)     NOT NULL    DEFAULT 'READ',     -- READ | READ_WRITE
    CONSTRAINT pk_role_function     PRIMARY KEY (role_function_id),
    CONSTRAINT uq_role_function     UNIQUE (role_id, function_id),
    CONSTRAINT fk_rf_role           FOREIGN KEY (role_id)       REFERENCES dbo.user_role(role_id),
    CONSTRAINT fk_rf_function       FOREIGN KEY (function_id)   REFERENCES dbo.app_function(function_id),
    CONSTRAINT chk_access_level     CHECK (access_level IN ('READ','READ_WRITE'))
);
GO

-- ── user_role_assignment ──────────────────────────────────────────────────────
CREATE TABLE dbo.user_role_assignment (
    assignment_id       INT             IDENTITY(1,1)   NOT NULL,
    user_id             INT             NOT NULL,
    role_id             INT             NOT NULL,
    status              VARCHAR(20)     NOT NULL    DEFAULT 'PENDING_APPROVAL',
    --   PENDING_APPROVAL → ACTIVE | REJECTED → EXPIRED
    assigned_by         VARCHAR(100)    NOT NULL,
    assigned_at         DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
    approved_by         VARCHAR(100)    NULL,
    approved_at         DATETIME2       NULL,
    rejection_reason    VARCHAR(500)    NULL,
    valid_from          DATE            NOT NULL    DEFAULT CAST(SYSDATETIME() AS DATE),
    valid_to            DATE            NULL,
    is_active           BIT             NOT NULL    DEFAULT 1,
    CONSTRAINT pk_user_role_assignment  PRIMARY KEY (assignment_id),
    CONSTRAINT uq_user_role             UNIQUE (user_id, role_id),
    -- user_id originally shipped as a bare INT with only a comment claiming
    -- "FK → system_user.user_id" — system_user was never a real table (the
    -- real one is dbo.app_user, created in V1) and no FOREIGN KEY was ever
    -- actually declared, so nothing stopped an assignment pointing at a
    -- user_id that doesn't exist. Fixed in place (this table has no real
    -- deployed data yet), matching how this file already fixes the V1/V20
    -- duplicate dbo.user_role bug above rather than patching forward.
    CONSTRAINT fk_ura_user              FOREIGN KEY (user_id) REFERENCES dbo.app_user(user_id),
    CONSTRAINT fk_ura_role              FOREIGN KEY (role_id) REFERENCES dbo.user_role(role_id),
    CONSTRAINT chk_ura_status           CHECK (status IN ('PENDING_APPROVAL','ACTIVE','REJECTED','EXPIRED'))
);
GO

-- ─── Seed: modules ────────────────────────────────────────────────────────────
INSERT INTO dbo.app_module (module_code, module_name, description, sort_order) VALUES
    ('TRADE',         'Trade Management',       'Create, amend, approve, and cancel trades',                     1),
    ('COUNTERPARTY',  'Counterparty Management','Manage trading counterparties, KYC, contacts, and bank details',2),
    ('MASTER_DATA',   'Master Data',            'Legal entities, books, traders, products, and markets',         3),
    ('STATIC_DATA',   'Static Data',            'Reference lookup tables — currencies, incoterms, types, codes', 4),
    ('POSITION',      'Position & P&L',         'View real-time and historical position and P&L reports',        5),
    ('PRICING',       'Pricing & Curves',        'Manage price sources, curves, and pricing rules',               6),
    ('ADMIN',         'Administration',          'User management, roles, permissions, and system configuration', 7);
GO

-- ─── Seed: functions ─────────────────────────────────────────────────────────
DECLARE @trade        INT = (SELECT module_id FROM dbo.app_module WHERE module_code='TRADE');
DECLARE @cp           INT = (SELECT module_id FROM dbo.app_module WHERE module_code='COUNTERPARTY');
DECLARE @md           INT = (SELECT module_id FROM dbo.app_module WHERE module_code='MASTER_DATA');
DECLARE @sd           INT = (SELECT module_id FROM dbo.app_module WHERE module_code='STATIC_DATA');
DECLARE @pos          INT = (SELECT module_id FROM dbo.app_module WHERE module_code='POSITION');
DECLARE @pricing      INT = (SELECT module_id FROM dbo.app_module WHERE module_code='PRICING');
DECLARE @admin        INT = (SELECT module_id FROM dbo.app_module WHERE module_code='ADMIN');

INSERT INTO dbo.app_function (module_id, function_code, function_name, sort_order) VALUES
    -- Trade
    (@trade,    'TRADE_VIEW',       'View Trades',              1),
    (@trade,    'TRADE_CREATE',     'Create Trades',            2),
    (@trade,    'TRADE_EDIT',       'Edit Trades',              3),
    (@trade,    'TRADE_APPROVE',    'Approve Trades',           4),
    (@trade,    'TRADE_CANCEL',     'Cancel Trades',            5),
    -- Counterparty
    (@cp,       'CP_VIEW',          'View Counterparties',      1),
    (@cp,       'CP_CREATE',        'Create Counterparties',    2),
    (@cp,       'CP_EDIT',          'Edit Counterparties',      3),
    (@cp,       'CP_DEACTIVATE',    'Deactivate Counterparties',4),
    -- Master Data
    (@md,       'MD_VIEW',          'View Master Data',         1),
    (@md,       'MD_CREATE',        'Create Master Data',       2),
    (@md,       'MD_EDIT',          'Edit Master Data',         3),
    (@md,       'MD_DELETE',        'Delete Master Data',       4),
    -- Static Data
    (@sd,       'SD_VIEW',          'View Static Data',         1),
    (@sd,       'SD_CREATE',        'Create Static Data',       2),
    (@sd,       'SD_EDIT',          'Edit Static Data',         3),
    (@sd,       'SD_DELETE',        'Delete Static Data',       4),
    -- Position
    (@pos,      'POS_VIEW',         'View Positions & P&L',     1),
    -- Pricing
    (@pricing,  'PRICE_VIEW',       'View Prices & Curves',     1),
    (@pricing,  'PRICE_EDIT',       'Edit Prices & Curves',     2),
    -- Admin
    (@admin,    'USER_VIEW',        'View Users',               1),
    (@admin,    'USER_CREATE',      'Create Users',             2),
    (@admin,    'USER_EDIT',        'Edit Users',               3),
    (@admin,    'ROLE_CREATE',      'Create Roles',             4),
    (@admin,    'ROLE_EDIT',        'Edit Roles',               5),
    (@admin,    'ROLE_APPROVE',     'Approve Roles',            6),
    (@admin,    'ROLE_ASSIGN',      'Assign Roles to Users',    7);
GO

-- ─── Seed: system roles ───────────────────────────────────────────────────────
INSERT INTO dbo.user_role (role_code, role_name, description, role_type, status, created_by, approved_by, approved_at) VALUES
    ('ADMIN',        'System Administrator', 'Full access to all modules including administration', 'SYSTEM', 'APPROVED', 'SYSTEM', 'SYSTEM', SYSDATETIME()),
    ('TRADER',       'Trader',               'Create and manage trades; view counterparties and master data', 'SYSTEM', 'APPROVED', 'SYSTEM', 'SYSTEM', SYSDATETIME()),
    ('RISK_MANAGER', 'Risk Manager',         'View and approve trades; view positions and P&L', 'SYSTEM', 'APPROVED', 'SYSTEM', 'SYSTEM', SYSDATETIME()),
    ('OPERATIONS',   'Operations',           'Full counterparty and master data management; view trades', 'SYSTEM', 'APPROVED', 'SYSTEM', 'SYSTEM', SYSDATETIME()),
    ('COMPLIANCE',   'Compliance',           'View and manage KYC/counterparty data; view trades', 'SYSTEM', 'APPROVED', 'SYSTEM', 'SYSTEM', SYSDATETIME()),
    ('VIEWER',       'Read-Only Viewer',     'Read-only access to all non-admin modules', 'SYSTEM', 'APPROVED', 'SYSTEM', 'SYSTEM', SYSDATETIME());
GO

-- ─── Seed: role → function grants ────────────────────────────────────────────
-- ADMIN: everything
INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id, 'READ_WRITE'
FROM dbo.user_role r CROSS JOIN dbo.app_function f
WHERE r.role_code = 'ADMIN';

-- TRADER: all trade RW; CP/MD/SD view only; position + price view
INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id,
    CASE WHEN m.module_code = 'TRADE' THEN 'READ_WRITE' ELSE 'READ' END
FROM dbo.user_role r
JOIN dbo.app_function f ON 1=1
JOIN dbo.app_module m ON f.module_id = m.module_id
WHERE r.role_code = 'TRADER'
  AND m.module_code IN ('TRADE','COUNTERPARTY','MASTER_DATA','STATIC_DATA','POSITION','PRICING')
  AND f.function_code NOT IN ('TRADE_APPROVE');

-- RISK_MANAGER: trade view+approve; position+pricing full; everything else view
INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id,
    CASE WHEN f.function_code IN ('TRADE_VIEW','TRADE_APPROVE','POS_VIEW','PRICE_VIEW','PRICE_EDIT') THEN 'READ_WRITE' ELSE 'READ' END
FROM dbo.user_role r
JOIN dbo.app_function f ON 1=1
JOIN dbo.app_module m ON f.module_id = m.module_id
WHERE r.role_code = 'RISK_MANAGER'
  AND m.module_code IN ('TRADE','COUNTERPARTY','MASTER_DATA','STATIC_DATA','POSITION','PRICING');

-- OPERATIONS: CP+MD+SD full; trade/position view
INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id,
    CASE WHEN m.module_code IN ('COUNTERPARTY','MASTER_DATA','STATIC_DATA') THEN 'READ_WRITE' ELSE 'READ' END
FROM dbo.user_role r
JOIN dbo.app_function f ON 1=1
JOIN dbo.app_module m ON f.module_id = m.module_id
WHERE r.role_code = 'OPERATIONS'
  AND m.module_code IN ('TRADE','COUNTERPARTY','MASTER_DATA','STATIC_DATA','POSITION');

-- COMPLIANCE: CP full; everything else view
INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id,
    CASE WHEN m.module_code = 'COUNTERPARTY' THEN 'READ_WRITE' ELSE 'READ' END
FROM dbo.user_role r
JOIN dbo.app_function f ON 1=1
JOIN dbo.app_module m ON f.module_id = m.module_id
WHERE r.role_code = 'COMPLIANCE'
  AND m.module_code IN ('TRADE','COUNTERPARTY','MASTER_DATA','STATIC_DATA','POSITION');

-- VIEWER: all non-admin VIEW functions, READ only
INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id, 'READ'
FROM dbo.user_role r
JOIN dbo.app_function f ON 1=1
JOIN dbo.app_module m ON f.module_id = m.module_id
WHERE r.role_code = 'VIEWER'
  AND m.module_code != 'ADMIN'
  AND (f.function_code LIKE '%_VIEW' OR f.function_code LIKE '%VIEW%');
GO

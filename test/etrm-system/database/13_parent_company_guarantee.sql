-- =============================================================================
-- ETRM SYSTEM — PARENT COMPANY GUARANTEE (PCG)
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql   (legal_entity, counterparty, currency, document_store)
-- =============================================================================
-- ADDS 1 TABLE:
--   01. parent_company_guarantee
-- =============================================================================
-- DESIGN NOTE — direction + three independently polymorphic roles:
-- A PCG is NOT always "counterparty's parent guarantees the counterparty."
-- Two real directions exist, stored explicitly in `direction` rather than
-- inferred from the role types (inference breaks down for edge cases like
-- cross-guarantees within a group, where a counterparty might guarantee
-- another counterparty on our behalf):
--   RECEIVED — a counterparty's parent (itself a counterparty in our
--              system) guarantees that counterparty's trading obligations
--              TO US.
--              principal = COUNTERPARTY (the subsidiary we trade with)
--              guarantor = COUNTERPARTY (their parent)
--              beneficiary = LEGAL_ENTITY (the one of our entities trading with them)
--   ISSUED   — we (the booking company) guarantee one of OUR OWN entities'
--              obligations TO a counterparty, extending them credit support.
--              principal = LEGAL_ENTITY (our trading subsidiary)
--              guarantor = LEGAL_ENTITY (our parent/booking company)
--              beneficiary = COUNTERPARTY (the external party being protected)
-- `direction` drives the form's sensible defaults; the three *_entity_type
-- columns stay independently settable so the unusual combinations aren't
-- hard-blocked. Same three-column-times-three polymorphic pattern already
-- used by address/contact/bank_account/tax_registration (entity_type +
-- entity_id), just applied to three roles in one row instead of one.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.parent_company_guarantee', 'U') IS NOT NULL DROP TABLE dbo.parent_company_guarantee;
GO

-- =============================================================================
-- 01. PARENT_COMPANY_GUARANTEE
-- Credit support instrument where a guarantor (a legal entity or
-- counterparty) backs the trading obligations of a principal (also a legal
-- entity or counterparty) for the benefit of a third party. Covers both
-- RECEIVED (a counterparty's parent guarantees them to us) and ISSUED (we
-- guarantee our own entity to a counterparty) directions via three
-- independently polymorphic role columns.
-- =============================================================================
CREATE TABLE dbo.parent_company_guarantee (
    pcg_id                      INT             NOT NULL IDENTITY(1,1),
    pcg_reference                  VARCHAR(50)     NOT NULL,   -- e.g. 'PCG-2026-0001'
    direction                         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pcg_direction CHECK (direction IN ('RECEIVED','ISSUED')),

    guarantor_entity_type                VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pcg_guarantor_type CHECK (guarantor_entity_type IN ('LEGAL_ENTITY','COUNTERPARTY')),
    guarantor_entity_id                     INT             NOT NULL,   -- who provides the guarantee

    principal_entity_type                      VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pcg_principal_type CHECK (principal_entity_type IN ('LEGAL_ENTITY','COUNTERPARTY')),
    principal_entity_id                           INT             NOT NULL,   -- whose obligations are guaranteed

    beneficiary_entity_type                          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pcg_beneficiary_type CHECK (beneficiary_entity_type IN ('LEGAL_ENTITY','COUNTERPARTY')),
    beneficiary_entity_id                               INT             NOT NULL,   -- who is protected by the guarantee

    guarantee_amount                                       DECIMAL(18,2)   NOT NULL,
    currency_id                                               INT             NOT NULL,
    issue_date                                                   DATE            NOT NULL,
    is_evergreen                                                    BIT             NOT NULL DEFAULT 0,
    expiry_date                                                        DATE            NULL,   -- NULL when is_evergreen = 1
    pcg_status                                                            VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
        CONSTRAINT chk_pcg_status CHECK (pcg_status IN (
            'DRAFT','ISSUED','AMENDED','EXPIRED','CANCELLED','CALLED'
        )),
    amount_called                                                            DECIMAL(18,2)   NULL,
    document_store_id                                                           INT             NULL,
    is_active                                                                      BIT             NOT NULL DEFAULT 1,
    notes                                                                            VARCHAR(500)    NULL,
    created_at                                                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                                        VARCHAR(100)    NOT NULL,
    updated_at                                                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                                        VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_parent_company_guarantee   PRIMARY KEY (pcg_id),
    CONSTRAINT uq_pcg_reference                 UNIQUE      (pcg_reference),
    CONSTRAINT fk_pcg_currency                     FOREIGN KEY (currency_id)        REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pcg_document                       FOREIGN KEY (document_store_id)  REFERENCES dbo.document_store(document_id),
    CONSTRAINT chk_pcg_evergreen_expiry                 CHECK (
        (is_evergreen = 1 AND expiry_date IS NULL) OR (is_evergreen = 0 AND expiry_date IS NOT NULL)
    ),
    CONSTRAINT chk_pcg_dates                                CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
    CONSTRAINT chk_pcg_not_self_guarantee                      CHECK (
        NOT (guarantor_entity_type = principal_entity_type AND guarantor_entity_id = principal_entity_id)
    ),
    CONSTRAINT chk_pcg_amount_called                              CHECK (
        amount_called IS NULL OR (amount_called >= 0 AND amount_called <= guarantee_amount)
    )
);
GO

-- One guarantor can back many principals at different amounts — no unique
-- constraint on guarantor alone. Indexes support "show me everything this
-- parent has guaranteed," "show me what's backing this counterparty," and
-- the frontend's listForEntity(type, id) call (any of the three roles).
CREATE INDEX ix_pcg_guarantor   ON dbo.parent_company_guarantee (guarantor_entity_type, guarantor_entity_id, is_active);
CREATE INDEX ix_pcg_principal   ON dbo.parent_company_guarantee (principal_entity_type, principal_entity_id, is_active);
CREATE INDEX ix_pcg_beneficiary ON dbo.parent_company_guarantee (beneficiary_entity_type, beneficiary_entity_id, is_active);
CREATE INDEX ix_pcg_status      ON dbo.parent_company_guarantee (pcg_status, expiry_date);
GO


-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================
/*
RECEIVED — Shell plc (a counterparty parent) guarantees Shell Trading
International Ltd's (a counterparty, their subsidiary) obligations to our
Acme UK legal entity:

    pcg_reference = 'PCG-2026-0001', direction = 'RECEIVED',
    guarantor_entity_type = 'COUNTERPARTY', guarantor_entity_id = <Shell plc cp id>,
    principal_entity_type = 'COUNTERPARTY', principal_entity_id = <Shell Trading Intl cp id>,
    beneficiary_entity_type = 'LEGAL_ENTITY', beneficiary_entity_id = <Acme UK legal_entity_id>,
    guarantee_amount = 50000000, currency_id = <USD>, pcg_status = 'ISSUED',
    is_evergreen = 0, expiry_date = '2027-01-15'

ISSUED — We (Acme Group Holdings, our parent legal entity) guarantee our own
Acme US trading subsidiary's obligations to Glencore:

    pcg_reference = 'PCG-2026-0002', direction = 'ISSUED',
    guarantor_entity_type = 'LEGAL_ENTITY', guarantor_entity_id = <Acme Group Holdings legal_entity_id>,
    principal_entity_type = 'LEGAL_ENTITY', principal_entity_id = <Acme US legal_entity_id>,
    beneficiary_entity_type = 'COUNTERPARTY', beneficiary_entity_id = <Glencore cp id>,
    guarantee_amount = 25000000, currency_id = <USD>, pcg_status = 'ISSUED',
    is_evergreen = 1, expiry_date = NULL
*/

PRINT '============================================================';
PRINT 'PARENT COMPANY GUARANTEE (PCG) v1.0 APPLIED';
PRINT '  01. parent_company_guarantee — supports both RECEIVED (a';
PRINT '      counterparty''s parent guarantees them) and ISSUED (we';
PRINT '      guarantee our own entity to a counterparty) directions via';
PRINT '      an explicit direction column plus three independently';
PRINT '      polymorphic role columns: guarantor, principal, beneficiary.';
PRINT '============================================================';
GO

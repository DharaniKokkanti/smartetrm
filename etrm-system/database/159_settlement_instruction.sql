-- =============================================================================
-- V159 — dbo.settlement_instruction: real Standard Settlement Instruction
-- (SSI) routing rules, separate from dbo.bank_account.
--
-- Design context (2026-07-25, following on from the V142 "no dedicated
-- settlement-instruction concept exists" finding): bank_account already
-- holds the static beneficiary/routing details for an account (bank name,
-- SWIFT/IBAN, etc). What was missing is the routing RULE that says "for
-- this counterparty, this direction, this currency, use THAT account" —
-- with history, effective-dating and a fraud-control verification step.
-- Modeled on ISDA's Standing Settlement Instructions best-practice
-- guidance and the FMSB Standard for Sharing of SSIs: a stable instruction
-- identifier, effective dating, and maker-checker verification before an
-- SSI can be relied on for a real payment — bank-detail-change fraud
-- (business email compromise redirecting a payment to a fraudulent
-- account) is the primary risk this construct exists to control, not
-- just data modeling tidiness.
--
-- direction determines which side of the polymorphic bank_account the
-- instruction must point at (enforced in SettlementInstructionService,
-- not the DB — bank_account's polymorphic entity_type/entity_id can't be
-- CHECK-constrained against a sibling table without a trigger, and the
-- existing row_version guard triggers (V153) are the only trigger
-- precedent in this schema, kept narrowly scoped on purpose):
--   PAY     -> we pay the counterparty -> bank_account must be their
--              account (entity_type='COUNTERPARTY', entity_id=counterparty_id)
--   RECEIVE -> counterparty pays us    -> bank_account must be OUR
--              account (entity_type='LEGAL_ENTITY', entity_id=our_entity_id)
--   BOTH    -> same account used either direction (rare; simple FX-style
--              relationships) -> either ownership is accepted
--
-- SSIs are immutable once created — no UPDATE endpoint. A changed bank
-- detail is always a NEW settlement_instruction row that supersedes the
-- old one once verified, never an edit to an existing row. This is
-- deliberate: an audit trail of exactly who requested which account and
-- who verified it is the whole point of the maker-checker control.
-- =============================================================================
CREATE TABLE dbo.settlement_instruction (
    settlement_instruction_id  INT             NOT NULL IDENTITY(1,1),
    instruction_code           VARCHAR(30)     NOT NULL,
    our_entity_id               INT             NOT NULL,
    counterparty_id             INT             NOT NULL,
    direction                   VARCHAR(10)     NOT NULL
        CONSTRAINT chk_ssi_direction CHECK (direction IN ('PAY','RECEIVE','BOTH')),
    currency_id                 INT             NULL,       -- NULL = default across all currencies
    product_scope                VARCHAR(30)     NULL,       -- NULL = all products; e.g. PHYSICAL/FINANCIAL
    bank_account_id             INT             NOT NULL,
    status                       VARCHAR(20)     NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CONSTRAINT chk_ssi_status CHECK (status IN (
            'PENDING_VERIFICATION','ACTIVE','SUPERSEDED','REJECTED'
        )),
    verified_by                 VARCHAR(100)    NULL,
    verified_at                  DATETIME2       NULL,
    verification_method          VARCHAR(30)     NULL
        CONSTRAINT chk_ssi_verification_method CHECK (verification_method IS NULL OR verification_method IN (
            'CALLBACK_CONFIRMED','SIGNED_LETTER','SWIFT_MT','BANK_PORTAL_CONFIRMED','OTHER'
        )),
    valid_from                   DATE            NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    valid_to                     DATE            NULL,
    superseded_by_id             INT             NULL,
    notes                        VARCHAR(500)    NULL,
    row_version                  INT             NOT NULL DEFAULT 1,
    created_at                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                   VARCHAR(100)    NOT NULL,
    updated_at                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                   VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_settlement_instruction        PRIMARY KEY (settlement_instruction_id),
    CONSTRAINT uq_ssi_instruction_code           UNIQUE (instruction_code),
    CONSTRAINT fk_ssi_our_entity                 FOREIGN KEY (our_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_ssi_counterparty                FOREIGN KEY (counterparty_id) REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_ssi_currency                    FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_ssi_bank_account                FOREIGN KEY (bank_account_id) REFERENCES dbo.bank_account(bank_account_id),
    CONSTRAINT fk_ssi_superseded_by               FOREIGN KEY (superseded_by_id) REFERENCES dbo.settlement_instruction(settlement_instruction_id)
);
GO

-- Only one open-ended ACTIVE SSI per routing key at a time — the normal
-- case. Overlapping *dated* ranges (valid_to set) are rarer and validated
-- in the service layer instead, since SQL Server has no native exclusion
-- constraint for range overlap.
CREATE UNIQUE INDEX uq_ssi_active_routing_key
    ON dbo.settlement_instruction (our_entity_id, counterparty_id, direction, currency_id, product_scope)
    WHERE status = 'ACTIVE' AND valid_to IS NULL;
GO

CREATE INDEX ix_ssi_counterparty ON dbo.settlement_instruction (counterparty_id, status);
GO
CREATE INDEX ix_ssi_bank_account ON dbo.settlement_instruction (bank_account_id);
GO

-- Closes the other half of the originally-flagged gap: bank_account.is_primary
-- was a completely unenforced boolean, so nothing stopped two "primary"
-- accounts existing for the same owning entity + currency. is_primary
-- remains a UI convenience flag (default pre-selection in dropdowns) —
-- settlement_instruction is now the actual routing source of truth — but
-- it should still not be able to lie.
CREATE UNIQUE INDEX uq_bank_account_primary_per_entity_currency
    ON dbo.bank_account (entity_type, entity_id, currency_id)
    WHERE is_primary = 1 AND is_active = 1;
GO

-- V153's row_version guard was applied to all tables that had row_version
-- at the time it ran, via a dynamic per-table scan — it does not retroactively
-- cover tables created afterward. Per that migration's own documented policy
-- ("applies to future Flyway migrations too, no exceptions"), the same guard
-- shape is added by hand here for this one new table.
CREATE TRIGGER dbo.trg_settlement_instruction_row_version_guard
    ON dbo.settlement_instruction
    AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.settlement_instruction (bypass write rejected by trg_settlement_instruction_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.settlement_instruction_id = d.settlement_instruction_id
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.settlement_instruction (stale or reused version rejected by trg_settlement_instruction_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

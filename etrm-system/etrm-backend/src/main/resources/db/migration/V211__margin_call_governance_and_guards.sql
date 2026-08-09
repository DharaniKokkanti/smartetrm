-- V211: two governance gaps found while finishing the margin-call feature
-- set (clearing_account, contract_margin_rate, clearing_account_margin_rate,
-- margin_offset_rule, margin_valuation, margin_call):
--
-- 1. dbo.margin_call (V5) predates the row_version/updated_at/updated_by
--    governance convention and never got the Tier1 rollout pass — it has
--    created_at/created_by/created_src_id/updated_src_id but no row_version
--    or updated_at/updated_by. 0 rows live, so a straight NOT NULL add is
--    safe, no backfill needed.
-- 2. None of the five margin tables added in V202-V208 got the row_version
--    guard trigger (trg_*_row_version_guard) that V153 established as a
--    no-exceptions standing rule for every row_version-bearing table —
--    only margin_account (altered, not newly created, in V203) picked it
--    up. All five are still empty or near-empty, so backfilling the
--    trigger now is free.

USE ETRM_DB;
GO

ALTER TABLE dbo.margin_call ADD
    updated_at   DATETIME2 NULL,
    updated_by   VARCHAR(100) NULL,
    row_version  INT NULL;
GO

UPDATE dbo.margin_call
SET updated_at = created_at, updated_by = created_by, row_version = 1
WHERE row_version IS NULL;
GO

ALTER TABLE dbo.margin_call ALTER COLUMN updated_at DATETIME2 NOT NULL;
GO
ALTER TABLE dbo.margin_call ALTER COLUMN updated_by VARCHAR(100) NOT NULL;
GO
ALTER TABLE dbo.margin_call ALTER COLUMN row_version INT NOT NULL;
GO
ALTER TABLE dbo.margin_call ADD CONSTRAINT df_margin_call_row_version DEFAULT 1 FOR row_version;
GO

CREATE TRIGGER dbo.trg_margin_call_row_version_guard ON dbo.margin_call AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.margin_call (bypass write rejected by trg_margin_call_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[call_id] = d.[call_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.margin_call (stale or reused version rejected by trg_margin_call_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_clearing_account_row_version_guard ON dbo.clearing_account AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.clearing_account (bypass write rejected by trg_clearing_account_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[clearing_account_id] = d.[clearing_account_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.clearing_account (stale or reused version rejected by trg_clearing_account_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_contract_margin_rate_row_version_guard ON dbo.contract_margin_rate AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.contract_margin_rate (bypass write rejected by trg_contract_margin_rate_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[contract_margin_rate_id] = d.[contract_margin_rate_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.contract_margin_rate (stale or reused version rejected by trg_contract_margin_rate_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_clearing_account_margin_rate_row_version_guard ON dbo.clearing_account_margin_rate AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.clearing_account_margin_rate (bypass write rejected by trg_clearing_account_margin_rate_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[clearing_account_margin_rate_id] = d.[clearing_account_margin_rate_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.clearing_account_margin_rate (stale or reused version rejected by trg_clearing_account_margin_rate_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_margin_offset_rule_row_version_guard ON dbo.margin_offset_rule AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.margin_offset_rule (bypass write rejected by trg_margin_offset_rule_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[margin_offset_rule_id] = d.[margin_offset_rule_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.margin_offset_rule (stale or reused version rejected by trg_margin_offset_rule_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_margin_valuation_row_version_guard ON dbo.margin_valuation AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.margin_valuation (bypass write rejected by trg_margin_valuation_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[margin_valuation_id] = d.[margin_valuation_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.margin_valuation (stale or reused version rejected by trg_margin_valuation_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

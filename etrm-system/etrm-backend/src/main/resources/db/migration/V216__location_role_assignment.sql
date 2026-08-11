-- V216: a physical location can hold more than one role at once (e.g. a
-- WAREHOUSE that also becomes an exchange-approved delivery point) —
-- dbo.location.location_type_id stays a single required FK (unchanged, zero
-- blast radius to existing consumers) representing the location's primary/
-- default role. This adds a purely additive table for EXTRA roles layered
-- on top of that primary one.
--
-- Design grounded in real-world exchange-warehouse structure (LME Delivery
-- Point -> Warehousing Company -> Warehouse; a single physical facility can
-- independently hold delivery-approval status for more than one exchange/
-- commodity, layered onto the base facility rather than replacing its
-- classification) -- see docs/masterdata_curve_derivative_asset_gaps_pending_06.md
-- gap #6 for the full research writeup and design discussion.
--
-- office_loc_ind/trading_desk_ind (V118) are a separate, orthogonal concept
-- (own-org office usage, not physical-place classification) and are left
-- untouched.

USE ETRM_DB;
GO

CREATE TABLE dbo.location_role_assignment (
    location_role_assignment_id INT             NOT NULL IDENTITY(1,1),
    location_id                 INT             NOT NULL,
    location_type_id            INT             NOT NULL,
    approval_reference          VARCHAR(100)    NULL,   -- exchange registration/approval number, if applicable
    effective_date              DATE            NULL,
    expiry_date                 DATE            NULL,
    notes                       VARCHAR(500)    NULL,
    row_version                 INT             NOT NULL DEFAULT 1,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  VARCHAR(100)    NOT NULL,
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                  VARCHAR(100)    NOT NULL,
    created_src_id              SMALLINT        NOT NULL,
    updated_src_id              SMALLINT        NOT NULL,

    CONSTRAINT pk_location_role_assignment PRIMARY KEY (location_role_assignment_id),
    CONSTRAINT fk_lra_location      FOREIGN KEY (location_id)      REFERENCES dbo.location(location_id),
    CONSTRAINT fk_lra_location_type FOREIGN KEY (location_type_id) REFERENCES dbo.location_type(location_type_id),
    CONSTRAINT uq_lra_location_type UNIQUE (location_id, location_type_id)
);
GO

CREATE TRIGGER dbo.trg_location_role_assignment_row_version_guard ON dbo.location_role_assignment AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.location_role_assignment (bypass write rejected by trg_location_role_assignment_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.[location_role_assignment_id] = d.[location_role_assignment_id] WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.location_role_assignment (stale or reused version rejected by trg_location_role_assignment_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

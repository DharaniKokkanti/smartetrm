-- =============================================================================
-- V66 — dbo.lng_terminal_detail: 1:1 LNG extension of dbo.storage_facility
-- =============================================================================
-- Part of a review of LNG/Power/Agri/Metals master data against real
-- industry structure (GIIGNL/industry LNG terminology: send-out capacity,
-- liquefaction nameplate capacity in MTPA, storage tank count, berth count,
-- and the min/max cargo lot size a terminal's berths and tanks can handle).
--
-- storage_facility (V1) already has facility_type = 'LNG_TANK' (renamed from
-- LNG_TERMINAL in V47) with a generic capacity/capacity_uom_id pair, but that
-- one generic number can't distinguish an import (regas) terminal's send-out
-- rate from an export (liquefaction) terminal's nameplate MTPA, and has no
-- concept of berth count, tank count, or acceptable cargo-lot size range —
-- all real, commonly-published attributes of an LNG terminal that a trading
-- desk needs to schedule/nominate cargoes against.
--
-- Modeled as a 1:1 extension table (PK = facility_id), the same pattern as
-- dbo.power_product_detail (1:1 extension of product) — only populated when
-- storage_facility.facility_type = 'LNG_TANK'.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.lng_terminal_detail', 'U') IS NOT NULL DROP TABLE dbo.lng_terminal_detail;
GO

CREATE TABLE dbo.lng_terminal_detail (
    facility_id                 INT             NOT NULL,
    terminal_type               VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ltd_terminal_type CHECK (terminal_type IN (
            'IMPORT_REGAS',        -- receives LNG, regasifies, sends out to pipeline grid
            'EXPORT_LIQUEFACTION', -- receives pipeline gas, liquefies, loads onto carriers
            'FSRU',                -- Floating Storage & Regasification Unit — import-side, ship-based
            'DUAL'                 -- bidirectional / can both import and export
        )),
    regas_capacity_mmscmd        DECIMAL(10,2)   NULL,   -- import terminals: send-out rate, million standard cubic metres/day
    liquefaction_capacity_mtpa   DECIMAL(8,2)    NULL,   -- export terminals: nameplate capacity, million tonnes per annum
    storage_capacity_cbm         DECIMAL(14,2)   NULL,   -- total LNG storage tank capacity at the terminal
    num_storage_tanks            SMALLINT        NULL,
    num_berths                    SMALLINT        NULL,
    min_cargo_size_cbm              DECIMAL(12,2)   NULL,  -- smallest LNG carrier cargo this terminal's berths/tanks can handle
    max_cargo_size_cbm                DECIMAL(12,2)   NULL,
    notes                                VARCHAR(500)    NULL,
    created_at                             DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                             VARCHAR(100)    NOT NULL,
    updated_at                             DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                             VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_lng_terminal_detail   PRIMARY KEY (facility_id),
    CONSTRAINT uq_ltd_facility             UNIQUE      (facility_id),
    CONSTRAINT fk_ltd_facility                FOREIGN KEY (facility_id) REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT chk_ltd_cargo_range               CHECK (min_cargo_size_cbm IS NULL OR max_cargo_size_cbm IS NULL OR max_cargo_size_cbm >= min_cargo_size_cbm)
);
GO

-- =============================================================================
-- Register in master data registry (Static Data page).
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'lng_terminal_detail')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('lng_terminal_detail', 'LNG Terminal Detail', 'Freight & Shipping', 1, 1, 1, 0, 6, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V66 — LNG_TERMINAL_DETAIL APPLIED';
PRINT '  lng_terminal_detail — NEW 1:1 extension of storage_facility (LNG_TANK rows).';
PRINT '============================================================';
GO

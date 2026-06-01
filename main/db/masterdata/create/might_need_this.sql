USE ETRM_DB;
GO

-- =============================================================================
-- 1. CLEANUP DUPLICATE DROP IN CONFIGURATION SECTION
-- =============================================================================
-- The original file evaluated dbo.product_price_index on Line 53 and Line 67.
-- Cleaned to ensure structural build engines do not compile warning anomalies.
PRINT 'Cleaning up configuration drops...';
GO

-- =============================================================================
-- 2. HARDEN STRING ATTRIBUTES FOR ENTERPRISE TIMEZONES
-- =============================================================================
PRINT 'Altering timezone columns to VARCHAR(100)...';
ALTER TABLE dbo.exchange ALTER COLUMN timezone VARCHAR(100) NOT NULL;
ALTER TABLE dbo.market ALTER COLUMN timezone VARCHAR(100) NOT NULL;
GO

-- =============================================================================
-- 3. EXPAND METRIC SCALE PRECISION FOR AUTOMATED POWER HOURLY BLOCKS
-- =============================================================================
PRINT 'Expanding numeric precision for market product scale...';
ALTER TABLE dbo.market_product ALTER COLUMN lot_size DECIMAL(18,6) NULL;
ALTER TABLE dbo.market_product ALTER COLUMN min_quantity DECIMAL(18,6) NULL;
ALTER TABLE dbo.market_product ALTER COLUMN max_quantity DECIMAL(18,6) NULL;
GO

PRINT 'ETRM_Master_Data_Schema_v2.0_Corrections.sql applied successfully.';


USE ETRM_DB;
GO

-- =============================================================================
-- 1. REMOVE NULL STRINGS FROM IN-ARRAY CONSTRAINTS & REBUILD CHECK RULE TIERS
-- =============================================================================
PRINT 'Dropping old ambiguous offset type check constraints...';
-- Drop existing constraints if they were applied via early iterations
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_mpp_ltd_type')
    ALTER TABLE dbo.market_product_period DROP CONSTRAINT chk_mpp_ltd_type;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_mpp_fnd_type')
    ALTER TABLE dbo.market_product_period DROP CONSTRAINT chk_mpp_fnd_type;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_mpp_set_type')
    ALTER TABLE dbo.market_product_period DROP CONSTRAINT chk_mpp_set_type;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_mpp_del_type')
    ALTER TABLE dbo.market_product_period DROP CONSTRAINT chk_mpp_del_type;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_mpp_exp_type')
    ALTER TABLE dbo.market_product_period DROP CONSTRAINT chk_mpp_exp_type;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_mpp_csh_type')
    ALTER TABLE dbo.market_product_period DROP CONSTRAINT chk_mpp_csh_type;
GO

PRINT 'Applying ANSI-compliant string array validation constraints...';
ALTER TABLE dbo.market_product_period ADD
    CONSTRAINT chk_mpp_ltd_type CHECK (ltd_offset_type IN ('CALENDAR', 'BUSINESS')),
    CONSTRAINT chk_mpp_fnd_type CHECK (fnd_offset_type IN ('CALENDAR', 'BUSINESS')),
    CONSTRAINT chk_mpp_set_type CHECK (settlement_offset_type IN ('CALENDAR', 'BUSINESS')),
    CONSTRAINT chk_mpp_del_type CHECK (delivery_offset_type IN ('CALENDAR', 'BUSINESS')),
    CONSTRAINT chk_mpp_exp_type CHECK (expiry_offset_type IN ('CALENDAR', 'BUSINESS')),
    CONSTRAINT chk_mpp_csh_type CHECK (cash_settlement_offset_type IN ('CALENDAR', 'BUSINESS'));
GO

-- =============================================================================
-- 2. APPLY MISSING RELATIONAL INTEGRITY CONTROLS (FOREIGN KEYS)
-- =============================================================================
PRINT 'Applying missing foreign keys to calendar configurations...';
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_mpp_offset_calendar')
BEGIN
    ALTER TABLE dbo.market_product_period 
    ADD CONSTRAINT fk_mpp_offset_calendar 
    FOREIGN KEY (offset_calendar_id) REFERENCES dbo.holiday_calendar(calendar_id);
END
GO

PRINT 'ETRM_MPP_Dates_Patch_v1.1_Hardened.sql applied successfully.';



USE ETRM_DB;
GO

-- =============================================================================
-- SYSTEM VERSIONING COMPLIANCE INGESTION SCRIPT
-- Sets up automated historical ledgers for trader exposure boundaries
-- =============================================================================

PRINT 'Checking prerequisites for trader_commodity_limit system versioning...';

-- If versioning is currently enabled, safely step it down to apply alterations cleanly
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'trader_commodity_limit' AND temporal_type = 2)
BEGIN
    PRINT 'Temporarily disabling active versioning for structural alignment...';
    ALTER TABLE dbo.trader_commodity_limit SET (SYSTEM_VERSIONING = OFF);
END
GO

-- Add the tracking date anchors required by SQL Server's system time mechanism
PRINT 'Injecting hidden temporal period tracking parameters...';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trader_commodity_limit') AND name = 'sys_start')
BEGIN
    ALTER TABLE dbo.trader_commodity_limit
    ADD 
        [sys_start] DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN NOT NULL DEFAULT SYSUTCDATETIME(),
        [sys_end] DATETIME2 GENERATED ALWAYS AS ROW END HIDDEN NOT NULL DEFAULT CAST('9999-12-31 23:59:59.9999999' AS datetime2),
        PERIOD FOR SYSTEM_TIME ([sys_start], [sys_end]);
END
GO

-- Turn on System Versioning and bind it permanently to the history table
PRINT 'Activating System-Versioned Temporal Engine...';
ALTER TABLE dbo.trader_commodity_limit
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trader_commodity_limit_history));
GO

PRINT 'ETRM_System_Versioning_Audit_Harden.sql applied successfully.';
-- =============================================================================
-- V121 — standardize dbo.*.sort_order on TINYINT everywhere
--
-- Follow-up to the 2026-07-18 data-type sizing audit (see handoff doc §0).
-- sort_order is always a small-list UI display-ordering field (a handful to
-- a few dozen rows per lookup table) and was found on three different
-- types schema-wide: plain INT (4 tables — an oversight, not deliberate),
-- SMALLINT (37 tables actually altered by this migration, of an original
-- 40 found by grep — 3 of the 40 turned out to belong to tables dropped by
-- a later migration, see below), and TINYINT (6 tables, unchanged by this
-- migration — already correct). 41 live columns altered in total (4 INT +
-- 37 SMALLINT).
--
-- TINYINT (SQL Server's unsigned 1-byte int, 0-255) was chosen over
-- SMALLINT for the single, uniform standard because it enforces "never
-- negative" at the schema level itself, not just via GUI validation, and
-- 255 is not a real constraint for any sort_order column in this schema —
-- all are small admin/reference-list ordering fields. Seed-data INSERT
-- literals across all 120 prior migrations were checked (grep) and none
-- approach 255.
--
-- Indexes covering sort_order are dropped and recreated around the ALTER
-- COLUMN — the same conservative drop-then-alter pattern already used in
-- this schema (V119's `DROP INDEX IF EXISTS ix_book_trader` before
-- altering dbo.book).
--
-- Every sort_order column has an inline `DEFAULT 0`, which SQL Server
-- backs with an auto-generated, unnamed DEFAULT constraint (e.g.
-- `DF__connectio__sort___3AB788A8`). SQL Server refuses ALTER COLUMN on a
-- column with ANY dependent default constraint, named or not — this was
-- only caught by actually running the migration against the live DB
-- (first attempt at this file omitted the drop/re-add and failed with
-- "The object 'DF__connectio__sort___3AB788A8' is dependent on column
-- 'sort_order'" on the very first table; Flyway's whole-migration
-- transaction rolled it back cleanly, no partial damage). Each table's
-- unnamed default is found dynamically via sys.default_constraints (the
-- generated name isn't predictable/portable across environments), dropped,
-- then re-added afterward with an explicit name (`df_<table>_sort_order`)
-- so this exact problem can never recur on this column again.
--
-- Second live-run finding, this one a real mistake in the original 44-table
-- list (now corrected, not worked around): `external_system_type` (V104),
-- `custom_config` (V16), and `commodity_instrument_map` (V113) were all
-- included because grepping for `sort_order` column declarations found
-- them — but all three tables were later DROPped by a subsequent migration
-- (V106, V17, and V115 respectively — V115's drop is already documented in
-- this handoff doc's own V113-session entry). No live column exists to
-- alter on any of the three, so this migration no longer touches them.
-- 41 tables remain (down from the original 44): 30 indexed + 11 → 30
-- indexed + 10 non-indexed after removing commodity_instrument_map from
-- the non-indexed list. All 30 `DROP INDEX` calls in Part A still use
-- `IF EXISTS` as cheap insurance against the same class of mistake.
--
-- Companion changes (not in this file): four dedicated JPA entities whose
-- sortOrder field is currently `Integer` (AppModule, AppFunction,
-- ScreenFieldRegistry, ObjectLockRule — the 4 tables that were plain INT)
-- need to become `Short`, matching the established convention already
-- used by StorageFacilityType/CommodityInstrumentMapEntry for their
-- SMALLINT/TINYINT sortOrder fields. The other 37 tables in this migration
-- have no dedicated entity — they're read/written entirely through the
-- generic Tier2 reference-data mechanism (`referencedata` package), which
-- reads column types dynamically and needs no Java change at all.
-- =============================================================================

-- Part A: tables whose sort_order column is covered by a nonclustered index.
-- Order per table: drop the (unnamed) DEFAULT constraint, drop the index,
-- narrow the column, recreate the index, re-add the DEFAULT constraint --
-- this time explicitly named so a future migration never hits this again.

DECLARE @df_connection_type NVARCHAR(200);
SELECT @df_connection_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.connection_type') AND c.name = 'sort_order';
IF @df_connection_type IS NOT NULL EXEC('ALTER TABLE dbo.connection_type DROP CONSTRAINT ' + @df_connection_type);
GO

DROP INDEX IF EXISTS ix_connection_type_active ON dbo.connection_type;
GO
ALTER TABLE dbo.connection_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_connection_type_active ON dbo.connection_type (is_active, sort_order);
GO
ALTER TABLE dbo.connection_type ADD CONSTRAINT df_connection_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_bunker_fuel_grade NVARCHAR(200);
SELECT @df_bunker_fuel_grade = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.bunker_fuel_grade') AND c.name = 'sort_order';
IF @df_bunker_fuel_grade IS NOT NULL EXEC('ALTER TABLE dbo.bunker_fuel_grade DROP CONSTRAINT ' + @df_bunker_fuel_grade);
GO

DROP INDEX IF EXISTS ix_bunker_fuel_grade_active ON dbo.bunker_fuel_grade;
GO
ALTER TABLE dbo.bunker_fuel_grade ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_bunker_fuel_grade_active ON dbo.bunker_fuel_grade (is_active, sort_order);
GO
ALTER TABLE dbo.bunker_fuel_grade ADD CONSTRAINT df_bunker_fuel_grade_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_deal_type NVARCHAR(200);
SELECT @df_deal_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.deal_type') AND c.name = 'sort_order';
IF @df_deal_type IS NOT NULL EXEC('ALTER TABLE dbo.deal_type DROP CONSTRAINT ' + @df_deal_type);
GO

DROP INDEX IF EXISTS ix_deal_type_active ON dbo.deal_type;
GO
ALTER TABLE dbo.deal_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_deal_type_active ON dbo.deal_type (is_active, sort_order);
GO
ALTER TABLE dbo.deal_type ADD CONSTRAINT df_deal_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_payment_method NVARCHAR(200);
SELECT @df_payment_method = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.payment_method') AND c.name = 'sort_order';
IF @df_payment_method IS NOT NULL EXEC('ALTER TABLE dbo.payment_method DROP CONSTRAINT ' + @df_payment_method);
GO

DROP INDEX IF EXISTS ix_payment_method_active ON dbo.payment_method;
GO
ALTER TABLE dbo.payment_method ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_payment_method_active ON dbo.payment_method (is_active, sort_order);
GO
ALTER TABLE dbo.payment_method ADD CONSTRAINT df_payment_method_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_counterparty_type NVARCHAR(200);
SELECT @df_counterparty_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.counterparty_type') AND c.name = 'sort_order';
IF @df_counterparty_type IS NOT NULL EXEC('ALTER TABLE dbo.counterparty_type DROP CONSTRAINT ' + @df_counterparty_type);
GO

DROP INDEX IF EXISTS ix_counterparty_type_active ON dbo.counterparty_type;
GO
ALTER TABLE dbo.counterparty_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_counterparty_type_active ON dbo.counterparty_type (is_active, sort_order);
GO
ALTER TABLE dbo.counterparty_type ADD CONSTRAINT df_counterparty_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_kyc_status NVARCHAR(200);
SELECT @df_kyc_status = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.kyc_status') AND c.name = 'sort_order';
IF @df_kyc_status IS NOT NULL EXEC('ALTER TABLE dbo.kyc_status DROP CONSTRAINT ' + @df_kyc_status);
GO

DROP INDEX IF EXISTS ix_kyc_status_active ON dbo.kyc_status;
GO
ALTER TABLE dbo.kyc_status ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_kyc_status_active ON dbo.kyc_status (is_active, sort_order);
GO
ALTER TABLE dbo.kyc_status ADD CONSTRAINT df_kyc_status_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_contact_role NVARCHAR(200);
SELECT @df_contact_role = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.contact_role') AND c.name = 'sort_order';
IF @df_contact_role IS NOT NULL EXEC('ALTER TABLE dbo.contact_role DROP CONSTRAINT ' + @df_contact_role);
GO

DROP INDEX IF EXISTS ix_contact_role_active ON dbo.contact_role;
GO
ALTER TABLE dbo.contact_role ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_contact_role_active ON dbo.contact_role (is_active, sort_order);
GO
ALTER TABLE dbo.contact_role ADD CONSTRAINT df_contact_role_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_address_type NVARCHAR(200);
SELECT @df_address_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.address_type') AND c.name = 'sort_order';
IF @df_address_type IS NOT NULL EXEC('ALTER TABLE dbo.address_type DROP CONSTRAINT ' + @df_address_type);
GO

DROP INDEX IF EXISTS ix_address_type_active ON dbo.address_type;
GO
ALTER TABLE dbo.address_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_address_type_active ON dbo.address_type (is_active, sort_order);
GO
ALTER TABLE dbo.address_type ADD CONSTRAINT df_address_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_bank_account_type NVARCHAR(200);
SELECT @df_bank_account_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.bank_account_type') AND c.name = 'sort_order';
IF @df_bank_account_type IS NOT NULL EXEC('ALTER TABLE dbo.bank_account_type DROP CONSTRAINT ' + @df_bank_account_type);
GO

DROP INDEX IF EXISTS ix_bank_account_type_active ON dbo.bank_account_type;
GO
ALTER TABLE dbo.bank_account_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_bank_account_type_active ON dbo.bank_account_type (is_active, sort_order);
GO
ALTER TABLE dbo.bank_account_type ADD CONSTRAINT df_bank_account_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_book_type NVARCHAR(200);
SELECT @df_book_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.book_type') AND c.name = 'sort_order';
IF @df_book_type IS NOT NULL EXEC('ALTER TABLE dbo.book_type DROP CONSTRAINT ' + @df_book_type);
GO

DROP INDEX IF EXISTS ix_book_type_active ON dbo.book_type;
GO
ALTER TABLE dbo.book_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_book_type_active ON dbo.book_type (is_active, sort_order);
GO
ALTER TABLE dbo.book_type ADD CONSTRAINT df_book_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_legal_entity_type NVARCHAR(200);
SELECT @df_legal_entity_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.legal_entity_type') AND c.name = 'sort_order';
IF @df_legal_entity_type IS NOT NULL EXEC('ALTER TABLE dbo.legal_entity_type DROP CONSTRAINT ' + @df_legal_entity_type);
GO

DROP INDEX IF EXISTS ix_legal_entity_type_active ON dbo.legal_entity_type;
GO
ALTER TABLE dbo.legal_entity_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_legal_entity_type_active ON dbo.legal_entity_type (is_active, sort_order);
GO
ALTER TABLE dbo.legal_entity_type ADD CONSTRAINT df_legal_entity_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_settlement_type NVARCHAR(200);
SELECT @df_settlement_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.settlement_type') AND c.name = 'sort_order';
IF @df_settlement_type IS NOT NULL EXEC('ALTER TABLE dbo.settlement_type DROP CONSTRAINT ' + @df_settlement_type);
GO

DROP INDEX IF EXISTS ix_settlement_type_active ON dbo.settlement_type;
GO
ALTER TABLE dbo.settlement_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_settlement_type_active ON dbo.settlement_type (is_active, sort_order);
GO
ALTER TABLE dbo.settlement_type ADD CONSTRAINT df_settlement_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_storage_facility_type NVARCHAR(200);
SELECT @df_storage_facility_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.storage_facility_type') AND c.name = 'sort_order';
IF @df_storage_facility_type IS NOT NULL EXEC('ALTER TABLE dbo.storage_facility_type DROP CONSTRAINT ' + @df_storage_facility_type);
GO

DROP INDEX IF EXISTS ix_storage_facility_type_active ON dbo.storage_facility_type;
GO
ALTER TABLE dbo.storage_facility_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_storage_facility_type_active ON dbo.storage_facility_type (is_active, sort_order);
GO
ALTER TABLE dbo.storage_facility_type ADD CONSTRAINT df_storage_facility_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_netting_agreement_type NVARCHAR(200);
SELECT @df_netting_agreement_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.netting_agreement_type') AND c.name = 'sort_order';
IF @df_netting_agreement_type IS NOT NULL EXEC('ALTER TABLE dbo.netting_agreement_type DROP CONSTRAINT ' + @df_netting_agreement_type);
GO

DROP INDEX IF EXISTS ix_netting_agreement_type_active ON dbo.netting_agreement_type;
GO
ALTER TABLE dbo.netting_agreement_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_netting_agreement_type_active ON dbo.netting_agreement_type (is_active, sort_order);
GO
ALTER TABLE dbo.netting_agreement_type ADD CONSTRAINT df_netting_agreement_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_tax_type NVARCHAR(200);
SELECT @df_tax_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.tax_type') AND c.name = 'sort_order';
IF @df_tax_type IS NOT NULL EXEC('ALTER TABLE dbo.tax_type DROP CONSTRAINT ' + @df_tax_type);
GO

DROP INDEX IF EXISTS ix_tax_type_active ON dbo.tax_type;
GO
ALTER TABLE dbo.tax_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_tax_type_active ON dbo.tax_type (is_active, sort_order);
GO
ALTER TABLE dbo.tax_type ADD CONSTRAINT df_tax_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_margin_agreement_type NVARCHAR(200);
SELECT @df_margin_agreement_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.margin_agreement_type') AND c.name = 'sort_order';
IF @df_margin_agreement_type IS NOT NULL EXEC('ALTER TABLE dbo.margin_agreement_type DROP CONSTRAINT ' + @df_margin_agreement_type);
GO

DROP INDEX IF EXISTS ix_margin_agreement_type_active ON dbo.margin_agreement_type;
GO
ALTER TABLE dbo.margin_agreement_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_margin_agreement_type_active ON dbo.margin_agreement_type (is_active, sort_order);
GO
ALTER TABLE dbo.margin_agreement_type ADD CONSTRAINT df_margin_agreement_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_valuation_frequency_type NVARCHAR(200);
SELECT @df_valuation_frequency_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.valuation_frequency_type') AND c.name = 'sort_order';
IF @df_valuation_frequency_type IS NOT NULL EXEC('ALTER TABLE dbo.valuation_frequency_type DROP CONSTRAINT ' + @df_valuation_frequency_type);
GO

DROP INDEX IF EXISTS ix_valuation_frequency_type_active ON dbo.valuation_frequency_type;
GO
ALTER TABLE dbo.valuation_frequency_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_valuation_frequency_type_active ON dbo.valuation_frequency_type (is_active, sort_order);
GO
ALTER TABLE dbo.valuation_frequency_type ADD CONSTRAINT df_valuation_frequency_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_governing_law_type NVARCHAR(200);
SELECT @df_governing_law_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.governing_law_type') AND c.name = 'sort_order';
IF @df_governing_law_type IS NOT NULL EXEC('ALTER TABLE dbo.governing_law_type DROP CONSTRAINT ' + @df_governing_law_type);
GO

DROP INDEX IF EXISTS ix_governing_law_type_active ON dbo.governing_law_type;
GO
ALTER TABLE dbo.governing_law_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_governing_law_type_active ON dbo.governing_law_type (is_active, sort_order);
GO
ALTER TABLE dbo.governing_law_type ADD CONSTRAINT df_governing_law_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_credit_limit_type NVARCHAR(200);
SELECT @df_credit_limit_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.credit_limit_type') AND c.name = 'sort_order';
IF @df_credit_limit_type IS NOT NULL EXEC('ALTER TABLE dbo.credit_limit_type DROP CONSTRAINT ' + @df_credit_limit_type);
GO

DROP INDEX IF EXISTS ix_credit_limit_type_active ON dbo.credit_limit_type;
GO
ALTER TABLE dbo.credit_limit_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_credit_limit_type_active ON dbo.credit_limit_type (is_active, sort_order);
GO
ALTER TABLE dbo.credit_limit_type ADD CONSTRAINT df_credit_limit_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_credit_limit_status_type NVARCHAR(200);
SELECT @df_credit_limit_status_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.credit_limit_status_type') AND c.name = 'sort_order';
IF @df_credit_limit_status_type IS NOT NULL EXEC('ALTER TABLE dbo.credit_limit_status_type DROP CONSTRAINT ' + @df_credit_limit_status_type);
GO

DROP INDEX IF EXISTS ix_credit_limit_status_type_active ON dbo.credit_limit_status_type;
GO
ALTER TABLE dbo.credit_limit_status_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_credit_limit_status_type_active ON dbo.credit_limit_status_type (is_active, sort_order);
GO
ALTER TABLE dbo.credit_limit_status_type ADD CONSTRAINT df_credit_limit_status_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_lc_type NVARCHAR(200);
SELECT @df_lc_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.lc_type') AND c.name = 'sort_order';
IF @df_lc_type IS NOT NULL EXEC('ALTER TABLE dbo.lc_type DROP CONSTRAINT ' + @df_lc_type);
GO

DROP INDEX IF EXISTS ix_lc_type_active ON dbo.lc_type;
GO
ALTER TABLE dbo.lc_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_lc_type_active ON dbo.lc_type (is_active, sort_order);
GO
ALTER TABLE dbo.lc_type ADD CONSTRAINT df_lc_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_lc_status_type NVARCHAR(200);
SELECT @df_lc_status_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.lc_status_type') AND c.name = 'sort_order';
IF @df_lc_status_type IS NOT NULL EXEC('ALTER TABLE dbo.lc_status_type DROP CONSTRAINT ' + @df_lc_status_type);
GO

DROP INDEX IF EXISTS ix_lc_status_type_active ON dbo.lc_status_type;
GO
ALTER TABLE dbo.lc_status_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_lc_status_type_active ON dbo.lc_status_type (is_active, sort_order);
GO
ALTER TABLE dbo.lc_status_type ADD CONSTRAINT df_lc_status_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_commodity_type NVARCHAR(200);
SELECT @df_commodity_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.commodity_type') AND c.name = 'sort_order';
IF @df_commodity_type IS NOT NULL EXEC('ALTER TABLE dbo.commodity_type DROP CONSTRAINT ' + @df_commodity_type);
GO

DROP INDEX IF EXISTS ix_commodity_type_active ON dbo.commodity_type;
GO
ALTER TABLE dbo.commodity_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_commodity_type_active ON dbo.commodity_type (is_active, sort_order);
GO
ALTER TABLE dbo.commodity_type ADD CONSTRAINT df_commodity_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_lookup_category NVARCHAR(200);
SELECT @df_lookup_category = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.lookup_category') AND c.name = 'sort_order';
IF @df_lookup_category IS NOT NULL EXEC('ALTER TABLE dbo.lookup_category DROP CONSTRAINT ' + @df_lookup_category);
GO

DROP INDEX IF EXISTS ix_lookup_category_active ON dbo.lookup_category;
GO
ALTER TABLE dbo.lookup_category ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_lookup_category_active ON dbo.lookup_category (is_active, sort_order);
GO
ALTER TABLE dbo.lookup_category ADD CONSTRAINT df_lookup_category_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_lookup_value NVARCHAR(200);
SELECT @df_lookup_value = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.lookup_value') AND c.name = 'sort_order';
IF @df_lookup_value IS NOT NULL EXEC('ALTER TABLE dbo.lookup_value DROP CONSTRAINT ' + @df_lookup_value);
GO

DROP INDEX IF EXISTS ix_lookup_value_category ON dbo.lookup_value;
GO
ALTER TABLE dbo.lookup_value ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_lookup_value_category ON dbo.lookup_value (category_id, is_active, sort_order);
GO
ALTER TABLE dbo.lookup_value ADD CONSTRAINT df_lookup_value_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_emission_scheme_type NVARCHAR(200);
SELECT @df_emission_scheme_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.emission_scheme_type') AND c.name = 'sort_order';
IF @df_emission_scheme_type IS NOT NULL EXEC('ALTER TABLE dbo.emission_scheme_type DROP CONSTRAINT ' + @df_emission_scheme_type);
GO

DROP INDEX IF EXISTS ix_emission_scheme_type_active ON dbo.emission_scheme_type;
GO
ALTER TABLE dbo.emission_scheme_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_emission_scheme_type_active ON dbo.emission_scheme_type (is_active, sort_order);
GO
ALTER TABLE dbo.emission_scheme_type ADD CONSTRAINT df_emission_scheme_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_carbon_registry_type NVARCHAR(200);
SELECT @df_carbon_registry_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.carbon_registry_type') AND c.name = 'sort_order';
IF @df_carbon_registry_type IS NOT NULL EXEC('ALTER TABLE dbo.carbon_registry_type DROP CONSTRAINT ' + @df_carbon_registry_type);
GO

DROP INDEX IF EXISTS ix_carbon_registry_type_active ON dbo.carbon_registry_type;
GO
ALTER TABLE dbo.carbon_registry_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_carbon_registry_type_active ON dbo.carbon_registry_type (is_active, sort_order);
GO
ALTER TABLE dbo.carbon_registry_type ADD CONSTRAINT df_carbon_registry_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_environmental_product_type NVARCHAR(200);
SELECT @df_environmental_product_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.environmental_product_type') AND c.name = 'sort_order';
IF @df_environmental_product_type IS NOT NULL EXEC('ALTER TABLE dbo.environmental_product_type DROP CONSTRAINT ' + @df_environmental_product_type);
GO

DROP INDEX IF EXISTS ix_environmental_product_type_active ON dbo.environmental_product_type;
GO
ALTER TABLE dbo.environmental_product_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_environmental_product_type_active ON dbo.environmental_product_type (is_active, sort_order);
GO
ALTER TABLE dbo.environmental_product_type ADD CONSTRAINT df_environmental_product_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_emission_obligation_status NVARCHAR(200);
SELECT @df_emission_obligation_status = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.emission_obligation_status') AND c.name = 'sort_order';
IF @df_emission_obligation_status IS NOT NULL EXEC('ALTER TABLE dbo.emission_obligation_status DROP CONSTRAINT ' + @df_emission_obligation_status);
GO

DROP INDEX IF EXISTS ix_emission_obligation_status_active ON dbo.emission_obligation_status;
GO
ALTER TABLE dbo.emission_obligation_status ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_emission_obligation_status_active ON dbo.emission_obligation_status (is_active, sort_order);
GO
ALTER TABLE dbo.emission_obligation_status ADD CONSTRAINT df_emission_obligation_status_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_uom_type NVARCHAR(200);
SELECT @df_uom_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.uom_type') AND c.name = 'sort_order';
IF @df_uom_type IS NOT NULL EXEC('ALTER TABLE dbo.uom_type DROP CONSTRAINT ' + @df_uom_type);
GO

DROP INDEX IF EXISTS ix_uom_type_active ON dbo.uom_type;
GO
ALTER TABLE dbo.uom_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_uom_type_active ON dbo.uom_type (is_active, sort_order);
GO
ALTER TABLE dbo.uom_type ADD CONSTRAINT df_uom_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_metal_shape NVARCHAR(200);
SELECT @df_metal_shape = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.metal_shape') AND c.name = 'sort_order';
IF @df_metal_shape IS NOT NULL EXEC('ALTER TABLE dbo.metal_shape DROP CONSTRAINT ' + @df_metal_shape);
GO

DROP INDEX IF EXISTS ix_metal_shape_active ON dbo.metal_shape;
GO
ALTER TABLE dbo.metal_shape ALTER COLUMN sort_order TINYINT NOT NULL;
GO
CREATE INDEX ix_metal_shape_active ON dbo.metal_shape (is_active, sort_order);
GO
ALTER TABLE dbo.metal_shape ADD CONSTRAINT df_metal_shape_sort_order DEFAULT 0 FOR sort_order;
GO

-- Part B: tables with no index on sort_order.

DECLARE @df_app_module NVARCHAR(200);
SELECT @df_app_module = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.app_module') AND c.name = 'sort_order';
IF @df_app_module IS NOT NULL EXEC('ALTER TABLE dbo.app_module DROP CONSTRAINT ' + @df_app_module);
GO

ALTER TABLE dbo.app_module ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.app_module ADD CONSTRAINT df_app_module_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_app_function NVARCHAR(200);
SELECT @df_app_function = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.app_function') AND c.name = 'sort_order';
IF @df_app_function IS NOT NULL EXEC('ALTER TABLE dbo.app_function DROP CONSTRAINT ' + @df_app_function);
GO

ALTER TABLE dbo.app_function ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.app_function ADD CONSTRAINT df_app_function_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_base_date_event_type NVARCHAR(200);
SELECT @df_base_date_event_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.base_date_event_type') AND c.name = 'sort_order';
IF @df_base_date_event_type IS NOT NULL EXEC('ALTER TABLE dbo.base_date_event_type DROP CONSTRAINT ' + @df_base_date_event_type);
GO

ALTER TABLE dbo.base_date_event_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.base_date_event_type ADD CONSTRAINT df_base_date_event_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_business_day_convention_type NVARCHAR(200);
SELECT @df_business_day_convention_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.business_day_convention_type') AND c.name = 'sort_order';
IF @df_business_day_convention_type IS NOT NULL EXEC('ALTER TABLE dbo.business_day_convention_type DROP CONSTRAINT ' + @df_business_day_convention_type);
GO

ALTER TABLE dbo.business_day_convention_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.business_day_convention_type ADD CONSTRAINT df_business_day_convention_type_sort_order DEFAULT 0 FOR sort_order;
GO

-- screen_field_registry and object_lock_rule used a deliberate "hundreds"
-- gap-numbering scheme (e.g. 900/910/920/930 for TRADE_BLOTTER's agriDetail
-- fields, 800s for metalsDetail, etc. — room to insert a field into a group
-- later without renumbering everything). Real live data: 38 of 60
-- screen_field_registry rows and several object_lock_rule rows exceed 255,
-- caught only by actually running this migration against the live DB, not
-- by the original grep-based "no seed value approaches 255" check (seed
-- INSERTs use small numbers; this data was populated by the application
-- afterward with the gap scheme, not by a migration INSERT literal).
-- Explicit user decision (asked, not assumed): renumber to fit TINYINT
-- rather than carve out an exception — the gap-space design intent is
-- deliberately given up here. Sequential per-screen renumbering (0, 1, 2,
-- ...), preserving existing relative order via the pre-renumber sort_order,
-- comfortably fits (max 60 rows in any one screen_code today, versus
-- TINYINT's 255 ceiling) and needs no per-table exception in Part B below.
WITH ranked AS (
    SELECT field_id, ROW_NUMBER() OVER (PARTITION BY screen_code ORDER BY sort_order, field_id) - 1 AS new_sort_order
    FROM dbo.screen_field_registry
)
UPDATE sfr SET sfr.sort_order = ranked.new_sort_order
FROM dbo.screen_field_registry sfr JOIN ranked ON ranked.field_id = sfr.field_id;
GO
WITH ranked AS (
    SELECT lock_rule_id, ROW_NUMBER() OVER (PARTITION BY screen_code ORDER BY sort_order, lock_rule_id) - 1 AS new_sort_order
    FROM dbo.object_lock_rule
)
UPDATE olr SET olr.sort_order = ranked.new_sort_order
FROM dbo.object_lock_rule olr JOIN ranked ON ranked.lock_rule_id = olr.lock_rule_id;
GO

DECLARE @df_screen_field_registry NVARCHAR(200);
SELECT @df_screen_field_registry = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.screen_field_registry') AND c.name = 'sort_order';
IF @df_screen_field_registry IS NOT NULL EXEC('ALTER TABLE dbo.screen_field_registry DROP CONSTRAINT ' + @df_screen_field_registry);
GO

ALTER TABLE dbo.screen_field_registry ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.screen_field_registry ADD CONSTRAINT df_screen_field_registry_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_object_lock_rule NVARCHAR(200);
SELECT @df_object_lock_rule = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.object_lock_rule') AND c.name = 'sort_order';
IF @df_object_lock_rule IS NOT NULL EXEC('ALTER TABLE dbo.object_lock_rule DROP CONSTRAINT ' + @df_object_lock_rule);
GO

ALTER TABLE dbo.object_lock_rule ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.object_lock_rule ADD CONSTRAINT df_object_lock_rule_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_vessel_type NVARCHAR(200);
SELECT @df_vessel_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.vessel_type') AND c.name = 'sort_order';
IF @df_vessel_type IS NOT NULL EXEC('ALTER TABLE dbo.vessel_type DROP CONSTRAINT ' + @df_vessel_type);
GO

ALTER TABLE dbo.vessel_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.vessel_type ADD CONSTRAINT df_vessel_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_movement_type NVARCHAR(200);
SELECT @df_movement_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.movement_type') AND c.name = 'sort_order';
IF @df_movement_type IS NOT NULL EXEC('ALTER TABLE dbo.movement_type DROP CONSTRAINT ' + @df_movement_type);
GO

ALTER TABLE dbo.movement_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.movement_type ADD CONSTRAINT df_movement_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_inventory_ownership_type NVARCHAR(200);
SELECT @df_inventory_ownership_type = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.inventory_ownership_type') AND c.name = 'sort_order';
IF @df_inventory_ownership_type IS NOT NULL EXEC('ALTER TABLE dbo.inventory_ownership_type DROP CONSTRAINT ' + @df_inventory_ownership_type);
GO

ALTER TABLE dbo.inventory_ownership_type ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.inventory_ownership_type ADD CONSTRAINT df_inventory_ownership_type_sort_order DEFAULT 0 FOR sort_order;
GO

DECLARE @df_blend_recipe_component NVARCHAR(200);
SELECT @df_blend_recipe_component = dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.blend_recipe_component') AND c.name = 'sort_order';
IF @df_blend_recipe_component IS NOT NULL EXEC('ALTER TABLE dbo.blend_recipe_component DROP CONSTRAINT ' + @df_blend_recipe_component);
GO

ALTER TABLE dbo.blend_recipe_component ALTER COLUMN sort_order TINYINT NOT NULL;
GO
ALTER TABLE dbo.blend_recipe_component ADD CONSTRAINT df_blend_recipe_component_sort_order DEFAULT 0 FOR sort_order;
GO


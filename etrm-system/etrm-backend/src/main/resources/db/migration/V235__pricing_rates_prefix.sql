-- V235: Pricing & Rates module_group. Classification refined beyond the
-- raw allow_create/edit=0 flag after Dharani asked to re-check which
-- tables are "required for adding data and utilized by other screens for
-- transactions" -- 5 tables (pricing_rule, ticker_mapping, formula_template,
-- option_index_link, volatility_point) have real dedicated Tier1 pages with
-- working POST/PUT endpoints despite a stale allow=0 registry flag, so
-- they're ref_, not mst_. 4 more Tier2-only tables (formula_component,
-- fx_period, interest_rate, interest_rate_index, missing_fixing_rule,
-- pricing_trigger_event_type, pricing_trigger_product, rate_fixing) are
-- genuinely locked today but feed pricing_rule/formula_template/
-- tran_trade_pricing_schedule directly -- need to be business-editable to
-- support real trade capture, so ref_ too.
--
-- pricing_rule is system-versioned temporal (found while scoping this
-- migration -- was initially miscategorized as an excludable "history/log"
-- table before checking sys.tables directly); pricing_rule_history is its
-- real HISTORY_TABLE, not a standalone log, and renames alongside it via
-- the standard OFF/rename/ON dance, same pattern as trade/trade_history.
--
-- pricing_dispute/pricing_event are data_category=TRANSACTIONAL -> tran_.
-- pricing_type/pricing_window_rule are genuinely Tier2-locked with no
-- dedicated page and no evidence of needing business editing -> mst_.
-- formula_evaluation_log/pricing_event_staging are computed log/staging
-- output, not consumed as a lookup by any transaction screen -> left
-- unprefixed, not excluded from classification forever, just not decided
-- here.

USE ETRM_DB;
GO

-- Temporal pair
ALTER TABLE dbo.pricing_rule SET (SYSTEM_VERSIONING = OFF);
GO
EXEC sp_rename 'dbo.pricing_rule', 'ref_pricing_rule';
GO
EXEC sp_rename 'dbo.pricing_rule_history', 'ref_pricing_rule_history';
GO
ALTER TABLE dbo.ref_pricing_rule SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.ref_pricing_rule_history));
GO

EXEC sp_rename 'dbo.fx_rate', 'ref_fx_rate';
GO
EXEC sp_rename 'dbo.ticker_mapping', 'ref_ticker_mapping';
GO
EXEC sp_rename 'dbo.formula_template', 'ref_formula_template';
GO
EXEC sp_rename 'dbo.option_index_link', 'ref_option_index_link';
GO
EXEC sp_rename 'dbo.volatility_point', 'ref_volatility_point';
GO
EXEC sp_rename 'dbo.formula_component', 'ref_formula_component';
GO
EXEC sp_rename 'dbo.fx_period', 'ref_fx_period';
GO
EXEC sp_rename 'dbo.interest_rate', 'ref_interest_rate';
GO
EXEC sp_rename 'dbo.interest_rate_index', 'ref_interest_rate_index';
GO
EXEC sp_rename 'dbo.missing_fixing_rule', 'ref_missing_fixing_rule';
GO
EXEC sp_rename 'dbo.pricing_trigger_event_type', 'ref_pricing_trigger_event_type';
GO
EXEC sp_rename 'dbo.pricing_trigger_product', 'ref_pricing_trigger_product';
GO
EXEC sp_rename 'dbo.rate_fixing', 'ref_rate_fixing';
GO
EXEC sp_rename 'dbo.pricing_type', 'mst_pricing_type';
GO
EXEC sp_rename 'dbo.pricing_window_rule', 'mst_pricing_window_rule';
GO
EXEC sp_rename 'dbo.pricing_dispute', 'tran_pricing_dispute';
GO
EXEC sp_rename 'dbo.pricing_event', 'tran_pricing_event';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_pricing_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pricing_rule_history', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_rule_history';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_fx_rate', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'fx_rate';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_ticker_mapping', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ticker_mapping';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_formula_template', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'formula_template';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_option_index_link', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'option_index_link';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_volatility_point', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'volatility_point';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_formula_component', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'formula_component';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_fx_period', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'fx_period';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_interest_rate', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'interest_rate';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_interest_rate_index', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'interest_rate_index';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_missing_fixing_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'missing_fixing_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pricing_trigger_event_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_trigger_event_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pricing_trigger_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_trigger_product';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_rate_fixing', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'rate_fixing';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_pricing_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_pricing_window_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_window_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_pricing_dispute', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_dispute';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_pricing_event', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pricing_event';
GO

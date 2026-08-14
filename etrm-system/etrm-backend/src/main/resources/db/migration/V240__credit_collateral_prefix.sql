-- V240: Credit & Collateral module_group (30 tables), same refined
-- classification method as every batch since V235. None temporal; zero
-- native/raw SQL risk confirmed via the standard sweep.
--
-- ref_ (15): bank_guarantee/clearing_account/clearing_account_margin_rate/
-- collateral/contract_margin_rate/credit_limit/insurance_policy/
-- letter_of_credit/margin_account/margin_agreement/margin_offset_rule/
-- parent_company_guarantee all have allow=0 but real dedicated pages with
-- working POST/PUT. insurance_provider/license_type already allow=1.
-- credit_limit_line_item has no own controller but a real nested write
-- path (CreditLimitService.saveLineItems, same pattern as
-- trader_commodity_limit in V239).
--
-- tran_ (5): margin_call/margin_valuation (data_category=TRANSACTIONAL,
-- real dedicated controllers). credit_limit_alert/bg_amendment/
-- lc_amendment (data_category=TRANSACTIONAL, no dedicated controller --
-- likely system/workflow-generated events rather than direct user entry,
-- still real business events by category).
--
-- mst_ (10): collateral_type/credit_limit_status_type/credit_limit_type/
-- governing_law_type/lc_status_type/lc_type/margin_agreement_type/
-- valuation_frequency_type/tax_type (Tier2-locked, no dedicated page, no
-- direct tran_ consumer, fixed vocab feeding ref_ parents), plus
-- insurance_policy_coverage (registry's own description: "schema-only, no
-- backend CRUD yet... exists only so governance sweeps can query by
-- data_category" -- confirmed unbuilt, zero code references anywhere;
-- Dharani confirmed mst_ directly).

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.bank_guarantee', 'ref_bank_guarantee';
GO
EXEC sp_rename 'dbo.clearing_account', 'ref_clearing_account';
GO
EXEC sp_rename 'dbo.clearing_account_margin_rate', 'ref_clearing_account_margin_rate';
GO
EXEC sp_rename 'dbo.collateral', 'ref_collateral';
GO
EXEC sp_rename 'dbo.contract_margin_rate', 'ref_contract_margin_rate';
GO
EXEC sp_rename 'dbo.credit_limit', 'ref_credit_limit';
GO
EXEC sp_rename 'dbo.insurance_policy', 'ref_insurance_policy';
GO
EXEC sp_rename 'dbo.letter_of_credit', 'ref_letter_of_credit';
GO
EXEC sp_rename 'dbo.margin_account', 'ref_margin_account';
GO
EXEC sp_rename 'dbo.margin_agreement', 'ref_margin_agreement';
GO
EXEC sp_rename 'dbo.margin_offset_rule', 'ref_margin_offset_rule';
GO
EXEC sp_rename 'dbo.parent_company_guarantee', 'ref_parent_company_guarantee';
GO
EXEC sp_rename 'dbo.insurance_provider', 'ref_insurance_provider';
GO
EXEC sp_rename 'dbo.license_type', 'ref_license_type';
GO
EXEC sp_rename 'dbo.credit_limit_line_item', 'ref_credit_limit_line_item';
GO
EXEC sp_rename 'dbo.margin_call', 'tran_margin_call';
GO
EXEC sp_rename 'dbo.margin_valuation', 'tran_margin_valuation';
GO
EXEC sp_rename 'dbo.credit_limit_alert', 'tran_credit_limit_alert';
GO
EXEC sp_rename 'dbo.bg_amendment', 'tran_bg_amendment';
GO
EXEC sp_rename 'dbo.lc_amendment', 'tran_lc_amendment';
GO
EXEC sp_rename 'dbo.collateral_type', 'mst_collateral_type';
GO
EXEC sp_rename 'dbo.credit_limit_status_type', 'mst_credit_limit_status_type';
GO
EXEC sp_rename 'dbo.credit_limit_type', 'mst_credit_limit_type';
GO
EXEC sp_rename 'dbo.governing_law_type', 'mst_governing_law_type';
GO
EXEC sp_rename 'dbo.lc_status_type', 'mst_lc_status_type';
GO
EXEC sp_rename 'dbo.lc_type', 'mst_lc_type';
GO
EXEC sp_rename 'dbo.margin_agreement_type', 'mst_margin_agreement_type';
GO
EXEC sp_rename 'dbo.valuation_frequency_type', 'mst_valuation_frequency_type';
GO
EXEC sp_rename 'dbo.tax_type', 'mst_tax_type';
GO
EXEC sp_rename 'dbo.insurance_policy_coverage', 'mst_insurance_policy_coverage';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_bank_guarantee', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bank_guarantee';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_clearing_account', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'clearing_account';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_clearing_account_margin_rate', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'clearing_account_margin_rate';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_collateral', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'collateral';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_contract_margin_rate', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'contract_margin_rate';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_credit_limit', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'credit_limit';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_insurance_policy', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'insurance_policy';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_letter_of_credit', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'letter_of_credit';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_margin_account', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'margin_account';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_margin_agreement', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'margin_agreement';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_margin_offset_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'margin_offset_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_parent_company_guarantee', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'parent_company_guarantee';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_insurance_provider', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'insurance_provider';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_license_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'license_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_credit_limit_line_item', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'credit_limit_line_item';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_margin_call', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'margin_call';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_margin_valuation', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'margin_valuation';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_credit_limit_alert', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'credit_limit_alert';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_bg_amendment', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bg_amendment';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_lc_amendment', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'lc_amendment';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_collateral_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'collateral_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_credit_limit_status_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'credit_limit_status_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_credit_limit_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'credit_limit_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_governing_law_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'governing_law_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_lc_status_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'lc_status_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_lc_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'lc_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_margin_agreement_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'margin_agreement_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_valuation_frequency_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'valuation_frequency_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_tax_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tax_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_insurance_policy_coverage', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'insurance_policy_coverage';
GO

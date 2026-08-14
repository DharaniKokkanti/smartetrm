-- V224: batch 2 of the mst_/ref_/tran_ naming convention -- the 24 clean
-- (is_enabled=1, allow_create=1, no classification ambiguity) tables across
-- Counterparties & Agreements and Products & Markets, per Dharani's direct
-- instruction to move both groups to ref_ (2026-08-14).
--
-- The remaining ~26 tables in these two groups (product, market,
-- counterparty, legal_entity and their satellite/dedicated-page tables) are
-- deliberately NOT in this migration -- they carry real Java JPA entities
-- with live REST controllers and (for product/counterparty/legal_entity) a
-- hardcoded frontend FK-dropdown escape hatch, so they need their own more
-- careful pass, not a blind batch rename.
--
-- 6 of these 24 also have real dedicated JPA entities (credit_term,
-- commodity, commodity_type, lookup_category, lookup_value,
-- reporting_group) -- their @Table(name=...) annotations are updated in the
-- same commit as this migration. None of the 24 are system-versioned
-- temporal tables (confirmed via sys.tables before writing this).

USE ETRM_DB;
GO

-- Counterparties & Agreements (8)
EXEC sp_rename 'dbo.address_type', 'ref_address_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.bank_account_type', 'ref_bank_account_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.counterparty_type', 'ref_counterparty_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.credit_rating', 'ref_credit_rating', 'OBJECT';
GO
EXEC sp_rename 'dbo.credit_term', 'ref_credit_term', 'OBJECT';
GO
EXEC sp_rename 'dbo.intercompany_transfer_rule', 'ref_intercompany_transfer_rule', 'OBJECT';
GO
EXEC sp_rename 'dbo.kyc_status', 'ref_kyc_status', 'OBJECT';
GO
EXEC sp_rename 'dbo.netting_agreement_type', 'ref_netting_agreement_type', 'OBJECT';
GO

-- Products & Markets (16)
EXEC sp_rename 'dbo.agri_crop_year_lifecycle', 'ref_agri_crop_year_lifecycle', 'OBJECT';
GO
EXEC sp_rename 'dbo.agri_moisture_discount_scale', 'ref_agri_moisture_discount_scale', 'OBJECT';
GO
EXEC sp_rename 'dbo.commodity', 'ref_commodity', 'OBJECT';
GO
EXEC sp_rename 'dbo.commodity_family', 'ref_commodity_family', 'OBJECT';
GO
EXEC sp_rename 'dbo.commodity_grade_standard', 'ref_commodity_grade_standard', 'OBJECT';
GO
EXEC sp_rename 'dbo.commodity_type', 'ref_commodity_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.deal_type', 'ref_deal_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.derivative_contract_specification', 'ref_derivative_contract_specification', 'OBJECT';
GO
EXEC sp_rename 'dbo.lookup_category', 'ref_lookup_category', 'OBJECT';
GO
EXEC sp_rename 'dbo.lookup_value', 'ref_lookup_value', 'OBJECT';
GO
EXEC sp_rename 'dbo.metal_assay_component_rule', 'ref_metal_assay_component_rule', 'OBJECT';
GO
EXEC sp_rename 'dbo.metal_brand', 'ref_metal_brand', 'OBJECT';
GO
EXEC sp_rename 'dbo.metal_shape', 'ref_metal_shape', 'OBJECT';
GO
EXEC sp_rename 'dbo.metal_warrant', 'ref_metal_warrant', 'OBJECT';
GO
EXEC sp_rename 'dbo.reporting_group', 'ref_reporting_group', 'OBJECT';
GO
EXEC sp_rename 'dbo.settlement_type', 'ref_settlement_type', 'OBJECT';
GO

UPDATE dbo.master_data_table_registry
SET table_name = 'ref_' + table_name,
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name IN (
    'address_type', 'bank_account_type', 'counterparty_type', 'credit_rating',
    'credit_term', 'intercompany_transfer_rule', 'kyc_status', 'netting_agreement_type',
    'agri_crop_year_lifecycle', 'agri_moisture_discount_scale', 'commodity',
    'commodity_family', 'commodity_grade_standard', 'commodity_type', 'deal_type',
    'derivative_contract_specification', 'lookup_category', 'lookup_value',
    'metal_assay_component_rule', 'metal_brand', 'metal_shape', 'metal_warrant',
    'reporting_group', 'settlement_type'
);
GO

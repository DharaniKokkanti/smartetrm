-- V225: final tranche of the Counterparties & Agreements / Products &
-- Markets ref_ rename (Dharani, 2026-08-14) -- the 4 core, most heavily
-- FK-referenced entities on the whole platform (product: 38 incoming FKs,
-- counterparty/legal_entity: 34 each, market: 8) plus their 24 satellite/
-- dedicated-page tables and (for counterparty/legal_entity) their
-- system-versioned temporal history tables.
--
-- Real blast radius, quantified before writing this migration (not
-- assumed): zero native/raw SQL anywhere in the backend references any of
-- these 30 table names (grepped every nativeQuery=true usage in the whole
-- codebase -- exactly 1 file uses nativeQuery at all, unrelated to this
-- batch), so FK-driven metadata resolution (sys.foreign_keys-backed,
-- ReferenceDataMetadataService) needs zero code changes and will resolve
-- the new names automatically. 21 of the 30 do have real dedicated JPA
-- entities though -- their @Table(name=...) annotations are updated in the
-- same commit as this migration. The frontend's DEDICATED_ENTITY_FK_TABLES
-- escape hatch (ReferenceDataTable.tsx) hardcodes 'counterparty'/
-- 'legal_entity'/'product' as literal keys -- also updated in the same
-- commit, this is the one place a rename here would have silently broken
-- the real (non-mock) FK-dropdown mechanism if left alone.
--
-- pipeline_product_approval is tagged data_category=TRANSACTIONAL (an
-- approval workflow action, not really reference data) but is bundled here
-- for consistency with Dharani's instruction to move the whole Products &
-- Markets group to ref_ -- flagged in this comment rather than silently
-- deviating; revisit if/when a tran_ pass reaches it instead.

USE ETRM_DB;
GO

-- Suspend system versioning on the two temporal pairs before renaming
ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = OFF);
GO

EXEC sp_rename 'dbo.product', 'ref_product', 'OBJECT';
GO
EXEC sp_rename 'dbo.market', 'ref_market', 'OBJECT';
GO
EXEC sp_rename 'dbo.counterparty', 'ref_counterparty', 'OBJECT';
GO
EXEC sp_rename 'dbo.counterparty_history', 'ref_counterparty_history', 'OBJECT';
GO
EXEC sp_rename 'dbo.legal_entity', 'ref_legal_entity', 'OBJECT';
GO
EXEC sp_rename 'dbo.legal_entity_history', 'ref_legal_entity_history', 'OBJECT';
GO
EXEC sp_rename 'dbo.address', 'ref_address', 'OBJECT';
GO
EXEC sp_rename 'dbo.contact', 'ref_contact', 'OBJECT';
GO
EXEC sp_rename 'dbo.cp_commercial_terms', 'ref_cp_commercial_terms', 'OBJECT';
GO
EXEC sp_rename 'dbo.cp_gtc_agreement', 'ref_cp_gtc_agreement', 'OBJECT';
GO
EXEC sp_rename 'dbo.cp_legal_entity_link', 'ref_cp_legal_entity_link', 'OBJECT';
GO
EXEC sp_rename 'dbo.cp_location', 'ref_cp_location', 'OBJECT';
GO
EXEC sp_rename 'dbo.entity_address', 'ref_entity_address', 'OBJECT';
GO
EXEC sp_rename 'dbo.entity_contact', 'ref_entity_contact', 'OBJECT';
GO
EXEC sp_rename 'dbo.gtc', 'ref_gtc', 'OBJECT';
GO
EXEC sp_rename 'dbo.gtc_version', 'ref_gtc_version', 'OBJECT';
GO
EXEC sp_rename 'dbo.netting_agreement', 'ref_netting_agreement', 'OBJECT';
GO
EXEC sp_rename 'dbo.regulatory_obligation', 'ref_regulatory_obligation', 'OBJECT';
GO
EXEC sp_rename 'dbo.reporting_counterparty', 'ref_reporting_counterparty', 'OBJECT';
GO
EXEC sp_rename 'dbo.balmo_product', 'ref_balmo_product', 'OBJECT';
GO
EXEC sp_rename 'dbo.market_product_source', 'ref_market_product_source', 'OBJECT';
GO
EXEC sp_rename 'dbo.mot_asset_product_approval', 'ref_mot_asset_product_approval', 'OBJECT';
GO
EXEC sp_rename 'dbo.pipeline_product_approval', 'ref_pipeline_product_approval', 'OBJECT';
GO
EXEC sp_rename 'dbo.product_blend_component', 'ref_product_blend_component', 'OBJECT';
GO
EXEC sp_rename 'dbo.product_reporting_group', 'ref_product_reporting_group', 'OBJECT';
GO
EXEC sp_rename 'dbo.product_spec_template', 'ref_product_spec_template', 'OBJECT';
GO
EXEC sp_rename 'dbo.product_spec_value', 'ref_product_spec_value', 'OBJECT';
GO
EXEC sp_rename 'dbo.spec_override', 'ref_spec_override', 'OBJECT';
GO
EXEC sp_rename 'dbo.spec_parameter', 'ref_spec_parameter', 'OBJECT';
GO
EXEC sp_rename 'dbo.spec_parameter_uom', 'ref_spec_parameter_uom', 'OBJECT';
GO

-- Re-link system versioning under the new names
ALTER TABLE dbo.ref_counterparty SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.ref_counterparty_history));
GO
ALTER TABLE dbo.ref_legal_entity SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.ref_legal_entity_history));
GO

UPDATE dbo.master_data_table_registry
SET table_name = 'ref_' + table_name,
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name IN (
    'product', 'market', 'counterparty', 'counterparty_history',
    'legal_entity', 'legal_entity_history', 'address', 'contact',
    'cp_commercial_terms', 'cp_gtc_agreement', 'cp_legal_entity_link',
    'cp_location', 'entity_address', 'entity_contact', 'gtc', 'gtc_version',
    'netting_agreement', 'regulatory_obligation', 'reporting_counterparty',
    'balmo_product', 'market_product_source', 'mot_asset_product_approval',
    'pipeline_product_approval', 'product_blend_component',
    'product_reporting_group', 'product_spec_template', 'product_spec_value',
    'spec_override', 'spec_parameter', 'spec_parameter_uom'
);
GO

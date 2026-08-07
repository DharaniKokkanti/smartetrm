-- V196: dbo.settlement_instruction gets created_source_system_id/
-- updated_source_system_id too -- the one AuditableEntity-extending table
-- V194's registry-driven rollout missed, because it was never registered in
-- dbo.master_data_table_registry (confirmed live: 0 rows there for it, only
-- Tier2-reachable and dual-registered Tier1 tables were covered by V194).
-- Discovered live 2026-08-07 via a real Hibernate SchemaManagementException
-- on boot ("missing column [created_source_system_id] in table
-- [settlement_instruction]") the moment AuditableEntity (see common package)
-- started mapping these columns for every entity that extends it.
-- Not temporal, 3 existing rows -- same simple shape as any other
-- non-temporal table in this rollout, backfilled to TIER1_APPLICATION_SCREEN
-- (V195) since this is a Tier1 dedicated-entity table, not a Tier2 one.

USE ETRM_DB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.settlement_instruction') AND name = 'created_source_system_id')
BEGIN
    ALTER TABLE dbo.settlement_instruction ADD created_source_system_id INT NULL, updated_source_system_id INT NULL;
END
GO

UPDATE si
SET si.created_source_system_id = ss.source_system_id,
    si.updated_source_system_id = ss.source_system_id,
    si.row_version = si.row_version + 1
FROM dbo.settlement_instruction si
JOIN dbo.source_system ss ON ss.source_code = 'TIER1_APPLICATION_SCREEN'
WHERE si.created_source_system_id IS NULL;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.settlement_instruction') AND name = 'created_source_system_id' AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.settlement_instruction ALTER COLUMN created_source_system_id INT NOT NULL;
    ALTER TABLE dbo.settlement_instruction ALTER COLUMN updated_source_system_id INT NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_settlement_instruction_created_src')
BEGIN
    ALTER TABLE dbo.settlement_instruction ADD CONSTRAINT fk_settlement_instruction_created_src FOREIGN KEY (created_source_system_id) REFERENCES dbo.source_system(source_system_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_settlement_instruction_updated_src')
BEGIN
    ALTER TABLE dbo.settlement_instruction ADD CONSTRAINT fk_settlement_instruction_updated_src FOREIGN KEY (updated_source_system_id) REFERENCES dbo.source_system(source_system_id);
END
GO

-- V214: dbo.address.address_type (INT FK to dbo.address_type) is a
-- vestigial column from before the entity_address M:M refactor -- real
-- address-type semantics now live on entity_address.address_type (VARCHAR
-- code), same as entity_type/entity_id above it in the Address entity
-- (already effectively unused, per that field's own "Kept for backward
-- read compatibility" comment). Its lingering NOT NULL blocked the
-- create-brand-new-address path through POST /api/v1/entity-addresses --
-- confirmed live: every one of the 45 existing rows was seeded directly
-- with a value, so this path had never actually been exercised through the
-- real API. Nothing populates it going forward; making it nullable is the
-- correct fix, not inventing a fake default id.

USE ETRM_DB;
GO

ALTER TABLE dbo.address ALTER COLUMN address_type INT NULL;
GO

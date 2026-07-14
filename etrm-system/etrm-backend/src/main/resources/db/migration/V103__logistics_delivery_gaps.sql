-- =============================================================================
-- V103 — Logistics & Delivery batch: small frontend-vs-DB gaps
-- =============================================================================
-- Found while building the Logistics & Delivery backend batch (location,
-- vessel, vessel_certificate, pipeline + satellites, truck, storage_facility,
-- tank, container, railcar). Two small, well-justified additions per this
-- session's standing rule (extend schema for a couple of missing nvarchar/
-- date columns rather than stopping to ask):
--
--   1. dbo.location: frontend Location type has portCode/unlocode
--      (port identifiers for maritime/terminal locations) with no backing
--      columns.
--   2. dbo.vessel: frontend Vessel type has sireInspectionDate/
--      cdiBerthStatus (SIRE vetting inspection tracking) with no backing
--      columns.
--
-- Larger mismatches found in this same batch were NOT schema-extended, per
-- the same rule (documented instead as code comments on the entities):
--   - dbo.pipeline has no origin/destination location columns and no
--     per-row tariff currency — those concepts live on the separate
--     pipeline_point/pipeline_tariff tables in the real relational design.
--   - dbo.truck splits capacity into capacity_litres/capacity_mt (no UOM
--     FK) rather than a single capacity+capacityUomCode pair; gvwTonnes/
--     statusCode/vehicleName/commodityType have no backing columns at all.
--   - dbo.storage_facility has no regulatoryRef/injectionRate/
--     withdrawalRate/statusCode columns (countryCode is instead resolved
--     transitively through location.country_id).
--   - dbo.vessel owner/operator are free-text on the frontend but the real
--     columns are owner_operator_id/manager_operator_id FKs into
--     dbo.transport_operator.
-- =============================================================================

ALTER TABLE dbo.location ADD port_code NVARCHAR(20) NULL, unlocode NVARCHAR(10) NULL;
GO

ALTER TABLE dbo.vessel ADD sire_inspection_date DATE NULL, cdi_berth_status NVARCHAR(30) NULL;
GO

PRINT '============================================================';
PRINT 'V103 — LOGISTICS & DELIVERY: location +port_code/+unlocode,';
PRINT '                             vessel +sire_inspection_date/+cdi_berth_status';
PRINT '============================================================';
GO

-- V52: master_data_table_registry — re-group module_group values to match the
-- Master Data Hub's own group names (frontend `MasterDataHub.tsx` GROUPS list),
-- so a Hub card and the Static Data sidebar group it lands on always agree.
-- Data-only change (UPDATE), no schema change. Only touches the rows that
-- actually exist in this table today (V14, V17, V51) — the frontend mock's
-- additional PARENT_LOOKUP_TABLES entries are mock-only and were never
-- inserted into this real registry table, so there is nothing to update there.

UPDATE dbo.master_data_table_registry SET module_group = 'Finance & Settlement'       WHERE table_name = 'currency';
UPDATE dbo.master_data_table_registry SET module_group = 'Products & Markets'         WHERE table_name = 'commodity';
UPDATE dbo.master_data_table_registry SET module_group = 'Counterparties & Agreements' WHERE table_name = 'credit_rating';
UPDATE dbo.master_data_table_registry SET module_group = 'Contract & Legal'          WHERE table_name = 'incoterm';
UPDATE dbo.master_data_table_registry SET module_group = 'Freight & Shipping'        WHERE table_name = 'charter_party_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'load_shape_template';
UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'balancing_authority';
UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'transmission_zone';

UPDATE dbo.master_data_table_registry SET module_group = 'Products & Markets'         WHERE table_name = 'deal_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Contract & Legal'          WHERE table_name = 'payment_method';
UPDATE dbo.master_data_table_registry SET module_group = 'Counterparties & Agreements' WHERE table_name = 'counterparty_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Counterparties & Agreements' WHERE table_name = 'kyc_status';
UPDATE dbo.master_data_table_registry SET module_group = 'Organization & Users'      WHERE table_name = 'contact_role';
UPDATE dbo.master_data_table_registry SET module_group = 'Organization & Users'      WHERE table_name = 'book_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Organization & Users'      WHERE table_name = 'legal_entity_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Counterparties & Agreements' WHERE table_name = 'address_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Counterparties & Agreements' WHERE table_name = 'bank_account_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Credit & Collateral'       WHERE table_name = 'tax_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Products & Markets'         WHERE table_name = 'settlement_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Logistics & Delivery'      WHERE table_name = 'storage_facility_type';
UPDATE dbo.master_data_table_registry SET module_group = 'Counterparties & Agreements' WHERE table_name = 'netting_agreement_type';

UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'load_shape_interval';
UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'load_shape_component';
UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'energy_footprint';
UPDATE dbo.master_data_table_registry SET module_group = 'Power & Energy'           WHERE table_name = 'energy_footprint_site';
GO

PRINT '===========================================================================';
PRINT 'V52 — MASTER DATA REGISTRY RE-GROUP APPLIED';
PRINT '  25 rows re-grouped: module_group now matches the Master Data Hub''s own';
PRINT '  group names exactly (Organization & Users, Counterparties & Agreements,';
PRINT '  Credit & Collateral, Products & Markets, Contract & Legal,';
PRINT '  Logistics & Delivery, Freight & Shipping, Power & Energy,';
PRINT '  Finance & Settlement) — replacing the old ad-hoc short names';
PRINT '  (Trade, Reference, Commercial, Counterparty, Organisation, Power, Freight,';
PRINT '  Products, Logistics) that had drifted apart from the Hub.';
PRINT '===========================================================================';
GO

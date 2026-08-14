-- V239: the real business tables inside "Organization & Users" (the
-- module_group that caused this whole initiative's original registry-drift
-- finding). Same refined classification method as V235/V236/V238: a stale
-- allow_create/edit=0 flag is not sufficient evidence for mst_ on its own
-- -- checked real dedicated-page CRUD and direct tran_* FK consumption
-- first. `position`/`position_eod_snapshot`/`position_valuation`
-- deliberately excluded (DERIVED, computed P&L/position output, not a
-- lookup anything creates from) per explicit instruction. `market_product`
-- (orphaned registry row, V237), the 9 tables reverted by V234, and
-- `flyway_schema_history` (Flyway's own bookkeeping table, never touched)
-- are also deliberately left out of this migration.
--
-- ref_ (19, +book_history as book's temporal shadow): book is itself
-- system-versioned temporal (found via direct sys.tables check before
-- writing this migration, same discipline that caught pricing_rule
-- earlier) -- book_history renames alongside it via the standard
-- OFF/rename/ON dance. broker/trader are both directly FK'd by
-- tran_trade(_order). country is the platform's most heavily-referenced
-- table in this batch (30+ incoming FKs incl. tran_trade_order).
-- custom_field_definition/document_store have no own controller but are
-- directly FK'd by tran_trade_custom_field_value/tran_pricing_dispute
-- respectively. bank_account/legal_entity_ownership/trader_commodity_limit
-- have real nested POST endpoints under CounterpartyController/
-- LegalEntityController/TraderController. book_access_grant/
-- broker_fee_agreement have dedicated controllers with real POST/PUT.
-- book_classification/book_ownership/book_trader/book_eod_status have real
-- nested POST endpoints under BookController. book_level_type/
-- connection_type already allow=1. settlement_price has a dedicated
-- controller with real POST/PUT.
--
-- **Real bug found and fixed in the same commit as this migration**:
-- BookRepository.findDescendantIds is a raw nativeQuery=true recursive CTE
-- hardcoding "FROM dbo.book" -- missed by every earlier nativeQuery grep
-- in this session because it WAS a nativeQuery hit, just never actually
-- checked against this specific batch's table list until now. Fixed to
-- dbo.ref_book in the same commit.
--
-- tran_ (3): delivery_instruction/inspection/nomination,
-- data_category=TRANSACTIONAL, real business events.
--
-- mst_ (8): book_type/book_classification_dimension/contact_role/
-- legal_entity_type/commodity_instrument_type_config (Tier2-locked, no
-- dedicated page, no direct tran_ consumer, fixed vocab feeding ref_
-- parents), event_category/event_type (same pattern, no FK consumer found
-- at all -- confirmed with Dharani rather than assumed), and
-- lookup_category_binding (DERIVED+allow=0, same criterion that put
-- market_holiday_calendar/pipeline_point_product in mst_ in earlier
-- batches, confirmed with Dharani).
--
-- None of these 30 tables besides book/book_history are temporal; zero
-- other native/raw SQL risk confirmed via the standard sweep.

USE ETRM_DB;
GO

-- Temporal pair
ALTER TABLE dbo.book SET (SYSTEM_VERSIONING = OFF);
GO
EXEC sp_rename 'dbo.book', 'ref_book';
GO
EXEC sp_rename 'dbo.book_history', 'ref_book_history';
GO
ALTER TABLE dbo.ref_book SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.ref_book_history));
GO

EXEC sp_rename 'dbo.broker', 'ref_broker';
GO
EXEC sp_rename 'dbo.trader', 'ref_trader';
GO
EXEC sp_rename 'dbo.country', 'ref_country';
GO
EXEC sp_rename 'dbo.custom_field_definition', 'ref_custom_field_definition';
GO
EXEC sp_rename 'dbo.document_store', 'ref_document_store';
GO
EXEC sp_rename 'dbo.bank_account', 'ref_bank_account';
GO
EXEC sp_rename 'dbo.legal_entity_ownership', 'ref_legal_entity_ownership';
GO
EXEC sp_rename 'dbo.trader_commodity_limit', 'ref_trader_commodity_limit';
GO
EXEC sp_rename 'dbo.book_access_grant', 'ref_book_access_grant';
GO
EXEC sp_rename 'dbo.broker_fee_agreement', 'ref_broker_fee_agreement';
GO
EXEC sp_rename 'dbo.book_classification', 'ref_book_classification';
GO
EXEC sp_rename 'dbo.book_ownership', 'ref_book_ownership';
GO
EXEC sp_rename 'dbo.book_trader', 'ref_book_trader';
GO
EXEC sp_rename 'dbo.book_eod_status', 'ref_book_eod_status';
GO
EXEC sp_rename 'dbo.book_level_type', 'ref_book_level_type';
GO
EXEC sp_rename 'dbo.settlement_price', 'ref_settlement_price';
GO
EXEC sp_rename 'dbo.connection_type', 'ref_connection_type';
GO
EXEC sp_rename 'dbo.delivery_instruction', 'tran_delivery_instruction';
GO
EXEC sp_rename 'dbo.inspection', 'tran_inspection';
GO
EXEC sp_rename 'dbo.nomination', 'tran_nomination';
GO
EXEC sp_rename 'dbo.book_type', 'mst_book_type';
GO
EXEC sp_rename 'dbo.book_classification_dimension', 'mst_book_classification_dimension';
GO
EXEC sp_rename 'dbo.contact_role', 'mst_contact_role';
GO
EXEC sp_rename 'dbo.legal_entity_type', 'mst_legal_entity_type';
GO
EXEC sp_rename 'dbo.commodity_instrument_type_config', 'mst_commodity_instrument_type_config';
GO
EXEC sp_rename 'dbo.event_category', 'mst_event_category';
GO
EXEC sp_rename 'dbo.event_type', 'mst_event_type';
GO
EXEC sp_rename 'dbo.lookup_category_binding', 'mst_lookup_category_binding';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_book', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_history', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_history';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_broker', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'broker';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_trader', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'trader';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_country', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'country';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_custom_field_definition', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'custom_field_definition';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_document_store', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'document_store';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_bank_account', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bank_account';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_legal_entity_ownership', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'legal_entity_ownership';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_trader_commodity_limit', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'trader_commodity_limit';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_access_grant', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_access_grant';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_broker_fee_agreement', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'broker_fee_agreement';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_classification', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_classification';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_ownership', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_ownership';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_trader', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_trader';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_eod_status', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_eod_status';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_book_level_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_level_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_settlement_price', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'settlement_price';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_connection_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'connection_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_delivery_instruction', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'delivery_instruction';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_inspection', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'inspection';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_nomination', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'nomination';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_book_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_book_classification_dimension', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'book_classification_dimension';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_contact_role', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'contact_role';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_legal_entity_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'legal_entity_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_commodity_instrument_type_config', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'commodity_instrument_type_config';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_event_category', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'event_category';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_event_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'event_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_lookup_category_binding', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'lookup_category_binding';
GO

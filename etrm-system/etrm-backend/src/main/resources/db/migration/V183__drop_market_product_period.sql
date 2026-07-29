-- V183: Drop dbo.market_product_period
--
-- Reviewed 2026-07-29 alongside dbo.market cleanup. market_product_period
-- carries per-listing lifecycle offset/date metadata (LTD/FND/settlement/
-- delivery/expiry/cash-settlement dates) keyed on
-- (market_product_link_id, period_id). It has a dedicated Tier-1
-- controller/service/repository/UI tab ("Trading Periods" on MarketsPage)
-- but:
--   - zero rows in the real DB (confirmed at V162 and again here)
--   - no other table has an FK to it
--   - V162 already flagged it as a retirement candidate and deliberately
--     left it "dormant, not retired" pending this review
--
-- Dharani confirmed (2026-07-29): drop outright. If per-listing lifecycle
-- dates are needed later, re-add them where they're actually consumed
-- rather than resurrecting this dormant table.

IF OBJECT_ID('dbo.market_product_period', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.market_product_period;
END

-- meta_table_registry (V155 backfill, not yet documented in CLAUDE.md as of
-- this migration) has its own dependency graph -- clear child rows before
-- the registry row itself, then the master_data_table_registry catalog row.
DECLARE @mtr_id INT = (SELECT meta_table_registry_id FROM dbo.meta_table_registry WHERE table_name = 'market_product_period');
IF @mtr_id IS NOT NULL
BEGIN
    DELETE ftr FROM dbo.meta_field_transition_rule ftr
        JOIN dbo.meta_field_change_rule fcr ON fcr.meta_field_change_rule_id = ftr.field_change_rule_id
        WHERE fcr.table_id = @mtr_id;
    DELETE FROM dbo.meta_field_change_rule WHERE table_id = @mtr_id;
    DELETE FROM dbo.meta_table_dependency WHERE parent_table_id = @mtr_id OR child_table_id = @mtr_id;
    DELETE FROM dbo.meta_table_registry WHERE meta_table_registry_id = @mtr_id;
END

DELETE FROM dbo.master_data_table_registry WHERE table_name = 'market_product_period';

PRINT 'V183: dropped dbo.market_product_period (was unpopulated, no dependents).';

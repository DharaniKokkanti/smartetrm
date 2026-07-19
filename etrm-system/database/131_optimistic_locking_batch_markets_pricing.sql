-- =============================================================================
-- V131 — Optimistic locking (row_version), Batch D: Markets/Pricing
--
-- Continues the rollout started in V127 (legal_entity, counterparty, book,
-- credit_limit, margin_agreement) — see that migration's doc comment for the
-- full rationale (silent last-write-wins lost updates on concurrent edits,
-- fixed via a plain Hibernate-managed row_version INT + @Version).
--
-- This migration covers the Markets/Pricing domain batch: exchanges,
-- markets, market products (+ their periods/sources), price indices (+
-- their sources), price sources, pricing rules, formula templates,
-- products (+ blend components, price index links, spec templates/values,
-- spec parameter catalog), commodity reference data, settlement prices,
-- and positions.
--
-- Several of these tables are read-only from the API's perspective today
-- (commodity_instrument_type_config, market_product_source, position,
-- commodity, spec_parameter — no create/update endpoint exists) or are
-- child rows edited only inline within a parent drawer with no full-record
-- update path (market_product_period, product_blend_component,
-- product_price_index, product_spec_template). row_version is still added
-- to their tables/entities for schema consistency and in case a write path
-- is added later — it is inert until an update() method actually echoes it
-- back through save().
--
-- Single-statement ADD COLUMN ... NOT NULL DEFAULT, same pattern as V127.
-- =============================================================================

ALTER TABLE dbo.commodity_instrument_type_config ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.exchange                    ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.formula_template             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.market                       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.market_product               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.market_product_period        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.market_product_source        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.position                     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.price_index                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.price_index_source           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.price_source                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pricing_rule                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product                      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product_blend_component      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product_price_index          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product_spec_template        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product_spec_value           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.settlement_price             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.spec_parameter               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.commodity                    ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V131 APPLIED — row_version added to 20 Markets/Pricing tables:';
PRINT '  commodity_instrument_type_config, exchange, formula_template,';
PRINT '  market, market_product, market_product_period,';
PRINT '  market_product_source, position, price_index,';
PRINT '  price_index_source, price_source, pricing_rule, product,';
PRINT '  product_blend_component, product_price_index,';
PRINT '  product_spec_template, product_spec_value, settlement_price,';
PRINT '  spec_parameter, commodity. Optimistic locking is now enforced';
PRINT '  on the entities among these with a real update() path — a';
PRINT '  concurrent stale update returns 409 instead of silently';
PRINT '  overwriting another user''s change. See the handoff doc for';
PRINT '  the remaining rollout order (Batch D of 5 parallel batches).';
PRINT '============================================================';
GO

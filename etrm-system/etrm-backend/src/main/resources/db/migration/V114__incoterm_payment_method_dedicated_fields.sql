-- =============================================================================
-- V114 — small additive ALTERs for two dedicated pages found with zero
-- backend (incoterms, payment-methods): both tables already exist and are
-- Tier2-registered, but each dedicated frontend page expects a couple of
-- fields the tables never had. Rather than inventing new tables, add the
-- missing nullable columns and give both a real dedicated controller
-- (matching the frontend's existing bespoke CRUD contract, which Tier2's
-- generic mechanism can't fully serve — e.g. deactivate, not hard delete).
-- =============================================================================

ALTER TABLE dbo.incoterm
    ADD cost_responsibility VARCHAR(500) NULL,
        title_transfer      VARCHAR(500) NULL;
GO

ALTER TABLE dbo.payment_method
    ADD currency_restriction VARCHAR(10) NULL,
        processing_days      SMALLINT    NULL;
GO

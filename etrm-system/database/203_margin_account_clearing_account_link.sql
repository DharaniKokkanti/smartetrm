-- V203: link dbo.margin_account (V5) to dbo.clearing_account (V202), and
-- drop the now-redundant legal_entity_id/clearing_broker_id/currency_id --
-- all three are derivable via clearing_account_id once the account-level
-- owner exists, and duplicating them here let the two disagree with no
-- constraint catching it. margin_account keeps its own PK/market_id/
-- account_type -- that per-market allocation under one shared clearing
-- account is the real thing it still adds on top of clearing_account.
--
-- dbo.margin_account has 0 rows in every environment as of this migration
-- (confirmed live 2026-08-08) -- no backfill needed, this is a straight
-- drop-and-replace.

USE ETRM_DB;
GO

ALTER TABLE dbo.margin_account DROP CONSTRAINT uq_ma;
ALTER TABLE dbo.margin_account DROP CONSTRAINT fk_ma_entity;
ALTER TABLE dbo.margin_account DROP CONSTRAINT fk_ma_broker;
ALTER TABLE dbo.margin_account DROP CONSTRAINT fk_ma_currency;
GO

ALTER TABLE dbo.margin_account DROP COLUMN legal_entity_id;
ALTER TABLE dbo.margin_account DROP COLUMN clearing_broker_id;
ALTER TABLE dbo.margin_account DROP COLUMN currency_id;
GO

ALTER TABLE dbo.margin_account ADD clearing_account_id INT NOT NULL
    CONSTRAINT fk_ma_clearing_account REFERENCES dbo.clearing_account(clearing_account_id);
GO

ALTER TABLE dbo.margin_account ADD CONSTRAINT uq_ma UNIQUE (clearing_account_id, market_id, account_type);
GO

CREATE INDEX ix_ma_clearing_account ON dbo.margin_account(clearing_account_id);
GO

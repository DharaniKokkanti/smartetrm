-- V213: a clearing account needs a settlement bank account to actually wire
-- margin payments to/from the FCM, and an address is useful for the
-- account's own correspondence/statement records.
--
-- bank_account.entity_type is the real, live polymorphic column (backs
-- CounterpartyController's /{id}/bank-accounts sub-resource, used by
-- BankAccountsSection.tsx) -- adds 'CLEARING_ACCOUNT' there.
--
-- address.entity_type/entity_id, by contrast, are DEAD columns -- confirmed
-- via AddressContactController: the real address-linking flow is the
-- separate entity_address M:M link table (own entity_type/entity_id +
-- chk_ea_entity_type), used by AddressesSection.tsx through the generic
-- /api/v1/entity-addresses?entityType=&entityId= endpoint. That's the one
-- that needs 'CLEARING_ACCOUNT' added -- deliberately NOT touching
-- dbo.address's own (unused) constraint.
--
-- Also adds a nullable primary_bank_account_id FK on clearing_account
-- itself for quick "this is the default settlement account" access without
-- a join/filter over every linked bank_account row.

USE ETRM_DB;
GO

ALTER TABLE dbo.bank_account DROP CONSTRAINT chk_bank_entity_type;
GO
ALTER TABLE dbo.bank_account ADD CONSTRAINT chk_bank_entity_type
    CHECK (entity_type IN ('COUNTERPARTY', 'LEGAL_ENTITY', 'CLEARING_ACCOUNT'));
GO

ALTER TABLE dbo.entity_address DROP CONSTRAINT chk_ea_entity_type;
GO
ALTER TABLE dbo.entity_address ADD CONSTRAINT chk_ea_entity_type
    CHECK (entity_type IN ('BROKER', 'COUNTERPARTY', 'LEGAL_ENTITY', 'CLEARING_ACCOUNT'));
GO

ALTER TABLE dbo.clearing_account ADD primary_bank_account_id INT NULL
    CONSTRAINT fk_clearing_account_primary_bank_account REFERENCES dbo.bank_account(bank_account_id);
GO

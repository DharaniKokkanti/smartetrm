/**
 * Mirrors dbo.legal_entity exactly (see ETRM_Database_Schema_Reference.docx).
 * Field names are camelCase here — Spring Boot/Jackson is expected to
 * serialize snake_case DB columns to camelCase JSON by convention; if that
 * convention changes, this is the one file that needs updating.
 */

import type { AddressAssignment, ContactAssignment, TaxRegistration } from '@features/tier1/counterparty/types';

// V78: legal_entity.entity_type is now a numeric FK id (legal_entity_type
// parent table) — resolve a label via useCustomConfigOptions('LEGAL_ENTITY_TYPE').
export type EntityType = number;

export interface LegalEntity {
  legalEntityId: number;
  entityCode: string;
  entityName: string;
  shortName: string;
  leiCode: string | null;
  entityType: EntityType;
  /** True when this entity has a parent — gates whether parentEntityId may
   *  be populated (V62: added alongside a CHECK enforcing the two agree). */
  parentInd: boolean;
  parentEntityId: number | null;
  jurisdictionId: number; // FK -> dbo.country(country_id) (V95, was CHAR(2) jurisdiction)
  incorporationCountryId: number | null; // FK -> dbo.country(country_id) (V95, was CHAR(2) incorporationCountry)
  incorporationNumber: string | null;
  baseCurrencyId: number; // FK -> dbo.currency(currency_id), NOT NULL default USD (V95, was CHAR(3) baseCurrency)
  defaultTimezone: string | null;
  regulator: string | null;
  regulatoryLicence: string | null;
  isInternal: boolean;
  isActive: boolean;
  goLiveDate: string | null; // ISO date
  deactivatedDate: string | null; // ISO date
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/** Shape sent on create/update — server assigns id + audit fields. */
export type LegalEntityInput = Omit<
  LegalEntity,
  'legalEntityId' | 'isActive' | 'deactivatedDate' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;

/** Row shape produced by Excel upload parsing, before it's been validated/sent.
 *  _jurisdictionCode/_baseCurrencyCode carry the raw ISO codes typed into the
 *  spreadsheet, purely for display in the review table (the real values sent
 *  on import are the resolved jurisdictionId/baseCurrencyId). */
export interface LegalEntityUploadRow extends LegalEntityInput {
  _rowNumber: number;
  _errors: string[];
  _jurisdictionCode: string;
  _baseCurrencyCode: string;
}

/**
 * Mirrors dbo.legal_entity_ownership (V125) — a joint venture's cap table.
 * owner is one of three cases: LEGAL_ENTITY/COUNTERPARTY resolve via
 * ownerRefId, EXTERNAL uses the free-text externalOwnerName fallback for a
 * co-investor never otherwise modeled in this system.
 */
export type OwnerType = 'LEGAL_ENTITY' | 'COUNTERPARTY' | 'EXTERNAL';
export type ConsolidationMethod = 'FULL' | 'PROPORTIONAL' | 'EQUITY' | 'COST';

export interface LegalEntityOwnership {
  ownershipId: number;
  jvEntityId: number;
  ownerType: OwnerType;
  ownerRefId: number | null;
  externalOwnerName: string | null;
  ownerDisplayName: string;
  ownershipPct: number;
  isOperator: boolean;
  consolidationMethod: ConsolidationMethod;
  effectiveFrom: string; // ISO date
  effectiveTo: string | null; // ISO date
  isActive: boolean;
  notes: string | null;
}

/** Shape sent on add — server assigns id/jvEntityId/ownerDisplayName/isActive. */
export type LegalEntityOwnershipInput = Omit<
  LegalEntityOwnership,
  'ownershipId' | 'jvEntityId' | 'ownerDisplayName' | 'isActive'
>;

export interface LegalEntityOwnershipListView {
  rows: LegalEntityOwnership[];
  /** Server-computed advisory total of active rows' ownershipPct — display
   *  guidance only (green/red "does this total 100%" indicator), never a
   *  blocking validation. */
  totalActiveOwnershipPct: number;
}

/** Everything needed to render + save the legal entity form in one place —
 *  same shape/convention as CounterpartyDraft. */
export interface LegalEntityDraft {
  core: LegalEntityInput;
  contacts: ContactAssignment[];
  addresses: AddressAssignment[];
  taxRegistrations: TaxRegistration[];
}

/**
 * Mirrors dbo.legal_entity exactly (see ETRM_Database_Schema_Reference.docx).
 * Field names are camelCase here — Spring Boot/Jackson is expected to
 * serialize snake_case DB columns to camelCase JSON by convention; if that
 * convention changes, this is the one file that needs updating.
 */

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

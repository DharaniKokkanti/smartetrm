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
  jurisdiction: string; // CHAR(2)
  incorporationCountry: string | null; // CHAR(2)
  incorporationNumber: string | null;
  baseCurrency: string; // CHAR(3), FK -> currency.currency_code
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

/** Row shape produced by Excel upload parsing, before it's been validated/sent. */
export interface LegalEntityUploadRow extends LegalEntityInput {
  _rowNumber: number;
  _errors: string[];
}

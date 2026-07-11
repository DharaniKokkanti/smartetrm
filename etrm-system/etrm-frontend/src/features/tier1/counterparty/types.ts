/** Shared by every polymorphic child table (address, contact, bank_account, tax_registration). */
export type PolymorphicEntityType = 'LEGAL_ENTITY' | 'COUNTERPARTY' | 'BROKER';

// ── Counterparty ──────────────────────────────────────────────────────────

// V78 converted counterparty.cp_type / kyc_status from CHECK+VARCHAR to a
// real FK id (counterparty_type / kyc_status parent tables) — these are now
// numeric ids, not string codes; resolve a label via useCustomConfigOptions.
export type CpType = number;
export type KycStatus = number;

export interface Counterparty {
  counterpartyId: number;
  cpCode: string;
  legalName: string;
  shortName: string;
  leiCode: string | null;
  jurisdictionId: number; // FK -> dbo.country(country_id) (V95, was CHAR(2) jurisdiction)
  cpType: CpType;
  creditRatingId: number | null;
  creditLimit: number | null;
  creditLimitCurrencyId: number; // FK -> dbo.currency(currency_id), NOT NULL default USD (V95, was CHAR(3) creditLimitCurrency)
  creditReviewDate: string | null;
  settlementDays: number;
  defaultCurrencyId: number | null;
  isIntercompany: boolean;
  internalEntityId: number | null;
  /** True when this counterparty has a parent company — gates whether
   *  parentCounterpartyId may be populated (V62: added alongside a CHECK
   *  enforcing the two agree; this self-referencing FK is net new — there
   *  was no parent-company concept on counterparty before). */
  parentInd: boolean;
  parentCounterpartyId: number | null;
  isActive: boolean;
  kycStatus: KycStatus;
  kycApprovedDate: string | null;
  kycExpiryDate: string | null;
  onboardedDate: string | null;
  deactivatedDate: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type CounterpartyInput = Omit<
  Counterparty,
  'counterpartyId' | 'isActive' | 'deactivatedDate' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;

// ── Address pool record (no entity binding) ──────────────────────────────────
// entity_address rows link these pool records to entities (M:M).

export interface Address {
  addressId: number | null;
  _localId: string;
  addressLine1: string;
  addressLine2: string | null;
  addressLine3: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  countryId: number;
  poBox: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  notes: string | null;
}

// V78: address.address_type is now a numeric FK id (address_type parent table).
export type AddressType = number;

// Link record: one Address assigned to one entity with role / primary flag.
// addressId is always set; address (embedded) is populated when fetched.
export interface AddressAssignment {
  entityAddressId: number | null;
  _localId: string;
  entityType: PolymorphicEntityType;
  entityId: number;
  addressId: number | null;       // null only while the pool record itself is also new
  address: Address;               // embedded for display / editing
  addressType: AddressType;
  isPrimary: boolean;
  isActive: boolean;
  isLinked: boolean;              // true = pool record already existed (reused)
}

// ── Contact pool record (no entity binding) ──────────────────────────────────

export interface Contact {
  contactId: number | null;
  _localId: string;
  salutation: string | null;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phoneDirect: string | null;
  phoneMobile: string | null;
  phoneMain: string | null;
  isActive: boolean;
  notes: string | null;
}

// V78: contact.contact_role is now a numeric FK id (contact_role parent table).
export type ContactRole = number;

// Link record: one Contact assigned to one entity.
export interface ContactAssignment {
  entityContactId: number | null;
  _localId: string;
  entityType: PolymorphicEntityType;
  entityId: number;
  contactId: number | null;
  contact: Contact;
  contactRole: ContactRole;
  isPrimary: boolean;
  isActive: boolean;
  isLinked: boolean;
}

// V78: bank_account.account_type is now a numeric FK id (bank_account_type parent table).
export type BankAccountType = number;

export interface BankAccount {
  bankAccountId: number | null;
  _localId: string;
  entityType: PolymorphicEntityType;
  entityId: number;
  accountType: BankAccountType;
  currencyId: number;
  isPrimary: boolean;
  bankName: string;
  bankCode: string | null;
  swiftBic: string | null;
  iban: string | null;
  accountNumber: string | null;
  accountName: string;
  correspondentSwift: string | null;
  correspondentName: string | null;
  isActive: boolean;
  notes: string | null;
}

// ── Tax registration (dbo.tax_registration) ────────────────────────────────────
// Shared VAT/tax-ID registration for LEGAL_ENTITY and COUNTERPARTY — this was
// an unbuilt placeholder (Master Data Hub card marked live:false) until now;
// the user asked for a VAT/organization ID field on counterparty, and this
// existing polymorphic table (not a new flat column) is the correct home.

// V78: tax_registration.tax_type is now a numeric FK id (tax_type parent
// table) — resolve a label via useCustomConfigOptions('TAX_TYPE').
export type TaxType = number;

export interface TaxRegistration {
  taxRegId: number | null;
  _localId: string;
  entityType: PolymorphicEntityType;
  entityId: number;
  taxType: TaxType;
  taxId: string;
  jurisdictionId: number; // FK -> dbo.country(country_id)
  issuingAuthority: string | null;
  registrationDate: string | null;
  validFrom: string | null;
  validTo: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
}

/** Everything needed to render + save the counterparty form in one place. */
export interface CounterpartyDraft {
  core: CounterpartyInput;
  contacts: ContactAssignment[];
  bankAccounts: BankAccount[];
  addresses: AddressAssignment[];
  taxRegistrations: TaxRegistration[];
}

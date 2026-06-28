/** Shared by every polymorphic child table (address, contact, bank_account, tax_registration). */
export type PolymorphicEntityType = 'LEGAL_ENTITY' | 'COUNTERPARTY' | 'BROKER';

// ── Counterparty ──────────────────────────────────────────────────────────

export type CpType = string;
export type KycStatus = string;

export interface Counterparty {
  counterpartyId: number;
  cpCode: string;
  legalName: string;
  shortName: string;
  leiCode: string | null;
  jurisdiction: string;
  cpType: CpType;
  creditRatingId: number | null;
  creditLimit: number | null;
  creditLimitCurrency: string;
  creditReviewDate: string | null;
  settlementDays: number;
  defaultCurrencyId: number | null;
  isIntercompany: boolean;
  internalEntityId: number | null;
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
  countryCode: string;
  poBox: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  notes: string | null;
}

export type AddressType = string;

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

export type ContactRole = string;

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

export type BankAccountType = string;

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

/** Everything needed to render + save the counterparty form in one place. */
export interface CounterpartyDraft {
  core: CounterpartyInput;
  contacts: ContactAssignment[];
  bankAccounts: BankAccount[];
  addresses: AddressAssignment[];
}

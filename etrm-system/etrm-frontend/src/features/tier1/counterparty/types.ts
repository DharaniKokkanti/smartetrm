/** Shared by every polymorphic child table (address, contact, bank_account, tax_registration). */
export type PolymorphicEntityType = 'LEGAL_ENTITY' | 'COUNTERPARTY';

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

// ── Polymorphic children ────────────────────────────────────────────────────
// Every child shares: a local-only `_localId` (used before the record has a
// real server id, i.e. while staged client-side), entityType + entityId
// (assigned only once the parent is saved), and isActive for soft-remove.

export type ContactRole = string;

export interface Contact {
  contactId: number | null; // null = staged, not yet saved to server
  _localId: string;
  entityType: PolymorphicEntityType;
  entityId: number;
  contactRole: ContactRole;
  salutation: string | null;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phoneDirect: string | null;
  phoneMobile: string | null;
  phoneMain: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
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

export type AddressType = string;

export interface Address {
  addressId: number | null;
  _localId: string;
  entityType: PolymorphicEntityType;
  entityId: number;
  addressType: AddressType;
  isPrimary: boolean;
  addressLine1: string;
  addressLine2: string | null;
  addressLine3: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  countryCode: string;
  poBox: string | null;
  isActive: boolean;
  notes: string | null;
}

/** Everything needed to render + save the counterparty form in one place. */
export interface CounterpartyDraft {
  core: CounterpartyInput;
  contacts: Contact[];
  bankAccounts: BankAccount[];
  addresses: Address[];
}

/** Shared by every polymorphic child table (address, contact, bank_account, tax_registration). */
export type PolymorphicEntityType = 'LEGAL_ENTITY' | 'COUNTERPARTY';

// ── Counterparty ──────────────────────────────────────────────────────────

export const CP_TYPES = [
  'PRODUCER',
  'CONSUMER',
  'TRADER',
  'BANK',
  'BROKER',
  'EXCHANGE',
  'INTERCOMPANY',
  'UTILITY',
  'OTHER',
] as const;
export type CpType = (typeof CP_TYPES)[number];

export const KYC_STATUSES = ['PENDING', 'APPROVED', 'REVIEW', 'SUSPENDED', 'REJECTED'] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

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

export const CONTACT_ROLES = [
  'TRADER',
  'BACK_OFFICE',
  'LEGAL',
  'COMPLIANCE',
  'ACCOUNTS',
  'PRIMARY',
  'OPERATIONS',
  'TECHNICAL',
  'CREDIT',
  'KYC',
  'OTHER',
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

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

export const BANK_ACCOUNT_TYPES = [
  'SETTLEMENT',
  'COLLATERAL',
  'FEE',
  'MARGIN',
  'GENERAL',
  'ESCROW',
] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

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

export const ADDRESS_TYPES = ['REGISTERED', 'TRADING', 'BILLING', 'SHIPPING', 'DELIVERY', 'OTHER'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

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

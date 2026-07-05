export const POLICY_TYPES = ['PI', 'HULL', 'CARGO', 'TRADE_CREDIT', 'POLITICAL_RISK', 'STORAGE', 'OTHER'] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export const INSURED_ENTITY_TYPES = ['VESSEL', 'CARGO', 'COUNTERPARTY', 'STORAGE_FACILITY', 'LEGAL_ENTITY', 'OTHER'] as const;
export type InsuredEntityType = (typeof INSURED_ENTITY_TYPES)[number];

export const PREMIUM_FREQUENCIES = ['ANNUAL', 'QUARTERLY', 'MONTHLY', 'PER_VOYAGE', 'PER_CARGO'] as const;
export type PremiumFrequency = (typeof PREMIUM_FREQUENCIES)[number];

export const POLICY_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'CLAIM_IN_PROGRESS'] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export interface InsurancePolicy {
  policyId: number;
  providerId: number;
  providerName: string;
  legalEntityId: number;
  legalEntityName: string;
  policyNumber: string;
  policyType: PolicyType;
  insuredEntityType: InsuredEntityType | null;
  insuredEntityId: number | null;
  currencyId: number;
  currencyCode: string;
  sumInsured: number;
  deductible: number;
  premiumAmount: number | null;
  premiumCurrencyId: number | null;
  premiumFrequency: PremiumFrequency | null;
  inceptionDate: string;
  expiryDate: string;
  policyStatus: PolicyStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InsurancePolicyInput = Omit<
  InsurancePolicy,
  'policyId' | 'providerName' | 'legalEntityName' | 'currencyCode' | 'createdAt' | 'updatedAt'
>;

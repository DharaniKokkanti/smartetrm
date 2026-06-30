export const CREDIT_LIMIT_TYPES = [
  'SETTLEMENT', 'PRE_SETTLEMENT', 'DELIVERY', 'MARK_TO_MARKET',
] as const;
export type CreditLimitType = (typeof CREDIT_LIMIT_TYPES)[number];

export const CREDIT_LIMIT_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'] as const;
export type CreditLimitStatus = (typeof CREDIT_LIMIT_STATUSES)[number];

export interface CreditLimit {
  creditLimitId: number;
  counterpartyId: number;
  counterpartyName: string;
  limitType: CreditLimitType;
  limitAmount: number;
  limitCurrency: string;
  usedAmount: number;
  availableAmount: number;    // computed: limitAmount - usedAmount
  utilisationPct: number;     // computed: usedAmount / limitAmount * 100
  effectiveDate: string;
  expiryDate: string | null;
  approvedBy: string | null;
  approvalDate: string | null;
  status: CreditLimitStatus;
  nettingAgreementRef: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreditLimitInput = Omit<
  CreditLimit,
  'creditLimitId' | 'counterpartyName' | 'availableAmount' | 'utilisationPct' | 'createdAt' | 'updatedAt'
>;

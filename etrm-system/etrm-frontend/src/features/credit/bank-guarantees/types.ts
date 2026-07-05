export const BG_TYPES = ['PERFORMANCE', 'PAYMENT', 'ADVANCE_PAYMENT', 'BID_BOND', 'STANDBY_LC'] as const;
export type BgType = (typeof BG_TYPES)[number];

export const BG_STATUSES = ['DRAFT', 'ISSUED', 'AMENDED', 'CALLED', 'EXPIRED', 'CANCELLED', 'DISCHARGED'] as const;
export type BgStatus = (typeof BG_STATUSES)[number];

export interface BankGuarantee {
  bgId: number;
  bgNumber: string;
  bgType: BgType;
  issuingBankId: number;
  issuingBankName: string;
  principalEntityId: number;
  principalEntityName: string;
  beneficiaryCpId: number;
  beneficiaryCpName: string;
  currencyId: number;
  currencyCode: string;
  guaranteeAmount: number;
  issueDate: string;
  expiryDate: string;
  claimPeriodDays: number;
  bgStatus: BgStatus;
  amountCalled: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BankGuaranteeInput = Omit<
  BankGuarantee,
  'bgId' | 'issuingBankName' | 'principalEntityName' | 'beneficiaryCpName' | 'currencyCode' | 'createdAt' | 'updatedAt'
>;

export const TENOR_BUCKETS = ['ALL', 'FRONT_MONTH', 'BACK_MONTH'] as const;
export type TenorBucket = (typeof TENOR_BUCKETS)[number];

export const MARGIN_UNIT_TYPES = ['PER_LOT', 'PER_MWH', 'PER_MMBTU', 'PERCENT_MTM'] as const;
export type MarginUnitType = (typeof MARGIN_UNIT_TYPES)[number];

export interface ClearingAccountMarginRate {
  clearingAccountMarginRateId: number;
  rowVersion: number;
  clearingAccountId: number;
  contractSpecId: number;
  contractSpecCode: string | null;
  tenorBucket: TenorBucket;
  marginUnitType: MarginUnitType;
  houseInitialMarginRate: number;
  houseMaintenanceMarginRate: number;
  marginCurrencyId: number;
  marginCurrencyCode: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isCurrent: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type ClearingAccountMarginRateInput = Omit<
  ClearingAccountMarginRate,
  'clearingAccountMarginRateId' | 'contractSpecCode' | 'marginCurrencyCode' | 'createdAt'
>;

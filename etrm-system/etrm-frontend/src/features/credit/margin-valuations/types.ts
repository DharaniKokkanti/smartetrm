export const MARGIN_VALUATION_RUN_TYPES = ['EOD', 'INTRADAY_1', 'INTRADAY_2'] as const;
export type MarginValuationRunType = (typeof MARGIN_VALUATION_RUN_TYPES)[number];

export const RECONCILIATION_STATUSES = ['CALCULATED', 'MATCHED_FCM', 'DISPUTED', 'SETTLED'] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export interface MarginValuation {
  marginValuationId: number;
  rowVersion: number;
  clearingAccountId: number;
  clearingAccountCode: string | null;
  valuationDate: string;
  runType: MarginValuationRunType;
  totalOpenLots: number;
  totalOpenVolume: number | null;
  volumeUomId: number | null;
  volumeUomCode: string | null;
  grossInitialMargin: number;
  spreadOffsetDiscount: number;
  netRequiredIm: number;
  variationMarginPnl: number;
  optionPremiumAmount: number;
  fcmCashBalance: number;
  fcmCollateralNoncash: number;
  fxRateToAccountBase: number;
  netMarginCallAmount: number;
  discrepancyWithFcm: number;
  reconciliationStatus: ReconciliationStatus;
  notes: string | null;
  createdAt: string;
}

export type MarginValuationInput = Omit<
  MarginValuation,
  'marginValuationId' | 'clearingAccountCode' | 'volumeUomCode' | 'createdAt'
>;

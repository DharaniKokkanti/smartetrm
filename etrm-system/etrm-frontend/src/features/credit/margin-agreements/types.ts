export const MARGIN_AGREEMENT_TYPES = [
  'CSA_BILATERAL', 'CSA_ONE_WAY_IN', 'CSA_ONE_WAY_OUT', 'PLEDGE', 'CTA',
] as const;
export type MarginAgreementType = (typeof MARGIN_AGREEMENT_TYPES)[number];

export const VALUATION_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type ValuationFrequency = (typeof VALUATION_FREQUENCIES)[number];

export const GOVERNING_LAWS = ['ENGLISH', 'NEW_YORK', 'OTHER'] as const;
export type GoverningLaw = (typeof GOVERNING_LAWS)[number];

export interface MarginAgreement {
  marginAgreementId: number;
  /** V127 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  agreementCode: string;
  agreementType: MarginAgreementType;
  counterpartyId: number;
  counterpartyName: string;
  // Our threshold — MTM > threshold means CP must post collateral
  thresholdAmount: number;
  thresholdCurrencyId: number;
  // CP's threshold — MTM < −threshold means we must post
  cpThresholdAmount: number;
  cpThresholdCurrencyId: number;
  // Minimum Transfer Amount
  mtaAmount: number;
  mtaCurrencyId: number;
  // Initial margin / independent amount
  independentAmount: number | null;
  independentAmountCurrencyId: number | null;
  roundingAmount: number | null;
  valuationFrequency: ValuationFrequency;
  eligibleCollateral: string | null;
  eligibleCurrencies: string | null;
  govLaw: GoverningLaw;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MarginAgreementInput = Omit<
  MarginAgreement,
  'marginAgreementId' | 'counterpartyName' | 'createdAt' | 'updatedAt'
>;

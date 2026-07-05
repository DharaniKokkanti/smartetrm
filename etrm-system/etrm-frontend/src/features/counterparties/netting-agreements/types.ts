export const NETTING_AGREEMENT_TYPES = ['ISDA_2002', 'ISDA_1992', 'EFET', 'GTMA', 'NAESB', 'OTHER'] as const;
export type NettingAgreementType = (typeof NETTING_AGREEMENT_TYPES)[number];

export interface NettingAgreement {
  nettingId: number;
  legalEntityId: number;
  legalEntityName: string;
  counterpartyId: number;
  counterpartyName: string;
  agreementType: NettingAgreementType;
  agreementRef: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type NettingAgreementInput = Omit<
  NettingAgreement,
  'nettingId' | 'legalEntityName' | 'counterpartyName' | 'createdAt'
>;

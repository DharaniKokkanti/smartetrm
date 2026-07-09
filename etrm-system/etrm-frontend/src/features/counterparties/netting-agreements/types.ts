// V78: netting_agreement.agreement_type is now a numeric FK id
// (netting_agreement_type parent table) — resolve a label via
// useCustomConfigOptions('NETTING_AGREEMENT_TYPE').
export type NettingAgreementType = number;

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

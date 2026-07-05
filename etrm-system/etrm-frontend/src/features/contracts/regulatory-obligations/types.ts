export const OBLIGATION_TYPES = ['FULL', 'DELEGATED', 'EXEMPT', 'PARTIAL'] as const;
export type ObligationType = (typeof OBLIGATION_TYPES)[number];

export interface RegulatoryObligation {
  obligationId: number;
  legalEntityId: number;
  legalEntityName: string;
  reportTypeId: number;
  reportTypeName: string;
  obligationType: ObligationType;
  applicableCommodities: string | null;
  reportingEntityId: number | null;
  reportingEntityName: string | null;
  registrationRef: string | null;
  registeredDate: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type RegulatoryObligationInput = Omit<
  RegulatoryObligation,
  'obligationId' | 'legalEntityName' | 'reportTypeName' | 'reportingEntityName' | 'createdAt'
>;

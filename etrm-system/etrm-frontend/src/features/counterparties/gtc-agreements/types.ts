// dbo.cp_gtc_agreement (real backend) links to dbo.gtc_version, a separate
// versioned-document table. This frontend's own `Gtc` type (features/
// contracts/gtcs/types.ts) already flattens gtc + gtc_version into one row
// (Gtc.version is a plain string field, no separate version-history table) —
// so this links directly to gtcId, matching that existing simplification
// rather than reintroducing a version table the rest of the app doesn't have.
export interface CpGtcAgreement {
  cpGtcId: number;
  counterpartyId: number;
  counterpartyName: string;
  legalEntityId: number;
  legalEntityName: string;
  gtcId: number;
  gtcName: string;
  gtcVersion: string;
  signedDate: string | null;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type CpGtcAgreementInput = Omit<
  CpGtcAgreement,
  'cpGtcId' | 'counterpartyName' | 'legalEntityName' | 'gtcName' | 'gtcVersion' | 'createdAt'
>;

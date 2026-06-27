export const GTC_TYPES = ['CRUDE_OIL', 'REFINED_PRODUCTS', 'GAS', 'LNG', 'POWER', 'METALS', 'AGRICULTURAL', 'FREIGHT', 'GENERIC'] as const;
export type GtcType = (typeof GTC_TYPES)[number];

export interface Gtc {
  gtcId: number;
  gtcCode: string;
  gtcName: string;
  gtcType: GtcType;
  version: string;
  effectiveDate: string;
  expiryDate: string | null;
  jurisdiction: string;
  governingLaw: string;
  disputeResolution: string;
  documentRef: string | null;
  isActive: boolean;
  createdAt: string;
}

export type GtcInput = Omit<Gtc, 'gtcId' | 'createdAt'>;

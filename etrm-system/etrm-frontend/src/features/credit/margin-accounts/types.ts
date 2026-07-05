export const MARGIN_ACCOUNT_TYPES = ['HOUSE', 'CLIENT', 'OMNIBUS'] as const;
export type MarginAccountType = (typeof MARGIN_ACCOUNT_TYPES)[number];

export interface MarginAccount {
  marginAccountId: number;
  legalEntityId: number;
  legalEntityName: string;
  marketId: number;
  marketName: string;
  accountRef: string;
  accountType: MarginAccountType;
  clearingBrokerId: number | null;
  clearingBrokerName: string | null;
  currencyId: number;
  currencyCode: string;
  initialMargin: number;
  variationMargin: number;
  excessMargin: number;
  marginLimit: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type MarginAccountInput = Omit<
  MarginAccount,
  'marginAccountId' | 'legalEntityName' | 'marketName' | 'clearingBrokerName' | 'currencyCode' | 'createdAt'
>;

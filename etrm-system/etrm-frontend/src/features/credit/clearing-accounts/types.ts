export const MARGIN_CALC_METHODS = ['SPAN', 'VAR', 'GRID_FLAT'] as const;
export type MarginCalcMethod = (typeof MARGIN_CALC_METHODS)[number];

export interface ClearingAccount {
  clearingAccountId: number;
  /** V128-style optimistic-locking token — echo back unchanged on update. */
  rowVersion: number;
  accountCode: string;
  accountName: string;
  clearingBrokerId: number;
  clearingBrokerName: string;
  legalEntityId: number;
  legalEntityName: string;
  baseCurrencyId: number;
  baseCurrencyCode: string;
  primaryBankAccountId: number | null;
  primaryBankAccountLabel: string | null;
  marginCalcMethod: MarginCalcMethod;
  targetCashBuffer: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type ClearingAccountInput = Omit<
  ClearingAccount,
  'clearingAccountId' | 'clearingBrokerName' | 'legalEntityName' | 'baseCurrencyCode' | 'primaryBankAccountLabel' | 'createdAt'
>;

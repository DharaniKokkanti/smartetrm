export const MARGIN_ACCOUNT_TYPES = ['HOUSE', 'CLIENT', 'OMNIBUS'] as const;
export type MarginAccountType = (typeof MARGIN_ACCOUNT_TYPES)[number];

export interface MarginAccount {
  marginAccountId: number;
  /** V128 — optimistic-locking token. Must be echoed back unchanged on
   *  update — see @components/smart/optimisticLock. */
  rowVersion: number;
  /** FK -> clearing_account (V203) — carries legal entity, clearing broker,
   *  and currency; this table only adds per-market allocation on top. */
  clearingAccountId: number;
  clearingAccountCode: string;
  marketId: number;
  marketName: string;
  accountRef: string;
  accountType: MarginAccountType;
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
  'marginAccountId' | 'clearingAccountCode' | 'marketName' | 'createdAt'
>;

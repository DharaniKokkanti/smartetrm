export const TAS_EXCHANGES = ['CME_NYMEX', 'ICE_EUROPE', 'ICE_US'] as const;
export type TasExchange = (typeof TAS_EXCHANGES)[number];

export const SETTLEMENT_SOURCES = ['CME', 'ICE', 'MANUAL'] as const;
export type SettlementSource = (typeof SETTLEMENT_SOURCES)[number];

export interface SettlementPrice {
  settlementPriceId: number;
  exchange: TasExchange;
  contractTicker: string;   // CLZ26, NGF27, HOF27
  settleDate: string;
  settlePrice: number;
  tickSize: number;
  tickCurrency: string;
  uomCode: string;
  isConfirmed: boolean;
  source: SettlementSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SettlementPriceInput = Omit<SettlementPrice, 'settlementPriceId' | 'createdAt' | 'updatedAt'>;

// Contract series metadata used for display
export const CL_MONTH_CODES: Record<string, string> = {
  F: 'Jan', G: 'Feb', H: 'Mar', J: 'Apr', K: 'May', M: 'Jun',
  N: 'Jul', Q: 'Aug', U: 'Sep', V: 'Oct', X: 'Nov', Z: 'Dec',
};

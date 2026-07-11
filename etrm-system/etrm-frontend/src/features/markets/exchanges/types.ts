export const EXCHANGE_TYPES = ['EXCHANGE', 'ECN', 'OTC_PLATFORM', 'DARK_POOL'] as const;
export type ExchangeType = (typeof EXCHANGE_TYPES)[number];

export interface Exchange {
  exchangeId: number;
  exchangeCode: string;
  exchangeName: string;
  exchangeType: ExchangeType;
  countryId: number;
  timezone: string;
  currencyCode: string;
  regulator: string | null;
  micCode: string | null;
  clearingHouse: string | null;
  isActive: boolean;
  createdAt: string;
}

export type ExchangeInput = Omit<Exchange, 'exchangeId' | 'createdAt'>;

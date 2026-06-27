export interface Currency {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  countryCode: string | null;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  createdAt: string;
}
export type CurrencyInput = Omit<Currency, 'currencyId' | 'createdAt'>;

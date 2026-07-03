export const BALMO_PRODUCT_EXCHANGES = ['CME_NYMEX', 'ICE_EUROPE', 'ICE_US'] as const;
export type BalmoProductExchange = (typeof BALMO_PRODUCT_EXCHANGES)[number];

export const BALMO_PRODUCT_SERIES = ['CL', 'NG', 'HO', 'RB', 'BZ', 'GAS_OIL', 'HH', 'OTHER'] as const;
export type BalmoProductSeries = (typeof BALMO_PRODUCT_SERIES)[number];

export const BALMO_PRODUCT_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED'] as const;
export type BalmoProductStatus = (typeof BALMO_PRODUCT_STATUSES)[number];

export const BALMO_PRICE_SOURCES = ['CME', 'ICE', 'PLATTS', 'ARGUS', 'BLOOMBERG', 'MANUAL'] as const;
export type BalmoPriceSource = (typeof BALMO_PRICE_SOURCES)[number];

export interface BalmoProduct {
  balmoProductId: number;
  productCode: string;           // e.g. BALMO-CL-2026-07
  productName: string;           // e.g. WTI Crude BALMO July 2026
  exchange: BalmoProductExchange;
  contractSeries: BalmoProductSeries;
  contractMonth: string;         // YYYY-MM
  pricingStartDate: string;      // First business day of contract month (or booking date for current month)
  pricingEndDate: string;        // Last business day of contract month
  lastTradingDate: string;       // Last day the BALMO can be transacted
  settlementPriceTicker: string; // Front-month futures ticker used for daily settlements: CLN26, BZN26
  tickSize: number;
  tickCurrency: string;
  uomCode: string;
  priceSource: BalmoPriceSource;
  status: BalmoProductStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BalmoProductInput = Omit<BalmoProduct, 'balmoProductId' | 'createdAt' | 'updatedAt'>;

export const MARKET_TYPES = ['EXCHANGE', 'OTC_CLEARED', 'OTC_BILATERAL', 'OTC_PHYSICAL', 'BROKER', 'INTERNAL'] as const;
export type MarketType = (typeof MARKET_TYPES)[number];

export const SETTLEMENT_TYPES_MKT = ['PHYSICAL', 'FINANCIAL', 'BOTH'] as const;
export type SettlementTypeMkt = (typeof SETTLEMENT_TYPES_MKT)[number];

export interface Market {
  marketId: number;
  exchangeId: number | null;
  exchangeCode: string | null;
  commodityType: string;
  marketCode: string;
  marketName: string;
  marketType: MarketType;
  settlementType: SettlementTypeMkt;
  currencyCode: string;
  timezone: string;
  countryCode: string | null;
  clearingHouse: string | null;
  contractSize: number | null;
  contractUomCode: string | null;
  priceQuotation: string | null;
  tickSize: number | null;
  goLiveDate: string | null;
  closeDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export type MarketInput = Omit<Market, 'marketId' | 'exchangeCode' | 'createdAt'>;

// Market → Product link
export interface MarketProduct {
  marketProductId: number;
  marketId: number;
  productId: number;
  productCode: string;
  productName: string;
  ticker: string | null;
  currencyCode: string | null;
  uomCode: string | null;
  lotSize: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  pricePrecision: number | null;
  settlementType: string | null;
  firstNoticeDayOffset: number | null;
  lastTradingDayOffset: number | null;
  listedDate: string | null;
  delistedDate: string | null;
  isActive: boolean;
}

export type MarketProductInput = Omit<MarketProduct, 'marketProductId' | 'productCode' | 'productName'>;

// Market-Product → Period link
export interface MarketProductPeriod {
  mppId: number;
  marketProductId: number;
  periodId: number;
  periodCode: string;
  periodName: string;
  periodType: string;
  curveLabel: string | null;
  isActive: boolean;
}

// Market-Product → Price Source link
export interface MarketProductSource {
  mpsId: number;
  marketProductId: number;
  priceSourceId: number;
  sourceCode: string;
  sourceName: string;
  sourceRole: 'PRIMARY_MTM' | 'SETTLEMENT' | 'BACKUP' | 'REFERENCE';
  sourceTicker: string | null;
  sourceFieldCode: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

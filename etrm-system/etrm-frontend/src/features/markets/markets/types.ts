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
  // V184 — currencyId/currencyCode and priceQuotation dropped: market-level
  // currency was never consumed downstream (settlement_price has its own
  // independent tickCurrencyId), and priceQuotation was unused free text.
  timezone: string | null;
  // V165 — country_id dropped (redundant with Exchange.countryId for
  // EXCHANGE-type markets); contract_size/tick_size dropped (redundant with
  // derivative_contract_specification, scoped per instrument, and
  // market_product_link.lotSize, scoped per listing); clearing_house went
  // from free-text to an FK into dbo.counterparty (new CLEARING_HOUSE type).
  clearingHouseId: number | null;
  clearingHouseName: string | null;
  goLiveDate: string | null;
  closeDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export type MarketInput = Omit<Market, 'marketId' | 'exchangeCode' | 'clearingHouseName' | 'createdAt'>;

// Market <-> Product link (V163 — renamed from MarketProduct/market_product:
// the row is a link record, not a product itself)
export interface MarketProductLink {
  marketProductLinkId: number;
  marketId: number;
  productId: number;
  productCode: string;
  productName: string;
  ticker: string | null;
  currencyId: number | null;
  currencyCode: string | null;
  uomId: number | null;
  uomCode: string | null;
  lotSize: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  pricePrecision: number | null;
  firstNoticeDayOffset: number | null;
  lastTradingDayOffset: number | null;
  // V164 — dropped listedDate/delistedDate (redundant: dbo.period is the
  // home for lifecycle dates since V162). altPriceSourceId/mtmPriceSourceId
  // dropped again in V173, superseded by price_index_source.
  // V179 — dropped settlementType: NULL on every live row; market.settlementType
  // and product.settlementType are the two actually used and populated.
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  /** Optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type MarketProductLinkInput = Omit<MarketProductLink, 'marketProductLinkId' | 'productCode' | 'productName' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;

// Market-Product-Link → Price Source link
export interface MarketProductSource {
  mpsId: number;
  marketProductLinkId: number;
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

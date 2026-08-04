export const SOURCE_ROLES = ['PRIMARY_MTM', 'SETTLEMENT', 'BACKUP', 'REFERENCE'] as const;
export type SourceRole = (typeof SOURCE_ROLES)[number];

export interface PriceIndexSource {
  pisId: number;
  priceIndexId: number;
  priceIndexCode: string;
  priceIndexName: string;
  currencyCode: string | null;
  uomCode: string | null;
  marketProductLinkId: number;
  marketCode: string | null;
  productCode: string | null;
  priceSourceId: number;
  sourceCode: string;
  sourceName: string;
  sourceRole: SourceRole;
  sourceFieldCode: string | null;
  // V179 — sourceTicker dropped, superseded by ticker_mapping (per-tenor,
  // per-price-field vendor tickers); see pricing/ticker-mappings.
  priceMultiplier: number;
  priceOffset: number;
  calculationSequence: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  rowVersion: number;
}

export type PriceIndexSourceInput = Omit<
  PriceIndexSource,
  'pisId' | 'priceIndexCode' | 'priceIndexName' | 'currencyCode' | 'uomCode' | 'marketCode' | 'productCode' | 'sourceCode' | 'sourceName'
>;

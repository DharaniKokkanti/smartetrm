export const SOURCE_ROLES = ['PRIMARY_MTM', 'SETTLEMENT', 'BACKUP', 'REFERENCE'] as const;
export type SourceRole = (typeof SOURCE_ROLES)[number];

export interface PriceIndexSource {
  pisId: number;
  priceIndexId: number;
  priceIndexCode: string;
  priceIndexName: string;
  marketProductLinkId: number;
  marketCode: string | null;
  productCode: string | null;
  priceSourceId: number;
  sourceCode: string;
  sourceName: string;
  sourceRole: SourceRole;
  sourceFieldCode: string | null;
  sourceTicker: string | null;
  priceMultiplier: number;
  priceOffset: number;
  calculationSequence: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

export type PriceIndexSourceInput = Omit<
  PriceIndexSource,
  'pisId' | 'priceIndexCode' | 'priceIndexName' | 'marketCode' | 'productCode' | 'sourceCode' | 'sourceName'
>;

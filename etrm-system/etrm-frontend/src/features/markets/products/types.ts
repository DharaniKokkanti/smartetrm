import type { CommodityType } from '@features/organization/desks/types';

export const SETTLEMENT_TYPES = ['PHYSICAL', 'FINANCIAL', 'OPTIONS', 'SWAP'] as const;
export type SettlementType = (typeof SETTLEMENT_TYPES)[number];

export const PRODUCT_FAMILIES = [
  'CRUDE_OIL', 'REFINED_PRODUCTS', 'NGL_CONDENSATE', 'PETROCHEMICAL',
  'NATURAL_GAS', 'LNG', 'LPG',
  'ELECTRICITY', 'RENEWABLE_POWER',
  'BASE_METALS', 'PRECIOUS_METALS', 'FERROUS',
  'GRAINS', 'OILSEEDS', 'SOFTS', 'LIVESTOCK',
  'OTHER',
] as const;
export type ProductFamily = (typeof PRODUCT_FAMILIES)[number];

export interface Product {
  productId: number;
  productCode: string;
  productName: string;
  commodityId: number;
  commodityType: CommodityType;
  settlementType: SettlementType;
  defaultPricingTypeCode: string;
  defaultUomCode: string;
  defaultCurrencyCode: string | null;
  defaultIncotermCode: string | null;
  lotSize: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  gradeCode: string | null;
  productFamily: ProductFamily | null;
  bloombergTicker: string | null;
  reutersRic: string | null;
  plattsCode: string | null;
  isExchangeTraded: boolean;
  isOtc: boolean;
  /** True if this product is a blend of multiple component products */
  isBlend: boolean;
  /** Recipe notes for blended products */
  blendNotes: string | null;
  // ── Pricing basis fields (used for position unit-conversion) ─────────────────
  /** OIL — cargo density used to convert BBL↔MT at trade entry (kg/m³) */
  densityEstimateKgM3: number | null;
  /** OIL — contractual/invoice density (kg/m³); may differ from estimate */
  densityBaseKgM3: number | null;
  /** GAS — gross calorific value used to convert volume↔energy (MJ/scm) */
  cvGrossMjScm: number | null;
  /** GAS — net calorific value (MJ/scm) */
  cvNetMjScm: number | null;
  /** METALS — minimum purity % (e.g. 99.9935 for LME Grade A Copper) */
  purityBasisPct: number | null;
  /** AGRICULTURAL — contract moisture basis % (e.g. 14.0 for wheat) */
  moistureBasisPct: number | null;
  /** AGRICULTURAL — contract protein basis % */
  proteinBasisPct: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>;

// ── Price index link (product_price_index bridge table) ───────────────────────

export type IndexRole = 'PRIMARY_MTM' | 'SETTLEMENT' | 'BACKUP' | 'REFERENCE';

export interface ProductPriceIndex {
  productIndexId: number;
  productId: number;
  priceIndexId: number;
  indexCode: string;
  indexName: string;
  publicationSource: string;
  currencyCode: string;
  uomCode: string;
  role: IndexRole;
  isPrimary: boolean;
  isActive: boolean;
}

export type ProductPriceIndexInput = {
  priceIndexId: number;
  role: IndexRole;
  isPrimary: boolean;
};

// ── Market link (market_product bridge table) ─────────────────────────────────

export interface ProductMarketLink {
  marketProductId: number;
  marketId: number;
  marketCode: string;
  marketName: string;
  ticker: string | null;
  currencyCode: string | null;
  uomCode: string | null;
  lotSize: number | null;
  pricePrecision: number | null;
  settlementType: string | null;
  lastTradingDayOffset: number | null;
  listedDate: string | null;
  delistedDate: string | null;
  isActive: boolean;
}

// ── Quality spec template (product_spec_template) ─────────────────────────────

export interface ProductSpecTemplate {
  templateId: number;
  productId: number;
  templateCode: string;
  templateName: string;
  commodityType: CommodityType;
  isDefault: boolean;
  issuingBody: string | null;
  standardRef: string | null;
  version: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Spec parameter value within a template (product_spec_value) ───────────────

export type BoundDirection = 'RANGE' | 'MIN_ONLY' | 'MAX_ONLY' | 'EXACT' | 'REPORT_ONLY' | 'NOT_EXCEED';
export type ParameterCategory = 'PHYSICAL' | 'CHEMICAL' | 'ENERGY' | 'QUALITY' | 'SAFETY' | 'REGULATORY' | 'OTHER';

export interface ProductSpecValue {
  specValueId: number;
  templateId: number;
  parameterId: number;
  parameterCode: string;
  parameterName: string;
  parameterCategory: ParameterCategory;
  uomCode: string | null;
  valueMin: number | null;
  valueMax: number | null;
  valueTypical: number | null;
  valueExact: number | null;
  valueText: string | null;
  boundDirection: BoundDirection;
  isMandatory: boolean;
  testMethod: string | null;
  notes: string | null;
}

// ── Blend component (product_blend_component) ─────────────────────────────────

export interface BlendComponent {
  blendComponentId: number;
  parentProductId: number;
  componentProductId: number;
  componentCode: string;
  componentName: string;
  sequenceNo: number;
  minPct: number | null;
  targetPct: number;
  maxPct: number | null;
  tolerancePct: number;
  notes: string | null;
  isActive: boolean;
  needsPositionGen: boolean;
}

export type BlendComponentInput = {
  componentProductId: number;
  sequenceNo: number;
  minPct: number | null;
  targetPct: number;
  maxPct: number | null;
  tolerancePct: number;
  notes: string | null;
  needsPositionGen: boolean;
};

// ── Spec parameter catalog (spec_parameter) ───────────────────────────────────

export interface SpecParameter {
  parameterId: number;
  commodityType: CommodityType;
  parameterCode: string;
  parameterName: string;
  parameterCategory: ParameterCategory;
  dataType: 'DECIMAL' | 'BOOLEAN' | 'TEXT';
  decimalPlaces: number;
}

// ── UoM Conversion ────────────────────────────────────────────────────────────

export interface UomConversion {
  conversionId: number;
  fromUomCode: string;
  toUomCode: string;
  factor: number;
  commodityType: CommodityType | null;
  notes: string | null;
}

export type UomConversionInput = Omit<UomConversion, 'conversionId'>;

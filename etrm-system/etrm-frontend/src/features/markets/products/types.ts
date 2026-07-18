import type { CommodityType } from '@features/reference/commodity-types/types';

// V78: product.settlement_type is now a numeric FK id (settlement_type parent
// table) — resolve a label via useCustomConfigOptions('SETTLEMENT_TYPE').
export type SettlementType = number;

export interface Product {
  productId: number;
  productCode: string;
  productName: string;
  // Resolves to a broad CommodityType via desks/types.ts's resolver against
  // the real `commodity` master data — no separate stored field (V59
  // cleanup: this used to duplicate commodityId as a redundant string).
  commodityId: number;
  settlementType: SettlementType;
  defaultPricingTypeCode: string;
  defaultUomCode: string;
  defaultCurrencyCode: string | null;
  defaultIncotermCode: string | null;
  lotSize: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  gradeCode: string | null;
  // FK to dbo.commodity_family(commodity_family_id) — replaces the old raw
  // productFamily string (V59). Null = not assigned to a family.
  commodityFamilyId: number | null;
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

// ── Commodity resolver (Product.commodityId → broad CommodityType) ────────────
// Shared between ProductsPage.tsx and BrokerFeeAgreementsPage.tsx: both filter
// products by a broad commodity type derived from the real `commodity` master
// data, not a stored duplicate field (removed in V59 cleanup).

export type CommodityRow = { commodityId: number; commodityCode: string; commodityName: string };

const COMMODITY_CODE_TO_TYPE: Partial<Record<string, CommodityType>> = {
  OIL: 'OIL', POWER: 'POWER', GAS: 'GAS', AGRI: 'AGRICULTURAL', METALS: 'METALS',
};

export function resolveCommodityType(rows: CommodityRow[], id: number | null | undefined): CommodityType | undefined {
  if (id == null) return undefined;
  const code = rows.find((r) => r.commodityId === id)?.commodityCode;
  return code ? COMMODITY_CODE_TO_TYPE[code] : undefined;
}

export function resolveCommodityName(rows: CommodityRow[], id: number | null | undefined): string {
  if (id == null) return '—';
  return rows.find((r) => r.commodityId === id)?.commodityName ?? `#${id}`;
}

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

// ── Reporting groups (reporting_group / product_reporting_group) ──────────────
// Independent per-report classification axes for a product — Position
// Reporting, VaR/Risk, Settlement/GL, etc. Separate from commodityFamilyId:
// a product can belong to a different group per reporting context (V60).
// classificationTypeId is a lookup_value FK (V63 — was free text in V60; a
// managed list since more axes will likely be added over time). No group
// code — a product is assigned directly to a named reporting_group row.

export interface ReportingGroup {
  reportingGroupId: number;
  classificationTypeId: number;
  groupName: string;
  description: string | null;
  isActive: boolean;
}

export interface ProductReportingGroup {
  productReportingGroupId: number;
  productId: number;
  reportingGroupId: number;
  classificationTypeId: number;
  classificationTypeCode: string;
  groupName: string;
}

export type ProductReportingGroupInput = {
  reportingGroupId: number;
};

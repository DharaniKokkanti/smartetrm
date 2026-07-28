// Must match dbo.period's chk_period_type CHECK constraint exactly — an
// earlier version of this list (DAILY/WEEKLY/MONTHLY/QUARTERLY/SEMI_ANNUAL/
// ANNUAL/PROMPT) never matched the live DB's actual values at all (only
// SPOT/CUSTOM happened to overlap), so every real "Add Period"/"Edit Period"
// through the GUI 409'd with a CHECK constraint violation for any other type.
export const PERIOD_TYPES = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR', 'SEASON', 'CROP_YEAR', 'INTRADAY', 'SPOT', 'CUSTOM'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

// Only these period_types have an unambiguous calendar-label convention the
// backend's auto-generate roll-forward can compute — must match
// PeriodRollCalculator.java's switch exactly.
export const AUTO_GENERATE_PERIOD_TYPES = ['MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR', 'WEEK', 'DAY'] as const;

export const PERIOD_STATUS_CODES = ['OPEN', 'CLOSED', 'LOCKED', 'ARCHIVED'] as const;
export type PeriodStatusCode = (typeof PERIOD_STATUS_CODES)[number];

// Power-specific sub-period and gas-specific day convention — real
// dbo.lookup_value categories ('LOAD_TYPE', 'GAS_DAY_TYPE', since V57), not
// fixed enums, so plain `string` here rather than a hardcoded union.
export type LoadType = string;
export type GasDayType = string;

export interface Period {
  periodId: number;
  // V162 — the key: which market AND which product this period belongs to.
  // market_product already pairs market_id + product_id, so this one FK
  // replaces the old free-floating commodityType.
  marketProductLinkId: number;
  marketCode: string | null;
  productCode: string | null;
  periodCode: string;
  periodName: string;
  // V179 — exchProductCode dropped: 0 rows ever populated; market_product_link
  // (via market/product) is the single path for the exchange root symbol.
  periodType: PeriodType;
  isRolling: boolean;
  rollOffset: number | null;
  rollUnit: string | null;
  startDate: string;
  endDate: string;
  deliveryStartDate: string | null;
  deliveryEndDate: string | null;
  curveLabel: string | null;
  // V162 contract lifecycle dates.
  firstTradeDate: string | null;
  expiryDate: string | null;
  lastTradeDate: string | null;
  optionExpDate: string | null;
  settlementDate: string | null;
  firstNoticeDate: string | null;
  lastNoticeDate: string | null;
  pricingCalendarCode: string | null;
  settlementCalendarCode: string | null;
  loadType: LoadType | null;
  gasDayType: GasDayType | null;
  // Power hourly/sub-hourly scheduling blocks (e.g. EEX blocks, PJM hourly
  // nodes) — 'HH:mm' in UTC. endTimeUtc = null means a standard full
  // gas-day or calendar-day block, not an hourly slice.
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  // Agri crop-year alignment — month the marketing year starts (e.g. 9 for
  // September-harvested grain).
  cropYearOffsetMonths: number | null;
  statusCode: PeriodStatusCode;
  isTradingPeriod: boolean;
  isRiskPeriod: boolean;
  isSettlementPeriod: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  /** Optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type PeriodInput = Omit<Period, 'periodId' | 'marketCode' | 'productCode' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;

export interface PeriodUploadRow extends PeriodInput {
  _rowNumber: number;
  _errors: string[];
}

export interface AutoGenerateRequest {
  marketProductLinkId: number;
  anchorPeriodId: number | null;
  iterations: number;
}

export interface PeriodBulkRejectedRow {
  row: Partial<Period>;
  reason: string;
}

export interface PeriodBulkResult {
  created: Period[];
  rejected: PeriodBulkRejectedRow[];
}

// Flat market_product picker option — GET /api/v1/market-product-links.
export interface MarketProductLinkOption {
  marketProductLinkId: number;
  marketId: number;
  marketCode: string | null;
  productId: number;
  productCode: string | null;
  productName: string | null;
  ticker: string | null;
  firstNoticeDayOffset: number | null;
  lastTradingDayOffset: number | null;
  isActive: boolean;
}

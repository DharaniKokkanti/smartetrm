// Must match dbo.period's chk_period_type CHECK constraint exactly — an
// earlier version of this list (DAILY/WEEKLY/MONTHLY/QUARTERLY/SEMI_ANNUAL/
// ANNUAL/PROMPT) never matched the live DB's actual values at all (only
// SPOT/CUSTOM happened to overlap), so every real "Add Period"/"Edit Period"
// through the GUI 409'd with a CHECK constraint violation for any other type.
export const PERIOD_TYPES = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR', 'SEASON', 'CROP_YEAR', 'INTRADAY', 'SPOT', 'CUSTOM'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const PERIOD_STATUS_CODES = ['OPEN', 'CLOSED', 'LOCKED', 'ARCHIVED'] as const;
export type PeriodStatusCode = (typeof PERIOD_STATUS_CODES)[number];

// NULL commodityType = period applies to all commodities (matches the
// dbo.period.commodity_type convention — see V57 migration).
export const COMMODITY_TYPES = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT', 'RINS', 'ENVIRONMENTAL', 'MULTI', 'OTHER'] as const;
export type CommodityType = (typeof COMMODITY_TYPES)[number];

// Power-specific sub-period (only meaningful when commodityType = 'POWER')
// and gas-specific day convention (only meaningful when commodityType =
// 'GAS') — both are real dbo.lookup_value categories ('LOAD_TYPE',
// 'GAS_DAY_TYPE', since V57), not fixed enums, so plain `string` here
// rather than a hardcoded union. PeriodsPage sources dropdown options via
// useLookupValues() instead of a frontend constant, so an admin adding a
// new lookup_value row actually shows up without a frontend deploy.
export type LoadType = string;
export type GasDayType = string;

export interface Period {
  periodId: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  deliveryStartDate: string | null;
  deliveryEndDate: string | null;
  pricingCalendarCode: string | null;
  settlementCalendarCode: string | null;
  commodityType: CommodityType | null;
  loadType: LoadType | null;
  gasDayType: GasDayType | null;
  // Power hourly/sub-hourly scheduling blocks (e.g. EEX blocks, PJM hourly
  // nodes) — 'HH:mm' in UTC. endTimeUtc = null means a standard full
  // gas-day or calendar-day block, not an hourly slice.
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  // Agri crop-year alignment — month the marketing year starts (e.g. 9 for
  // September-harvested grain). Only meaningful when commodityType = 'AGRICULTURAL'.
  cropYearOffsetMonths: number | null;
  statusCode: PeriodStatusCode;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type PeriodInput = Omit<Period, 'periodId' | 'createdAt' | 'createdBy'>;

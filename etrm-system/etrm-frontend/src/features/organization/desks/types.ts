// Master data commodity classification for desks, books, GL accounts, trader limits.
// Superset of tradeable commodities (trade/types.ts COMMODITY_TYPES_TRADE) plus MULTI/OTHER.
// NOTE: kept as a string union because several OTHER tables (product, price_index,
// market, location, uom_conversion, credit_limit, position — see their own
// features) still use this string representation; their SQL commodity_type
// column was NOT converted to a lookup_value FK, so do not change this export.
export const COMMODITY_TYPES = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT', 'RINS', 'ENVIRONMENTAL', 'MULTI', 'OTHER'] as const;
export type CommodityType = (typeof COMMODITY_TYPES)[number];

// V55 converted commodity_type on desk/book/gl_account/trader_commodity_limit
// specifically (not the tables above) from VARCHAR+CHECK to an INT FK on
// lookup_value; V85 then pulled it into its own dedicated dbo.commodity_type
// table (lookup_value's 'commodity_type'/'book_type' categories were never
// backfilled — see V85__lookup_category.sql). This mirrors dbo.commodity_type's
// real seed order so the mock/UI numeric ids agree with the live table.
export interface CommodityTypeLookupRow { lookupId: number; code: CommodityType; label: string }
export const COMMODITY_TYPE_LOOKUP: CommodityTypeLookupRow[] = [
  { lookupId: 1, code: 'OIL', label: 'Oil' },
  { lookupId: 2, code: 'GAS', label: 'Gas' },
  { lookupId: 3, code: 'POWER', label: 'Power' },
  { lookupId: 4, code: 'LNG', label: 'LNG' },
  { lookupId: 5, code: 'AGRICULTURAL', label: 'Agricultural' },
  { lookupId: 6, code: 'METALS', label: 'Metals' },
  { lookupId: 7, code: 'FREIGHT', label: 'Freight' },
  { lookupId: 8, code: 'RINS', label: 'RINs' },
  { lookupId: 9, code: 'ENVIRONMENTAL', label: 'Environmental' },
  { lookupId: 10, code: 'MULTI', label: 'Multi-Commodity' },
  { lookupId: 11, code: 'OTHER', label: 'Other' },
];

export function commodityLabel(lookupId: number | null | undefined): string {
  if (lookupId == null) return '—';
  return COMMODITY_TYPE_LOOKUP.find((l) => l.lookupId === lookupId)?.label ?? `#${lookupId}`;
}
export function commodityCodeById(lookupId: number | null | undefined): CommodityType | null {
  if (lookupId == null) return null;
  return COMMODITY_TYPE_LOOKUP.find((l) => l.lookupId === lookupId)?.code ?? null;
}

export interface Desk {
  deskId: number;
  deskCode: string;
  deskName: string;
  legalEntityId: number;
  legalEntityCode: string;
  // FK to dbo.commodity_type(commodity_type_id) — see COMMODITY_TYPE_LOOKUP above.
  commodityType: number | null;
  headTraderId: number | null;
  headTraderName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DeskInput = Omit<Desk, 'deskId' | 'legalEntityCode' | 'headTraderName' | 'createdAt' | 'updatedAt'>;

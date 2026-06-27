export const COMMODITY_TYPES_TRADE = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT'] as const;
export type CommodityTypeTrade = (typeof COMMODITY_TYPES_TRADE)[number];

export const TRADE_TYPES = ['PHYSICAL', 'FINANCIAL', 'OPTION', 'FREIGHT'] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

export const DIRECTIONS = ['BUY', 'SELL'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const TRADE_STATUSES = ['DRAFT', 'CONFIRMED', 'AMENDED', 'CANCELLED', 'MATURED', 'CLOSED'] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export const SETTLEMENT_TYPES_TRADE = ['PHYSICAL', 'FINANCIAL', 'NETTED'] as const;
export type SettlementTypeTrade = (typeof SETTLEMENT_TYPES_TRADE)[number];

// ─── Commodity-specific detail interfaces ─────────────────────────────────────

export interface OilDetail {
  crudeGrade: string | null;
  apiGravity: number | null;
  sulphurPct: number | null;
  loadLocationCode: string | null;
  dischargeLocationCode: string | null;
  vesselName: string | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  blDate: string | null;
  norsTenderedDate: string | null;
  codDate: string | null;
  pipelineId: number | null;
}

export interface GasDetail {
  deliveryHub: string | null;
  gasDeliveryStart: string | null;
  gasDeliveryEnd: string | null;
  swingPct: number | null;
  gasDayType: 'STANDARD' | 'EXTENDED' | null;
  nominationType: 'FIRM' | 'INTERRUPTIBLE' | null;
}

export interface PowerDetail {
  loadType: 'BASELOAD' | 'PEAK' | 'OFF_PEAK' | 'CUSTOM' | null;
  mwCapacity: number | null;
  mwhVolume: number | null;
  gridNodeCode: string | null;
  interconnector: string | null;
  deliveryStart: string | null;
  deliveryEnd: string | null;
}

export interface LngDetail {
  loadTerminalCode: string | null;
  dischargeTerminalCode: string | null;
  cargoVolumeMmbtu: number | null;
  priceBasis: 'JCC' | 'HH' | 'TTF' | 'NBP' | 'CUSTOM' | null;
}

export interface MetalsDetail {
  metalGrade: string | null;
  shape: 'CATHODE' | 'INGOT' | 'BILLET' | 'COIL' | 'ROD' | 'SLAB' | 'WIRE' | null;
  lmeDate: string | null;
  warehouseLocationCode: string | null;
  brand: string | null;
}

export interface AgriDetail {
  cropYear: number | null;
  gradeQuality: string | null;
  originCountry: string | null;
  deliveryBasis: string | null;
}

// ─── Main trade interface ──────────────────────────────────────────────────────

export interface Trade {
  tradeId: number;
  tradeReference: string;
  tradeDate: string;
  executionDatetime: string | null;
  commodityType: CommodityTypeTrade;
  tradeType: TradeType;
  direction: Direction;
  counterpartyId: number;
  counterpartyName: string;
  traderId: number;
  traderCode: string;
  bookId: number;
  bookCode: string;
  legalEntityId: number;
  legalEntityName: string;
  productId: number | null;
  productCode: string | null;
  marketId: number | null;
  marketCode: string | null;
  pricingRuleId: number | null;
  pricingRuleCode: string | null;
  quantity: number;
  uomCode: string;
  price: number;
  currencyCode: string;
  incotermCode: string | null;
  deliveryLocationCode: string | null;
  periodCode: string | null;
  settlementType: SettlementTypeTrade;
  status: TradeStatus;
  notes: string | null;
  parentTradeId: number | null;
  amendmentNumber: number;
  isLatestVersion: boolean;
  oilDetail?: OilDetail | null;
  gasDetail?: GasDetail | null;
  powerDetail?: PowerDetail | null;
  lngDetail?: LngDetail | null;
  metalsDetail?: MetalsDetail | null;
  agriDetail?: AgriDetail | null;
  createdAt: string;
  updatedAt: string;
}

export type TradeInput = Omit<Trade,
  'tradeId' | 'tradeReference' | 'amendmentNumber' | 'isLatestVersion' | 'createdAt' | 'updatedAt'
>;

export interface TradeFilter {
  commodityType?: CommodityTypeTrade;
  status?: TradeStatus;
  direction?: Direction;
}

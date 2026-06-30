export const COMMODITY_TYPES_TRADE = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT'] as const;
export type CommodityTypeTrade = (typeof COMMODITY_TYPES_TRADE)[number];

export const TRADE_TYPES = ['PHYSICAL', 'FINANCIAL', 'OPTION', 'FREIGHT'] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

export const DIRECTIONS = ['BUY', 'SELL'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const TRADE_STATUSES = ['DRAFT', 'CONFIRMED', 'AMENDED', 'CANCELLED', 'MATURED', 'CLOSED'] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export const ORDER_STATUSES = ['WORKING', 'CONFIRMED', 'SETTLED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SETTLEMENT_TYPES_TRADE = ['PHYSICAL', 'FINANCIAL', 'NETTED'] as const;
export type SettlementTypeTrade = (typeof SETTLEMENT_TYPES_TRADE)[number];

export const CONTRACT_TYPES = ['SPOT', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'TERM'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const TERM_TYPES = ['SPOT', 'RFP'] as const;
export type TermType = (typeof TERM_TYPES)[number];

export const DEAL_INDICATORS = ['INTERNAL', 'EXTERNAL'] as const;
export type DealIndicator = (typeof DEAL_INDICATORS)[number];

export const RFP_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] as const;
export type RfpFrequency = (typeof RFP_FREQUENCIES)[number];

export const BROKER_FEE_TYPES = ['FIXED', 'PERCENTAGE'] as const;
export type BrokerFeeType = (typeof BROKER_FEE_TYPES)[number];

export const CREDIT_TERM_CODES = ['PREPAY', 'CASH_ON_DELIVERY', 'NET_7', 'NET_14', 'NET_30', 'NET_45', 'NET_60', 'NET_90'] as const;
export type CreditTermCode = (typeof CREDIT_TERM_CODES)[number];

export const CREDIT_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXEMPT'] as const;
export type CreditApprovalStatus = (typeof CREDIT_APPROVAL_STATUSES)[number];

export const MOT_TYPES = ['TANKER', 'PIPELINE', 'BARGE', 'TRUCK', 'RAIL', 'ISO_TANK', 'SHIP'] as const;
export type MotType = (typeof MOT_TYPES)[number];

export const FREIGHT_VESSEL_TYPES = ['VLCC', 'SUEZMAX', 'AFRAMAX', 'LR2', 'LR1', 'MR', 'CAPE', 'PANAMAX', 'SUPRAMAX', 'HANDYSIZE'] as const;
export type FreightVesselType = (typeof FREIGHT_VESSEL_TYPES)[number];

export const FREIGHT_RATE_TYPES = ['WORLDSCALE', 'FLAT_RATE', 'LUMPSUM', 'TCE'] as const;
export type FreightRateType = (typeof FREIGHT_RATE_TYPES)[number];

export const FREIGHT_CHARTER_TYPES = ['VOYAGE', 'TIME', 'COA'] as const;
export type FreightCharterType = (typeof FREIGHT_CHARTER_TYPES)[number];

// ─── Broker reference (for dropdown) ──────────────────────────────────────────
export interface Broker {
  brokerId: number;
  brokerCode: string;
  brokerName: string;
  isActive: boolean;
}

// ─── Commodity-specific detail interfaces ─────────────────────────────────────
export interface OilDetail {
  crudeGrade: string | null;
  apiGravity: number | null;
  sulphurPct: number | null;
  motType: MotType | null;
  loadLocationCode: string | null;
  dischargeLocationCode: string | null;
  titleTransferLocationCode: string | null;
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
  titleTransferLocationCode: string | null;
  motType: MotType | null;
  cargoVolumeMmbtu: number | null;
  priceBasis: 'JCC' | 'HH' | 'TTF' | 'NBP' | 'CUSTOM' | null;
}

export interface MetalsDetail {
  metalGrade: string | null;
  shape: 'CATHODE' | 'INGOT' | 'BILLET' | 'COIL' | 'ROD' | 'SLAB' | 'WIRE' | null;
  motType: MotType | null;
  lmeDate: string | null;
  warehouseLocationCode: string | null;
  titleTransferLocationCode: string | null;
  brand: string | null;
}

export interface AgriDetail {
  cropYear: number | null;
  gradeQuality: string | null;
  originCountry: string | null;
  deliveryBasis: string | null;
  motType: MotType | null;
}

export interface FreightDetail {
  vesselType: FreightVesselType | null;
  routeCode: string | null;
  loadLocationCode: string | null;
  dischargeLocationCode: string | null;
  cargoSizeMT: number | null;
  freightRateType: FreightRateType | null;
  freightRate: number | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  charterType: FreightCharterType | null;
}

// ─── Trade (contract header — fields that apply to ALL legs) ─────────────────

export interface Trade {
  tradeId: number;
  tradeReference: string;     // auto-generated, e.g. TRD-2026-00001
  contractNumber: string | null; // external / counterparty contract reference
  tradeDate: string;
  executionDatetime: string | null;
  commodityType: CommodityTypeTrade;
  tradeType: TradeType;
  direction: Direction;
  // Deal classification
  termType: TermType;          // SPOT or RFP (multi-period)
  dealIndicator: DealIndicator; // INTERNAL or EXTERNAL (auto from CP type)
  contractType: ContractType | null;
  status: TradeStatus;
  // Counterparty & book
  counterpartyId: number;
  counterpartyName: string;
  traderId: number;
  traderCode: string;
  bookId: number;
  bookCode: string;
  legalEntityId: number;
  legalEntityName: string;
  // RFP-specific (only when termType = 'RFP')
  rfpMinQty: number | null;
  rfpMaxQty: number | null;
  rfpStartDate: string | null;
  rfpEndDate: string | null;
  rfpFrequency: RfpFrequency | null; // how often legs repeat
  // Broker (deal-level — same for all legs)
  brokerId: number | null;
  brokerCode: string | null;
  brokerName: string | null;
  brokerFeeType: BrokerFeeType | null;
  brokerFee: number | null;
  brokerFeeCurrencyCode: string | null;
  // Credit & legal
  creditTermCode: CreditTermCode | null;
  creditApprovalStatus: CreditApprovalStatus | null;
  creditLimitUsed: number | null;
  gtcReference: string | null;
  notes: string | null;
  parentTradeId: number | null;
  amendmentNumber: number;
  isLatestVersion: boolean;
  orderCount: number; // computed from leg rows
  createdAt: string;
  updatedAt: string;
}

export type TradeInput = Omit<Trade,
  'tradeId' | 'tradeReference' | 'counterpartyName' | 'traderCode' | 'bookCode' |
  'legalEntityName' | 'brokerCode' | 'brokerName' |
  'orderCount' | 'amendmentNumber' | 'isLatestVersion' | 'createdAt' | 'updatedAt'
>;

// ─── TradeOrder (one delivery leg per period) ─────────────────────────────────
// For SPOT trades there is one order. For TERM/MONTHLY trades one order per period
// (monthly cargo, quarterly period, etc.). Commodity-specific detail lives here.

export interface TradeOrder {
  orderId: number;
  tradeId: number;
  orderSequence: number;
  orderReference: string;
  isTemplate: boolean; // first leg = template; others inherit from it
  status: OrderStatus;
  periodCode: string | null;
  riskStartDate: string;
  riskEndDate: string;
  productId: number | null;
  productCode: string | null;
  productName: string | null;
  marketId: number | null;
  marketCode: string | null;
  pricingRuleId: number | null;
  pricingRuleCode: string | null;
  quantity: number;
  uomCode: string;
  price: number | null;
  currencyCode: string;
  incotermCode: string | null;
  deliveryLocationCode: string | null;
  settlementType: SettlementTypeTrade;
  oilDetail?: OilDetail | null;
  gasDetail?: GasDetail | null;
  powerDetail?: PowerDetail | null;
  lngDetail?: LngDetail | null;
  metalsDetail?: MetalsDetail | null;
  agriDetail?: AgriDetail | null;
  freightDetail?: FreightDetail | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TradeOrderInput = Omit<TradeOrder,
  'orderId' | 'orderReference' | 'productCode' | 'productName' | 'marketCode' | 'pricingRuleCode' | 'createdAt' | 'updatedAt'
>;

// ─── TradeItem (line item within an order) ───────────────────────────────────
// Optional sub-items under an order — multiple products per delivery, pricing
// components, or partial shipments under one order.

export interface TradeItem {
  itemId: number;
  orderId: number;
  itemSequence: number;
  productId: number | null;
  productCode: string | null;
  description: string;
  quantity: number;
  uomCode: string;
  unitPrice: number | null;
  currencyCode: string;
  notes: string | null;
}

export type TradeItemInput = Omit<TradeItem, 'itemId' | 'productCode'>;

export interface TradeFilter {
  commodityType?: CommodityTypeTrade;
  status?: TradeStatus;
  direction?: Direction;
}

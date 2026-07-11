export const COMMODITY_TYPES_TRADE = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT', 'RINS', 'ENVIRONMENTAL'] as const;
export type CommodityTypeTrade = (typeof COMMODITY_TYPES_TRADE)[number];

// V78: trade.trade_type is now a numeric FK id (deal_type parent table) —
// resolve a label via useCustomConfigOptions('DEAL_TYPE').
export type TradeType = number;

// Instrument type — more granular than tradeType; describes the financial structure of the deal
export const INSTRUMENT_TYPES = [
  'PHYSICAL',              // standard physical commodity delivery (oil, gas, power, metals, agri)
  'CERTIFICATE_TRANSFER',  // spot electronic certificate transfer (RINs in EPA EMTS, EUAs on ICE/EEX spot, VCUs/RECs on Xpansiv)
  'FUTURES',               // exchange-traded, daily MTM, cash-settle or deliver
  'FORWARD',               // OTC bilateral, fixed price, future delivery (no daily MTM)
  'SWAP_FIXED_FLOAT',      // fixed price leg vs floating index (e.g. fixed vs Platts Brent avg)
  'SWAP_FLOAT_FLOAT',      // two floating legs on different indices — basis / spread swap
  'OPTION_LISTED',         // exchange-traded option (CME, ICE, EEX)
  'OPTION_OTC_AMERICAN',   // OTC — exercisable any time before expiry
  'OPTION_OTC_ASIAN',      // OTC — payoff based on average price over observation period (APO)
  'OPTION_OTC_EUROPEAN',   // OTC — exercisable only at expiry date
  'STORAGE_AGREEMENT',     // capacity lease or throughput deal at a storage facility
  'TRANSPORT_AGREEMENT',   // ship charter, pipeline capacity, or truck/rail contract
] as const;
export type InstrumentType = (typeof INSTRUMENT_TYPES)[number];


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

export const CONTRACT_PERIODICITIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] as const;
export type ContractPeriodicity = (typeof CONTRACT_PERIODICITIES)[number];

export const CONTRACT_DEAL_STATUSES = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED'] as const;
export type ContractDealStatus = (typeof CONTRACT_DEAL_STATUSES)[number];

export const TOLERANCE_TYPES = ['RATE', 'FLAT'] as const;
export type ToleranceType = (typeof TOLERANCE_TYPES)[number];

export const BROKER_FEE_TYPES = ['FIXED', 'PERCENTAGE'] as const;
export type BrokerFeeType = (typeof BROKER_FEE_TYPES)[number];

export const CREDIT_TERM_CODES = ['PREPAY', 'CASH_ON_DELIVERY', 'NET_7', 'NET_14', 'NET_30', 'NET_45', 'NET_60', 'NET_90'] as const;
export type CreditTermCode = (typeof CREDIT_TERM_CODES)[number];

export const CREDIT_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXEMPT'] as const;
export type CreditApprovalStatus = (typeof CREDIT_APPROVAL_STATUSES)[number];

// CERTIFICATE = no physical transport — used for RINs, carbon credits, RECs, and other certificate trades
export const MOT_TYPES = ['TANKER', 'PIPELINE', 'BARGE', 'TRUCK', 'RAIL', 'ISO_TANK', 'SHIP', 'CERTIFICATE'] as const;
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
  commodityType: CommodityTypeTrade | null; // null = generalist, offered for every commodity
  isActive: boolean;
}

// ─── Commodity-specific detail interfaces ─────────────────────────────────────
export interface OilDetail {
  crudeGrade: string | null;
  apiGravity: number | null;
  sulphurPct: number | null;
  motType: MotType | null;
  loadLocationId: number | null;
  dischargeLocationId: number | null;
  titleTransferLocationId: number | null;
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
  titleTransferLocationId: number | null;
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
  titleTransferLocationId: number | null;
  brand: string | null;
}

export interface AgriDetail {
  cropYear: number | null;
  gradeQuality: string | null;
  originCountryId: number | null;
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

// ─── RIN detail (RINS commodity legs) ─────────────────────────────────────────
// A RIN is a 38-character electronic certificate in EPA EMTS. ASSIGNED RINs
// travel with the physical fuel batch; SEPARATED RINs are standalone certificates.
export const RIN_ASSIGNMENT_STATUSES = ['ASSIGNED', 'SEPARATED'] as const;
export type RinAssignmentStatus = (typeof RIN_ASSIGNMENT_STATUSES)[number];

export interface RinDetail {
  dCode: 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | null;  // renewable fuel category
  vintageYear: number | null;                        // RIN generation year (current or prior)
  assignmentStatus: RinAssignmentStatus | null;
  fuelCategoryCode: string | null;                   // FK code to rins/fuel-categories master data
  epaBatchNumber: string | null;                     // EMTS batch identifier
  emtsTransferRef: string | null;                    // EMTS transaction reference once transferred
}

// ─── Environmental detail (ENVIRONMENTAL commodity legs) ──────────────────────
export const ENV_PRODUCT_TYPES = ['ALLOWANCE', 'CERTIFICATE', 'OFFSET'] as const;
export type EnvProductType = (typeof ENV_PRODUCT_TYPES)[number];

export interface EnvironmentalDetail {
  envProductType: EnvProductType | null;   // ALLOWANCE (EUA/UKA/CCA), CERTIFICATE (REC/GO), OFFSET (VCU/CER)
  schemeCode: string | null;               // EU_ETS, UK_ETS, CA_CAP_TRADE, RGGI, VERRA, GOLD_STANDARD
  registryCode: string | null;             // FK code to environmental/carbon-registries master data
  vintageYear: number | null;              // compliance/generation year
  projectCode: string | null;              // offset project identifier (VCS-1234)
  serialNumberRange: string | null;        // certificate serial range for delivery
  retirementFlag: boolean;                 // true = bought for immediate retirement, not resale
}

// ─── Price adjustments (physical legs only) ───────────────────────────────────
// Each row modifies the base contract price (positive = premium, negative = discount).
// OIL:  API_GRAVITY, DENSITY, SULFUR, QUALITY_PREMIUM/DISCOUNT, TAX, MARKUP
// GAS:  HEAT_CONTENT, TAX, MARKUP
// LNG:  HEAT_CONTENT, DENSITY, MARKUP
// AGRI: PROTEIN, MOISTURE, TEST_WEIGHT, QUALITY_PREMIUM/DISCOUNT, TAX
// METALS: ASSAY, TREATMENT_CHARGE, REFINING_CHARGE, MARKUP
export const PRICE_ADJUSTMENT_TYPES = [
  'API_GRAVITY',        // crude: $/BBL per °API vs reference
  'DENSITY',            // volumetric → mass conversion factor
  'HEAT_CONTENT',       // gas/LNG: price per actual BTU/MJ vs reference calorific value
  'SULFUR',             // crude/products: $/BBL premium or discount for sulphur %
  'PROTEIN',            // agri: premium per % protein above minimum
  'MOISTURE',           // agri: deduction per % moisture above maximum
  'TEST_WEIGHT',        // agri: bushel weight premium/discount
  'ASSAY',              // metals: purity / payable metal adjustment
  'TREATMENT_CHARGE',   // metals concentrates: TC deducted from proceeds
  'REFINING_CHARGE',    // metals concentrates: RC deducted from proceeds
  'QUALITY_PREMIUM',    // general: agreed quality uplift in $/unit
  'QUALITY_DISCOUNT',   // general: agreed quality markdown in $/unit
  'TAX',                // applicable commodity or excise tax on price
  'MARKUP',             // commercial markup applied by trading desk
  'FX_DIFFERENTIAL',    // cross-currency adjustment embedded in price
] as const;
export type PriceAdjustmentType = (typeof PRICE_ADJUSTMENT_TYPES)[number];

export interface PriceAdjustment {
  adjustmentId?: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;       // positive = adds to price; negative = subtracts
  adjustmentCurrencyId: number | null;
  adjustmentUomId: number | null;
  // Traces this adjustment back to the published commodity_grade_standard
  // row it was auto-derived from (V69) — null for manually-entered or
  // assay-computed adjustments (crude API gravity/sulfur, LNG cargo, etc.).
  gradeStandardId?: number | null;
  notes: string | null;
}

// ─── Demurrage & laytime ──────────────────────────────────────────────────────
// Applies to physical legs with vessel transport (OIL tanker, LNG carrier, bulk carriers).
// REVERSIBLE: laytime at load and discharge ports is added together, one pool.
// NON_REVERSIBLE: each port has its own separate laytime allowance.
// AVERAGED: an average of the two ports' laytime is used.
export const DEMURRAGE_BASIS_TYPES = ['REVERSIBLE', 'NON_REVERSIBLE', 'AVERAGED'] as const;
export type DemurrageBasis = (typeof DEMURRAGE_BASIS_TYPES)[number];

// ─── Secondary costs (trade-level and leg-level) ─────────────────────────────
// Ancillary costs beyond the deal price itself — freight, insurance, storage,
// port dues, etc. Modeled as two separate lists: trade-level (whole deal, e.g.
// legal/documentation) and leg-level (cargo-specific, e.g. freight/insurance
// for one delivery), per V88.
export const TRADE_COST_TYPES = [
  'FREIGHT', 'INSURANCE', 'STORAGE', 'PORT_DUES', 'CUSTOMS_DUTY',
  'INSPECTION_SURVEY', 'BANK_CHARGES', 'LEGAL_DOCUMENTATION', 'AGENCY_FEES', 'OTHER',
] as const;
export type TradeCostType = (typeof TRADE_COST_TYPES)[number];

// ─── Swap detail (SWAP_FIXED_FLOAT and SWAP_FLOAT_FLOAT) ─────────────────────
export const SWAP_RESET_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const;
export type SwapResetFrequency = (typeof SWAP_RESET_FREQUENCIES)[number];

export interface SwapDetail {
  fixedRate: number | null;              // fixed leg rate (for SWAP_FIXED_FLOAT)
  fixedCurrencyId: number | null;
  fixedUomId: number | null;
  floatingIndexCode: string | null;      // primary floating leg price index
  floatingIndex2Code: string | null;     // second floating leg (SWAP_FLOAT_FLOAT only)
  resetFrequency: SwapResetFrequency | null;
  paymentFrequency: SwapResetFrequency | null;
  notionalQuantity: number | null;
  notionalUomId: number | null;
  averagingMethod: 'ARITHMETIC' | 'WEIGHTED' | null;
}

// ─── Option detail (all OPTION_ instrument types) ─────────────────────────────
export const OPTION_PUT_CALLS = ['CALL', 'PUT'] as const;
export type OptionPutCall = (typeof OPTION_PUT_CALLS)[number];

export interface OptionDetail {
  putCall: OptionPutCall | null;
  strikePrice: number | null;
  strikeCurrencyId: number | null;
  strikeUomId: number | null;
  expiryDate: string | null;
  exerciseDate: string | null;           // last date exercised (= expiryDate for European)
  premiumAmount: number | null;
  premiumCurrencyId: number | null;
  premiumPayDate: string | null;
  underlyingProductCode: string | null;
  underlyingContractCode: string | null; // e.g. CLZ26 for listed options
  lotSize: number | null;
  numberOfLots: number | null;
  isExercised: boolean;
  exercisedPrice: number | null;
}

// ─── Storage agreement detail (STORAGE_AGREEMENT instrument type) ─────────────
export const STORAGE_AGREEMENT_TYPES = [
  'TANK_LEASE',       // fixed capacity lease — pay for reserved space regardless of use
  'THROUGHPUT',       // pay per unit moved into / out of storage
  'TERMINALLING',     // terminal handling, loading and unloading fees
  'WORKING_GAS',      // working gas capacity in an underground gas storage field
  'CUSHION_GAS',      // base / cushion gas — mandatory non-withdrawable volume
  'LNG_SLOT',         // reserved LNG berth or send-out slot at an LNG terminal
  'REGASIFICATION',   // FSRU or land-based LNG regasification capacity
] as const;
export type StorageAgreementType = (typeof STORAGE_AGREEMENT_TYPES)[number];

export interface StorageAgreementDetail {
  storageAgreementType: StorageAgreementType | null;
  storageFacilityCode: string | null;
  storageCountryId: number | null;
  capacityReserved: number | null;
  capacityUomId: number | null;
  injectionRatePerDay: number | null;
  withdrawalRatePerDay: number | null;
  storageStartDate: string | null;
  storageEndDate: string | null;
  tariffRate: number | null;
  tariffCurrencyId: number | null;
  tariffUomId: number | null;          // per BBL, per MT, per MWH, or FLAT_MONTHLY
  minimumThroughput: number | null;      // take-or-pay floor
}

// ─── Transport agreement detail (TRANSPORT_AGREEMENT instrument type) ──────────
export const TRANSPORT_AGREEMENT_TYPES = [
  'VOYAGE_CHARTER',         // specific voyage at worldscale or lumpsum
  'TIME_CHARTER',           // vessel for a fixed period, charterer pays voyage costs
  'BAREBOAT_CHARTER',       // vessel hull only — charterer provides crew and operations
  'COA',                    // Contract of Affreightment — multiple voyages at fixed rate
  'PIPELINE_FIRM',          // must-take reserved pipeline capacity with take-or-pay
  'PIPELINE_INTERRUPTIBLE', // interruptible pipeline capacity — no delivery guarantee
  'TRUCK_SPOT',             // spot road tanker or bulk truck
  'RAIL_SPOT',              // spot rail tank car
  'BARGE_SPOT',             // spot river or coastal barge
  'LNG_SLOT_CHARTER',       // LNG vessel slot within a time-charter or COA structure
] as const;
export type TransportAgreementType = (typeof TRANSPORT_AGREEMENT_TYPES)[number];

export interface TransportAgreementDetail {
  transportAgreementType: TransportAgreementType | null;
  carrierName: string | null;            // shipping company, TSO, haulier name
  vesselName: string | null;
  vesselImoNumber: string | null;
  pipelineCode: string | null;
  loadLocationId: number | null;
  dischargeLocationId: number | null;
  routeCode: string | null;             // e.g. TD3C, TC2, C3 worldscale routes
  capacityPerLift: number | null;
  capacityUomId: number | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  agreementStartDate: string | null;
  agreementEndDate: string | null;
  numberOfLifts: number | null;         // total contracted voyages for COA
  freightRate: number | null;
  freightRateType: FreightRateType | null;
  freightCurrencyId: number | null;
}

// ─── TAS detail (Trade at Settlement pricing) ────────────────────────────────
// Attached to a TradeOrder when pricingRule.pricingType === 'TAS'.
// Price = exchange daily settlement ± (tasDifferential × tickSize).
export interface TasDetail {
  tasContractTicker: string;          // CLZ26, NGF27, HOF27 — specific futures month
  tasDifferential: number;            // signed integer ticks (+2, 0, -1)
  tasStatus: 'AWAITING_SETTLEMENT' | 'PRICE_LOCKED';
  tasLockedPrice: number | null;      // computed on lock: settlePrice + diff × tickSize
  tasSettlementDate: string | null;   // date exchange published the settlement
}

// ─── BALMO detail (Balance of Month swap pricing) ────────────────────────────
// Attached to a TradeOrder when pricingRule.pricingType === 'BALMO'.
// Pricing window = [booking date → last business day of contract month].
// Floating price = arithmetic average of front-month futures settlements each day.
export interface BalmoDetail {
  balmoProductId: number;             // FK to balmo_product (monthly contract listing)
  pricingStartDate: string;           // trade/booking date — first pricing day
  pricingEndDate: string;             // last business day of contract month (auto)
  contractMonth: string;              // YYYY-MM — e.g. '2026-07'
  balmoStatus: 'ACTIVE' | 'PRICING_COMPLETE' | 'SETTLED';
  runningAvgPrice: number | null;     // updated daily from settlement_price table
  elapsedPricingDays: number | null;  // business days elapsed in pricing window
  totalPricingDays: number | null;    // total business days in pricing window
  finalSettledPrice: number | null;   // filled on last day / manual settlement
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
  termType: TermType;               // SPOT or RFP (multi-period)
  dealIndicator: DealIndicator;     // INTERNAL or EXTERNAL (auto from CP type)
  contractType: ContractType | null;
  instrumentType: InstrumentType | null; // financial structure — FUTURES, SWAP_*, OPTION_*, AGREEMENT, etc.
  status: TradeStatus;
  // Counterparty
  counterpartyId: number;
  counterpartyName: string;
  traderId: number;
  traderCode: string;
  // RFP-specific (only when termType = 'RFP')
  rfpMinQty: number | null;
  rfpMaxQty: number | null;
  rfpStartDate: string | null;
  rfpEndDate: string | null;
  rfpFrequency: RfpFrequency | null; // how often legs repeat
  // Credit & legal
  creditTermCode: CreditTermCode | null;
  creditApprovalStatus: CreditApprovalStatus | null;
  creditLimitUsed: number | null;
  gtcReference: string | null;
  // Contract controls
  hedgeFlag: boolean;
  cin: string | null;
  paymentCalendarCode: string | null;
  contractPeriodicity: ContractPeriodicity | null;
  contractStatus: ContractDealStatus | null;
  specialReference: string | null;  // special contract reference — side letters, bespoke terms (max 180 chars)
  notes: string | null;
  parentTradeId: number | null;
  amendmentNumber: number;
  isLatestVersion: boolean;
  orderCount: number; // computed from leg rows
  createdAt: string;
  updatedAt: string;
}

export type TradeInput = Omit<Trade,
  'tradeId' | 'tradeReference' | 'counterpartyName' | 'traderCode' |
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
  // Entity & Book — independent per leg, no fallback to the trade (a multi-leg
  // strip can book different legs to different desks/entities).
  legalEntityId: number;
  legalEntityName: string;
  bookId: number;
  bookCode: string;
  // Broker — independent per leg (a strip's legs can be executed via different
  // IDBs on different days). Commodity-scoped: options are filtered to brokers
  // whose `commodityType` is null (generalist) or matches this leg's commodity.
  brokerId: number | null;
  brokerCode: string | null;
  brokerName: string | null;
  brokerFeeType: BrokerFeeType | null;
  brokerFee: number | null;
  brokerFeeCurrencyId: number | null;
  productId: number | null;
  productCode: string | null;
  productName: string | null;
  marketId: number | null;
  marketCode: string | null;
  pricingRuleId: number | null;
  pricingRuleCode: string | null;
  quantity: number;
  uomId: number;
  uomCode: string;
  price: number | null;
  currencyId: number;
  currencyCode: string;
  incotermCode: string | null;
  deliveryLocationId: number | null;
  deliveryLocationName: string | null;
  settlementType: SettlementTypeTrade;
  // Operational tolerance (not used for risk — risk always = contract qty)
  toleranceType: ToleranceType | null;
  tolerancePlus: number | null;   // % if RATE, volume if FLAT
  toleranceMinus: number | null;
  toleranceForScheduling: boolean; // false = tolerance for actuals only
  // Physical delivery enrichments (order-level, not commodity-specific)
  originCountryId: number | null;      // used for sanctions screening
  demurrageRate: number | null;        // $/day or currency/day penalty for excess laytime
  demurrageCurrencyId: number | null;
  demurrageBasis: DemurrageBasis | null;
  allowedLaytimeHours: number | null;  // free laytime before demurrage starts
  despatchRate: number | null;         // reward for early completion (typically 50% of demurrage)
  priceAdjustments?: PriceAdjustment[];
  oilDetail?: OilDetail | null;
  gasDetail?: GasDetail | null;
  powerDetail?: PowerDetail | null;
  lngDetail?: LngDetail | null;
  metalsDetail?: MetalsDetail | null;
  agriDetail?: AgriDetail | null;
  freightDetail?: FreightDetail | null;
  rinDetail?: RinDetail | null;
  environmentalDetail?: EnvironmentalDetail | null;
  tasDetail?: TasDetail | null;
  balmoDetail?: BalmoDetail | null;
  swapDetail?: SwapDetail | null;
  optionDetail?: OptionDetail | null;
  storageAgreementDetail?: StorageAgreementDetail | null;
  transportAgreementDetail?: TransportAgreementDetail | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TradeOrderInput = Omit<TradeOrder,
  'orderId' | 'orderReference' | 'productCode' | 'productName' | 'marketCode' | 'pricingRuleCode' |
  'legalEntityName' | 'bookCode' | 'brokerCode' | 'brokerName' | 'createdAt' | 'updatedAt' |
  'uomCode' | 'deliveryLocationName' | 'currencyCode'
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
  uomId: number;
  uomCode: string;
  unitPrice: number | null;
  currencyId: number;
  currencyCode: string;
  notes: string | null;
}

export type TradeItemInput = Omit<TradeItem, 'itemId' | 'productCode' | 'uomCode' | 'currencyCode'>;

// ─── TradeCost / TradeOrderCost (secondary costs, V88) ───────────────────────
export interface TradeCost {
  costId: number;
  tradeId: number;
  costType: TradeCostType;
  description: string | null;
  amount: number;
  currencyId: number;
  currencyCode: string;
  isEstimated: boolean;
  notes: string | null;
}
export type TradeCostInput = Omit<TradeCost, 'costId' | 'currencyCode'>;

export interface TradeOrderCost {
  costId: number;
  orderId: number;
  costType: TradeCostType;
  description: string | null;
  amount: number;
  currencyId: number;
  currencyCode: string;
  isEstimated: boolean;
  notes: string | null;
}
export type TradeOrderCostInput = Omit<TradeOrderCost, 'costId' | 'currencyCode'>;

// ─── TradeAssayResult (physical-leg quality results, V88) ────────────────────
// Actual measured values captured against the product's existing quality spec
// (product_spec_template / spec_parameter / product_spec_value) for a physical
// delivery leg — e.g. Certificate of Quality/Analysis results. The joined
// parameter/bound fields are read-only, sourced from product_spec_value via
// specValueId — mirrors the productCode-alongside-productId pattern already
// used by TradeItem above.
export interface TradeAssayResult {
  assayResultId: number;
  orderId: number;
  specValueId: number;
  parameterCode: string;
  parameterName: string;
  uomCode: string | null;
  valueMin: number | null;
  valueMax: number | null;
  valueTypical: number | null;
  valueExact: number | null;
  boundDirection: string;
  testMethod: string | null;
  actualValue: number | null;
  actualText: string | null;
  samplePoint: 'LOAD' | 'DISCHARGE' | 'SHORE_TANK' | 'OTHER' | null;
  recordedDate: string | null;
  notes: string | null;
}
export type TradeAssayResultInput = Omit<TradeAssayResult,
  'assayResultId' | 'parameterCode' | 'parameterName' | 'uomCode' | 'valueMin' | 'valueMax' | 'valueTypical' | 'valueExact' | 'boundDirection' | 'testMethod'
>;

// ─── Custom field registry (V89) ──────────────────────────────────────────────
// A governed, typed alternative to Endur/OpenLink's "User Defined Fields" —
// those let anyone type an untyped single value with no validation, which in
// practice causes field sprawl and values nobody can reliably report on. Here
// an admin defines each field once (name, data type, whether it's a Trade- or
// Leg-level field, optional commodity scoping) and every trade/leg gets a
// validated input for each active definition — still no code to add a field,
// but typed and centrally visible instead of free-text sprawl.
export const CUSTOM_FIELD_DATA_TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'] as const;
export type CustomFieldDataType = (typeof CUSTOM_FIELD_DATA_TYPES)[number];

export const CUSTOM_FIELD_APPLIES_TO = ['TRADE', 'LEG'] as const;
export type CustomFieldAppliesTo = (typeof CUSTOM_FIELD_APPLIES_TO)[number];

export interface CustomFieldDefinition {
  definitionId: number;
  fieldCode: string;
  fieldName: string;
  dataType: CustomFieldDataType;
  appliesTo: CustomFieldAppliesTo;
  commodityType: CommodityTypeTrade | null; // null = applies to every commodity
  selectOptions: string[] | null;           // only for dataType = 'SELECT'
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  notes: string | null;
}
export type CustomFieldDefinitionInput = Omit<CustomFieldDefinition, 'definitionId'>;

/** One typed value slot per data type — only the matching one is populated. */
interface CustomFieldValueBase {
  definitionId: number;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  valueBoolean: boolean | null;
}
export interface TradeCustomFieldValue extends CustomFieldValueBase {
  valueId: number;
  tradeId: number;
}
export type TradeCustomFieldValueInput = Omit<TradeCustomFieldValue, 'valueId'>;

export interface TradeOrderCustomFieldValue extends CustomFieldValueBase {
  valueId: number;
  orderId: number;
}
export type TradeOrderCustomFieldValueInput = Omit<TradeOrderCustomFieldValue, 'valueId'>;

export interface TradeFilter {
  commodityType?: CommodityTypeTrade;
  status?: TradeStatus;
  direction?: Direction;
}

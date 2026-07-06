/**
 * MSW handlers for all new ETRM master data domains:
 * Organization (desks, books, traders), Markets (products, price-indices, exchanges),
 * Logistics (locations, vessels, pipelines), Calendar (holiday-calendars, periods),
 * Pricing (pricing-rules)
 */
import { http, HttpResponse } from 'msw';
import { legalEntityStore } from './handlers';
import { cpStore } from './counterpartyHandlers';
import { rowSeed as referenceRowSeed } from './referenceData';

const API = '/api/v1';
function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}
let _id = 1000;
const nextId = () => ++_id;
const now = () => new Date().toISOString();

// ─── DESKS ────────────────────────────────────────────────────────────────────
// commodityType is now the numeric FK id into COMMODITY_TYPE_LOOKUP (V55):
// 1=OIL, 2=GAS, 3=POWER, 4=LNG, 5=AGRICULTURAL, 6=METALS, 7=FREIGHT, 8=RINS, 9=ENVIRONMENTAL, 10=MULTI, 11=OTHER
const desksStore: unknown[] = [
  { deskId: 1, deskCode: 'OIL-CRUDE', deskName: 'Crude Oil Trading', legalEntityId: 1, commodityType: 1, headTraderId: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 2, deskCode: 'GAS-EU', deskName: 'European Gas', legalEntityId: 1, commodityType: 2, headTraderId: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 3, deskCode: 'METALS-BASE', deskName: 'Base Metals', legalEntityId: 1, commodityType: 6, headTraderId: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 4, deskCode: 'POWER-EU', deskName: 'European Power', legalEntityId: 1, commodityType: 3, headTraderId: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 5, deskCode: 'AGR-GRAINS', deskName: 'Grains & Oilseeds', legalEntityId: 2, commodityType: 5, headTraderId: null, isActive: false, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── BOOKS ────────────────────────────────────────────────────────────────────
const booksStore: unknown[] = [
  { bookId: 1, bookCode: 'CRUDE-PROP',   bookName: 'Crude Proprietary',    bookType: 'TRADING',   deskId: 1, deskCode: 'OIL-CRUDE',   legalEntityId: 1, legalEntityCode: 'ACME-UK', responsibleTraderId: 1,    responsibleTraderName: 'John Doe',         commodityType: 1,             currencyCode: 'USD', positionLimit: 5000000,  pnlLimit: 500000,  varLimit: 250000, goLiveDate: '2020-01-01', description: 'Primary crude proprietary trading book — Brent and WTI physical OTC.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { bookId: 2, bookCode: 'CRUDE-HEDGE',  bookName: 'Crude Hedge Book',     bookType: 'HEDGING',   deskId: 1, deskCode: 'OIL-CRUDE',   legalEntityId: 1, legalEntityCode: 'ACME-UK', responsibleTraderId: null, responsibleTraderName: null,               commodityType: 1,             currencyCode: 'USD', positionLimit: 10000000, pnlLimit: null,    varLimit: 100000, goLiveDate: '2020-01-01', description: 'Hedge book for crude oil futures offsetting physical exposure.',          isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { bookId: 3, bookCode: 'GAS-EU-TRADE', bookName: 'EU Gas Trading',       bookType: 'TRADING',   deskId: 2, deskCode: 'GAS-EU',      legalEntityId: 2, legalEntityCode: 'ACME-US',  responsibleTraderId: 2,    responsibleTraderName: 'Alice Smith',       commodityType: 2,             currencyCode: 'EUR', positionLimit: 2000000,  pnlLimit: 200000,  varLimit: 50000,  goLiveDate: '2020-01-01', description: 'European natural gas physical and financial book — TTF and NBP.',         isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { bookId: 4, bookCode: 'LME-CU-ARB',  bookName: 'Copper Arbitrage',     bookType: 'ARBITRAGE', deskId: 3, deskCode: 'METALS-BASE', legalEntityId: 1, legalEntityCode: 'ACME-UK', responsibleTraderId: 3,    responsibleTraderName: 'Raj Kumar Patel',  commodityType: 6,             currencyCode: 'USD', positionLimit: 1000,     pnlLimit: 100000,  varLimit: 25000,  goLiveDate: '2022-01-10', description: 'LME copper cash/3M arbitrage and spread trading book.',                 isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { bookId: 5, bookCode: 'POWER-CLIENT', bookName: 'Power Client Book',    bookType: 'CLIENT',    deskId: 4, deskCode: 'POWER-EU',    legalEntityId: 2, legalEntityCode: 'ACME-US',  responsibleTraderId: 6,    responsibleTraderName: 'Sarah Wong',        commodityType: 3,             currencyCode: 'EUR', positionLimit: 500000,   pnlLimit: null,    varLimit: null,   goLiveDate: '2024-02-01', description: 'European power client back-to-back book — EEX German and French baseload.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ─── TRADERS ──────────────────────────────────────────────────────────────────
const tradersStore: unknown[] = [
  { traderId: 1, traderCode: 'JDO', fullName: 'John Doe',        email: 'john.doe@smartetrm.com',       userId: 101, legalEntityId: 1, legalEntityCode: 'ACME-UK', deskId: 1, deskCode: 'OIL-CRUDE',   deskName: 'Crude Oil Trading',  commodityTypes: [1],    commodityLimits: [{ commodityType: 1, singleTradeLimit: 25000000, dailyTradeLimit: 100000000, positionLimit: 250000000 }],                                                                                                             approverTraderId: null, approverName: null,          goLiveDate: '2020-03-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 2, traderCode: 'ASM', fullName: 'Alice Smith',     email: 'alice.smith@smartetrm.com',    userId: 102, legalEntityId: 2, legalEntityCode: 'ACME-US',  deskId: 2, deskCode: 'GAS-EU',      deskName: 'European Gas',       commodityTypes: [2, 3], commodityLimits: [{ commodityType: 2, singleTradeLimit: 10000000, dailyTradeLimit: 40000000,  positionLimit: 100000000 }, { commodityType: 3, singleTradeLimit: 5000000,  dailyTradeLimit: 20000000, positionLimit: 50000000 }], approverTraderId: null, approverName: null,          goLiveDate: '2019-06-15', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 3, traderCode: 'RKP', fullName: 'Raj Kumar Patel', email: 'raj.patel@smartetrm.com',     userId: 103, legalEntityId: 1, legalEntityCode: 'ACME-UK', deskId: 3, deskCode: 'METALS-BASE', deskName: 'Base Metals',        commodityTypes: [6],    commodityLimits: [{ commodityType: 6, singleTradeLimit: 5000000,  dailyTradeLimit: 20000000,  positionLimit: 50000000 }],                                                                                                              approverTraderId: 1,    approverName: 'John Doe',    goLiveDate: '2022-01-10', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 4, traderCode: 'MJL', fullName: 'Maria Jensen',    email: 'maria.jensen@smartetrm.com',  userId: 104, legalEntityId: 1, legalEntityCode: 'ACME-UK', deskId: 1, deskCode: 'OIL-CRUDE',   deskName: 'Crude Oil Trading',  commodityTypes: [1],    commodityLimits: [{ commodityType: 1, singleTradeLimit: 12500000, dailyTradeLimit: 50000000,  positionLimit: 100000000 }],                                                                                                             approverTraderId: 1,    approverName: 'John Doe',    goLiveDate: '2023-09-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 5, traderCode: 'PLN', fullName: 'Pierre Lefebvre', email: 'pierre.lefebvre@smartetrm.com', userId: 105, legalEntityId: 2, legalEntityCode: 'ACME-US', deskId: 2, deskCode: 'GAS-EU',      deskName: 'European Gas',       commodityTypes: [2, 4], commodityLimits: [{ commodityType: 2, singleTradeLimit: 8000000,  dailyTradeLimit: 30000000,  positionLimit: 80000000 }],                                                                                                              approverTraderId: 2,    approverName: 'Alice Smith', goLiveDate: '2021-04-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 6, traderCode: 'SWN', fullName: 'Sarah Wong',      email: 'sarah.wong@smartetrm.com',    userId: 106, legalEntityId: 2, legalEntityCode: 'ACME-US',  deskId: 4, deskCode: 'POWER-EU',    deskName: 'European Power',     commodityTypes: [3],    commodityLimits: [{ commodityType: 3, singleTradeLimit: 3000000,  dailyTradeLimit: 15000000,  positionLimit: 30000000 }],                                                                                                              approverTraderId: 2,    approverName: 'Alice Smith', goLiveDate: '2024-02-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
const productsStore: unknown[] = [
  { productId: 1,  productCode: 'BRENT-CRUDE',    productName: 'Brent Crude Oil',           commodityId: 1,         settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'BBL',    defaultCurrencyCode: 'USD', defaultIncotermCode: 'FOB',  gradeCode: 'LIGHT_SWEET',  commodityFamilyId: 1,         bloombergTicker: 'CO1 Comdty',    reutersRic: 'LCOc1',       plattsCode: 'AAWLD00', isExchangeTraded: false, isOtc: true,  lotSize: 500000, minQuantity: 50000,  maxQuantity: 5000000, isBlend: false, blendNotes: null, densityEstimateKgM3: 857.0, densityBaseKgM3: 836.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'Dated Brent crude — benchmark for North Sea, West African, and Asian physical crude markets.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 2,  productCode: 'WTI-CRUDE',      productName: 'West Texas Intermediate',   commodityId: 1,         settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'BBL',    defaultCurrencyCode: 'USD', defaultIncotermCode: 'FOB',  gradeCode: 'LIGHT_SWEET',  commodityFamilyId: 1,         bloombergTicker: 'CL1 Comdty',    reutersRic: 'CLc1',        plattsCode: 'AAXHZ00', isExchangeTraded: false, isOtc: true,  lotSize: 1000,   minQuantity: 1000,   maxQuantity: 5000000, isBlend: false, blendNotes: null, densityEstimateKgM3: 828.0, densityBaseKgM3: 800.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'WTI crude — primary US benchmark, delivery at Cushing Oklahoma.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 3,  productCode: 'BRENT-FUTURES',  productName: 'Brent Crude Futures',       commodityId: 1,         settlementType: 'FINANCIAL', defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'BBL',    defaultCurrencyCode: 'USD', defaultIncotermCode: null,   gradeCode: null,           commodityFamilyId: 1,         bloombergTicker: 'CO1 Comdty',    reutersRic: 'LCOc1',       plattsCode: null,      isExchangeTraded: true,  isOtc: false, lotSize: 1000,   minQuantity: 1000,   maxQuantity: 1000000, isBlend: false, blendNotes: null, densityEstimateKgM3: 857.0, densityBaseKgM3: 836.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'ICE Brent futures contract — cash-settled against ICE Brent Index.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 4,  productCode: 'TTF-GAS',        productName: 'TTF Natural Gas',           commodityId: 3,         settlementType: 'FINANCIAL', defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'MWH',    defaultCurrencyCode: 'EUR', defaultIncotermCode: null,   gradeCode: null,           commodityFamilyId: 4,       bloombergTicker: 'TTFG1 Comdty',  reutersRic: 'TTFMc1',      plattsCode: null,      isExchangeTraded: true,  isOtc: true,  lotSize: 1,      minQuantity: 1,      maxQuantity: 1000000, isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: 38.0,  cvNetMjScm: 34.2, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'Title Transfer Facility day-ahead and forward natural gas traded on ICE/EEX.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 5,  productCode: 'NBP-GAS',        productName: 'NBP Natural Gas',           commodityId: 3,         settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'THERM',  defaultCurrencyCode: 'GBP', defaultIncotermCode: null,   gradeCode: null,           commodityFamilyId: 4,       bloombergTicker: 'NBPG1 Comdty',  reutersRic: 'GBPGASDAc1',  plattsCode: null,      isExchangeTraded: true,  isOtc: true,  lotSize: 1,      minQuantity: 1,      maxQuantity: 500000,  isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: 39.5,  cvNetMjScm: 35.6, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'UK National Balancing Point — physical and financial gas delivery at NBP.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 6,  productCode: 'LME-COPPER',     productName: 'LME Grade A Copper',        commodityId: 5,      settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'MT',     defaultCurrencyCode: 'USD', defaultIncotermCode: null,   gradeCode: 'GRADE_A',      commodityFamilyId: 6,       bloombergTicker: 'LMCADY Comdty', reutersRic: 'MCUCASH=',    plattsCode: null,      isExchangeTraded: true,  isOtc: true,  lotSize: 25,     minQuantity: 25,     maxQuantity: 10000,   isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: 99.9935, moistureBasisPct: null, proteinBasisPct: null, description: 'LME Grade A copper cathodes — 99.9935% purity minimum, 25 MT lots.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 7,  productCode: 'LME-ALUMINIUM',  productName: 'LME Primary Aluminium',     commodityId: 5,      settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'MT',     defaultCurrencyCode: 'USD', defaultIncotermCode: null,   gradeCode: 'STANDARD',     commodityFamilyId: 6,       bloombergTicker: 'LMADAY Comdty', reutersRic: 'MALCASH=',    plattsCode: null,      isExchangeTraded: true,  isOtc: true,  lotSize: 25,     minQuantity: 25,     maxQuantity: 25000,   isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: 99.7, moistureBasisPct: null, proteinBasisPct: null, description: 'LME primary aluminium — 99.7% minimum purity, 25 MT lots, P1020 or equivalent.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 8,  productCode: 'EEX-DE-POWER',   productName: 'EEX German Power Baseload', commodityId: 2,       settlementType: 'FINANCIAL', defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'MWH',    defaultCurrencyCode: 'EUR', defaultIncotermCode: null,   gradeCode: null,           commodityFamilyId: 9,       bloombergTicker: 'AACXBMNY Index',reutersRic: 'DEPWRBSLm1',  plattsCode: null,      isExchangeTraded: true,  isOtc: true,  lotSize: 1,      minQuantity: 1,      maxQuantity: 100000,  isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'EEX German Power day-ahead and forward contracts, hourly and baseload.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 9,  productCode: 'ICE-BRENT-OPT',  productName: 'ICE Brent Crude Options',   commodityId: 1,         settlementType: 'OPTIONS',   defaultPricingTypeCode: 'FORMULA',      defaultUomCode: 'BBL',    defaultCurrencyCode: 'USD', defaultIncotermCode: null,   gradeCode: null,           commodityFamilyId: 1,         bloombergTicker: 'CO Comdty',     reutersRic: 'LCO',         plattsCode: null,      isExchangeTraded: true,  isOtc: false, lotSize: 1000,   minQuantity: 1000,   maxQuantity: 500000,  isBlend: false, blendNotes: null, densityEstimateKgM3: 857.0, densityBaseKgM3: 836.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'ICE Brent crude options — European-style options exercisable at expiry.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 10, productCode: 'HEATING-OIL',    productName: 'Gas Oil / Heating Oil',     commodityId: 1,         settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'DIFFERENTIAL', defaultUomCode: 'MT',     defaultCurrencyCode: 'USD', defaultIncotermCode: 'CIF',  gradeCode: null,           commodityFamilyId: 2,  bloombergTicker: 'QS1 Comdty',    reutersRic: 'LGOc1',       plattsCode: 'AAGLD00', isExchangeTraded: false, isOtc: true,  lotSize: 100,    minQuantity: 100,    maxQuantity: 50000,   isBlend: false, blendNotes: null, densityEstimateKgM3: 845.0, densityBaseKgM3: 820.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'ICE Gas Oil / Heating Oil — European distillate benchmark, 100 MT lots.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 11, productCode: 'JKM-LNG',        productName: 'JKM LNG Japan/Korea',       commodityId: 3,         settlementType: 'FINANCIAL', defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'MMBTU',  defaultCurrencyCode: 'USD', defaultIncotermCode: 'DES',  gradeCode: null,           commodityFamilyId: 5,               bloombergTicker: 'PLNJKM Comdty', reutersRic: 'PLNJKM',      plattsCode: 'ASGIM00', isExchangeTraded: false, isOtc: true,  lotSize: 1,      minQuantity: 1,      maxQuantity: 1000000, isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: 40.5,  cvNetMjScm: 36.5, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'Platts JKM benchmark for LNG into Japan, South Korea, China, Taiwan.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 12, productCode: 'CBOT-CORN',      productName: 'CBOT Corn Futures',         commodityId: 4, settlementType: 'PHYSICAL',  defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'BUSHEL', defaultCurrencyCode: 'USD', defaultIncotermCode: null,   gradeCode: 'US_GRADE_2_YELLOW', commodityFamilyId: 8,   bloombergTicker: 'C 1 Comdty',    reutersRic: 'Cc1',         plattsCode: null,      isExchangeTraded: true,  isOtc: false, lotSize: 5000,   minQuantity: 5000,   maxQuantity: 500000,  isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: 14.0, proteinBasisPct: 8.0, description: 'CBOT No. 2 Yellow Corn — 5,000 bushel standard lots.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Agricultural
  { productId: 16, productCode: 'WHEAT-EU', productName: 'Euronext Milling Wheat (EU)', commodityId: 4, settlementType: 'PHYSICAL', defaultPricingTypeCode: 'INDEX', defaultUomCode: 'MT', defaultCurrencyCode: 'EUR', defaultIncotermCode: 'FOB', gradeCode: 'EU_MILLING_WHEAT', commodityFamilyId: 8, bloombergTicker: null, reutersRic: null, plattsCode: null, isExchangeTraded: false, isOtc: true, lotSize: 100, minQuantity: 100, maxQuantity: 100000, isBlend: false, blendNotes: null, densityEstimateKgM3: null, densityBaseKgM3: null, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: 14.5, proteinBasisPct: 12.0, description: 'EU milling wheat — Euronext front month reference. Min 12% protein, 14.5% moisture basis.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Blend component base products + blend product
  { productId: 13, productCode: 'ULSD-10PPM',  productName: 'Ultra-Low Sulphur Diesel 10ppm',          commodityId: 1, settlementType: 'PHYSICAL', defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'MT',    defaultCurrencyCode: 'USD', defaultIncotermCode: 'CIF', gradeCode: 'ULSD',  commodityFamilyId: 2, bloombergTicker: 'QS1 Comdty', reutersRic: 'LGOc1', plattsCode: 'AAGLD00', isExchangeTraded: false, isOtc: true, lotSize: 100, minQuantity: 100, maxQuantity: 50000, isBlend: false, blendNotes: null, densityEstimateKgM3: 838.0, densityBaseKgM3: 815.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'European EN590 ULSD — max 10ppm sulphur, CIF ARA / FOB Rotterdam barge.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 14, productCode: 'ETHANOL',     productName: 'Fuel Ethanol (Denatured, Industrial Grade)', commodityId: 1, settlementType: 'PHYSICAL', defaultPricingTypeCode: 'INDEX',        defaultUomCode: 'CBM',   defaultCurrencyCode: 'EUR', defaultIncotermCode: 'FOB', gradeCode: null,    commodityFamilyId: 3,    bloombergTicker: null,         reutersRic: null,    plattsCode: 'AAAPQ00', isExchangeTraded: false, isOtc: true, lotSize: 100, minQuantity: 100, maxQuantity: 10000, isBlend: false, blendNotes: null, densityEstimateKgM3: 794.0, densityBaseKgM3: 789.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'Denatured fuel-grade ethanol, European spec. Blend feedstock for gasoline pools.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { productId: 15, productCode: 'GAS97-BLEND', productName: 'Gasoline 97 E3 (ULSD/Ethanol Blend)',      commodityId: 1, settlementType: 'PHYSICAL', defaultPricingTypeCode: 'DIFFERENTIAL', defaultUomCode: 'CBM',   defaultCurrencyCode: 'USD', defaultIncotermCode: 'CIF', gradeCode: 'GAS97', commodityFamilyId: 2, bloombergTicker: null,         reutersRic: null,    plattsCode: null,      isExchangeTraded: false, isOtc: true, lotSize: 100, minQuantity: 100, maxQuantity: 50000, isBlend: true,  blendNotes: '97%vol ULSD-10PPM + 3%vol Denatured Ethanol — EN228 Euro-5 compliant gasoline blend.', densityEstimateKgM3: 835.0, densityBaseKgM3: 812.0, cvGrossMjScm: null, cvNetMjScm: null, purityBasisPct: null, moistureBasisPct: null, proteinBasisPct: null, description: 'Internal 97-octane gasoline blend per EN228. Formula-priced vs. ULSD benchmark + ethanol premium.', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ─── PRODUCT SPEC TEMPLATES ───────────────────────────────────────────────────
const productSpecTemplateStore: unknown[] = [
  { templateId: 1, productId: 1, templateCode: 'DTBRT_BFOE_STD', templateName: 'Dated Brent / BFOE Standard Loadable Quality', commodityType: 'OIL', isDefault: true, issuingBody: 'Platts / Shell / BP / TotalEnergies', standardRef: 'BFOE Memorandum of Understanding', version: '2023', effectiveFrom: '2023-01-01', effectiveTo: null, notes: 'Forties, Oseberg, Ekofisk, Brent blend loadable quality.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 2, productId: 2, templateCode: 'WTI_NYMEX_STD',  templateName: 'WTI Crude NYMEX Contract Specification',       commodityType: 'OIL', isDefault: true, issuingBody: 'CME Group / NYMEX', standardRef: 'NYMEX Rule 200.00 — Light Sweet Crude Oil', version: '2023', effectiveFrom: '1983-03-30', effectiveTo: null, notes: 'Light sweet crude deliverable into Cushing OK pipeline network.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 3, productId: 4, templateCode: 'TTF_EFET_2020',  templateName: 'TTF Natural Gas — H-Gas Quality per GTS Network Code', commodityType: 'GAS', isDefault: true, issuingBody: 'EFET / GTS (Gasunie Transport Services)', standardRef: 'NTA 8000 / Interconnection Agreement', version: '2020', effectiveFrom: '2020-01-01', effectiveTo: null, notes: 'H-Gas quality for delivery at TTF virtual trading point.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 4, productId: 6, templateCode: 'LME_CU_GRADE_A', templateName: 'LME Grade A Copper Chemical Specification',       commodityType: 'METALS', isDefault: true, issuingBody: 'London Metal Exchange', standardRef: 'LME Rules — Annex A / BS EN 1978:1998', version: '2022', effectiveFrom: '1993-01-01', effectiveTo: null, notes: 'Cu+Ag ≥ 99.9935%. Must be LME-registered brand.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 5, productId: 13, templateCode: 'EN590_10PPM',    templateName: 'EN 590 Ultra-Low Sulphur Diesel — European Road Fuel Standard', commodityType: 'OIL', isDefault: true, issuingBody: 'CEN (European Committee for Standardization)', standardRef: 'EN 590:2022+A1', version: '2022', effectiveFrom: '2022-01-01', effectiveTo: null, notes: 'European automotive diesel standard. Applies to CIF ARA, FOB Rotterdam barges.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 6, productId: 15, templateCode: 'GAS97_INTERNAL', templateName: 'Gasoline 97 E3 Internal Blend Specification',      commodityType: 'OIL', isDefault: true, issuingBody: 'Internal / EN 228', standardRef: 'EN 228:2012+A1 / Internal Blend Spec v2.1', version: '2023', effectiveFrom: '2023-01-01', effectiveTo: null, notes: 'Internal spec for 97%vol ULSD + 3%vol ethanol blend meeting EN228 Euro-5.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const productSpecValueStore: unknown[] = [
  // Brent (templateId=1)
  { specValueId: 1,  templateId: 1, parameterId: 1, parameterCode: 'API_GRAVITY',    parameterName: 'API Gravity',                 parameterCategory: 'PHYSICAL', uomCode: null,   valueMin: 28.0, valueMax: 46.0, valueTypical: 38.5, valueExact: null, valueText: null, boundDirection: 'RANGE',    isMandatory: true,  testMethod: 'ASTM D5002', notes: 'Forties ~40-41°, Oseberg ~34-36°, Ekofisk ~41-43°, Brent ~38-39°' },
  { specValueId: 2,  templateId: 1, parameterId: 2, parameterCode: 'SULPHUR_PCT',    parameterName: 'Sulphur Content (%wt)',       parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: null, valueMax: 0.60, valueTypical: 0.26, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ASTM D4294', notes: 'Sweet crude. Forties ~0.26%, Ekofisk ~0.15%' },
  { specValueId: 3,  templateId: 1, parameterId: 7, parameterCode: 'BSW_PCT',        parameterName: 'Basic Sediment & Water (%vol)', parameterCategory: 'QUALITY', uomCode: null,  valueMin: null, valueMax: 0.50, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ASTM D4006', notes: null },
  { specValueId: 4,  templateId: 1, parameterId: 8, parameterCode: 'SALT_PTB',       parameterName: 'Salt Content (ptb)',          parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: null, valueMax: 50.0, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ASTM D1748', notes: 'Max 50 ptb (lbs/1000 bbls)' },
  // WTI (templateId=2)
  { specValueId: 5,  templateId: 2, parameterId: 1, parameterCode: 'API_GRAVITY',    parameterName: 'API Gravity',                 parameterCategory: 'PHYSICAL', uomCode: null,   valueMin: 37.0, valueMax: 42.0, valueTypical: 39.6, valueExact: null, valueText: null, boundDirection: 'RANGE',    isMandatory: true,  testMethod: 'ASTM D5002', notes: null },
  { specValueId: 6,  templateId: 2, parameterId: 2, parameterCode: 'SULPHUR_PCT',    parameterName: 'Sulphur Content (%wt)',       parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: null, valueMax: 0.42, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ASTM D4294', notes: 'Light sweet per NYMEX Rule 200' },
  { specValueId: 7,  templateId: 2, parameterId: 7, parameterCode: 'BSW_PCT',        parameterName: 'Basic Sediment & Water (%vol)', parameterCategory: 'QUALITY', uomCode: null,  valueMin: null, valueMax: 1.00, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ASTM D4006', notes: null },
  // TTF Gas (templateId=3)
  { specValueId: 8,  templateId: 3, parameterId: 14, parameterCode: 'GCV_MJSCM',     parameterName: 'Gross Calorific Value (MJ/scm)', parameterCategory: 'ENERGY', uomCode: null,  valueMin: 35.17, valueMax: 41.89, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'RANGE',   isMandatory: true,  testMethod: 'ISO 6976', notes: 'GCV at 25°C combustion, 15°C metering, dry basis' },
  { specValueId: 9,  templateId: 3, parameterId: 15, parameterCode: 'WOBBE_INDEX',   parameterName: 'Wobbe Index (MJ/scm)',         parameterCategory: 'ENERGY',   uomCode: null,   valueMin: 46.07, valueMax: 56.91, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'RANGE',   isMandatory: true,  testMethod: 'ISO 6976', notes: null },
  { specValueId: 10, templateId: 3, parameterId: 16, parameterCode: 'METHANE_PCT',   parameterName: 'Methane Content (%mol)',      parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: 81.3, valueMax: null,  valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MIN_ONLY', isMandatory: true,  testMethod: 'ISO 6974', notes: 'H-Gas minimum methane 81.3% mol' },
  { specValueId: 11, templateId: 3, parameterId: 17, parameterCode: 'CO2_PCT',       parameterName: 'CO2 Content (%mol)',          parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: null, valueMax: 2.5,  valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ISO 6974', notes: null },
  { specValueId: 12, templateId: 3, parameterId: 18, parameterCode: 'H2S_MG',        parameterName: 'H2S Content (mg/Nm3)',        parameterCategory: 'SAFETY',   uomCode: null,   valueMin: null, valueMax: 5.0,  valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'UOP 212', notes: 'H2S max 5.0 mg/Nm³ — corrosion control' },
  { specValueId: 13, templateId: 3, parameterId: 19, parameterCode: 'WATER_DEW',     parameterName: 'Water Dew Point (°C at bar)', parameterCategory: 'QUALITY',  uomCode: null,   valueMin: null, valueMax: -8.0, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'ISO 6327', notes: 'Water dew point max -8°C at 70 bar' },
  // LME Copper (templateId=4)
  { specValueId: 14, templateId: 4, parameterId: 30, parameterCode: 'PURITY_PCT',    parameterName: 'Purity (%)',                  parameterCategory: 'QUALITY',  uomCode: null,   valueMin: 99.9935, valueMax: null, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MIN_ONLY', isMandatory: true, testMethod: 'EN ISO 1553', notes: 'Minimum 99.9935% Cu+Ag combined' },
  { specValueId: 15, templateId: 4, parameterId: 31, parameterCode: 'LME_BRAND',     parameterName: 'LME Approved Brand',          parameterCategory: 'REGULATORY', uomCode: null, valueMin: null, valueMax: null, valueTypical: null, valueExact: null, valueText: 'TRUE', boundDirection: 'EXACT', isMandatory: true, testMethod: 'LME Brand Register', notes: 'Must be from LME-approved smelter list' },
  { specValueId: 16, templateId: 4, parameterId: 32, parameterCode: 'COPPER_PCT',    parameterName: 'Copper Content (%)',          parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: 99.0, valueMax: null, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MIN_ONLY', isMandatory: true, testMethod: 'EN ISO 1553', notes: 'Copper excluding silver ≥ 99.0%' },
  // ULSD-10PPM (templateId=5)
  { specValueId: 17, templateId: 5, parameterId: 39, parameterCode: 'DENSITY_KGL',   parameterName: 'Density @ 15°C (kg/L)',       parameterCategory: 'PHYSICAL', uomCode: 'KG/L', valueMin: 0.820, valueMax: 0.845, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'RANGE',   isMandatory: true,  testMethod: 'EN ISO 12185', notes: 'Density at 15°C in kg/L' },
  { specValueId: 18, templateId: 5, parameterId: 2,  parameterCode: 'SULPHUR_PCT',   parameterName: 'Sulphur Content (%wt)',       parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: null, valueMax: 0.001, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true,  testMethod: 'EN ISO 20884', notes: 'Sulphur max 10ppm = 0.001% mass — ULSD threshold' },
  { specValueId: 19, templateId: 5, parameterId: 40, parameterCode: 'CETANE_INDEX',  parameterName: 'Cetane Index / Number',       parameterCategory: 'QUALITY',  uomCode: null,   valueMin: 51.0, valueMax: null, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MIN_ONLY', isMandatory: true,  testMethod: 'EN ISO 5165', notes: 'Cetane min 51 — EN590 combustion quality' },
  { specValueId: 20, templateId: 5, parameterId: 12, parameterCode: 'FLASH_POINT',   parameterName: 'Flash Point (°C)',            parameterCategory: 'SAFETY',   uomCode: null,   valueMin: 55.0, valueMax: null, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MIN_ONLY', isMandatory: true,  testMethod: 'EN ISO 2719', notes: 'Flash point min 55°C — safety classification' },
  { specValueId: 21, templateId: 5, parameterId: 3,  parameterCode: 'VISCOSITY_40',  parameterName: 'Kinematic Viscosity @ 40°C', parameterCategory: 'PHYSICAL', uomCode: 'cSt',  valueMin: 2.00, valueMax: 4.50, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'RANGE',    isMandatory: true,  testMethod: 'EN ISO 3104', notes: 'Viscosity at 40°C in mm²/s (cSt)' },
  { specValueId: 22, templateId: 5, parameterId: 42, parameterCode: 'DISTILL_T95',   parameterName: 'Distillation T95 (°C)',       parameterCategory: 'PHYSICAL', uomCode: null,   valueMin: null, valueMax: 360.0, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true, testMethod: 'EN ISO 3405', notes: 'T95 max 360°C limits heavy residue' },
  { specValueId: 23, templateId: 5, parameterId: 43, parameterCode: 'LUBRICITY',     parameterName: 'Lubricity HFRR (µm)',         parameterCategory: 'PHYSICAL', uomCode: 'µm',   valueMin: null, valueMax: 460.0, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true, testMethod: 'EN ISO 12156-1', notes: 'HFRR wear scar diameter max 460 µm at 60°C' },
  // GAS97-BLEND (templateId=6)
  { specValueId: 24, templateId: 6, parameterId: 39, parameterCode: 'DENSITY_KGL',   parameterName: 'Density @ 15°C (kg/L)',       parameterCategory: 'PHYSICAL', uomCode: 'KG/L', valueMin: 0.720, valueMax: 0.775, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'RANGE',   isMandatory: true,  testMethod: 'EN ISO 12185', notes: 'Lower than ULSD base due to ethanol addition' },
  { specValueId: 25, templateId: 6, parameterId: 2,  parameterCode: 'SULPHUR_PCT',   parameterName: 'Sulphur Content (%wt)',       parameterCategory: 'CHEMICAL', uomCode: null,   valueMin: null, valueMax: 0.001, valueTypical: null, valueExact: null, valueText: null, boundDirection: 'MAX_ONLY', isMandatory: true, testMethod: 'EN ISO 20884', notes: null },
  { specValueId: 26, templateId: 6, parameterId: 46, parameterCode: 'ETHANOL_PCT',   parameterName: 'Ethanol Blend Content (%vol)', parameterCategory: 'QUALITY', uomCode: '%vol', valueMin: 2.70, valueMax: 3.30, valueTypical: 3.0, valueExact: null, valueText: null, boundDirection: 'RANGE',   isMandatory: true,  testMethod: 'EN ISO 5275', notes: '3%vol ± 0.3%vol blend ratio' },
];

// ─── PRODUCT BLEND COMPONENTS ─────────────────────────────────────────────────
const productBlendComponentStore: unknown[] = [
  // GAS97-BLEND (productId=15) = 97% ULSD-10PPM (productId=13) + 3% ETHANOL (productId=14)
  { blendComponentId: 1, parentProductId: 15, componentProductId: 13, componentCode: 'ULSD-10PPM', componentName: 'Ultra-Low Sulphur Diesel 10ppm', sequenceNo: 1, minPct: 95.00, targetPct: 97.00, maxPct: 99.00, tolerancePct: 0.50, needsPositionGen: true,  notes: 'ULSD-10PPM base component — volume basis. Target 97%vol, tolerance ±0.5%vol.', isActive: true },
  { blendComponentId: 2, parentProductId: 15, componentProductId: 14, componentCode: 'ETHANOL',    componentName: 'Fuel Ethanol (Denatured, Industrial Grade)', sequenceNo: 2, minPct: 1.00, targetPct: 3.00, maxPct: 5.00, tolerancePct: 0.25, needsPositionGen: false, notes: 'Denatured ethanol — volume basis. Target 3%vol (E3). Max 5%vol (EN228 E5 limit).', isActive: true },
];

// ─── PRODUCT REPORTING GROUPS ─────────────────────────────────────────────────
// reportingGroupId → { classificationTypeId, classificationTypeCode, groupName }
// (V63 seed, see referenceData.ts's reporting_group/lookup_value rowSeed —
// lookupId 1=POSITION, 2=VAR, 3=SETTLEMENT)
const REPORTING_GROUP_LOOKUP: Record<number, { classificationTypeId: number; classificationTypeCode: string; groupName: string }> = {
  1:  { classificationTypeId: 1, classificationTypeCode: 'POSITION',   groupName: 'Light Distillates' },
  2:  { classificationTypeId: 1, classificationTypeCode: 'POSITION',   groupName: 'Crude Oil' },
  3:  { classificationTypeId: 1, classificationTypeCode: 'POSITION',   groupName: 'Natural Gas' },
  4:  { classificationTypeId: 1, classificationTypeCode: 'POSITION',   groupName: 'Power' },
  5:  { classificationTypeId: 1, classificationTypeCode: 'POSITION',   groupName: 'Metals' },
  6:  { classificationTypeId: 1, classificationTypeCode: 'POSITION',   groupName: 'Agricultural' },
  7:  { classificationTypeId: 2, classificationTypeCode: 'VAR',        groupName: 'Energy Risk Class' },
  8:  { classificationTypeId: 2, classificationTypeCode: 'VAR',        groupName: 'Metals Risk Class' },
  9:  { classificationTypeId: 2, classificationTypeCode: 'VAR',        groupName: 'Agricultural Risk Class' },
  10: { classificationTypeId: 3, classificationTypeCode: 'SETTLEMENT', groupName: 'GL — Energy' },
  11: { classificationTypeId: 3, classificationTypeCode: 'SETTLEMENT', groupName: 'GL — Metals' },
  12: { classificationTypeId: 3, classificationTypeCode: 'SETTLEMENT', groupName: 'GL — Agricultural' },
};
const productReportingGroupStore: unknown[] = [
  // BRENT-CRUDE (productId=1)
  { productReportingGroupId: 1, productId: 1, reportingGroupId: 2 },
  { productReportingGroupId: 2, productId: 1, reportingGroupId: 7 },
  // WTI-CRUDE (productId=2)
  { productReportingGroupId: 3, productId: 2, reportingGroupId: 2 },
  { productReportingGroupId: 4, productId: 2, reportingGroupId: 7 },
  // TTF-GAS (productId=4)
  { productReportingGroupId: 5, productId: 4, reportingGroupId: 3 },
  { productReportingGroupId: 6, productId: 4, reportingGroupId: 7 },
  { productReportingGroupId: 7, productId: 4, reportingGroupId: 10 },
  // LME-COPPER (productId=6)
  { productReportingGroupId: 8, productId: 6, reportingGroupId: 5 },
  { productReportingGroupId: 9, productId: 6, reportingGroupId: 8 },
  { productReportingGroupId: 10, productId: 6, reportingGroupId: 11 },
  // EEX-DE-POWER (productId=8)
  { productReportingGroupId: 11, productId: 8, reportingGroupId: 4 },
  { productReportingGroupId: 12, productId: 8, reportingGroupId: 7 },
  // CBOT-CORN (productId=12)
  { productReportingGroupId: 13, productId: 12, reportingGroupId: 6 },
  { productReportingGroupId: 14, productId: 12, reportingGroupId: 9 },
  { productReportingGroupId: 15, productId: 12, reportingGroupId: 12 },
  // ULSD-10PPM (productId=13)
  { productReportingGroupId: 16, productId: 13, reportingGroupId: 1 },
  { productReportingGroupId: 17, productId: 13, reportingGroupId: 7 },
  { productReportingGroupId: 18, productId: 13, reportingGroupId: 10 },
  // GAS97-BLEND (productId=15)
  { productReportingGroupId: 19, productId: 15, reportingGroupId: 1 },
  { productReportingGroupId: 20, productId: 15, reportingGroupId: 7 },
  { productReportingGroupId: 21, productId: 15, reportingGroupId: 10 },
].map((r) => ({ ...r, ...REPORTING_GROUP_LOOKUP[(r as { reportingGroupId: number }).reportingGroupId] }));

// ─── PRODUCT PRICE INDEX LINKS ────────────────────────────────────────────────
const productPriceIndexStore: unknown[] = [
  // Brent Crude — Physical OTC
  { productIndexId: 1, productId: 1, priceIndexId: 1,  indexCode: 'DTBRT',      indexName: 'Platts Dated Brent',           publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', role: 'PRIMARY_MTM', isPrimary: true,  isActive: true },
  { productIndexId: 2, productId: 1, priceIndexId: 9,  indexCode: 'ARGUS-URALS', indexName: 'Argus Urals Med',             publicationSource: 'ARGUS',  currencyCode: 'USD', uomCode: 'BBL', role: 'REFERENCE',   isPrimary: false, isActive: true },
  // WTI Crude — Physical OTC
  { productIndexId: 3, productId: 2, priceIndexId: 2,  indexCode: 'WTI-NYMEX',  indexName: 'NYMEX WTI Front Month',        publicationSource: 'NYMEX',  currencyCode: 'USD', uomCode: 'BBL', role: 'PRIMARY_MTM', isPrimary: true,  isActive: true },
  // Brent Futures
  { productIndexId: 4, productId: 3, priceIndexId: 1,  indexCode: 'DTBRT',      indexName: 'Platts Dated Brent',           publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', role: 'SETTLEMENT',  isPrimary: true,  isActive: true },
  { productIndexId: 5, productId: 3, priceIndexId: 2,  indexCode: 'WTI-NYMEX',  indexName: 'NYMEX WTI Front Month',        publicationSource: 'NYMEX',  currencyCode: 'USD', uomCode: 'BBL', role: 'REFERENCE',   isPrimary: false, isActive: true },
  // TTF Gas
  { productIndexId: 6, productId: 4, priceIndexId: 3,  indexCode: 'TTF-ICE',    indexName: 'ICE TTF Natural Gas',          publicationSource: 'ICE',    currencyCode: 'EUR', uomCode: 'MWH', role: 'PRIMARY_MTM', isPrimary: true,  isActive: true },
  // NBP Gas
  { productIndexId: 7, productId: 5, priceIndexId: 4,  indexCode: 'NBP-ICE',    indexName: 'ICE UK NBP Natural Gas',       publicationSource: 'ICE',    currencyCode: 'GBP', uomCode: 'THERM', role: 'PRIMARY_MTM', isPrimary: true, isActive: true },
  // LME Copper
  { productIndexId: 8, productId: 6, priceIndexId: 6,  indexCode: 'LME-CU-CASH', indexName: 'LME Copper Cash',            publicationSource: 'LME',    currencyCode: 'USD', uomCode: 'MT', role: 'PRIMARY_MTM', isPrimary: true,  isActive: true },
  // LME Aluminium
  { productIndexId: 9, productId: 7, priceIndexId: 7,  indexCode: 'LME-AL-CASH', indexName: 'LME Aluminium Cash',         publicationSource: 'LME',    currencyCode: 'USD', uomCode: 'MT', role: 'PRIMARY_MTM', isPrimary: true,  isActive: true },
  // EEX Power
  { productIndexId: 10, productId: 8, priceIndexId: 8, indexCode: 'EEX-DE-SPOT', indexName: 'EEX Germany Day-Ahead Power', publicationSource: 'EEX',   currencyCode: 'EUR', uomCode: 'MWH', role: 'PRIMARY_MTM', isPrimary: true,  isActive: true },
  // JKM LNG
  { productIndexId: 11, productId: 11, priceIndexId: 19, indexCode: 'JKM',       indexName: 'Platts JKM LNG Japan/Korea Marker', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'MMBTU', role: 'PRIMARY_MTM', isPrimary: true, isActive: true },
  // CBOT Corn
  { productIndexId: 12, productId: 12, priceIndexId: 29, indexCode: 'CBOT-CORN', indexName: 'CBOT Corn Futures Front Month', publicationSource: 'CME',  currencyCode: 'USD', uomCode: 'BUSHEL', role: 'PRIMARY_MTM', isPrimary: true, isActive: true },
];

// ─── PRICE INDICES ────────────────────────────────────────────────────────────
const priceIndicesStore: unknown[] = [
  { priceIndexId: 1, indexCode: 'DTBRT', indexName: 'Platts Dated Brent', commodityType: 'OIL', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Europe/London', publishedPage: 'AAQUA', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 2, indexCode: 'WTI-NYMEX', indexName: 'NYMEX WTI Front Month', commodityType: 'OIL', publicationSource: 'NYMEX', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '14:30', fixingTimezone: 'America/New_York', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 3, indexCode: 'TTF-ICE', indexName: 'ICE TTF Natural Gas', commodityType: 'GAS', publicationSource: 'ICE', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '17:00', fixingTimezone: 'Europe/Amsterdam', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 4, indexCode: 'NBP-ICE', indexName: 'ICE UK NBP Natural Gas', commodityType: 'GAS', publicationSource: 'ICE', currencyCode: 'GBP', uomCode: 'THERM', fixingTime: '17:00', fixingTimezone: 'Europe/London', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 5, indexCode: 'HH', indexName: 'Henry Hub Natural Gas', commodityType: 'GAS', publicationSource: 'NYMEX', currencyCode: 'USD', uomCode: 'MMBTU', fixingTime: '14:30', fixingTimezone: 'America/New_York', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 6, indexCode: 'LME-CU-CASH', indexName: 'LME Copper Cash', commodityType: 'METALS', publicationSource: 'LME', currencyCode: 'USD', uomCode: 'MT', fixingTime: '13:00', fixingTimezone: 'Europe/London', publishedPage: 'METALS BULLETIN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 7, indexCode: 'LME-AL-CASH', indexName: 'LME Aluminium Cash', commodityType: 'METALS', publicationSource: 'LME', currencyCode: 'USD', uomCode: 'MT', fixingTime: '13:00', fixingTimezone: 'Europe/London', publishedPage: 'METALS BULLETIN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 8, indexCode: 'EEX-DE-SPOT', indexName: 'EEX Germany Day-Ahead Power', commodityType: 'POWER', publicationSource: 'EEX', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '12:00', fixingTimezone: 'Europe/Berlin', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 9, indexCode: 'ARGUS-URALS', indexName: 'Argus Urals Med', commodityType: 'OIL', publicationSource: 'ARGUS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Europe/London', publishedPage: 'AP-0001', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 10, indexCode: 'JCC', indexName: 'Japan Crude Cocktail', commodityType: 'OIL', publicationSource: 'REUTERS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: null, fixingTimezone: null, publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // OIL — additional grades
  { priceIndexId: 11, indexCode: 'DUBAI-OMAN', indexName: 'Platts Dubai/Oman Crude', commodityType: 'OIL', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Europe/London', publishedPage: 'AAFRT00', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 12, indexCode: 'ESPO', indexName: 'Platts ESPO Blend CIF Japan', commodityType: 'OIL', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Asia/Singapore', publishedPage: 'AAFRT01', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 13, indexCode: 'BONNY-LIGHT', indexName: 'Argus Bonny Light FOB', commodityType: 'OIL', publicationSource: 'ARGUS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Europe/London', publishedPage: 'AP-0002', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 14, indexCode: 'BASRA-LIGHT', indexName: 'Platts Basra Light FOB', commodityType: 'OIL', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Europe/London', publishedPage: 'AAFRT02', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 15, indexCode: 'ARAB-HEAVY', indexName: 'Platts Arab Heavy FOB Ras Tanura', commodityType: 'OIL', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'BBL', fixingTime: '16:30', fixingTimezone: 'Europe/London', publishedPage: 'AAFRT03', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // GAS
  { priceIndexId: 16, indexCode: 'GASPOOL', indexName: 'Gaspool (GPL) Day-Ahead Index', commodityType: 'GAS', publicationSource: 'EEX', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '17:00', fixingTimezone: 'Europe/Berlin', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 17, indexCode: 'NCG', indexName: 'NetConnect Germany Day-Ahead', commodityType: 'GAS', publicationSource: 'EEX', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '17:00', fixingTimezone: 'Europe/Berlin', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 18, indexCode: 'ZTP', indexName: 'Zeebrugge Trading Point Day-Ahead', commodityType: 'GAS', publicationSource: 'ICE', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '17:00', fixingTimezone: 'Europe/Brussels', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 19, indexCode: 'JKM', indexName: 'Platts JKM LNG Japan/Korea Marker', commodityType: 'GAS', publicationSource: 'PLATTS', currencyCode: 'USD', uomCode: 'MMBTU', fixingTime: '16:30', fixingTimezone: 'Asia/Singapore', publishedPage: 'ASGIM00', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 20, indexCode: 'AECO', indexName: 'AECO Alberta Gas Price', commodityType: 'GAS', publicationSource: 'NGX', currencyCode: 'CAD', uomCode: 'MMBTU', fixingTime: '14:00', fixingTimezone: 'America/Edmonton', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // POWER
  { priceIndexId: 21, indexCode: 'EPEX-FR-DA', indexName: 'EPEX France Day-Ahead', commodityType: 'POWER', publicationSource: 'EPEX', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '12:00', fixingTimezone: 'Europe/Paris', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 22, indexCode: 'N2EX-UK', indexName: 'N2EX UK Day-Ahead Power', commodityType: 'POWER', publicationSource: 'EPEX', currencyCode: 'GBP', uomCode: 'MWH', fixingTime: '10:30', fixingTimezone: 'Europe/London', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 23, indexCode: 'GME-IT-DA', indexName: 'GME Italy Day-Ahead (PUN)', commodityType: 'POWER', publicationSource: 'GME', currencyCode: 'EUR', uomCode: 'MWH', fixingTime: '12:00', fixingTimezone: 'Europe/Rome', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // METALS
  { priceIndexId: 24, indexCode: 'LME-ZN-CASH', indexName: 'LME Zinc Cash Official', commodityType: 'METALS', publicationSource: 'LME', currencyCode: 'USD', uomCode: 'MT', fixingTime: '13:00', fixingTimezone: 'Europe/London', publishedPage: 'METALS BULLETIN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 25, indexCode: 'LME-NI-CASH', indexName: 'LME Nickel Cash Official', commodityType: 'METALS', publicationSource: 'LME', currencyCode: 'USD', uomCode: 'MT', fixingTime: '13:00', fixingTimezone: 'Europe/London', publishedPage: 'METALS BULLETIN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 26, indexCode: 'LME-PB-CASH', indexName: 'LME Lead Cash Official', commodityType: 'METALS', publicationSource: 'LME', currencyCode: 'USD', uomCode: 'MT', fixingTime: '13:00', fixingTimezone: 'Europe/London', publishedPage: 'METALS BULLETIN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 27, indexCode: 'LME-SN-CASH', indexName: 'LME Tin Cash Official', commodityType: 'METALS', publicationSource: 'LME', currencyCode: 'USD', uomCode: 'MT', fixingTime: '13:00', fixingTimezone: 'Europe/London', publishedPage: 'METALS BULLETIN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 28, indexCode: 'SHFE-CU', indexName: 'SHFE Copper Front Month', commodityType: 'METALS', publicationSource: 'SHFE', currencyCode: 'CNY', uomCode: 'MT', fixingTime: '15:00', fixingTimezone: 'Asia/Shanghai', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // AGRICULTURAL
  { priceIndexId: 29, indexCode: 'CBOT-CORN', indexName: 'CBOT Corn Futures Front Month', commodityType: 'AGRICULTURAL', publicationSource: 'CME', currencyCode: 'USD', uomCode: 'BUSHEL', fixingTime: '14:20', fixingTimezone: 'America/Chicago', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 30, indexCode: 'CBOT-WHEAT', indexName: 'CBOT Wheat (SRW) Futures Front Month', commodityType: 'AGRICULTURAL', publicationSource: 'CME', currencyCode: 'USD', uomCode: 'BUSHEL', fixingTime: '14:20', fixingTimezone: 'America/Chicago', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 31, indexCode: 'CBOT-SOYBEAN', indexName: 'CBOT Soybean Futures Front Month', commodityType: 'AGRICULTURAL', publicationSource: 'CME', currencyCode: 'USD', uomCode: 'BUSHEL', fixingTime: '14:20', fixingTimezone: 'America/Chicago', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 32, indexCode: 'EURONEXT-RAPESEED', indexName: 'Euronext Rapeseed Futures', commodityType: 'AGRICULTURAL', publicationSource: 'EURONEXT', currencyCode: 'EUR', uomCode: 'MT', fixingTime: '18:30', fixingTimezone: 'Europe/Paris', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceIndexId: 33, indexCode: 'EURONEXT-WHEAT', indexName: 'Euronext Milling Wheat Futures', commodityType: 'AGRICULTURAL', publicationSource: 'EURONEXT', currencyCode: 'EUR', uomCode: 'MT', fixingTime: '18:30', fixingTimezone: 'Europe/Paris', publishedPage: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── EXCHANGES ────────────────────────────────────────────────────────────────
const exchangesStore: unknown[] = [
  { exchangeId: 1, exchangeCode: 'ICE', exchangeName: 'Intercontinental Exchange', exchangeType: 'EXCHANGE', countryCode: 'GB', timezone: 'Europe/London', currencyCode: 'USD', micCode: 'XICE', regulator: 'FCA', clearingHouse: 'ICE Clear Europe', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { exchangeId: 2, exchangeCode: 'NYMEX', exchangeName: 'New York Mercantile Exchange', exchangeType: 'EXCHANGE', countryCode: 'US', timezone: 'America/New_York', currencyCode: 'USD', micCode: 'XNYM', regulator: 'CFTC', clearingHouse: 'CME Clearing', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { exchangeId: 3, exchangeCode: 'LME', exchangeName: "London Metal Exchange", exchangeType: 'EXCHANGE', countryCode: 'GB', timezone: 'Europe/London', currencyCode: 'USD', micCode: 'XLME', regulator: 'FCA', clearingHouse: 'LME Clear', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { exchangeId: 4, exchangeCode: 'EEX', exchangeName: 'European Energy Exchange', exchangeType: 'EXCHANGE', countryCode: 'DE', timezone: 'Europe/Berlin', currencyCode: 'EUR', micCode: 'XEEX', regulator: 'BaFin / BNetzA', clearingHouse: 'ECC', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { exchangeId: 5, exchangeCode: 'CME', exchangeName: 'Chicago Mercantile Exchange', exchangeType: 'EXCHANGE', countryCode: 'US', timezone: 'America/Chicago', currencyCode: 'USD', micCode: 'XCME', regulator: 'CFTC', clearingHouse: 'CME Clearing', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { exchangeId: 6, exchangeCode: 'TOCOM', exchangeName: 'Tokyo Commodity Exchange', exchangeType: 'EXCHANGE', countryCode: 'JP', timezone: 'Asia/Tokyo', currencyCode: 'JPY', micCode: 'XTKT', regulator: 'FSA Japan', clearingHouse: 'TOCOM Clearing', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── LOCATIONS ────────────────────────────────────────────────────────────────
const locationsStore: unknown[] = [
  { locationId: 1, locationCode: 'SULLOM-VOE', locationName: 'Sullom Voe Terminal', locationTypeCode: 'PORT', commodityType: 'OIL', countryCode: 'GB', portCode: 'SUL', unlocode: 'GBSUL', operator: 'Shetland Islands Council / Equinor', capacity: 12000000, capacityUomCode: 'BBL', latitude: 60.4833, longitude: -1.3167, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 2, locationCode: 'RAS-TANURA', locationName: 'Ras Tanura Terminal', locationTypeCode: 'PORT', commodityType: 'OIL', countryCode: 'SA', portCode: 'RAT', unlocode: 'SARAR', operator: 'Saudi Aramco', capacity: 40000000, capacityUomCode: 'BBL', latitude: 26.6500, longitude: 50.1667, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 3, locationCode: 'CUSHING-OK', locationName: 'Cushing Oklahoma Hub', locationTypeCode: 'PIPELINE_HUB', commodityType: 'OIL', countryCode: 'US', portCode: null, unlocode: null, operator: 'Multiple', capacity: 80000000, capacityUomCode: 'BBL', latitude: 35.9847, longitude: -96.7693, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 4, locationCode: 'NBP-UK', locationName: 'National Balancing Point UK', locationTypeCode: 'GAS_HUB', commodityType: 'GAS', countryCode: 'GB', portCode: null, unlocode: null, operator: 'National Gas Transmission', capacity: null, capacityUomCode: null, latitude: null, longitude: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 5, locationCode: 'TTF-NL', locationName: 'Title Transfer Facility Netherlands', locationTypeCode: 'GAS_HUB', commodityType: 'GAS', countryCode: 'NL', portCode: null, unlocode: null, operator: 'Gasunie Transport Services', capacity: null, capacityUomCode: null, latitude: null, longitude: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 6, locationCode: 'ROTTERDAM', locationName: 'Port of Rotterdam', locationTypeCode: 'PORT', commodityType: null, countryCode: 'NL', portCode: 'RTM', unlocode: 'NLRTM', operator: 'Port of Rotterdam Authority', capacity: null, capacityUomCode: null, latitude: 51.9225, longitude: 4.4792, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 7, locationCode: 'LME-WAREHOUSE', locationName: 'LME Rotterdam Approved Warehouse', locationTypeCode: 'WAREHOUSE', commodityType: 'METALS', countryCode: 'NL', portCode: null, unlocode: 'NLRTM', operator: 'Steinweg BV', capacity: 100000, capacityUomCode: 'MT', latitude: 51.9225, longitude: 4.4792, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { locationId: 8, locationCode: 'FREEPORT-LNG', locationName: 'Freeport LNG Terminal', locationTypeCode: 'LNG_TERMINAL', commodityType: 'GAS', countryCode: 'US', portCode: null, unlocode: 'USFPT', operator: 'Freeport LNG Development', capacity: 15000000, capacityUomCode: 'MMBTU', latitude: 28.9000, longitude: -95.3700, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── VESSELS ──────────────────────────────────────────────────────────────────
const vesselsStore: unknown[] = [
  { vesselId: 1, imoNumber: 'IMO 9741060', vesselName: 'NORDIC LUNA', vesselType: 'VLCC', dwt: 307285, grossTonnage: 162028, buildYear: 2016, flag: 'MH', owner: 'Nordic Tankers AS', operator: 'Trafigura Maritime Logistics', classificationSociety: 'DNV', vettingExpiry: '2026-09-15', sireInspectionDate: '2025-09-15', cdiBerthStatus: 'APPROVED', statusCode: 'ACTIVE', grainCapacityCbm: null, baleCapacityCbm: null, guaranteedBoilOffRatePctPerDay: null, heelCapacityCbm: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 2, imoNumber: 'IMO 9634454', vesselName: 'FRONT ALTAIR', vesselType: 'SUEZMAX', dwt: 158000, grossTonnage: 86402, buildYear: 2013, flag: 'LR', owner: 'Frontline Ltd', operator: 'Frontline Management', classificationSociety: 'LR', vettingExpiry: '2026-08-01', sireInspectionDate: '2025-08-01', cdiBerthStatus: 'APPROVED', statusCode: 'ON_CHARTER', grainCapacityCbm: null, baleCapacityCbm: null, guaranteedBoilOffRatePctPerDay: null, heelCapacityCbm: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 3, imoNumber: 'IMO 9387890', vesselName: 'SCF SAKHALIN', vesselType: 'AFRAMAX', dwt: 105936, grossTonnage: 60196, buildYear: 2009, flag: 'CY', owner: 'Sovcomflot PAO', operator: 'Sovcomflot', classificationSociety: 'BV', vettingExpiry: '2026-07-10', sireInspectionDate: '2025-07-10', cdiBerthStatus: null, statusCode: 'ACTIVE', grainCapacityCbm: null, baleCapacityCbm: null, guaranteedBoilOffRatePctPerDay: null, heelCapacityCbm: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 4, imoNumber: 'IMO 9812744', vesselName: 'MARATHON TS', vesselType: 'MR', dwt: 49900, grossTonnage: 28500, buildYear: 2020, flag: 'PA', owner: 'Marathon Tanker AS', operator: 'Hafnia Management', classificationSociety: 'ABS', vettingExpiry: '2026-12-31', sireInspectionDate: '2025-12-31', cdiBerthStatus: 'APPROVED', statusCode: 'ACTIVE', grainCapacityCbm: null, baleCapacityCbm: null, guaranteedBoilOffRatePctPerDay: null, heelCapacityCbm: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 5, imoNumber: 'IMO 9462082', vesselName: 'ENERGY INNOVATOR', vesselType: 'LNG_CARRIER', dwt: 88000, grossTonnage: 107000, buildYear: 2011, flag: 'MH', owner: 'Teekay LNG AS', operator: 'Teekay LNG Partners', classificationSociety: 'LR', vettingExpiry: '2026-06-01', sireInspectionDate: '2025-06-01', cdiBerthStatus: null, statusCode: 'ON_CHARTER', grainCapacityCbm: null, baleCapacityCbm: null, guaranteedBoilOffRatePctPerDay: 0.10, heelCapacityCbm: 3000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 6, imoNumber: 'IMO 9203536', vesselName: 'BUNGA KASTURI LIMA', vesselType: 'VLCC', dwt: 298337, grossTonnage: 160283, buildYear: 2001, flag: 'MY', owner: 'MISC Berhad', operator: 'MISC Petroleum', classificationSociety: 'LR', vettingExpiry: '2026-05-15', sireInspectionDate: '2025-05-15', cdiBerthStatus: 'CONDITIONAL', statusCode: 'IN_DRYDOCK', grainCapacityCbm: null, baleCapacityCbm: null, guaranteedBoilOffRatePctPerDay: null, heelCapacityCbm: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 7, imoNumber: 'IMO 9695123', vesselName: 'CAPE ENDURANCE', vesselType: 'BULK_CARRIER', dwt: 180000, grossTonnage: 93000, buildYear: 2017, flag: 'PA', owner: 'Star Bulk Carriers Corp', operator: 'Star Bulk Management', classificationSociety: 'ABS', vettingExpiry: null, sireInspectionDate: null, cdiBerthStatus: null, statusCode: 'ACTIVE', grainCapacityCbm: 198000, baleCapacityCbm: 189500, guaranteedBoilOffRatePctPerDay: null, heelCapacityCbm: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── PIPELINES ────────────────────────────────────────────────────────────────
const pipelinesStore: unknown[] = [
  { pipelineId: 1, pipelineCode: 'TANAP', pipelineName: 'Trans-Anatolian Natural Gas Pipeline', pipelineType: 'NATURAL_GAS', originLocationId: null, destinationLocationId: null, originLocationCode: 'SHAH-DENIZ', destinationLocationCode: 'TURKEY-EU', lengthKm: 1850, diameterInch: 56, capacityPerDay: 16000000000, capacityUomCode: 'SCFD', tso: 'BOTAŞ / SOCAR', regulatoryBody: 'EMRA Turkey', tariffCurrencyCode: 'USD', statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pipelineId: 2, pipelineCode: 'DRUZHBA-S', pipelineName: 'Druzhba Pipeline South Branch', pipelineType: 'CRUDE_OIL', originLocationId: null, destinationLocationId: null, originLocationCode: 'ALMETYEVSK-RU', destinationLocationCode: 'BRATISLAVA-SK', lengthKm: 3900, diameterInch: 48, capacityPerDay: 1200000, capacityUomCode: 'BBL', tso: 'Transneft', regulatoryBody: 'Federal Antimonopoly Service', tariffCurrencyCode: 'USD', statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pipelineId: 3, pipelineCode: 'IUK', pipelineName: 'Interconnector UK', pipelineType: 'NATURAL_GAS', originLocationId: null, destinationLocationId: null, originLocationCode: 'BACTON-GB', destinationLocationCode: 'ZEEBRUGGE-BE', lengthKm: 235, diameterInch: 40, capacityPerDay: 25600000000, capacityUomCode: 'BTU', tso: 'Fluxys / National Gas', regulatoryBody: 'Ofgem', tariffCurrencyCode: 'GBP', statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pipelineId: 4, pipelineCode: 'CAPLINE', pipelineName: 'Capline Crude Pipeline', pipelineType: 'CRUDE_OIL', originLocationId: null, destinationLocationId: null, originLocationCode: 'ST-JAMES-LA', destinationLocationCode: 'PATOKA-IL', lengthKm: 1321, diameterInch: 40, capacityPerDay: 1200000, capacityUomCode: 'BBL', tso: 'Shell Pipeline / BP Pipelines', regulatoryBody: 'FERC', tariffCurrencyCode: 'USD', statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── HOLIDAY CALENDARS ────────────────────────────────────────────────────────
const holidayCalendarsStore: unknown[] = [
  { calendarId: 1, calendarCode: 'LON', calendarName: 'London Banking Days', calendarType: 'BANKING', countryCode: 'GB', currencyCode: 'GBP', description: 'UK public holidays and Bank Holidays as observed by the London interbank market', isActive: true, holidayCount: 82, createdAt: '2024-01-01T00:00:00Z' },
  { calendarId: 2, calendarCode: 'NYC', calendarName: 'New York Federal Reserve', calendarType: 'BANKING', countryCode: 'US', currencyCode: 'USD', description: 'US Federal Reserve banking holidays — SIFMA calendar basis', isActive: true, holidayCount: 80, createdAt: '2024-01-01T00:00:00Z' },
  { calendarId: 3, calendarCode: 'NYMEX', calendarName: 'NYMEX Exchange Calendar', calendarType: 'EXCHANGE', countryCode: 'US', currencyCode: 'USD', description: 'CME/NYMEX exchange trading holidays', isActive: true, holidayCount: 65, createdAt: '2024-01-01T00:00:00Z' },
  { calendarId: 4, calendarCode: 'LME', calendarName: 'London Metal Exchange', calendarType: 'COMMODITY', countryCode: 'GB', currencyCode: 'USD', description: 'LME ring trading holidays and closure dates', isActive: true, holidayCount: 70, createdAt: '2024-01-01T00:00:00Z' },
  { calendarId: 5, calendarCode: 'ECB', calendarName: 'ECB Target Calendar', calendarType: 'BANKING', countryCode: null, currencyCode: 'EUR', description: 'European Central Bank TARGET2 payment system holidays — applies to EUR settlements', isActive: true, holidayCount: 58, createdAt: '2024-01-01T00:00:00Z' },
  { calendarId: 6, calendarCode: 'ICE-EU', calendarName: 'ICE Futures Europe', calendarType: 'EXCHANGE', countryCode: 'GB', currencyCode: 'USD', description: 'ICE Futures Europe exchange holidays — Brent, Gasoil, TTF', isActive: true, holidayCount: 66, createdAt: '2024-01-01T00:00:00Z' },
];

const holidayDates: Record<number, unknown[]> = {
  1: [
    { holidayId: 1, calendarId: 1, holidayDate: '2026-01-01', holidayName: "New Year's Day", isPartialDay: false, endTime: null },
    { holidayId: 2, calendarId: 1, holidayDate: '2026-04-03', holidayName: 'Good Friday', isPartialDay: false, endTime: null },
    { holidayId: 3, calendarId: 1, holidayDate: '2026-04-06', holidayName: 'Easter Monday', isPartialDay: false, endTime: null },
    { holidayId: 4, calendarId: 1, holidayDate: '2026-05-04', holidayName: 'Early May Bank Holiday', isPartialDay: false, endTime: null },
    { holidayId: 5, calendarId: 1, holidayDate: '2026-05-25', holidayName: 'Spring Bank Holiday', isPartialDay: false, endTime: null },
    { holidayId: 6, calendarId: 1, holidayDate: '2026-08-31', holidayName: 'Summer Bank Holiday', isPartialDay: false, endTime: null },
    { holidayId: 7, calendarId: 1, holidayDate: '2026-12-24', holidayName: 'Christmas Eve (Early Close)', isPartialDay: true, endTime: '12:00' },
    { holidayId: 8, calendarId: 1, holidayDate: '2026-12-25', holidayName: 'Christmas Day', isPartialDay: false, endTime: null },
    { holidayId: 9, calendarId: 1, holidayDate: '2026-12-28', holidayName: 'Boxing Day (observed)', isPartialDay: false, endTime: null },
    { holidayId: 10, calendarId: 1, holidayDate: '2026-12-31', holidayName: "New Year's Eve (Early Close)", isPartialDay: true, endTime: '12:00' },
  ],
};

// ─── PERIODS ──────────────────────────────────────────────────────────────────
const periodsStore: unknown[] = [
  { periodId: 1, periodCode: 'M2026-01', periodName: 'January 2026', periodType: 'MONTHLY', startDate: '2026-01-01', endDate: '2026-01-31', deliveryStartDate: '2026-01-01', deliveryEndDate: '2026-01-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'LOCKED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 2, periodCode: 'M2026-02', periodName: 'February 2026', periodType: 'MONTHLY', startDate: '2026-02-01', endDate: '2026-02-28', deliveryStartDate: '2026-02-01', deliveryEndDate: '2026-02-28', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 3, periodCode: 'M2026-03', periodName: 'March 2026', periodType: 'MONTHLY', startDate: '2026-03-01', endDate: '2026-03-31', deliveryStartDate: '2026-03-01', deliveryEndDate: '2026-03-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 4, periodCode: 'M2026-04', periodName: 'April 2026', periodType: 'MONTHLY', startDate: '2026-04-01', endDate: '2026-04-30', deliveryStartDate: '2026-04-01', deliveryEndDate: '2026-04-30', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 5, periodCode: 'M2026-05', periodName: 'May 2026', periodType: 'MONTHLY', startDate: '2026-05-01', endDate: '2026-05-31', deliveryStartDate: '2026-05-01', deliveryEndDate: '2026-05-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 6, periodCode: 'M2026-06', periodName: 'June 2026', periodType: 'MONTHLY', startDate: '2026-06-01', endDate: '2026-06-30', deliveryStartDate: '2026-06-01', deliveryEndDate: '2026-06-30', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 7, periodCode: 'M2026-07', periodName: 'July 2026', periodType: 'MONTHLY', startDate: '2026-07-01', endDate: '2026-07-31', deliveryStartDate: '2026-07-01', deliveryEndDate: '2026-07-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 8, periodCode: 'Q2026-Q1', periodName: 'Q1 2026', periodType: 'QUARTERLY', startDate: '2026-01-01', endDate: '2026-03-31', deliveryStartDate: '2026-01-01', deliveryEndDate: '2026-03-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'LOCKED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 9, periodCode: 'Q2026-Q2', periodName: 'Q2 2026', periodType: 'QUARTERLY', startDate: '2026-04-01', endDate: '2026-06-30', deliveryStartDate: '2026-04-01', deliveryEndDate: '2026-06-30', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 10, periodCode: 'Y2026', periodName: 'Calendar Year 2026', periodType: 'ANNUAL', startDate: '2026-01-01', endDate: '2026-12-31', deliveryStartDate: '2026-01-01', deliveryEndDate: '2026-12-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 11, periodCode: 'SPOT', periodName: 'Spot', periodType: 'SPOT', startDate: '2026-06-27', endDate: '2026-06-27', deliveryStartDate: null, deliveryEndDate: null, pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: null, loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: null, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 12, periodCode: 'PWR-PEAK-M2026-07', periodName: 'Power Peak Block — July 2026', periodType: 'MONTHLY', startDate: '2026-07-01', endDate: '2026-07-31', deliveryStartDate: '2026-07-01', deliveryEndDate: '2026-07-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', commodityType: 'POWER', loadType: 'PEAK', gasDayType: null, startTimeUtc: '07:00', endTimeUtc: '19:00', cropYearOffsetMonths: null, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 13, periodCode: 'AGRI-CROP-2026', periodName: 'US Corn/Soybean Crop Year 2026', periodType: 'CUSTOM', startDate: '2026-09-01', endDate: '2027-08-31', deliveryStartDate: '2026-09-01', deliveryEndDate: '2027-08-31', pricingCalendarCode: 'CBOT', settlementCalendarCode: 'NYC', commodityType: 'AGRICULTURAL', loadType: null, gasDayType: null, startTimeUtc: null, endTimeUtc: null, cropYearOffsetMonths: 9, statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── PRICING RULES ────────────────────────────────────────────────────────────
const pricingRulesStore: unknown[] = [
  { pricingRuleId: 1,  ruleCode: 'FLT-DTBRT-AVG',   ruleName: 'Dated Brent Monthly Average',         pricingType: 'AVERAGE',       priceIndexCode: 'DTBRT',       differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'PLATTS', rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 2,  ruleCode: 'DIFF-URALS-MED',   ruleName: 'Urals Med vs Dated Brent',            pricingType: 'DIFFERENTIAL',  priceIndexCode: 'DTBRT',       differentialAmount: -2.5, differentialCurrencyCode: 'USD', differentialUomCode: 'BBL', formulaExpression: null,              averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'ARGUS',  rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 3,  ruleCode: 'FLT-WTI-PROMPT',   ruleName: 'WTI NYMEX Prompt Month',              pricingType: 'FLOATING',      priceIndexCode: 'WTI-NYMEX',   differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'NYC', publicationSource: 'NYMEX',  rounding: 'ROUND_2DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 4,  ruleCode: 'FORMULA-JCC-LNG',  ruleName: 'JCC-Linked LNG Formula',              pricingType: 'FORMULA',       priceIndexCode: 'JCC',         differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: 'JCC * 0.1485 + 0.50', averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'NYC', publicationSource: 'REUTERS', rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 5,  ruleCode: 'FLT-TTF-MONTHLY',  ruleName: 'TTF Gas Monthly Average',             pricingType: 'AVERAGE',       priceIndexCode: 'TTF-ICE',     differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'ICE',    rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 6,  ruleCode: 'FLT-LME-CU-CASH',  ruleName: 'LME Copper Cash Settlement',         pricingType: 'FLOATING',      priceIndexCode: 'LME-CU-CASH', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'LME', publicationSource: 'LME',    rounding: 'ROUND_2DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 7,  ruleCode: 'PLT-BRENT-MOC',    ruleName: 'Platts Brent MOC Window',             pricingType: 'PLATTS_WINDOW', priceIndexCode: 'DTBRT',       differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'LON', publicationSource: 'PLATTS', rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 8,  ruleCode: 'FIXED-75.00-USD',  ruleName: 'Fixed Price USD 75.00/BBL',           pricingType: 'FIXED',         priceIndexCode: null,          differentialAmount: 75.0, differentialCurrencyCode: 'USD', differentialUomCode: 'BBL', formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: null,  publicationSource: null,     rounding: 'ROUND_2DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // TAS rules — price = CME/ICE settlement ± tasDifferential × tasTickSize
  { pricingRuleId: 9,  ruleCode: 'TAS-NYMEX-CL',     ruleName: 'WTI Crude CL Trade at Settlement',   pricingType: 'TAS',           priceIndexCode: 'WTI-NYMEX',   differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'NYC', publicationSource: 'CME',    rounding: 'ROUND_2DP', tasExchange: 'CME_NYMEX', tasContractSeries: 'CL', tasTickSize: 0.01,   balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 10, ruleCode: 'TAS-NYMEX-NG',     ruleName: 'Henry Hub NG Trade at Settlement',   pricingType: 'TAS',           priceIndexCode: 'HH-HENRY-HUB',differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'NYC', publicationSource: 'CME',    rounding: 'ROUND_3DP', tasExchange: 'CME_NYMEX', tasContractSeries: 'NG', tasTickSize: 0.001,  balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 11, ruleCode: 'TAS-NYMEX-HO',     ruleName: 'Heating Oil HO Trade at Settlement', pricingType: 'TAS',           priceIndexCode: 'HO-NYMEX',    differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'NYC', publicationSource: 'CME',    rounding: 'ROUND_4DP', tasExchange: 'CME_NYMEX', tasContractSeries: 'HO', tasTickSize: 0.0001, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 12, ruleCode: 'TAS-ICE-BZ',       ruleName: 'ICE Brent BZ Trade at Settlement',   pricingType: 'TAS',           priceIndexCode: 'DTBRT',       differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: null,         pricingCalendarCode: 'LON', publicationSource: 'ICE',    rounding: 'ROUND_2DP', tasExchange: 'ICE_EUROPE', tasContractSeries: 'BZ', tasTickSize: 0.01, balmoExchange: null, balmoSeries: null, balmoTickSize: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  // BALMO rules — price = arithmetic average of daily CME/ICE front-month settlements over pricing window
  { pricingRuleId: 13, ruleCode: 'BALMO-CME-CL',     ruleName: 'WTI Crude CL Balance of Month',      pricingType: 'BALMO',         priceIndexCode: 'WTI-NYMEX',   differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'NYC', publicationSource: 'CME',    rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: 'CME_NYMEX', balmoSeries: 'CL', balmoTickSize: 0.01,   isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 14, ruleCode: 'BALMO-ICE-BZ',     ruleName: 'ICE Brent Crude Balance of Month',   pricingType: 'BALMO',         priceIndexCode: 'DTBRT',       differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'ICE',    rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: 'ICE_EUROPE', balmoSeries: 'BZ', balmoTickSize: 0.01, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 15, ruleCode: 'BALMO-CME-HO',     ruleName: 'Heating Oil HO Balance of Month',    pricingType: 'BALMO',         priceIndexCode: 'HO-NYMEX',    differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null,              averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'NYC', publicationSource: 'CME',    rounding: 'ROUND_4DP', tasExchange: null, tasContractSeries: null, tasTickSize: null, balmoExchange: 'CME_NYMEX', balmoSeries: 'HO', balmoTickSize: 0.0001, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── SETTLEMENT PRICES ────────────────────────────────────────────────────────
const settlementPricesStore: unknown[] = [
  { settlementPriceId: 1,  exchange: 'CME_NYMEX',  contractTicker: 'CLZ26', settleDate: '2026-07-01', settlePrice: 72.45,  tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   isConfirmed: true,  source: 'CME',    notes: null, createdAt: '2026-07-01T21:30:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  { settlementPriceId: 2,  exchange: 'CME_NYMEX',  contractTicker: 'CLF27', settleDate: '2026-07-01', settlePrice: 71.80,  tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   isConfirmed: true,  source: 'CME',    notes: null, createdAt: '2026-07-01T21:30:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  { settlementPriceId: 3,  exchange: 'CME_NYMEX',  contractTicker: 'NGF27', settleDate: '2026-07-01', settlePrice: 3.456,  tickSize: 0.001,  tickCurrency: 'USD', uomCode: 'MMBTU', isConfirmed: true,  source: 'CME',    notes: null, createdAt: '2026-07-01T21:30:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  { settlementPriceId: 4,  exchange: 'CME_NYMEX',  contractTicker: 'HOF27', settleDate: '2026-07-01', settlePrice: 2.3421, tickSize: 0.0001, tickCurrency: 'USD', uomCode: 'GAL',   isConfirmed: true,  source: 'CME',    notes: null, createdAt: '2026-07-01T21:30:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  { settlementPriceId: 5,  exchange: 'ICE_EUROPE',  contractTicker: 'BZF27', settleDate: '2026-07-01', settlePrice: 76.23,  tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   isConfirmed: true,  source: 'ICE',    notes: null, createdAt: '2026-07-01T21:30:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  { settlementPriceId: 6,  exchange: 'CME_NYMEX',  contractTicker: 'CLZ26', settleDate: '2026-06-30', settlePrice: 72.18,  tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   isConfirmed: true,  source: 'CME',    notes: null, createdAt: '2026-06-30T21:30:00Z', updatedAt: '2026-06-30T21:30:00Z' },
  { settlementPriceId: 7,  exchange: 'CME_NYMEX',  contractTicker: 'NGF27', settleDate: '2026-06-30', settlePrice: 3.456,  tickSize: 0.001,  tickCurrency: 'USD', uomCode: 'MMBTU', isConfirmed: true,  source: 'CME',    notes: null, createdAt: '2026-06-30T21:30:00Z', updatedAt: '2026-06-30T21:30:00Z' },
  { settlementPriceId: 8,  exchange: 'CME_NYMEX',  contractTicker: 'NGZ26', settleDate: '2026-07-01', settlePrice: 3.892,  tickSize: 0.001,  tickCurrency: 'USD', uomCode: 'MMBTU', isConfirmed: false, source: 'MANUAL', notes: 'Awaiting CME official', createdAt: '2026-07-01T14:00:00Z', updatedAt: '2026-07-01T14:00:00Z' },
];

// ─── BOLMO AGREEMENTS ─────────────────────────────────────────────────────────
const bolmoAgreementsStore: unknown[] = [
  { bolmoId: 1, bolmoReference: 'BKO-2026-00001', counterpartyId: 7, counterpartyName: 'Vitol SA', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', agreementDate: '2026-06-28', settlementDate: '2026-07-10', commodityType: 'OIL', deliveryLocationCode: 'SULLOM-VOE', deliveryPeriodCode: 'M2026-07', netQuantity: 250000, uomCode: 'BBL', nettingPrice: 82.00, currencyCode: 'USD', status: 'AGREED',    notes: 'Forties blend offsetting obligations — physical delivery avoided via book-out.',    createdAt: '2026-06-28T10:00:00Z', updatedAt: '2026-06-28T10:30:00Z' },
  { bolmoId: 2, bolmoReference: 'BKO-2026-00002', counterpartyId: 3, counterpartyName: 'Equinor Energy AS', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', agreementDate: '2026-06-29', settlementDate: null,           commodityType: 'GAS', deliveryLocationCode: 'TTF-NL',      deliveryPeriodCode: 'M2026-08', netQuantity: 50000,  uomCode: 'MWH', nettingPrice: 34.00, currencyCode: 'EUR', status: 'PENDING',   notes: 'TTF Aug-26 balancing position — counterparty confirmation pending.',                createdAt: '2026-06-29T09:00:00Z', updatedAt: '2026-06-29T09:00:00Z' },
  { bolmoId: 3, bolmoReference: 'BKO-2026-00003', counterpartyId: 1, counterpartyName: 'Shell Trading International', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', agreementDate: '2026-06-15', settlementDate: '2026-06-25', commodityType: 'OIL', deliveryLocationCode: 'ROTTERDAM',   deliveryPeriodCode: 'M2026-07', netQuantity: 100000, uomCode: 'BBL', nettingPrice: 80.50, currencyCode: 'USD', status: 'COMPLETED', notes: 'ARA ULSD book-out — completed and cash-settled. Net receivable USD 50,000.',         createdAt: '2026-06-15T14:00:00Z', updatedAt: '2026-06-25T16:00:00Z' },
];

const bolmoLegsStore: unknown[] = [
  { legId: 1, bolmoId: 1, orderId: null, orderReference: null, direction: 'BUY',  quantity: 250000, uomCode: 'BBL', price: 81.50, notes: 'Vitol Forties parcel BUY — TRD-2026-00003',  createdAt: '2026-06-28T10:05:00Z' },
  { legId: 2, bolmoId: 1, orderId: null, orderReference: null, direction: 'SELL', quantity: 250000, uomCode: 'BBL', price: 82.50, notes: 'Vitol Forties parcel SELL — TRD-2026-00004', createdAt: '2026-06-28T10:05:00Z' },
  { legId: 3, bolmoId: 2, orderId: null, orderReference: null, direction: 'BUY',  quantity: 50000,  uomCode: 'MWH', price: 33.80, notes: 'Equinor TTF Aug BUY',  createdAt: '2026-06-29T09:05:00Z' },
  { legId: 4, bolmoId: 2, orderId: null, orderReference: null, direction: 'SELL', quantity: 50000,  uomCode: 'MWH', price: 34.20, notes: 'Equinor TTF Aug SELL', createdAt: '2026-06-29T09:05:00Z' },
  { legId: 5, bolmoId: 3, orderId: null, orderReference: null, direction: 'BUY',  quantity: 100000, uomCode: 'BBL', price: 80.00, notes: 'Shell ULSD Rotterdam BUY',  createdAt: '2026-06-15T14:05:00Z' },
  { legId: 6, bolmoId: 3, orderId: null, orderReference: null, direction: 'SELL', quantity: 100000, uomCode: 'BBL', price: 81.00, notes: 'Shell ULSD Rotterdam SELL', createdAt: '2026-06-15T14:05:00Z' },
];

// ─── BALMO PRODUCTS ───────────────────────────────────────────────────────────
const balmoProductsStore: unknown[] = [
  { balmoProductId: 1, productCode: 'BALMO-CL-2026-07', productName: 'WTI Crude CL Balance of Month July 2026',   exchange: 'CME_NYMEX',  contractSeries: 'CL', contractMonth: '2026-07', pricingStartDate: '2026-07-01', pricingEndDate: '2026-07-31', lastTradingDate: '2026-07-01', settlementPriceTicker: 'CLN26', tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   priceSource: 'CME', status: 'ACTIVE',  notes: 'CME NYMEX WTI BALMO Jul26 — front month CLN26 settlements', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { balmoProductId: 2, productCode: 'BALMO-CL-2026-08', productName: 'WTI Crude CL Balance of Month August 2026', exchange: 'CME_NYMEX',  contractSeries: 'CL', contractMonth: '2026-08', pricingStartDate: '2026-08-01', pricingEndDate: '2026-08-31', lastTradingDate: '2026-08-01', settlementPriceTicker: 'CLQ26', tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   priceSource: 'CME', status: 'ACTIVE',  notes: 'CME NYMEX WTI BALMO Aug26 — front month CLQ26 settlements', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { balmoProductId: 3, productCode: 'BALMO-BZ-2026-07', productName: 'ICE Brent BZ Balance of Month July 2026',   exchange: 'ICE_EUROPE', contractSeries: 'BZ', contractMonth: '2026-07', pricingStartDate: '2026-07-01', pricingEndDate: '2026-07-31', lastTradingDate: '2026-07-01', settlementPriceTicker: 'BZN26', tickSize: 0.01,   tickCurrency: 'USD', uomCode: 'BBL',   priceSource: 'ICE', status: 'ACTIVE',  notes: 'ICE Brent BALMO Jul26 — front month BZN26 settlements', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { balmoProductId: 4, productCode: 'BALMO-HO-2026-07', productName: 'Heating Oil HO Balance of Month July 2026', exchange: 'CME_NYMEX',  contractSeries: 'HO', contractMonth: '2026-07', pricingStartDate: '2026-07-01', pricingEndDate: '2026-07-31', lastTradingDate: '2026-07-01', settlementPriceTicker: 'HON26', tickSize: 0.0001, tickCurrency: 'USD', uomCode: 'GAL',   priceSource: 'CME', status: 'ACTIVE',  notes: 'CME Heating Oil BALMO Jul26 — front month HON26 settlements', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
];

// ─── SYSTEM USERS ─────────────────────────────────────────────────────────────
const systemUsersStore: unknown[] = [
  { userId: 1, username: 'admin', email: 'admin@smartetrm.com', fullName: 'System Administrator', role: 'ADMIN', traderId: null, department: 'IT', phone: '+44 20 7123 0001', preferredLocale: 'en-GB', officeLocation: 'London', isActive: true, lastLogin: '2026-06-27T08:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 2, username: 'j.doe', email: 'john.doe@smartetrm.com', fullName: 'John Doe', role: 'TRADER', traderId: 1, department: 'Crude Oil Trading', phone: '+44 20 7123 0002', preferredLocale: 'en-GB', officeLocation: 'London', isActive: true, lastLogin: '2026-06-27T09:30:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 3, username: 'a.smith', email: 'alice.smith@smartetrm.com', fullName: 'Alice Smith', role: 'TRADER', traderId: 2, department: 'European Gas', phone: '+44 20 7123 0003', preferredLocale: 'en-US', officeLocation: 'Houston', isActive: true, lastLogin: '2026-06-26T17:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 4, username: 'risk.mgr', email: 'risk@smartetrm.com', fullName: 'Risk Manager', role: 'RISK_MANAGER', traderId: null, department: 'Risk Management', phone: null, preferredLocale: 'en-SG', officeLocation: 'Singapore', isActive: true, lastLogin: '2026-06-27T07:45:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 5, username: 'compliance', email: 'compliance@smartetrm.com', fullName: 'Compliance Officer', role: 'COMPLIANCE', traderId: null, department: 'Legal & Compliance', phone: null, preferredLocale: 'fr-FR', officeLocation: 'Paris', isActive: true, lastLogin: '2026-06-25T14:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 6, username: 'ops.team', email: 'operations@smartetrm.com', fullName: 'Operations Team', role: 'OPERATIONS', traderId: null, department: 'Operations', phone: '+44 20 7123 0006', preferredLocale: 'en-GB', officeLocation: 'London', isActive: true, lastLogin: '2026-06-27T08:30:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 7, username: 'viewer1', email: 'viewer@smartetrm.com', fullName: 'Board Viewer', role: 'VIEWER', traderId: null, department: 'Executive', phone: null, preferredLocale: null, officeLocation: null, isActive: false, lastLogin: '2026-05-01T10:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { userId: 8, username: 's.chen', email: 'sarah.chen@smartetrm.com', fullName: 'Sarah Chen', role: 'CREDIT_ANALYST', traderId: null, department: 'Credit Risk', phone: '+44 20 7123 0008', preferredLocale: 'en-GB', officeLocation: 'London', isActive: true, lastLogin: '2026-07-02T09:15:00Z', createdAt: '2024-06-01T00:00:00Z' },
  { userId: 9, username: 'm.webb', email: 'marcus.webb@smartetrm.com', fullName: 'Marcus Webb', role: 'CREDIT_ANALYST', traderId: null, department: 'Credit Risk', phone: '+65 6123 0009', preferredLocale: 'en-SG', officeLocation: 'Singapore', isActive: true, lastLogin: '2026-07-02T03:40:00Z', createdAt: '2025-01-15T00:00:00Z' },
];

// ─── PAYMENT TERMS ─────────────────────────────────────────────────────────────
const paymentTermsStore: unknown[] = [
  // Generic / Commercial
  { paymentTermId: 1,  termCode: 'NET_30',       termName: 'Net 30 Calendar Days',             baseDateEvent: 'INVOICE_DATE',          monthOffset: 0, offsetDays: 30,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: true,  description: 'Payment due 30 calendar days from invoice date. System default.',                          isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 2,  termCode: 'NET_45',       termName: 'Net 45 Calendar Days',             baseDateEvent: 'INVOICE_DATE',          monthOffset: 0, offsetDays: 45,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Payment due 45 calendar days from invoice date.',                                          isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 3,  termCode: 'NET_60',       termName: 'Net 60 Calendar Days',             baseDateEvent: 'INVOICE_DATE',          monthOffset: 0, offsetDays: 60,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Extended payment terms — agricultural bulk and long-haul trades.',                          isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 4,  termCode: 'NET_5_BIZ',    termName: 'Net 5 Business Days',              baseDateEvent: 'INVOICE_DATE',          monthOffset: 0, offsetDays: 5,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Payment 5 business days from invoice date.',                                               isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 5,  termCode: 'NET_10_BIZ',   termName: 'Net 10 Business Days',             baseDateEvent: 'INVOICE_DATE',          monthOffset: 0, offsetDays: 10,  daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Payment 10 business days from invoice date.',                                              isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 6,  termCode: '2_10_NET_30',  termName: '2% / 10 Net 30',                  baseDateEvent: 'INVOICE_DATE',          monthOffset: 0, offsetDays: 30,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: 10,   discountPct: 0.02,  paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: '2 % early payment discount if settled within 10 days; otherwise net 30.',                  isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  // Crude Oil & LNG
  { paymentTermId: 7,  termCode: 'BL_PLUS_30',   termName: 'BL Date +30 Calendar Days',        baseDateEvent: 'BL_DATE',               monthOffset: 0, offsetDays: 30,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Crude oil standard — 30 calendar days from Bill of Lading date.',                          isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 8,  termCode: 'BL_PLUS_45',   termName: 'BL Date +45 Calendar Days',        baseDateEvent: 'BL_DATE',               monthOffset: 0, offsetDays: 45,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'LNG cargo standard — 45 calendar days from Bill of Lading date.',                          isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 9,  termCode: 'BL_PLUS_5_BIZ',termName: 'BL Date +5 Business Days',         baseDateEvent: 'BL_DATE',               monthOffset: 0, offsetDays: 5,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Product cargoes — 5 business days from B/L date.',                                         isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 10, termCode: 'NOR_PLUS_7_BIZ',termName: 'NOR Tendered +7 Business Days',   baseDateEvent: 'NOR_TENDERED',          monthOffset: 0, offsetDays: 7,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Tanker demurrage / outturn — 7 business days from Notice of Readiness.',                   isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  // Gas & Power
  { paymentTermId: 11, termCode: 'M_PLUS_20',    termName: 'EDM +20 Calendar Days',            baseDateEvent: 'END_OF_DELIVERY_MONTH', monthOffset: 0, offsetDays: 20,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Gas pipeline — 20 calendar days after end of delivery month.',                             isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 12, termCode: 'M1_DOM_20',    termName: '20th of Month Following Delivery', baseDateEvent: 'END_OF_DELIVERY_MONTH', monthOffset: 1, offsetDays: 0,   daysBasis: 'CALENDAR', fixedDayOfMonth: 20,   businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Power — fixed 20th of the month following the delivery month.',                            isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 13, termCode: 'M1_DOM_25',    termName: '25th of Month Following Delivery', baseDateEvent: 'END_OF_DELIVERY_MONTH', monthOffset: 1, offsetDays: 0,   daysBasis: 'CALENDAR', fixedDayOfMonth: 25,   businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'Gas — fixed 25th of the month following the delivery month.',                              isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 14, termCode: 'NETTING_EFET', termName: 'EFET Monthly Netting',             baseDateEvent: 'END_OF_DELIVERY_MONTH', monthOffset: 1, offsetDays: 0,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'NETTING',           invoiceLeadDays: 0, isDefault: false, description: 'EFET bilateral netting — net position settled at start of following month.',               isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  // Metals
  { paymentTermId: 15, termCode: 'LME_2_BIZ',   termName: 'LME Prompt +2 Business Days',      baseDateEvent: 'PRICING_DATE',          monthOffset: 0, offsetDays: 2,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: 4,    discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'LME standard — payment 2 business days after the pricing / prompt date.',                  isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 16, termCode: 'COMEX_1_BIZ',  termName: 'COMEX Settlement +1 Business Day', baseDateEvent: 'SETTLEMENT_DATE',       monthOffset: 0, offsetDays: 1,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: 3,    discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: 0, isDefault: false, description: 'COMEX / NYMEX cleared metals — T+1 business day settlement.',                              isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  // Prepayment & LC
  { paymentTermId: 17, termCode: 'PREPAY_3D',    termName: 'Prepayment 3 Days Prior',          baseDateEvent: 'DELIVERY_DATE',         monthOffset: 0, offsetDays: -3,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_PRECEDING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'WIRE',              invoiceLeadDays: -3, isDefault: false, description: 'Payment required 3 calendar days before delivery — high-risk counterparties.',             isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 18, termCode: 'LC_AT_SIGHT',  termName: 'Letter of Credit at Sight',        baseDateEvent: 'BL_DATE',               monthOffset: 0, offsetDays: 7,   daysBasis: 'BUSINESS', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'LETTER_OF_CREDIT',  invoiceLeadDays: 0, isDefault: false, description: 'Documentary LC payable at sight — typically 5-7 banking days after presentation.',         isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 19, termCode: 'LC_90',        termName: 'Letter of Credit 90 Days Usance',  baseDateEvent: 'BL_DATE',               monthOffset: 0, offsetDays: 90,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'LETTER_OF_CREDIT',  invoiceLeadDays: 0, isDefault: false, description: '90-day usance LC — deferred payment letter of credit from B/L date.',                     isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { paymentTermId: 20, termCode: 'BG_30',        termName: 'Bank Guarantee 30 Days',           baseDateEvent: 'DELIVERY_DATE',         monthOffset: 0, offsetDays: 30,  daysBasis: 'CALENDAR', fixedDayOfMonth: null, businessDayConvention: 'MOD_FOLLOWING', calendarId: null, discountDays: null, discountPct: null,   paymentMethod: 'BANK_GUARANTEE',    invoiceLeadDays: 0, isDefault: false, description: 'Payment backed by bank guarantee, due 30 calendar days from delivery.',                    isActive: false, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── PAYMENT METHODS ───────────────────────────────────────────────────────────
const paymentMethodsStore: unknown[] = [
  { paymentMethodId: 1, methodCode: 'SWIFT-USD', methodName: 'SWIFT Wire USD', methodType: 'SWIFT', currencyRestriction: 'USD', processingDays: 1, description: 'Standard SWIFT MT103 wire transfer in US Dollars via correspondent banking.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { paymentMethodId: 2, methodCode: 'SWIFT-EUR', methodName: 'SWIFT Wire EUR', methodType: 'SWIFT', currencyRestriction: 'EUR', processingDays: 1, description: 'Standard SWIFT MT103 wire transfer in Euros — same-day in TARGET2 window.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { paymentMethodId: 3, methodCode: 'SEPA-CT', methodName: 'SEPA Credit Transfer', methodType: 'SEPA', currencyRestriction: 'EUR', processingDays: 0, description: 'Same-day EUR settlement within SEPA zone — faster and cheaper than SWIFT.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { paymentMethodId: 4, methodCode: 'NETTING', methodName: 'Bilateral Netting', methodType: 'NETTING', currencyRestriction: null, processingDays: 0, description: 'Offset of payables vs receivables under ISDA/EFET netting agreement — reduces settlement risk.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { paymentMethodId: 5, methodCode: 'LC-SIGHT', methodName: 'Letter of Credit (Sight)', methodType: 'LETTER_OF_CREDIT', currencyRestriction: null, processingDays: 5, description: 'Documentary LC payable at sight against B/L + cargo docs — used for new counterparties.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { paymentMethodId: 6, methodCode: 'BANK-GTY', methodName: 'Bank Guarantee', methodType: 'BANK_GUARANTEE', currencyRestriction: null, processingDays: 3, description: 'On-demand bank guarantee — alternative to LC for secured but unfunded exposure.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── BROKER FEE AGREEMENTS ────────────────────────────────────────────────────
const brokerFeeAgreementsStore: unknown[] = [
  { agreementId: 1, brokerId: 1, brokerCode: 'ICAP',      brokerName: 'ICAP Energy',                  agreementCode: 'ICAP-OIL-2026',       description: 'ICAP Energy OTC crude oil rate. North Sea and Mediterranean physical cargoes and OTC Brent/WTI swaps.',             commodityType: 'OIL',    productId: null, productName: null, tradeType: null,       feeType: 'PER_LOT',       feeRate: 0.020000, feeCurrencyCode: 'USD', uomCode: 'BBL',   payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: 2000.00, maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 2, brokerId: 3, brokerCode: 'BGC',       brokerName: 'BGC Partners Energy',          agreementCode: 'BGC-OIL-2026',        description: 'BGC Partners crude oil and products rate. Mediterranean and West African physical cargoes.',                       commodityType: 'OIL',    productId: null, productName: null, tradeType: null,       feeType: 'PER_LOT',       feeRate: 0.030000, feeCurrencyCode: 'USD', uomCode: 'BBL',   payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: 3000.00, maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 3, brokerId: 5, brokerCode: 'TP-ICAP',   brokerName: 'TP ICAP Global Broking',       agreementCode: 'TPICAP-GAS-2026',     description: 'TP ICAP gas brokerage. TTF, NBP, NCG, PEG. Voice and Parameta electronic.',                                          commodityType: 'GAS',    productId: null, productName: null, tradeType: null,       feeType: 'PER_LOT',       feeRate: 0.010000, feeCurrencyCode: 'EUR', uomCode: 'MWH',   payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: 1500.00, maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 4, brokerId: 2, brokerCode: 'GFI',       brokerName: 'GFI Group Commodities',        agreementCode: 'GFI-POWER-2026',      description: 'GFI Group power brokerage. EEX Germany baseload/peak, French and Belgian power OTC.',                               commodityType: 'POWER',  productId: null, productName: null, tradeType: null,       feeType: 'PER_LOT',       feeRate: 0.015000, feeCurrencyCode: 'EUR', uomCode: 'MWH',   payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: 1000.00, maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 5, brokerId: 4, brokerCode: 'TRADITION', brokerName: 'Tradition Financial Services', agreementCode: 'TRADITION-FREIGHT-2026', description: 'Tradition freight brokerage. Flat fee per voyage — TD3C, TC2, BS3. BIMCO proforma.',                              commodityType: 'FREIGHT', productId: null, productName: null, tradeType: null,      feeType: 'FLAT_PER_TRADE', feeRate: 2500.000000, feeCurrencyCode: 'USD', uomCode: null, payPeriod: 'PER_TRADE', paymentDueDays: 5,  minimumFee: null,    maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 6, brokerId: 6, brokerCode: 'TULLETT',   brokerName: 'Tullett Prebon',               agreementCode: 'TULLETT-METALS-2026', description: 'Tullett Prebon metals brokerage. LME copper, aluminium, zinc, nickel. Cash and 3-month contracts.',                  commodityType: 'METALS', productId: null, productName: null, tradeType: null,       feeType: 'PER_LOT',       feeRate: 1.000000, feeCurrencyCode: 'USD', uomCode: 'MT',    payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: 2000.00, maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 7, brokerId: 1, brokerCode: 'ICAP',      brokerName: 'ICAP Energy',                  agreementCode: 'ICAP-OIL-FIN-2026',   description: 'ICAP Energy financial OTC rate. Applies to Brent and WTI OTC swap and CFD trades only. Higher rate than physical.',  commodityType: 'OIL',    productId: null, productName: null, tradeType: 'FINANCIAL', feeType: 'PCT_NOTIONAL',  feeRate: 0.000400, feeCurrencyCode: 'USD', uomCode: null,   payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: null,    maximumFee: null,     effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { agreementId: 8, brokerId: 7, brokerCode: 'SPARK',     brokerName: 'Spark Commodities',            agreementCode: 'SPARK-LNG-2026',      description: 'Spark Commodities electronic LNG platform. JKM spot, FOB Atlantic, DES regas. Pure electronic.',                      commodityType: 'LNG',    productId: null, productName: null, tradeType: null,       feeType: 'PER_LOT',       feeRate: 0.010000, feeCurrencyCode: 'USD', uomCode: 'MMBTU', payPeriod: 'MONTHLY',   paymentDueDays: 30, minimumFee: null,    maximumFee: 5000.00, effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
];

// ─── COUNTERPARTIES — NETTING AGREEMENTS ─────────────────────────────────────
function computeNettingAgreement(input: Record<string, unknown>): Record<string, unknown> {
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const cp = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['counterpartyId']);
  return { ...input, legalEntityName: le?.['entityName'] ?? null, counterpartyName: cp?.['legalName'] ?? null };
}
const nettingAgreementsStore: unknown[] = [
  { nettingId: 1, legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', counterpartyId: 1, counterpartyName: 'Shell Trading International Ltd', agreementType: 'ISDA_2002', agreementRef: 'ISDA-ACMEUK-SHELLTR-2024', effectiveDate: '2024-01-15', terminationDate: null, isActive: true, notes: '2002 ISDA Master Agreement with 2013 CSA — see margin agreement CSA-SHELL-2024.', createdAt: '2024-01-15T00:00:00Z' },
  { nettingId: 2, legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', counterpartyId: 2, counterpartyName: 'Glencore International AG', agreementType: 'EFET', agreementRef: 'EFET-ACMEUK-GLEN-2023', effectiveDate: '2023-09-01', terminationDate: null, isActive: true, notes: 'EFET General Agreement — European gas/power physical and financial delivery.', createdAt: '2023-09-01T00:00:00Z' },
];

// ─── COUNTERPARTIES — CP COMMERCIAL TERMS ────────────────────────────────────
function computeCpCommercialTerms(input: Record<string, unknown>): Record<string, unknown> {
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const cp = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['counterpartyId']);
  const pt = (paymentTermsStore as Array<Record<string, unknown>>).find((t) => t['paymentTermId'] === input['paymentTermId']);
  const ct = (referenceRowSeed.credit_term as unknown as Array<Record<string, unknown>>).find((t) => t['creditTermId'] === input['creditTermId']);
  return {
    ...input,
    legalEntityName: le?.['entityName'] ?? null,
    counterpartyName: cp?.['legalName'] ?? null,
    paymentTermName: pt?.['termName'] ?? null,
    creditTermName: ct?.['termName'] ?? null,
  };
}
const cpCommercialTermsStore: unknown[] = [
  { cpTermsId: 1, counterpartyId: 1, counterpartyName: 'Shell Trading International Ltd', legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', paymentTermId: 1, paymentTermName: 'Net 30 Calendar Days', creditTermId: 2, creditTermName: 'ISDA/CSA Standard Margined', defaultCurrencyId: 1, defaultIncotermId: null, commodityType: null, effectiveDate: '2024-01-15', expiryDate: null, isActive: true, notes: null, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
  { cpTermsId: 2, counterpartyId: 2, counterpartyName: 'Glencore International AG', legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', paymentTermId: 1, paymentTermName: 'Net 30 Calendar Days', creditTermId: 1, creditTermName: 'Standard 30-Day Unsecured', defaultCurrencyId: 1, defaultIncotermId: null, commodityType: 'METALS', effectiveDate: '2023-09-01', expiryDate: null, isActive: true, notes: 'Metals-specific terms — separate from any other commodity terms with the same counterparty.', createdAt: '2023-09-01T00:00:00Z', updatedAt: '2023-09-01T00:00:00Z' },
];

// ─── COUNTERPARTIES — CP GTC AGREEMENTS ──────────────────────────────────────
function computeCpGtcAgreement(input: Record<string, unknown>): Record<string, unknown> {
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const cp = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['counterpartyId']);
  const gtc = (gtcsStore as Array<Record<string, unknown>>).find((g) => g['gtcId'] === input['gtcId']);
  return {
    ...input,
    legalEntityName: le?.['entityName'] ?? null,
    counterpartyName: cp?.['legalName'] ?? null,
    gtcName: gtc?.['gtcName'] ?? null,
    gtcVersion: gtc?.['version'] ?? null,
  };
}
const cpGtcAgreementsStore: unknown[] = [
  { cpGtcId: 1, counterpartyId: 1, counterpartyName: 'Shell Trading International Ltd', legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', gtcId: 1, gtcName: 'BP Standard Crude Oil GTCs 2020', gtcVersion: '2020-v3', signedDate: '2024-01-10', effectiveDate: '2024-01-15', expiryDate: null, isActive: true, notes: null, createdAt: '2024-01-10T00:00:00Z' },
  { cpGtcId: 2, counterpartyId: 2, counterpartyName: 'Glencore International AG', legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', gtcId: 3, gtcName: 'LME Contract Rules & Regulations 2021', gtcVersion: '2021-v1', signedDate: '2023-08-20', effectiveDate: '2023-09-01', expiryDate: null, isActive: true, notes: null, createdAt: '2023-08-20T00:00:00Z' },
];

// ─── CREDIT — BANK GUARANTEES ─────────────────────────────────────────────────
function computeBankGuarantee(input: Record<string, unknown>): Record<string, unknown> {
  const bank = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['issuingBankId']);
  const principal = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['principalEntityId']);
  const beneficiary = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['beneficiaryCpId']);
  const ccy = (referenceRowSeed.currency as unknown as Array<Record<string, unknown>>).find((c) => c['currencyId'] === input['currencyId']);
  return {
    ...input,
    issuingBankName: bank?.['legalName'] ?? null,
    principalEntityName: principal?.['entityName'] ?? null,
    beneficiaryCpName: beneficiary?.['legalName'] ?? null,
    currencyCode: ccy?.['currencyCode'] ?? null,
  };
}
const bankGuaranteesStore: unknown[] = [
  { bgId: 1, bgNumber: 'BG-2024-0012', bgType: 'PERFORMANCE', issuingBankId: 1, issuingBankName: 'Shell Trading International Ltd', principalEntityId: 1, principalEntityName: 'Acme Trading UK Limited', beneficiaryCpId: 2, beneficiaryCpName: 'Glencore International AG', currencyId: 1, currencyCode: 'USD', guaranteeAmount: 5000000, issueDate: '2024-06-01', expiryDate: '2027-06-01', claimPeriodDays: 30, bgStatus: 'ISSUED', amountCalled: 0, notes: 'Performance guarantee for annual supply contract.', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
];

// ─── CREDIT — INSURANCE POLICIES ─────────────────────────────────────────────
function computeInsurancePolicy(input: Record<string, unknown>): Record<string, unknown> {
  const provider = (referenceRowSeed.insurance_provider as unknown as Array<Record<string, unknown>>).find((p) => p['providerId'] === input['providerId']);
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const ccy = (referenceRowSeed.currency as unknown as Array<Record<string, unknown>>).find((c) => c['currencyId'] === input['currencyId']);
  return {
    ...input,
    providerName: provider?.['providerName'] ?? null,
    legalEntityName: le?.['entityName'] ?? null,
    currencyCode: ccy?.['currencyCode'] ?? null,
  };
}
const insurancePoliciesStore: unknown[] = [
  { policyId: 1, providerId: 1, providerName: "Lloyd's of London (Syndicate 2623)", legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', policyNumber: 'LLD-2026-CARGO-001', policyType: 'CARGO', insuredEntityType: null, insuredEntityId: null, currencyId: 1, currencyCode: 'USD', sumInsured: 50000000, deductible: 100000, premiumAmount: 125000, premiumCurrencyId: 1, premiumFrequency: 'ANNUAL', inceptionDate: '2026-01-01', expiryDate: '2026-12-31', policyStatus: 'ACTIVE', notes: 'Blanket cargo cover for physical crude/product cargoes.', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

// ─── CREDIT — MARGIN ACCOUNTS ─────────────────────────────────────────────────
function computeMarginAccount(input: Record<string, unknown>): Record<string, unknown> {
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const market = (marketsStore as Array<Record<string, unknown>>).find((m) => m['marketId'] === input['marketId']);
  const broker = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['clearingBrokerId']);
  const ccy = (referenceRowSeed.currency as unknown as Array<Record<string, unknown>>).find((c) => c['currencyId'] === input['currencyId']);
  return {
    ...input,
    legalEntityName: le?.['entityName'] ?? null,
    marketName: market?.['marketName'] ?? null,
    clearingBrokerName: broker?.['legalName'] ?? null,
    currencyCode: ccy?.['currencyCode'] ?? null,
  };
}
const marginAccountsStore: unknown[] = [
  { marginAccountId: 1, legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', marketId: 1, marketName: 'ICE Brent', accountRef: 'ICE-ACMEUK-001', accountType: 'HOUSE', clearingBrokerId: null, clearingBrokerName: null, currencyId: 1, currencyCode: 'USD', initialMargin: 2500000, variationMargin: -180000, excessMargin: 320000, marginLimit: 10000000, isActive: true, notes: null, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── CREDIT — COLLATERAL ──────────────────────────────────────────────────────
function computeCollateral(input: Record<string, unknown>): Record<string, unknown> {
  const ct = (referenceRowSeed.collateral_type as unknown as Array<Record<string, unknown>>).find((t) => t['collateralTypeId'] === input['collateralTypeId']);
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const cp = (cpStore as unknown as Array<Record<string, unknown>>).find((c) => c['counterpartyId'] === input['counterpartyId']);
  const ccy = (referenceRowSeed.currency as unknown as Array<Record<string, unknown>>).find((c) => c['currencyId'] === input['currencyId']);
  return {
    ...input,
    collateralTypeName: ct?.['typeName'] ?? null,
    legalEntityName: le?.['entityName'] ?? null,
    counterpartyName: cp?.['legalName'] ?? null,
    currencyCode: ccy?.['currencyCode'] ?? null,
  };
}
const collateralStore: unknown[] = [
  { collateralId: 1, collateralTypeId: 1, collateralTypeName: 'Cash USD', direction: 'RECEIVED', securedEntityType: 'COUNTERPARTY', securedEntityId: 2, legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', counterpartyId: 2, counterpartyName: 'Glencore International AG', currencyId: 1, currencyCode: 'USD', faceValue: 1000000, marketValue: 1000000, haircutPct: 0, instrumentIsin: null, instrumentDesc: null, lcId: null, bgId: null, postingDate: '2024-07-01', maturityDate: null, returnDate: null, status: 'ACTIVE', notes: 'Independent amount under PLEDGE-GLENCORE-24 margin agreement.', createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z' },
];

// ─── LOGISTICS — VESSEL CERTIFICATES ─────────────────────────────────────────
function computeVesselCertificate(input: Record<string, unknown>): Record<string, unknown> {
  const vessel = (vesselsStore as Array<Record<string, unknown>>).find((v) => v['vesselId'] === input['vesselId']);
  return { ...input, vesselName: vessel?.['vesselName'] ?? null };
}
const vesselCertificatesStore: unknown[] = [
  { certId: 1, vesselId: 1, vesselName: 'NORDIC LUNA', certType: 'SIRE', certNumber: 'SIRE-2025-9741060', issuingBody: 'OCIMF', issueDate: '2025-09-15', expiryDate: '2026-09-15', isCurrent: true, notes: null, createdAt: '2025-09-15T00:00:00Z' },
  { certId: 2, vesselId: 1, vesselName: 'NORDIC LUNA', certType: 'CLASS_CERT', certNumber: 'DNV-CL-9741060', issuingBody: 'DNV', issueDate: '2021-06-01', expiryDate: '2026-06-01', isCurrent: true, notes: null, createdAt: '2021-06-01T00:00:00Z' },
];

// ─── LOGISTICS — RAILCARS ─────────────────────────────────────────────────────
function computeRailcar(input: Record<string, unknown>): Record<string, unknown> {
  const op = (referenceRowSeed.transport_operator as unknown as Array<Record<string, unknown>>).find((o) => o['operatorId'] === input['operatorId']);
  return { ...input, operatorName: op?.['operatorName'] ?? null };
}
const railcarsStore: unknown[] = [
  { railcarId: 1, carNumber: 'TILX 483920', carType: 'TANK_CAR', operatorId: 2, operatorName: 'Northward Rail Freight', capacityLitres: 113000, capacityMt: 90, dotClass: 'DOT-117', aarClass: 'T112', approvedCommodities: 'ETHANOL,HEATING-OIL', lastTestDate: '2025-03-01', nextTestDate: '2035-03-01', certExpiry: '2035-03-01', homeRailroad: 'BNSF', countryCode: 'US', isActive: true, notes: null, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── LOGISTICS — CONTAINERS ───────────────────────────────────────────────────
function computeContainer(input: Record<string, unknown>): Record<string, unknown> {
  const op = (referenceRowSeed.transport_operator as unknown as Array<Record<string, unknown>>).find((o) => o['operatorId'] === input['operatorId']);
  return { ...input, operatorName: op?.['operatorName'] ?? null };
}
const containersStore: unknown[] = [
  { containerId: 1, containerNumber: 'TTNU1234567', containerType: 'ISO_TANK', operatorId: 3, operatorName: 'Rhine Barge Logistics', capacityLitres: 24000, capacityMt: 22, tareWeightKg: 3800, maxGrossWeightKg: 36000, unApproval: 'T11', approvedCommodities: 'ETHANOL', cscPlateExpiry: '2030-01-01', lastInspectionDate: '2025-01-01', nextInspectionDate: '2030-01-01', isActive: true, notes: null, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── LOGISTICS — TANKS ────────────────────────────────────────────────────────
function computeTank(input: Record<string, unknown>): Record<string, unknown> {
  const facility = (referenceRowSeed.storage_facility as unknown as Array<Record<string, unknown>>).find((f) => f['facilityId'] === input['facilityId']);
  const product = (referenceRowSeed.product as unknown as Array<Record<string, unknown>>).find((p) => p['productId'] === input['primaryProductId']);
  return { ...input, facilityName: facility?.['facilityName'] ?? null, primaryProductName: product?.['productName'] ?? null };
}
const tanksStore: unknown[] = [
  { tankId: 1, facilityId: 1, facilityName: 'Cushing Tank Farm T-1', tankNumber: 'T-101', tankName: 'Crude Storage Tank 1', tankType: 'FLOATING_ROOF', commodityType: 'OIL', primaryProductId: 2, primaryProductName: 'West Texas Intermediate', nominalCapacityM3: 159000, workingCapacityM3: 151000, heelVolumeM3: 800, diameterM: 60, heightM: 18, isHeated: false, maxTempCelsius: null, hasMetering: true, meterRef: 'MTR-101', tankStatus: 'IN_SERVICE', isActive: true, notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ─── LOGISTICS — PIPELINE SEGMENTS ────────────────────────────────────────────
function computePipelineSegment(input: Record<string, unknown>): Record<string, unknown> {
  const pipeline = (pipelinesStore as Array<Record<string, unknown>>).find((p) => p['pipelineId'] === input['pipelineId']);
  return { ...input, pipelineName: pipeline?.['pipelineName'] ?? null };
}
const pipelineSegmentsStore: unknown[] = [
  { segmentId: 1, pipelineId: 4, pipelineName: 'Capline Crude Pipeline', fromPointCode: 'ST-JAMES-LA', toPointCode: 'PATOKA-IL', segmentCode: 'CAPLINE-SEG1', segmentName: 'St. James to Patoka Main Line', lengthKm: 1321, diameterMm: 1016, maxOperatingPressure: 70, forwardCapacity: 1200000, reverseCapacity: null, tariffZone: 'ZONE_1', operationalStatus: 'IN_SERVICE', isActive: true, notes: null },
];

// ─── LOGISTICS — PIPELINE TARIFFS ─────────────────────────────────────────────
function computePipelineTariff(input: Record<string, unknown>): Record<string, unknown> {
  const pipeline = (pipelinesStore as Array<Record<string, unknown>>).find((p) => p['pipelineId'] === input['pipelineId']);
  const product = (referenceRowSeed.product as unknown as Array<Record<string, unknown>>).find((p) => p['productId'] === input['productId']);
  const ccy = (referenceRowSeed.currency as unknown as Array<Record<string, unknown>>).find((c) => c['currencyId'] === input['currencyId']);
  const uom = (uomStore as Array<Record<string, unknown>>).find((u) => u['uomId'] === input['rateUomId']);
  return {
    ...input,
    pipelineName: pipeline?.['pipelineName'] ?? null,
    productName: product?.['productName'] ?? null,
    currencyCode: ccy?.['currencyCode'] ?? null,
    rateUomCode: uom?.['uomCode'] ?? null,
  };
}
const pipelineTariffsStore: unknown[] = [
  { tariffId: 1, pipelineId: 4, pipelineName: 'Capline Crude Pipeline', fromPointCode: 'ST-JAMES-LA', toPointCode: 'PATOKA-IL', productId: 2, productName: 'West Texas Intermediate', tariffType: 'FIRM', capacityType: 'ENTRY_EXIT', currencyId: 1, currencyCode: 'USD', rate: 0.85, rateUomId: 1, rateUomCode: 'BBL', season: 'ALL', effectiveFrom: '2024-01-01', effectiveTo: null, regulatoryRef: 'FERC-CAPLINE-2024', isActive: true, notes: null },
];

// ─── PRICING — FORMULA TEMPLATES ─────────────────────────────────────────────
const formulaTemplatesStore: unknown[] = [
  { templateId: 1, commodityType: 'OIL', templateCode: 'DTD-BRENT-DIFF', templateName: 'Dated Brent + Differential', formulaType: 'DIFFERENTIAL', formulaExpression: 'DTD_BRENT + DIFFERENTIAL', averagingType: 'DAILY', averagingPeriodType: 'PRICING_PERIOD', fxConversionRequired: false, fxFixingType: null, description: 'Standard dated Brent plus/minus a fixed differential — the default crude pricing structure.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 2, commodityType: 'LNG', templateCode: 'JCC-SLOPE', templateName: 'JCC Slope-Linked', formulaType: 'INDEX', formulaExpression: 'JCC * 0.1485 + CONSTANT', averagingType: 'MONTHLY_AVERAGE', averagingPeriodType: 'DELIVERY_MONTH', fxConversionRequired: true, fxFixingType: 'AVERAGE', description: 'JCC slope formula common in long-term LNG SPAs, converted from JPY.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { templateId: 3, commodityType: 'GAS', templateCode: 'TTF-FM-AVG', templateName: 'TTF Front-Month Average', formulaType: 'AVERAGE', formulaExpression: 'AVG(TTF_FRONT_MONTH)', averagingType: 'DAILY', averagingPeriodType: 'DELIVERY_MONTH', fxConversionRequired: false, fxFixingType: null, description: 'Daily average of the TTF front-month contract over the delivery month.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── COMPLIANCE — REGULATORY OBLIGATIONS ─────────────────────────────────────
function computeRegulatoryObligation(input: Record<string, unknown>): Record<string, unknown> {
  const le = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['legalEntityId']);
  const rt = (referenceRowSeed.regulatory_report_type as unknown as Array<Record<string, unknown>>).find((t) => t['reportTypeId'] === input['reportTypeId']);
  const rep = (legalEntityStore as unknown as Array<Record<string, unknown>>).find((e) => e['legalEntityId'] === input['reportingEntityId']);
  return {
    ...input,
    legalEntityName: le?.['entityName'] ?? null,
    reportTypeName: rt?.['reportName'] ?? null,
    reportingEntityName: rep?.['entityName'] ?? null,
  };
}
const regulatoryObligationsStore: unknown[] = [
  { obligationId: 1, legalEntityId: 1, legalEntityName: 'Acme Trading UK Limited', reportTypeId: 3, reportTypeName: 'UK EMIR Trade Report', obligationType: 'FULL', applicableCommodities: null, reportingEntityId: null, reportingEntityName: null, registrationRef: 'LEI-213800ABCXYZ12345', registeredDate: '2018-01-03', effectiveFrom: '2018-01-03', effectiveTo: null, isActive: true, notes: null, createdAt: '2024-01-01T00:00:00Z' },
  { obligationId: 2, legalEntityId: 2, legalEntityName: 'Acme Trading US Inc.', reportTypeId: 4, reportTypeName: 'CFTC Swap Data Report', obligationType: 'DELEGATED', applicableCommodities: null, reportingEntityId: 1, reportingEntityName: 'Acme Trading UK Limited', registrationRef: 'LEI-549300XYZ98765432', registeredDate: '2019-05-14', effectiveFrom: '2019-05-14', effectiveTo: null, isActive: true, notes: 'Reporting delegated to UK entity under group arrangement.', createdAt: '2024-01-01T00:00:00Z' },
];

// ─── CREDIT — MARGIN AGREEMENTS ──────────────────────────────────────────────
const marginAgreementsStore: unknown[] = [
  { marginAgreementId: 1, agreementCode: 'CSA-SHELL-2024',    agreementType: 'CSA_BILATERAL',   counterpartyId: 1, counterpartyName: 'Shell Trading International', thresholdAmount: 5000000,   thresholdCurrency: 'USD', cpThresholdAmount: 5000000,   cpThresholdCurrency: 'USD', mtaAmount: 250000,  mtaCurrency: 'USD', independentAmount: null, independentAmountCurrency: null, roundingAmount: 1000,  valuationFrequency: 'DAILY',  eligibleCollateral: 'Cash (USD, EUR, GBP); G7 Government Bonds (AAA–AA, <10yr); Gold', eligibleCurrencies: 'USD, EUR, GBP', govLaw: 'ENGLISH',   effectiveDate: '2024-01-01', expiryDate: null,         isActive: true, notes: 'ISDA 2002 Master Agreement + 2013 CSA', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { marginAgreementId: 2, agreementCode: 'CSA-BP-2024',       agreementType: 'CSA_BILATERAL',   counterpartyId: 2, counterpartyName: 'BP Oil Trading',            thresholdAmount: 10000000,  thresholdCurrency: 'USD', cpThresholdAmount: 10000000,  cpThresholdCurrency: 'USD', mtaAmount: 500000,  mtaCurrency: 'USD', independentAmount: null, independentAmountCurrency: null, roundingAmount: 1000,  valuationFrequency: 'DAILY',  eligibleCollateral: 'Cash (USD, EUR); US Treasuries; UK Gilts',                        eligibleCurrencies: 'USD, EUR',      govLaw: 'ENGLISH',   effectiveDate: '2024-03-01', expiryDate: null,         isActive: true, notes: 'Bilateral threshold — both AA rated',  createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  { marginAgreementId: 3, agreementCode: 'CSA-EQUINOR-2023',  agreementType: 'CSA_ONE_WAY_IN',  counterpartyId: 3, counterpartyName: 'Equinor Energy AS',          thresholdAmount: 0,         thresholdCurrency: 'USD', cpThresholdAmount: 15000000,  cpThresholdCurrency: 'USD', mtaAmount: 100000,  mtaCurrency: 'USD', independentAmount: null, independentAmountCurrency: null, roundingAmount: 1000,  valuationFrequency: 'DAILY',  eligibleCollateral: 'Cash USD only',                                                    eligibleCurrencies: 'USD',           govLaw: 'ENGLISH',   effectiveDate: '2023-06-15', expiryDate: null,         isActive: true, notes: 'One-way — Equinor must post, we never do', createdAt: '2023-06-15T00:00:00Z', updatedAt: '2023-06-15T00:00:00Z' },
  { marginAgreementId: 4, agreementCode: 'PLEDGE-GLENCORE-24', agreementType: 'PLEDGE',          counterpartyId: 4, counterpartyName: 'Glencore Metals',           thresholdAmount: 2000000,   thresholdCurrency: 'USD', cpThresholdAmount: 2000000,   cpThresholdCurrency: 'USD', mtaAmount: 200000,  mtaCurrency: 'USD', independentAmount: 1000000, independentAmountCurrency: 'USD', roundingAmount: 10000, valuationFrequency: 'WEEKLY', eligibleCollateral: 'Cash (USD); LME Grade A Copper warrants',                          eligibleCurrencies: 'USD',           govLaw: 'ENGLISH',   effectiveDate: '2024-07-01', expiryDate: '2026-12-31', isActive: true, notes: 'IA = $1M upfront (Glencore posts)',    createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z' },
];

// ─── CREDIT — CREDIT LIMITS ───────────────────────────────────────────────────
// Denormalize + compute derived fields for a credit limit row.
function computeCreditLimit(input: Record<string, unknown>): Record<string, unknown> {
  const cp = counterpartiesRef.find((x) => x.counterpartyId === (input['counterpartyId'] as number));
  const analyst = (systemUsersStore as Array<Record<string, unknown>>).find((u) => u['userId'] === input['creditAnalystUserId']);
  const todayIso = new Date().toISOString().slice(0, 10);
  const limitAmount = Number(input['limitAmount'] ?? 0);
  const usedAmount = Number(input['usedAmount'] ?? 0);
  const collateralOffset = Number(input['collateralOffset'] ?? 0);
  const upliftActive = input['tempUpliftAmount'] != null && (input['tempUpliftExpiry'] == null || String(input['tempUpliftExpiry']) >= todayIso);
  const capacity = limitAmount + (upliftActive ? Number(input['tempUpliftAmount']) : 0) + collateralOffset;
  const available = capacity - usedAmount;
  const pct = capacity > 0 ? Math.round((usedAmount / capacity) * 1000) / 10 : 0;
  const warn = Number(input['warningThresholdPct'] ?? 80);
  const crit = Number(input['criticalThresholdPct'] ?? 95);
  const indicator = pct >= 100 ? 'BREACHED' : pct >= crit ? 'CRITICAL' : pct >= warn ? 'WARNING' : 'OK';
  // next review = last review + frequency, unless explicitly provided
  let nextReview = input['nextReviewDate'] as string | null;
  if (!nextReview && input['lastReviewDate'] && input['reviewFrequencyDays']) {
    const d = new Date(String(input['lastReviewDate']));
    d.setDate(d.getDate() + Number(input['reviewFrequencyDays']));
    nextReview = d.toISOString().slice(0, 10);
  }
  return {
    ...input,
    counterpartyName: cp?.name ?? (input['counterpartyName'] as string | null) ?? null,
    cpCountryCode: (input['cpCountryCode'] as string | null) ?? cp?.countryCode ?? null,
    creditAnalystName: analyst ? String(analyst['fullName']) : (input['creditAnalystName'] as string | null) ?? null,
    availableAmount: available,
    utilisationPct: pct,
    limitIndicator: indicator,
    nextReviewDate: nextReview ?? null,
    lineItems: input['lineItems'] ?? [],
  };
}

const creditLimitsStore: unknown[] = [
  // Shell — group PSR umbrella (DIRECT), with instrument-class sub-limits
  { creditLimitId: 1, counterpartyId: 1, counterpartyName: 'Shell Trading International', cpCountryCode: 'GB', countryRiskRating: 'LOW',
    limitType: 'PRE_SETTLEMENT', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'ALL',
    limitAmount: 100000000, limitCurrency: 'USD', usedAmount: 41225000, availableAmount: 63775000, utilisationPct: 39.3,
    collateralOffset: 5000000, collateralRef: 'PCG-SHELL-PLC-2025', tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: 24,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    creditAnalystUserId: 8, creditAnalystName: 'Sarah Chen', approvedBy: 'Credit Committee', approvalDate: '2025-12-10',
    reviewFrequencyDays: 365, lastReviewDate: '2025-12-10', nextReviewDate: '2026-12-10', lastReviewOutcome: 'MAINTAIN',
    internalRating: 'IR-2', externalRating: 'AA-',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'BLOCK_NEW_TRADES', alertInternal: true, alertCounterparty: false, cpAlertEmail: null,
    limitIndicator: 'OK',
    lineItems: [
      { lineItemId: 1, instrumentClass: 'PHYSICAL', subLimitAmount: 60000000, usedAmount: 35000000, tenorCapMonths: 12, notes: 'Cargo exposure incl. Forties programme' },
      { lineItemId: 2, instrumentClass: 'SWAPS',    subLimitAmount: 25000000, usedAmount: 6225000,  tenorCapMonths: 24, notes: null },
      { lineItemId: 3, instrumentClass: 'OPTIONS',  subLimitAmount: 10000000, usedAmount: 0,        tenorCapMonths: 12, notes: 'OTC options only — listed margined at exchange' },
    ],
    alerts: [],
    status: 'ACTIVE', nettingAgreementRef: 'ISDA-2002-SHELL-001', isActive: true,
    notes: 'Annual renewal. AA− rated. Netting set includes OTC & physical. PCG from Shell plc offsets $5M.',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
  // Shell — settlement limit (separate risk type, same CP)
  { creditLimitId: 2, counterpartyId: 1, counterpartyName: 'Shell Trading International', cpCountryCode: 'GB', countryRiskRating: 'LOW',
    limitType: 'SETTLEMENT', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'ALL',
    limitAmount: 50000000, limitCurrency: 'USD', usedAmount: 0, availableAmount: 50000000, utilisationPct: 0,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: null,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    creditAnalystUserId: 8, creditAnalystName: 'Sarah Chen', approvedBy: 'Credit Committee', approvalDate: '2025-12-10',
    reviewFrequencyDays: 365, lastReviewDate: '2025-12-10', nextReviewDate: '2026-12-10', lastReviewOutcome: 'MAINTAIN',
    internalRating: 'IR-2', externalRating: 'AA-',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'ALERT_ONLY', alertInternal: true, alertCounterparty: false, cpAlertEmail: null,
    limitIndicator: 'OK', lineItems: [], alerts: [],
    status: 'ACTIVE', nettingAgreementRef: 'ISDA-2002-SHELL-001', isActive: true,
    notes: 'Settlement limit — T+2 wire payments.', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  // BP — OIL-scoped PSR, reduced at last review
  { creditLimitId: 3, counterpartyId: 2, counterpartyName: 'BP Oil Trading', cpCountryCode: 'GB', countryRiskRating: 'LOW',
    limitType: 'PRE_SETTLEMENT', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'OIL',
    limitAmount: 75000000, limitCurrency: 'USD', usedAmount: 8310000, availableAmount: 66690000, utilisationPct: 11.1,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: 18,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    creditAnalystUserId: 8, creditAnalystName: 'Sarah Chen', approvedBy: 'Mary Andrews', approvalDate: '2025-11-20',
    reviewFrequencyDays: 180, lastReviewDate: '2025-11-20', nextReviewDate: '2026-05-19', lastReviewOutcome: 'DECREASE',
    internalRating: 'IR-3', externalRating: 'A-',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'ALERT_ONLY', alertInternal: true, alertCounterparty: false, cpAlertEmail: null,
    limitIndicator: 'OK', lineItems: [], alerts: [
      { alertId: 1, alertType: 'REVIEW_DUE', recipients: 'INTERNAL', message: 'Semi-annual review due 2026-05-19 — overdue, escalated to analyst.', sentAt: '2026-05-19T08:00:00Z', acknowledgedBy: 'Sarah Chen', acknowledgedAt: '2026-05-20T09:12:00Z' },
    ],
    status: 'UNDER_REVIEW', nettingAgreementRef: 'ISDA-2002-BP-002', isActive: true,
    notes: 'Reduced from $100M following Q3 2025 review. Review overdue — reassessment in progress.',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
  // Glencore — METALS MTM limit
  { creditLimitId: 4, counterpartyId: 4, counterpartyName: 'Glencore Metals', cpCountryCode: 'CH', countryRiskRating: 'LOW',
    limitType: 'MARK_TO_MARKET', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'METALS',
    limitAmount: 20000000, limitCurrency: 'USD', usedAmount: 2461250, availableAmount: 17538750, utilisationPct: 12.3,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: 12,
    effectiveDate: '2026-01-01', expiryDate: null,
    creditAnalystUserId: 9, creditAnalystName: 'Marcus Webb', approvedBy: 'Risk Director', approvalDate: '2026-01-05',
    reviewFrequencyDays: 180, lastReviewDate: '2026-01-05', nextReviewDate: '2026-07-04', lastReviewOutcome: 'MAINTAIN',
    internalRating: 'IR-3', externalRating: 'BBB+',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'ALERT_ONLY', alertInternal: true, alertCounterparty: false, cpAlertEmail: null,
    limitIndicator: 'OK', lineItems: [], alerts: [
      { alertId: 2, alertType: 'REVIEW_DUE', recipients: 'INTERNAL', message: 'Semi-annual review due 2026-07-04.', sentAt: '2026-07-01T08:00:00Z', acknowledgedBy: null, acknowledgedAt: null },
    ],
    status: 'ACTIVE', nettingAgreementRef: null, isActive: true,
    notes: 'MTM limit for LME metals positions.', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  // Vitol — PSR near 50%, temp uplift for summer cargo programme
  { creditLimitId: 5, counterpartyId: 7, counterpartyName: 'Vitol SA', cpCountryCode: 'CH', countryRiskRating: 'LOW',
    limitType: 'PRE_SETTLEMENT', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'OIL',
    limitAmount: 120000000, limitCurrency: 'USD', usedAmount: 59962500, availableAmount: 80037500, utilisationPct: 42.8,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: 20000000, tempUpliftExpiry: '2026-09-30', tenorCapMonths: 12,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    creditAnalystUserId: 8, creditAnalystName: 'Sarah Chen', approvedBy: 'Credit Committee', approvalDate: '2025-12-15',
    reviewFrequencyDays: 365, lastReviewDate: '2025-12-15', nextReviewDate: '2026-12-15', lastReviewOutcome: 'INCREASE',
    internalRating: 'IR-2', externalRating: 'BBB',
    warningThresholdPct: 75, criticalThresholdPct: 90, breachAction: 'BLOCK_NEW_TRADES', alertInternal: true, alertCounterparty: true, cpAlertEmail: 'credit.desk@vitol.com',
    limitIndicator: 'OK',
    lineItems: [
      { lineItemId: 4, instrumentClass: 'PHYSICAL', subLimitAmount: 100000000, usedAmount: 59962500, tenorCapMonths: 6, notes: 'Urals + Med cargo programme' },
      { lineItemId: 5, instrumentClass: 'FUTURES',  subLimitAmount: 40000000,  usedAmount: 0,        tenorCapMonths: 12, notes: 'Exchange-margined — lower weight' },
    ],
    alerts: [],
    status: 'ACTIVE', nettingAgreementRef: 'ISDA-2002-VITOL-007', isActive: true,
    notes: 'Temp uplift $20M for summer cargo programme, expires 30-Sep. CP receives status notices.',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-20T00:00:00Z' },
  // Centrica — expired, pending renewal
  { creditLimitId: 6, counterpartyId: 6, counterpartyName: 'Centrica Energy Trading', cpCountryCode: 'GB', countryRiskRating: 'LOW',
    limitType: 'PRE_SETTLEMENT', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'GAS',
    limitAmount: 15000000, limitCurrency: 'USD', usedAmount: 0, availableAmount: 15000000, utilisationPct: 0,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: 12,
    effectiveDate: '2026-01-01', expiryDate: '2026-06-30',
    creditAnalystUserId: 9, creditAnalystName: 'Marcus Webb', approvedBy: 'John Davies', approvalDate: '2026-01-10',
    reviewFrequencyDays: 180, lastReviewDate: '2026-01-10', nextReviewDate: '2026-07-09', lastReviewOutcome: 'MAINTAIN',
    internalRating: 'IR-4', externalRating: 'BBB-',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'ALERT_ONLY', alertInternal: true, alertCounterparty: false, cpAlertEmail: null,
    limitIndicator: 'OK', lineItems: [], alerts: [
      { alertId: 3, alertType: 'EXPIRY_APPROACHING', recipients: 'INTERNAL', message: 'Limit expires 2026-06-30 — renewal not yet approved.', sentAt: '2026-06-16T08:00:00Z', acknowledgedBy: 'Marcus Webb', acknowledgedAt: '2026-06-16T10:30:00Z' },
      { alertId: 4, alertType: 'STATUS_CHANGE', recipients: 'INTERNAL', message: 'Limit expired without renewal — new trades blocked.', sentAt: '2026-07-01T00:05:00Z', acknowledgedBy: null, acknowledgedAt: null },
    ],
    status: 'EXPIRED', nettingAgreementRef: null, isActive: false,
    notes: 'Expired — pending renewal.', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-30T00:00:00Z' },
  // Trafigura — ALLOCATED child under Trafigura Group umbrella, running hot (CRITICAL demo)
  { creditLimitId: 7, counterpartyId: 9, counterpartyName: 'Trafigura PTE Ltd', cpCountryCode: 'SG', countryRiskRating: 'MEDIUM',
    limitType: 'PRE_SETTLEMENT', limitBasis: 'ALLOCATED', parentLimitId: 8, commodityType: 'OIL',
    limitAmount: 40000000, limitCurrency: 'USD', usedAmount: 38800000, availableAmount: 1200000, utilisationPct: 97,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: 6,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    creditAnalystUserId: 9, creditAnalystName: 'Marcus Webb', approvedBy: 'Credit Committee', approvalDate: '2025-12-20',
    reviewFrequencyDays: 90, lastReviewDate: '2026-04-15', nextReviewDate: '2026-07-14', lastReviewOutcome: 'MAINTAIN',
    internalRating: 'IR-4', externalRating: 'BB+',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'BLOCK_NEW_TRADES', alertInternal: true, alertCounterparty: true, cpAlertEmail: 'credit@trafigura.com',
    limitIndicator: 'CRITICAL',
    lineItems: [
      { lineItemId: 6, instrumentClass: 'PHYSICAL', subLimitAmount: 35000000, usedAmount: 34500000, tenorCapMonths: 3, notes: 'TAS strip + physical cargoes' },
      { lineItemId: 7, instrumentClass: 'SWAPS',    subLimitAmount: 10000000, usedAmount: 4300000,  tenorCapMonths: 6, notes: null },
    ],
    alerts: [
      { alertId: 5, alertType: 'WARNING_THRESHOLD',  recipients: 'INTERNAL',     message: 'Utilisation crossed 80% (now 84.2%).', sentAt: '2026-06-24T14:02:00Z', acknowledgedBy: 'Marcus Webb', acknowledgedAt: '2026-06-24T15:00:00Z' },
      { alertId: 6, alertType: 'CRITICAL_THRESHOLD', recipients: 'BOTH',         message: 'Utilisation crossed 95% (now 97.0%) — new trades will be blocked at 100%. Counterparty credit desk notified.', sentAt: '2026-07-01T11:45:00Z', acknowledgedBy: null, acknowledgedAt: null },
    ],
    status: 'ACTIVE', nettingAgreementRef: 'ISDA-2002-TRAFI-004', isActive: true,
    notes: 'Allocated from Trafigura Group umbrella. 90-day review cycle due to MEDIUM country risk + BB+ rating.',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T11:45:00Z' },
  // Trafigura Group — parent umbrella limit (TOTAL_AGGREGATE)
  { creditLimitId: 8, counterpartyId: 9, counterpartyName: 'Trafigura PTE Ltd', cpCountryCode: 'SG', countryRiskRating: 'MEDIUM',
    limitType: 'TOTAL_AGGREGATE', limitBasis: 'DIRECT', parentLimitId: null, commodityType: 'ALL',
    limitAmount: 60000000, limitCurrency: 'USD', usedAmount: 38800000, availableAmount: 21200000, utilisationPct: 64.7,
    collateralOffset: 0, collateralRef: null, tempUpliftAmount: null, tempUpliftExpiry: null, tenorCapMonths: 12,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    creditAnalystUserId: 9, creditAnalystName: 'Marcus Webb', approvedBy: 'Credit Committee', approvalDate: '2025-12-20',
    reviewFrequencyDays: 90, lastReviewDate: '2026-04-15', nextReviewDate: '2026-07-14', lastReviewOutcome: 'MAINTAIN',
    internalRating: 'IR-4', externalRating: 'BB+',
    warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'BLOCK_NEW_TRADES', alertInternal: true, alertCounterparty: false, cpAlertEmail: null,
    limitIndicator: 'OK', lineItems: [], alerts: [],
    status: 'ACTIVE', nettingAgreementRef: 'ISDA-2002-TRAFI-004', isActive: true,
    notes: 'Group umbrella — child allocations must not exceed this cap.',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
];

// ─── CREDIT — LETTERS OF CREDIT ───────────────────────────────────────────────
const lettersOfCreditStore: unknown[] = [
  { lcId: 1, lcReference: 'LC/2026/HSBC/001234', lcType: 'STANDBY',     status: 'ACTIVE',           counterpartyId: 8, counterpartyName: 'Cargill International SA',  beneficiaryEntityId: 1, beneficiaryEntityName: 'NonameETRM Trading Ltd', issuingBankName: 'HSBC Bank plc',         issuingBankBic: 'HBUKGB4B', confirmingBankName: null,         lcAmount: 5000000,  lcCurrency: 'USD', issuedAmount: 5000000,  drawdownAmount: 0,       availableAmount: 5000000,  issueDate: '2026-02-01', expiryDate: '2027-01-31', presentationDeadlineDays: 21, isEvergreen: true,  autoRenewalDays: 60, placeOfExpiry: 'London',    applicableLaw: 'ISP98',   notes: 'Evergreen standby LC. 60-day cancellation notice required.', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
  { lcId: 2, lcReference: 'LC/2026/CITI/005521', lcType: 'DOCUMENTARY', status: 'PARTIALLY_DRAWN',  counterpartyId: 3, counterpartyName: 'Equinor Energy AS',          beneficiaryEntityId: 1, beneficiaryEntityName: 'NonameETRM Trading Ltd', issuingBankName: 'Citibank N.A.',         issuingBankBic: 'CITIUS33',  confirmingBankName: 'Barclays Bank', lcAmount: 3500000,  lcCurrency: 'USD', issuedAmount: 3500000,  drawdownAmount: 1750000, availableAmount: 1750000,  issueDate: '2026-03-15', expiryDate: '2026-09-14', presentationDeadlineDays: 14, isEvergreen: false, autoRenewalDays: null, placeOfExpiry: 'Houston',   applicableLaw: 'UCP 600', notes: 'TTF gas delivery LC. 50% drawn on Jul cargo.', createdAt: '2026-03-15T00:00:00Z', updatedAt: '2026-07-05T00:00:00Z' },
  { lcId: 3, lcReference: 'LC/2026/BNP/009871', lcType: 'REVOLVING',   status: 'ACTIVE',           counterpartyId: 4, counterpartyName: 'Glencore Metals',           beneficiaryEntityId: 1, beneficiaryEntityName: 'NonameETRM Trading Ltd', issuingBankName: 'BNP Paribas SA',        issuingBankBic: 'BNPAFRPP',  confirmingBankName: null,         lcAmount: 10000000, lcCurrency: 'USD', issuedAmount: 15000000, drawdownAmount: 3200000, availableAmount: 6800000,  issueDate: '2026-01-10', expiryDate: '2026-12-31', presentationDeadlineDays: 21, isEvergreen: false, autoRenewalDays: null, placeOfExpiry: 'Paris',     applicableLaw: 'UCP 600', notes: 'Revolving LC — reinstates after each draw.',  createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { lcId: 4, lcReference: 'LC/2025/DBS/778821',  lcType: 'STANDBY',     status: 'EXPIRED',          counterpartyId: 5, counterpartyName: 'RWE Supply & Trading',      beneficiaryEntityId: 1, beneficiaryEntityName: 'NonameETRM Trading Ltd', issuingBankName: 'DBS Bank Ltd',          issuingBankBic: 'DBSSSGSG',  confirmingBankName: null,         lcAmount: 2000000,  lcCurrency: 'EUR', issuedAmount: 2000000,  drawdownAmount: 0,       availableAmount: 0,        issueDate: '2025-01-01', expiryDate: '2025-12-31', presentationDeadlineDays: 30, isEvergreen: false, autoRenewalDays: null, placeOfExpiry: 'Singapore', applicableLaw: 'ISP98',   notes: 'Expired. Renewal under discussion.',          createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-12-31T00:00:00Z' },
];

// ─── CARBON & ENVIRONMENTAL ───────────────────────────────────────────────────
const emissionSchemesStore: unknown[] = [
  { schemeId: 1, schemeCode: 'EU_ETS',  schemeName: 'EU Emissions Trading System',                schemeType: 'COMPLIANCE', regulator: 'European Commission',       jurisdiction: 'European Union',    description: 'Phase IV (2021-2030) covers power, industry, and aviation within the EU. Annual surrender by 30 April.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { schemeId: 2, schemeCode: 'UK_ETS',  schemeName: 'UK Emissions Trading Scheme',                schemeType: 'COMPLIANCE', regulator: 'UK DESNZ / EA',             jurisdiction: 'United Kingdom',    description: 'UK successor to EU ETS post-Brexit. Launched January 2021. Auction-based with free allocation for industry.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { schemeId: 3, schemeCode: 'CA_CAP',  schemeName: 'California Cap-and-Trade Program',           schemeType: 'COMPLIANCE', regulator: 'California Air Resources Board', jurisdiction: 'California, USA', description: 'AB 32 compliance market. Linked with Quebec. Covers ~85% of California GHG emissions.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { schemeId: 4, schemeCode: 'RGGI',    schemeName: 'Regional Greenhouse Gas Initiative',         schemeType: 'COMPLIANCE', regulator: 'RGGI Inc.',                  jurisdiction: 'US Northeast',      description: 'Multi-state US cap-and-invest programme covering power sector CO2 in 12 northeastern states.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { schemeId: 5, schemeCode: 'VCS',     schemeName: 'Verified Carbon Standard (Verra)',           schemeType: 'VOLUNTARY',  regulator: 'Verra',                      jurisdiction: 'Global',            description: 'World\'s largest voluntary carbon market. Issues VCUs for REDD+, cookstove, and other project types.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { schemeId: 6, schemeCode: 'GS',      schemeName: 'Gold Standard for the Global Goals',        schemeType: 'VOLUNTARY',  regulator: 'Gold Standard Foundation',   jurisdiction: 'Global',            description: 'Premium voluntary carbon and SDG standard. Issues Gold Standard Verified Emission Reductions (GSVERs).', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const carbonRegistriesStore: unknown[] = [
  { registryId: 1, registryCode: 'EU_UNION', registryName: 'EU Union Registry',             registryType: 'COMPLIANCE', operator: 'European Commission / SRD', website: 'registry.ets.europa.eu', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { registryId: 2, registryCode: 'UK_REG',   registryName: 'UK Emissions Trading Registry', registryType: 'COMPLIANCE', operator: 'Environment Agency (UK)',    website: 'etregistration.net',     isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { registryId: 3, registryCode: 'VERRA',    registryName: 'Verra Registry',                registryType: 'VOLUNTARY',  operator: 'Verra',                    website: 'registry.verra.org',     isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { registryId: 4, registryCode: 'GOLD_STD', registryName: 'Gold Standard Impact Registry', registryType: 'VOLUNTARY',  operator: 'Gold Standard Foundation', website: 'registry.goldstandard.org', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { registryId: 5, registryCode: 'APX',      registryName: 'APX / Evident Environmental Registry', registryType: 'VOLUNTARY', operator: 'Xpansiv (APX / Evident)', website: 'apx.com/evident', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const environmentalProductsStore: unknown[] = [
  { productId: 1, productCode: 'EUA',  productName: 'EU Emission Allowance',           productType: 'ALLOWANCE',   schemeId: 1, schemeName: 'EU Emissions Trading System', registryId: 1, registryName: 'EU Union Registry', unitOfMeasure: 'tCO2e', description: 'One allowance = right to emit 1 tonne CO2e under EU ETS Phase IV.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 2, productCode: 'EUAA', productName: 'EU Aviation Allowance',           productType: 'ALLOWANCE',   schemeId: 1, schemeName: 'EU Emissions Trading System', registryId: 1, registryName: 'EU Union Registry', unitOfMeasure: 'tCO2e', description: 'Aviation-specific EUA. Airlines use EUAAs to cover intra-EU flight emissions.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 3, productCode: 'UKA',  productName: 'UK Allowance',                   productType: 'ALLOWANCE',   schemeId: 2, schemeName: 'UK Emissions Trading Scheme', registryId: 2, registryName: 'UK Emissions Trading Registry', unitOfMeasure: 'tCO2e', description: 'UK ETS allowance. Non-fungible with EUAs post-Brexit.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 4, productCode: 'CCA',  productName: 'California Carbon Allowance',    productType: 'ALLOWANCE',   schemeId: 3, schemeName: 'California Cap-and-Trade Program', registryId: null, registryName: null, unitOfMeasure: 'short tCO2e', description: 'California Cap-and-Trade allowance. Can be used in Quebec WCI market.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 5, productCode: 'VCU',  productName: 'Verra Carbon Unit',              productType: 'OFFSET',      schemeId: 5, schemeName: 'Verified Carbon Standard (Verra)', registryId: 3, registryName: 'Verra Registry', unitOfMeasure: 'tCO2e', description: 'Voluntary carbon offset issued by Verra under VCS standard. Includes REDD+, ARR, and IFM project types.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 6, productCode: 'REC',  productName: 'Renewable Energy Certificate',   productType: 'CERTIFICATE', schemeId: null, schemeName: null, registryId: 5, registryName: 'APX / Evident Environmental Registry', unitOfMeasure: 'MWh', description: 'US renewable energy certificate. 1 REC = 1 MWh of electricity from a certified renewable source.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 7, productCode: 'GO',   productName: 'Guarantee of Origin',            productType: 'CERTIFICATE', schemeId: null, schemeName: null, registryId: 1, registryName: 'EU Union Registry', unitOfMeasure: 'MWh', description: 'EU/UK certificate for renewable electricity generation. 1 GO = 1 MWh. Used for corporate PPA disclosure.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const emissionObligationsStore: unknown[] = [
  { obligationId: 1, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', schemeId: 1, schemeName: 'EU Emissions Trading System', obligationYear: 2025, verifiedEmissions: 125000, allowancesHeld: 118000, shortfallUnits: 7000, surrenderDeadline: '2026-04-30', status: 'OPEN', notes: 'Verified by Bureau Veritas. 7,000 EUA shortfall — sourcing in Q1 2026.', createdAt: '2025-06-01T00:00:00Z' },
  { obligationId: 2, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', schemeId: 2, schemeName: 'UK Emissions Trading Scheme', obligationYear: 2025, verifiedEmissions: 42000,  allowancesHeld: 45000,  shortfallUnits: -3000, surrenderDeadline: '2026-04-30', status: 'OPEN', notes: 'Surplus of 3,000 UKAs. Will carry forward or sell.', createdAt: '2025-06-01T00:00:00Z' },
];

// ─── FINANCE — GL ACCOUNTS ────────────────────────────────────────────────────
/** Denormalizes legal entity / book / parent account display codes, same pattern as computeCreditLimit. */
function computeGlAccount(input: Record<string, unknown>): Record<string, unknown> {
  const leId = input['legalEntityId'] as number | null;
  const bookId = input['bookId'] as number | null;
  const parentId = input['parentAccountId'] as number | null;
  const le = leId != null ? legalEntityStore.find((e) => e.legalEntityId === leId) : null;
  const book = bookId != null ? (booksStore as Array<Record<string, unknown>>).find((b) => b['bookId'] === bookId) : null;
  const parent = parentId != null
    ? (glAccountsStore as Array<Record<string, unknown>>).find((a) => a['accountId'] === parentId)
    : null;
  return {
    ...input,
    legalEntityCode: le?.entityCode ?? null,
    bookCode: (book?.['bookCode'] as string | undefined) ?? null,
    parentAccountCode: (parent?.['accountCode'] as string | undefined) ?? null,
  };
}

// commodityType is now the numeric FK id into COMMODITY_TYPE_LOOKUP (V55) — see desksStore comment above.
const glAccountsStore: unknown[] = [
  { accountId: 1, accountCode: '4100', accountName: 'Trade Revenue — Physical Oil',         accountType: 'REVENUE',   commodityType: 1,             costCenter: 'TRADING',     description: 'Revenue from physical oil sale contracts — crude and products.', legalEntityId: 1, legalEntityCode: 'ACME-UK', bookId: 1, bookCode: 'CRUDE-PROP',  parentAccountId: null, parentAccountCode: null, normalBalance: 'CREDIT', currencyCode: 'USD', externalGlCode: 'SAP-410010', isControlAccount: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 2, accountCode: '4200', accountName: 'Trade Revenue — Physical Gas',         accountType: 'REVENUE',   commodityType: 2,             costCenter: 'TRADING',     description: 'Revenue from physical natural gas and LNG sale contracts.', legalEntityId: 2, legalEntityCode: 'ACME-US',  bookId: 3, bookCode: 'GAS-EU-TRADE', parentAccountId: null, parentAccountCode: null, normalBalance: 'CREDIT', currencyCode: 'EUR', externalGlCode: 'SAP-420010', isControlAccount: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 3, accountCode: '4300', accountName: 'Trade Revenue — Power',               accountType: 'REVENUE',   commodityType: 3,             costCenter: 'TRADING',     description: 'Revenue from power sale contracts and ancillary services.', legalEntityId: 2, legalEntityCode: 'ACME-US',  bookId: 5, bookCode: 'POWER-CLIENT', parentAccountId: null, parentAccountCode: null, normalBalance: 'CREDIT', currencyCode: 'EUR', externalGlCode: 'SAP-430010', isControlAccount: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 4, accountCode: '5100', accountName: 'Cost of Goods Sold — Physical Oil',   accountType: 'COST',      commodityType: 1,             costCenter: 'TRADING',     description: 'Purchase cost of physical oil — crude and products.', legalEntityId: 1, legalEntityCode: 'ACME-UK', bookId: 1, bookCode: 'CRUDE-PROP',  parentAccountId: null, parentAccountCode: null, normalBalance: 'DEBIT',  currencyCode: 'USD', externalGlCode: 'SAP-510010', isControlAccount: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 5, accountCode: '6100', accountName: 'Unrealised MTM — Open Positions',     accountType: 'PNL',       commodityType: null,          costCenter: 'RISK',        description: 'Mark-to-market fair value of all open physical and financial positions.', legalEntityId: null, legalEntityCode: null, bookId: null, bookCode: null, parentAccountId: null, parentAccountCode: null, normalBalance: 'DEBIT', currencyCode: null, externalGlCode: 'SAP-610010', isControlAccount: true, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 6, accountCode: '1200', accountName: 'Trade Receivables',                   accountType: 'ASSET',     commodityType: null,          costCenter: 'OPERATIONS',  description: 'Amounts owed by counterparties for settled trades.', legalEntityId: null, legalEntityCode: null, bookId: null, bookCode: null, parentAccountId: null, parentAccountCode: null, normalBalance: 'DEBIT', currencyCode: null, externalGlCode: 'SAP-120000', isControlAccount: true, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 7, accountCode: '2100', accountName: 'Trade Payables',                      accountType: 'LIABILITY', commodityType: null,          costCenter: 'OPERATIONS',  description: 'Amounts owed to counterparties for settled purchases.', legalEntityId: null, legalEntityCode: null, bookId: null, bookCode: null, parentAccountId: null, parentAccountCode: null, normalBalance: 'CREDIT', currencyCode: null, externalGlCode: 'SAP-210000', isControlAccount: true, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 8, accountCode: '4110', accountName: 'Trade Revenue — Crude Proprietary Book', accountType: 'REVENUE', commodityType: 1,           costCenter: 'TRADING',     description: 'Sub-account of Trade Revenue — Physical Oil, scoped to the crude proprietary book.', legalEntityId: 1, legalEntityCode: 'ACME-UK', bookId: 1, bookCode: 'CRUDE-PROP', parentAccountId: 1, parentAccountCode: '4100', normalBalance: 'CREDIT', currencyCode: 'USD', externalGlCode: 'SAP-410011', isControlAccount: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── RINS — RENEWABLE FUEL STANDARD ──────────────────────────────────────────
const rinFuelCategoriesStore: unknown[] = [
  { categoryId: 1, dCode: 'D3', fuelName: 'Cellulosic Biofuel',   fuelType: 'CELLULOSIC',        equivalenceValue: 3.0, energySources: 'Corn Stover, Switchgrass, Woody Biomass, Municipal Solid Waste', description: 'Highest-value RIN category. Produced from cellulosic feedstocks not from food crops. Very limited supply — attracts a significant premium over D6.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { categoryId: 2, dCode: 'D4', fuelName: 'Biomass-Based Diesel', fuelType: 'BIOMASS_DIESEL',    equivalenceValue: 1.5, energySources: 'Soybean Oil, Animal Fats, Used Cooking Oil, Distillers Corn Oil', description: 'Includes biodiesel (B100) and renewable diesel. Also satisfies the Advanced Biofuel (D5) nested volume. Widely produced with a deep liquid market.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { categoryId: 3, dCode: 'D5', fuelName: 'Advanced Biofuel',     fuelType: 'ADVANCED',          equivalenceValue: 1.5, energySources: 'Sugarcane Ethanol, Naphtha from Biomass, Biobutanol', description: 'Lifecycle GHG reduction of at least 50% vs. petroleum. Includes sugarcane ethanol (Brazil). Can be satisfied by D4 RINs as D4 is a subset of the Advanced category.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { categoryId: 4, dCode: 'D6', fuelName: 'Conventional Biofuel', fuelType: 'CONVENTIONAL',      equivalenceValue: 1.0, energySources: 'Corn Ethanol, Grain Sorghum Ethanol', description: 'Largest RIN category by volume. Corn ethanol produced at US facilities. Only satisfies the total renewable fuel nested volume — cannot be used to meet Advanced, BBD, or Cellulosic requirements.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { categoryId: 5, dCode: 'D7', fuelName: 'Cellulosic Diesel',    fuelType: 'CELLULOSIC_DIESEL', equivalenceValue: 1.7, energySources: 'Cellulosic feedstocks (wood, agricultural residues) via thermochemical or biochemical conversion', description: 'Cellulosic biofuel that also qualifies as biomass-based diesel. Satisfies both cellulosic and BBD nested volumes simultaneously.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const rinAccountsStore: unknown[] = [
  { accountId: 1, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', epaCompanyId: 'CO0012345', epaFacilityId: null,       accountCode: 'RIN-OBL-001', accountName: 'NonameETRM — Obligated Party Account',    accountType: 'OBLIGATED_PARTY',         isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 2, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', epaCompanyId: 'CO0012345', epaFacilityId: 'FAC-B001', accountCode: 'RIN-PRD-001', accountName: 'NonameETRM Biofuels — Producer Account', accountType: 'RENEWABLE_FUEL_PRODUCER', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { accountId: 3, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', epaCompanyId: 'CO0012345', epaFacilityId: null,       accountCode: 'RIN-TRD-001', accountName: 'NonameETRM — Trading / Separated RINs',    accountType: 'TRADING',                 isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const rinTransactionsStore: unknown[] = [
  { transactionId: 1,  transactionType: 'GENERATE',      transactionDate: '2025-01-10', accountId: 2, accountName: 'NonameETRM Biofuels — Producer Account', dCode: 'D4', fuelName: 'Biomass-Based Diesel', vintageYear: 2025, quantity: 125000,   pricePerRin: null,   totalValue: null,      counterpartyId: null, counterpartyName: null,                 tradeReference: 'CARGO-2025-001', batchNumber: '202501-12345-00001', epaTransactionId: 'EMTS-2025-G00123', obligationId: null, notes: 'Soybean oil biodiesel batch — January run', status: 'CONFIRMED', createdAt: '2025-01-10T09:00:00Z' },
  { transactionId: 2,  transactionType: 'SEPARATE',      transactionDate: '2025-01-12', accountId: 2, accountName: 'NonameETRM Biofuels — Producer Account', dCode: 'D4', fuelName: 'Biomass-Based Diesel', vintageYear: 2025, quantity: 125000,   pricePerRin: null,   totalValue: null,      counterpartyId: null, counterpartyName: null,                 tradeReference: null,             batchNumber: '202501-12345-00001', epaTransactionId: 'EMTS-2025-S00124', obligationId: null, notes: 'Separating D4 RINs from Jan biodiesel batch for trading', status: 'CONFIRMED', createdAt: '2025-01-12T10:00:00Z' },
  { transactionId: 3,  transactionType: 'TRANSFER_BUY',  transactionDate: '2025-01-20', accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2025, quantity: 1500000,  pricePerRin: 0.7250, totalValue: 1087500,   counterpartyId: 7,    counterpartyName: 'Vitol SA',          tradeReference: 'TRD-20250120-001', batchNumber: null,                 epaTransactionId: null,               obligationId: null, notes: 'Block purchase via broker', status: 'CONFIRMED', createdAt: '2025-01-20T14:30:00Z' },
  { transactionId: 4,  transactionType: 'TRANSFER_BUY',  transactionDate: '2025-02-05', accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2025, quantity: 800000,   pricePerRin: 0.7400, totalValue: 592000,    counterpartyId: 2,    counterpartyName: 'BP Oil Trading',    tradeReference: 'TRD-20250205-002', batchNumber: null,                 epaTransactionId: null,               obligationId: null, notes: 'Feb top-up purchase', status: 'CONFIRMED', createdAt: '2025-02-05T11:00:00Z' },
  { transactionId: 5,  transactionType: 'TRANSFER_BUY',  transactionDate: '2025-03-15', accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2024, quantity: 500000,   pricePerRin: 0.6800, totalValue: 340000,    counterpartyId: 1,    counterpartyName: 'Shell Trading International', tradeReference: 'TRD-20250315-003', batchNumber: null, epaTransactionId: null,               obligationId: null, notes: 'Prior-year vintage at discount — applies up to 20% of 2025 RVO', status: 'CONFIRMED', createdAt: '2025-03-15T09:45:00Z' },
  { transactionId: 6,  transactionType: 'TRANSFER_BUY',  transactionDate: '2025-04-10', accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D3', fuelName: 'Cellulosic Biofuel',    vintageYear: 2025, quantity: 15000,    pricePerRin: 3.2000, totalValue: 48000,     counterpartyId: 8,    counterpartyName: 'Cargill International SA', tradeReference: 'TRD-20250410-004', batchNumber: null, epaTransactionId: null,               obligationId: null, notes: 'Small D3 purchase to partially satisfy cellulosic obligation', status: 'CONFIRMED', createdAt: '2025-04-10T16:00:00Z' },
  { transactionId: 7,  transactionType: 'RETIRE',        transactionDate: '2025-05-01', accountId: 1, accountName: 'NonameETRM — Obligated Party Account',   dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2025, quantity: 1200000,  pricePerRin: null,   totalValue: null,      counterpartyId: null, counterpartyName: null,                 tradeReference: null,             batchNumber: null,                 epaTransactionId: 'EMTS-2025-R00441', obligationId: 1,    notes: 'Q1 2025 RVO partial retirement — D6', status: 'CONFIRMED', createdAt: '2025-05-01T08:00:00Z' },
  { transactionId: 8,  transactionType: 'RETIRE',        transactionDate: '2025-05-01', accountId: 1, accountName: 'NonameETRM — Obligated Party Account',   dCode: 'D4', fuelName: 'Biomass-Based Diesel', vintageYear: 2025, quantity: 500000,   pricePerRin: null,   totalValue: null,      counterpartyId: null, counterpartyName: null,                 tradeReference: null,             batchNumber: null,                 epaTransactionId: 'EMTS-2025-R00442', obligationId: 2,    notes: 'Full D4 BBD obligation satisfied', status: 'CONFIRMED', createdAt: '2025-05-01T08:15:00Z' },
  { transactionId: 9,  transactionType: 'TRANSFER_BUY',  transactionDate: '2025-06-20', accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2025, quantity: 600000,   pricePerRin: 0.7600, totalValue: 456000,    counterpartyId: 3,    counterpartyName: 'Equinor Energy AS', tradeReference: 'TRD-20250620-005', batchNumber: null, epaTransactionId: null,               obligationId: null, notes: 'H2 procurement — staggered to reduce market impact', status: 'CONFIRMED', createdAt: '2025-06-20T13:00:00Z' },
  { transactionId: 10, transactionType: 'TRANSFER_SELL', transactionDate: '2025-06-25', accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D4', fuelName: 'Biomass-Based Diesel', vintageYear: 2025, quantity: 50000,    pricePerRin: 1.5500, totalValue: 77500,     counterpartyId: 4,    counterpartyName: 'Glencore Metals',   tradeReference: 'TRD-20250625-006', batchNumber: null, epaTransactionId: null,               obligationId: null, notes: 'Selling surplus D4 — above RVO requirement', status: 'CONFIRMED', createdAt: '2025-06-25T10:30:00Z' },
];

const rinInventoryStore: unknown[] = [
  { inventoryId: 1, accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2025, quantity: 1700000, avgCostPerRin: 0.7334, totalValue: 1246780, asOfDate: '2026-07-01' },
  { inventoryId: 2, accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D6', fuelName: 'Conventional Biofuel',  vintageYear: 2024, quantity: 500000,  avgCostPerRin: 0.6800, totalValue: 340000,  asOfDate: '2026-07-01' },
  { inventoryId: 3, accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D4', fuelName: 'Biomass-Based Diesel', vintageYear: 2025, quantity: 75000,   avgCostPerRin: null,   totalValue: null,    asOfDate: '2026-07-01' },
  { inventoryId: 4, accountId: 3, accountName: 'NonameETRM — Trading / Separated RINs',  dCode: 'D3', fuelName: 'Cellulosic Biofuel',   vintageYear: 2025, quantity: 15000,   avgCostPerRin: 3.2000, totalValue: 48000,   asOfDate: '2026-07-01' },
];

const rinObligationsStore: unknown[] = [
  { obligationId: 1, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', complianceYear: 2025, dCode: 'D6', fuelName: 'Conventional Biofuel',  requiredQuantity: 5000000, retiredQuantity: 1200000, shortfallQuantity: 3800000, deadline: '2026-03-31', status: 'PARTIALLY_SATISFIED', notes: 'Q1 partial retirement complete. H2 procurement underway.', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-05-01T00:00:00Z' },
  { obligationId: 2, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', complianceYear: 2025, dCode: 'D4', fuelName: 'Biomass-Based Diesel', requiredQuantity: 500000,  retiredQuantity: 500000,  shortfallQuantity: 0,       deadline: '2026-03-31', status: 'SATISFIED',           notes: 'Fully satisfied via company biodiesel production.', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-05-01T00:00:00Z' },
  { obligationId: 3, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', complianceYear: 2025, dCode: 'D5', fuelName: 'Advanced Biofuel',     requiredQuantity: 250000,  retiredQuantity: 0,       shortfallQuantity: 250000,  deadline: '2026-03-31', status: 'OPEN',                notes: 'D4 RINs can satisfy D5 obligation as BBD is a subset of Advanced.', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { obligationId: 4, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', complianceYear: 2025, dCode: 'D3', fuelName: 'Cellulosic Biofuel',   requiredQuantity: 100000,  retiredQuantity: 0,       shortfallQuantity: 100000,  deadline: '2026-03-31', status: 'OPEN',                notes: 'Limited D3 supply. ALC (cellulosic waiver credit) purchase being evaluated.', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { obligationId: 5, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', complianceYear: 2024, dCode: 'D6', fuelName: 'Conventional Biofuel',  requiredQuantity: 4500000, retiredQuantity: 4500000, shortfallQuantity: 0,       deadline: '2025-03-31', status: 'SATISFIED',           notes: '2024 D6 obligation fully satisfied March 2025.', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-03-28T00:00:00Z' },
  { obligationId: 6, legalEntityId: 1, entityName: 'NonameETRM Trading Ltd', complianceYear: 2024, dCode: 'D4', fuelName: 'Biomass-Based Diesel', requiredQuantity: 450000,  retiredQuantity: 450000,  shortfallQuantity: 0,       deadline: '2025-03-31', status: 'SATISFIED',           notes: '2024 D4 obligation fully satisfied.', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-03-28T00:00:00Z' },
];

// ─── GENERAL TERMS & CONDITIONS ────────────────────────────────────────────────
const gtcsStore: unknown[] = [
  { gtcId: 1, gtcCode: 'BP-OIL-2020', gtcName: 'BP Standard Crude Oil GTCs 2020', gtcType: 'CRUDE_OIL', version: '2020-v3', effectiveDate: '2020-01-01', expiryDate: null, jurisdiction: 'England & Wales', governingLaw: 'English Law', disputeResolution: 'LCIA', documentRef: 'DOC-GTC-001', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { gtcId: 2, gtcCode: 'EFET-GAS-2019', gtcName: 'EFET General Agreement Gas 2019', gtcType: 'GAS', version: '2019-v2', effectiveDate: '2019-07-01', expiryDate: null, jurisdiction: 'England & Wales', governingLaw: 'English Law', disputeResolution: 'ICC', documentRef: 'DOC-GTC-002', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { gtcId: 3, gtcCode: 'LME-METALS-2021', gtcName: 'LME Contract Rules & Regulations 2021', gtcType: 'METALS', version: '2021-v1', effectiveDate: '2021-01-01', expiryDate: null, jurisdiction: 'England & Wales', governingLaw: 'English Law', disputeResolution: 'Court', documentRef: 'DOC-GTC-003', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { gtcId: 4, gtcCode: 'GAFTA-100', gtcName: 'GAFTA Contract No.100 (Grains CIF)', gtcType: 'AGRICULTURAL', version: 'Rev 2024', effectiveDate: '2024-01-01', expiryDate: null, jurisdiction: 'England & Wales', governingLaw: 'English Law', disputeResolution: 'GAFTA Arbitration', documentRef: 'DOC-GTC-004', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { gtcId: 5, gtcCode: 'ISDA-2002-MA', gtcName: 'ISDA 2002 Master Agreement (Derivatives)', gtcType: 'GENERIC', version: '2002', effectiveDate: '2002-01-01', expiryDate: null, jurisdiction: 'New York', governingLaw: 'New York Law', disputeResolution: 'Court (SDNY)', documentRef: 'DOC-GTC-005', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { gtcId: 6, gtcCode: 'NAESB-GAS-2013', gtcName: 'NAESB Base Contract for Sale of Natural Gas', gtcType: 'GAS', version: '2013', effectiveDate: '2013-01-01', expiryDate: null, jurisdiction: 'Texas', governingLaw: 'Texas Law', disputeResolution: 'AAA', documentRef: 'DOC-GTC-006', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── TRUCKS ───────────────────────────────────────────────────────────────────
const trucksStore: unknown[] = [
  { vehicleId: 1, vehicleCode: 'TRK-001', vehicleName: 'Mercedes Actros 2663', vehicleType: 'ROAD_TANKER', licensePlate: 'LK21 ABT', operatorName: 'Hoyer Group', capacity: 32000, capacityUomCode: 'LTR', countryCode: 'GB', gvwTonnes: 44, licenseExpiryDate: '2027-06-30', inspectionExpiryDate: '2026-09-15', adrCertExpiry: '2027-01-01', commodityType: 'OIL', statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vehicleId: 2, vehicleCode: 'TRK-002', vehicleName: 'Volvo FH 500', vehicleType: 'ROAD_TANKER', licensePlate: 'DE-MUC-H4521', operatorName: 'Tank & Rast GmbH', capacity: 30000, capacityUomCode: 'LTR', countryCode: 'DE', gvwTonnes: 40, licenseExpiryDate: '2026-12-31', inspectionExpiryDate: '2026-08-01', adrCertExpiry: '2026-09-30', commodityType: 'OIL', statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vehicleId: 3, vehicleCode: 'TRK-003', vehicleName: 'Scania R 450', vehicleType: 'DRY_BULK', licensePlate: 'NL-RT-1234', operatorName: 'Van den Bosch Transporten', capacity: 90, capacityUomCode: 'MT', countryCode: 'NL', gvwTonnes: 40, licenseExpiryDate: '2027-03-31', inspectionExpiryDate: '2026-11-30', adrCertExpiry: null, commodityType: 'AGRICULTURAL', statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vehicleId: 4, vehicleCode: 'TRK-004', vehicleName: 'DAF XF 480 Isotank', vehicleType: 'ISOTANK', licensePlate: 'SG-TK-8821', operatorName: 'Bulk Liquid Logistics SG', capacity: 25000, capacityUomCode: 'LTR', countryCode: 'SG', gvwTonnes: 38, licenseExpiryDate: '2026-07-15', inspectionExpiryDate: '2026-07-15', adrCertExpiry: '2026-07-15', commodityType: 'GAS', statusCode: 'MAINTENANCE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vehicleId: 5, vehicleCode: 'TRK-005', vehicleName: 'Iveco Stralis 460', vehicleType: 'ROAD_TANKER', licensePlate: 'IT-MI-42918', operatorName: 'PETROLAV SpA', capacity: 28000, capacityUomCode: 'LTR', countryCode: 'IT', gvwTonnes: 44, licenseExpiryDate: '2027-09-30', inspectionExpiryDate: '2027-03-31', adrCertExpiry: '2028-06-30', commodityType: 'OIL', statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── STORAGE FACILITIES ────────────────────────────────────────────────────────
const storageStore: unknown[] = [
  { storageId: 1, storageCode: 'CUSHING-T1', storageName: 'Cushing Tank Farm T-1', storageType: 'TANK_FARM', locationCode: 'CUSHING-OK', commodityType: 'OIL', capacity: 15000000, capacityUomCode: 'BBL', operatorName: 'Magellan Midstream Partners', countryCode: 'US', regulatoryRef: 'FERC-TSA-001', injectionRate: 500000, withdrawalRate: 500000, statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { storageId: 2, storageCode: 'HUMBLY-GROVE', storageName: 'Humbly Grove Gas Storage', storageType: 'GAS_STORAGE', locationCode: 'NBP-UK', commodityType: 'GAS', capacity: 270000000, capacityUomCode: 'THERM', operatorName: 'Storengy UK', countryCode: 'GB', regulatoryRef: 'Ofgem-GAS-UGS-001', injectionRate: 750000, withdrawalRate: 1200000, statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { storageId: 3, storageCode: 'BERGERMEER-NL', storageName: 'Bergermeer Gas Storage', storageType: 'SALT_CAVERN', locationCode: 'TTF-NL', commodityType: 'GAS', capacity: 4600000000, capacityUomCode: 'M3', operatorName: 'TAQA Energy BV', countryCode: 'NL', regulatoryRef: 'ACM-GAS-BGM-001', injectionRate: 25000000, withdrawalRate: 35000000, statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { storageId: 4, storageCode: 'GATE-LNG-RTM', storageName: 'Gate LNG Terminal Rotterdam', storageType: 'LNG_TANK', locationCode: 'ROTTERDAM', commodityType: 'GAS', capacity: 540000, capacityUomCode: 'M3_LNG', operatorName: 'Gate Terminal BV', countryCode: 'NL', regulatoryRef: 'ACM-LNG-GATE-001', injectionRate: null, withdrawalRate: 12000000, statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { storageId: 5, storageCode: 'LME-METRO-DT', storageName: 'Metro Detroit LME Approved Warehouse', storageType: 'WAREHOUSE', locationCode: null, commodityType: 'METALS', capacity: 500000, capacityUomCode: 'MT', operatorName: 'Metro International Trade Services', countryCode: 'US', regulatoryRef: 'LME-WH-2024-DT01', injectionRate: null, withdrawalRate: null, statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { storageId: 6, storageCode: 'SULLOM-STORAGE', storageName: 'Sullom Voe Crude Storage Tanks', storageType: 'TANK_FARM', locationCode: 'SULLOM-VOE', commodityType: 'OIL', capacity: 12000000, capacityUomCode: 'BBL', operatorName: 'Equinor / Shetland Islands Council', countryCode: 'GB', regulatoryRef: 'NSTA-OFFSHORE-001', injectionRate: 200000, withdrawalRate: 200000, statusCode: 'OPERATIONAL', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── CURRENCIES ───────────────────────────────────────────────────────────────
const currenciesStore: unknown[] = [
  { currencyId: 1, currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$', countryCode: 'US', decimalPlaces: 2, isBaseCurrency: true, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 2, currencyCode: 'EUR', currencyName: 'Euro', symbol: '€', countryCode: null, decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 3, currencyCode: 'GBP', currencyName: 'Pound Sterling', symbol: '£', countryCode: 'GB', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 4, currencyCode: 'JPY', currencyName: 'Japanese Yen', symbol: '¥', countryCode: 'JP', decimalPlaces: 0, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 5, currencyCode: 'CNY', currencyName: 'Chinese Renminbi', symbol: '¥', countryCode: 'CN', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 6, currencyCode: 'CAD', currencyName: 'Canadian Dollar', symbol: 'C$', countryCode: 'CA', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 7, currencyCode: 'SGD', currencyName: 'Singapore Dollar', symbol: 'S$', countryCode: 'SG', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 8, currencyCode: 'NOK', currencyName: 'Norwegian Krone', symbol: 'kr', countryCode: 'NO', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 9, currencyCode: 'AED', currencyName: 'UAE Dirham', symbol: 'د.إ', countryCode: 'AE', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { currencyId: 10, currencyCode: 'CHF', currencyName: 'Swiss Franc', symbol: 'Fr', countryCode: 'CH', decimalPlaces: 2, isBaseCurrency: false, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── UNITS OF MEASURE ─────────────────────────────────────────────────────────
const uomStore: unknown[] = [
  { uomId: 1, uomCode: 'BBL', uomName: 'Barrel (42 US Gallons)', uomType: 'VOLUME', baseUomCode: 'BBL', conversionFactor: 1, commodityHint: 'Crude oil, refined products (Americas)', commodityTypes: ['OIL'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 2, uomCode: 'MT', uomName: 'Metric Tonne', uomType: 'WEIGHT', baseUomCode: 'MT', conversionFactor: 1, commodityHint: 'All physical commodities (international)', commodityTypes: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 3, uomCode: 'MWH', uomName: 'Megawatt Hour', uomType: 'ENERGY', baseUomCode: 'MWH', conversionFactor: 1, commodityHint: 'Power, natural gas (EU)', commodityTypes: ['POWER', 'GAS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 4, uomCode: 'MMBTU', uomName: 'Million British Thermal Units', uomType: 'ENERGY', baseUomCode: 'MWH', conversionFactor: 0.29307, commodityHint: 'Natural gas (US), LNG', commodityTypes: ['GAS', 'LNG'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 5, uomCode: 'THERM', uomName: 'Therm (100,000 BTU)', uomType: 'ENERGY', baseUomCode: 'MWH', conversionFactor: 0.02931, commodityHint: 'UK NBP gas market', commodityTypes: ['GAS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 6, uomCode: 'BUSHEL', uomName: 'Bushel (US 60 lb)', uomType: 'VOLUME', baseUomCode: 'MT', conversionFactor: 0.027216, commodityHint: 'Grains: corn, wheat, soybeans (CBOT)', commodityTypes: ['AGRICULTURAL'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 7, uomCode: 'GAL', uomName: 'US Gallon', uomType: 'VOLUME', baseUomCode: 'BBL', conversionFactor: 0.02381, commodityHint: 'Refined products, NYMEX heating oil, RIN volumes (RVO gallons)', commodityTypes: ['OIL', 'RINS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 8, uomCode: 'M3', uomName: 'Cubic Metre', uomType: 'VOLUME', baseUomCode: 'SCM', conversionFactor: 1, commodityHint: 'Gas pipeline, LNG storage (M3 = SCM at standard conditions)', commodityTypes: ['GAS', 'LNG'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 9, uomCode: 'KG', uomName: 'Kilogram', uomType: 'WEIGHT', baseUomCode: 'MT', conversionFactor: 0.001, commodityHint: 'Precious metals, chemicals', commodityTypes: ['METALS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 10, uomCode: 'MW', uomName: 'Megawatt (capacity)', uomType: 'POWER', baseUomCode: 'MW', conversionFactor: 1, commodityHint: 'Power capacity (not energy)', commodityTypes: ['POWER'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 11, uomCode: 'LTR', uomName: 'Litre', uomType: 'VOLUME', baseUomCode: 'BBL', conversionFactor: 0.006290, commodityHint: 'Road tankers, retail fuel', commodityTypes: ['OIL'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 12, uomCode: 'SCFD',    uomName: 'Standard Cubic Feet per Day',      uomType: 'VOLUME', baseUomCode: 'SCM',  conversionFactor: 0.0000283168, commodityHint: 'US pipeline gas capacity (1 SCF = 0.028317 SCM)', commodityTypes: ['GAS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 13, uomCode: 'GJ',      uomName: 'Gigajoule',                         uomType: 'ENERGY', baseUomCode: 'MWH', conversionFactor: 0.27778,    commodityHint: 'Gas (Australia, continental EU wholesale)', commodityTypes: ['GAS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 14, uomCode: 'SCM',     uomName: 'Standard Cubic Metre',              uomType: 'VOLUME', baseUomCode: 'SCM',  conversionFactor: 1,          commodityHint: 'Gas pipeline volumes (EU, Asia). SCM→MWH requires product GCV — no commodity default.', commodityTypes: ['GAS', 'LNG'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 15, uomCode: 'MMSCM',   uomName: 'Million Standard Cubic Metres',     uomType: 'VOLUME', baseUomCode: 'SCM',  conversionFactor: 1000000,    commodityHint: 'Large gas pipeline capacity (1 MMSCM = 1,000,000 SCM)', commodityTypes: ['GAS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 16, uomCode: 'LB',      uomName: 'Pound (weight)',                    uomType: 'WEIGHT', baseUomCode: 'MT',  conversionFactor: 0.0004536,  commodityHint: 'US agricultural (soybeans, wheat) and metals', commodityTypes: ['AGRICULTURAL', 'METALS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 17, uomCode: 'CBM',     uomName: 'Cubic Metre (oil/liquid)',          uomType: 'VOLUME', baseUomCode: 'BBL', conversionFactor: 6.28981,    commodityHint: 'Oil product road tankers, refinery volumes', commodityTypes: ['OIL'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 18, uomCode: 'TROY_OZ', uomName: 'Troy Ounce',                        uomType: 'WEIGHT', baseUomCode: 'MT',  conversionFactor: 0.0000311,  commodityHint: 'Precious metals (gold, silver, platinum, palladium)', commodityTypes: ['METALS'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { uomId: 19, uomCode: 'GWH',     uomName: 'Gigawatt Hour',                     uomType: 'ENERGY', baseUomCode: 'MWH', conversionFactor: 1000,       commodityHint: 'Large-scale power contracts, interconnector capacity', commodityTypes: ['POWER'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── UOM CONVERSION ───────────────────────────────────────────────────────────
const uomConversionStore: unknown[] = [
  // ── Weight (universal) ────────────────────────────────────────────────────────
  { conversionId: 1,  fromUomCode: 'MT',     toUomCode: 'KG',     factor: 1000,          commodityType: null,           notes: '1 MT = 1,000 kg — universal weight conversion' },
  { conversionId: 2,  fromUomCode: 'KG',     toUomCode: 'MT',     factor: 0.001,         commodityType: null,           notes: '1 kg = 0.001 MT — universal weight conversion' },
  { conversionId: 3,  fromUomCode: 'MT',     toUomCode: 'LB',     factor: 2204.6226218,  commodityType: null,           notes: '1 MT = 2,204.62 lb — universal weight conversion' },
  { conversionId: 4,  fromUomCode: 'LB',     toUomCode: 'MT',     factor: 0.0004535924,  commodityType: null,           notes: '1 lb = 0.0004536 MT' },
  // ── Precious metals ───────────────────────────────────────────────────────────
  { conversionId: 5,  fromUomCode: 'TROY_OZ',toUomCode: 'KG',     factor: 0.0311034768,  commodityType: null,           notes: '1 Troy Oz = 31.1035 g — London good delivery standard' },
  { conversionId: 6,  fromUomCode: 'KG',     toUomCode: 'TROY_OZ',factor: 32.1507466,    commodityType: null,           notes: '1 kg = 32.1507 Troy Oz' },
  { conversionId: 7,  fromUomCode: 'MT',     toUomCode: 'TROY_OZ',factor: 32150.7466,    commodityType: null,           notes: '1 MT = 32,150.75 Troy Oz' },
  { conversionId: 8,  fromUomCode: 'TROY_OZ',toUomCode: 'MT',     factor: 0.0000311035,  commodityType: null,           notes: '1 Troy Oz = 0.0000311035 MT' },
  // ── OIL volume (VOLUME→VOLUME only — exact, no density needed) ───────────────
  { conversionId: 9,  fromUomCode: 'BBL',    toUomCode: 'GAL',    factor: 42,            commodityType: 'OIL',          notes: '1 BBL = 42 US gallons — exact, API standard (42 US gal = 158.987 L)' },
  { conversionId: 10, fromUomCode: 'GAL',    toUomCode: 'BBL',    factor: 0.0238095238,  commodityType: 'OIL',          notes: '1 US gallon = 1/42 BBL — exact' },
  { conversionId: 11, fromUomCode: 'BBL',    toUomCode: 'CBM',    factor: 0.158987295,   commodityType: 'OIL',          notes: '1 BBL = 0.158987 m³ — exact (42 gal × 3.785412 L)' },
  { conversionId: 12, fromUomCode: 'CBM',    toUomCode: 'BBL',    factor: 6.28981077,    commodityType: 'OIL',          notes: '1 m³ = 6.28981 BBL — exact inverse' },
  // BBL↔MT and CBM↔MT are NOT stored here. They require product density (kg/m³).
  // Each OIL product has density_estimate_kg_m3 and density_base_kg_m3.
  // Position engine formula: MT = CBM × density_kg_m3 / 1000
  //   Brent (857 kg/m³): 1 BBL = 0.13625 MT   WTI (828 kg/m³): 1 BBL = 0.13165 MT
  //   ULSD (838 kg/m³): 1 BBL = 0.13324 MT     Naphtha (720 kg/m³): 1 BBL = 0.11447 MT
  //   Fuel Oil 380 (990 kg/m³): 1 BBL = 0.15741 MT
  // A generic commodity-level factor would be wrong for almost every product.
  // ── GAS energy (ENERGY→ENERGY only — exact thermodynamic ratios) ─────────────
  { conversionId: 15, fromUomCode: 'MWH',    toUomCode: 'MMBTU',  factor: 3.41214148,    commodityType: 'GAS',          notes: '1 MWh = 3.412142 MMBTU — exact (1 BTU = 0.29307107 Wh). Energy→Energy, no GCV needed.' },
  { conversionId: 16, fromUomCode: 'MMBTU',  toUomCode: 'MWH',    factor: 0.29307108,    commodityType: 'GAS',          notes: '1 MMBTU = 0.29307108 MWh — exact inverse' },
  { conversionId: 17, fromUomCode: 'MWH',    toUomCode: 'THERM',  factor: 34.1214148,    commodityType: 'GAS',          notes: '1 MWh = 34.1214 Therms — exact (1 Therm = 100,000 BTU)' },
  { conversionId: 18, fromUomCode: 'THERM',  toUomCode: 'MWH',    factor: 0.029307108,   commodityType: 'GAS',          notes: '1 Therm = 0.0293071 MWh — exact' },
  { conversionId: 19, fromUomCode: 'MWH',    toUomCode: 'GJ',     factor: 3.6,           commodityType: 'GAS',          notes: '1 MWh = 3.6 GJ — exact (1 W = 1 J/s → 1 MWh = 3,600,000 J = 3.6 GJ)' },
  { conversionId: 20, fromUomCode: 'GJ',     toUomCode: 'MWH',    factor: 0.2777777778,  commodityType: 'GAS',          notes: '1 GJ = 0.27778 MWh — exact' },
  { conversionId: 21, fromUomCode: 'MMBTU',  toUomCode: 'GJ',     factor: 1.0550558526,  commodityType: 'GAS',          notes: '1 MMBTU = 1.055056 GJ — exact (1 BTU = 1,055.056 J)' },
  { conversionId: 22, fromUomCode: 'GJ',     toUomCode: 'MMBTU',  factor: 0.9478171203,  commodityType: 'GAS',          notes: '1 GJ = 0.947817 MMBTU — exact inverse' },
  // SCM↔MWH and SCM↔MMBTU are NOT stored here. They require product GCV (MJ/scm).
  // Each GAS product has cv_gross_mj_scm and cv_net_mj_scm.
  // Position engine formula: MWh = SCM × cv_gross_mj_scm / 3600
  //   TTF H-Gas (38.0 MJ/scm): 1 SCM = 0.010556 MWh   NBP (39.5 MJ/scm): 1 SCM = 0.010972 MWh
  //   JKM LNG (40.5 MJ/scm): 1 SCM = 0.011250 MWh     L-Gas (33.5 MJ/scm): 1 SCM = 0.009306 MWh
  // A generic commodity-level GAS SCM→MWH factor would be wrong for every product.
  // ── POWER ────────────────────────────────────────────────────────────────────
  { conversionId: 25, fromUomCode: 'GWH',    toUomCode: 'MWH',    factor: 1000,          commodityType: 'POWER',        notes: '1 GWh = 1,000 MWh' },
  { conversionId: 26, fromUomCode: 'MWH',    toUomCode: 'GWH',    factor: 0.001,         commodityType: 'POWER',        notes: '1 MWh = 0.001 GWh' },
  { conversionId: 27, fromUomCode: 'MWH',    toUomCode: 'GJ',     factor: 3.6,           commodityType: 'POWER',        notes: '1 MWh = 3.6 GJ — exact' },
  // ── AGRICULTURAL ─────────────────────────────────────────────────────────────
  { conversionId: 28, fromUomCode: 'BUSHEL', toUomCode: 'MT',     factor: 0.027216,      commodityType: 'AGRICULTURAL', notes: '1 bushel (60 lb) = 27.2155 kg — wheat, corn, soybeans (all 60 lb/bu CBOT). Sorghum 56 lb/bu → 0.02540 MT/bu.' },
  { conversionId: 29, fromUomCode: 'MT',     toUomCode: 'BUSHEL', factor: 36.7437,       commodityType: 'AGRICULTURAL', notes: '1 MT = 36.7437 bushels (60 lb/bu standard — wheat/corn/soy)' },
];

// ─── SPEC PARAMETER CATALOG ───────────────────────────────────────────────────
const specParameterStore: unknown[] = [
  // OIL
  { parameterId: 1,  commodityType: 'OIL',         parameterCode: 'API_GRAVITY',    parameterName: 'API Gravity',                     parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 2,  commodityType: 'OIL',         parameterCode: 'SULPHUR_PCT',    parameterName: 'Sulphur Content (%wt)',           parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 3,  commodityType: 'OIL',         parameterCode: 'VISCOSITY_40',   parameterName: 'Kinematic Viscosity @ 40°C (cSt)', parameterCategory: 'PHYSICAL',  dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 4,  commodityType: 'OIL',         parameterCode: 'VISCOSITY_50',   parameterName: 'Kinematic Viscosity @ 50°C (cSt)', parameterCategory: 'PHYSICAL',  dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 5,  commodityType: 'OIL',         parameterCode: 'POUR_POINT',     parameterName: 'Pour Point (°C)',                 parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 6,  commodityType: 'OIL',         parameterCode: 'RVP',            parameterName: 'Reid Vapour Pressure (psi)',      parameterCategory: 'SAFETY',     dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 7,  commodityType: 'OIL',         parameterCode: 'BSW_PCT',        parameterName: 'Basic Sediment & Water (%vol)',   parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 8,  commodityType: 'OIL',         parameterCode: 'SALT_PTB',       parameterName: 'Salt Content (ptb)',              parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 9,  commodityType: 'OIL',         parameterCode: 'WATER_PCT',      parameterName: 'Free Water Content (%vol)',       parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 10, commodityType: 'OIL',         parameterCode: 'NICKEL_PPM',     parameterName: 'Nickel Content (ppm)',            parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 11, commodityType: 'OIL',         parameterCode: 'VANADIUM_PPM',   parameterName: 'Vanadium Content (ppm)',          parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 12, commodityType: 'OIL',         parameterCode: 'FLASH_POINT',    parameterName: 'Flash Point (°C)',                parameterCategory: 'SAFETY',     dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 13, commodityType: 'OIL',         parameterCode: 'NITROGEN_PPM',   parameterName: 'Nitrogen Content (ppm)',          parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 39, commodityType: 'OIL',         parameterCode: 'DENSITY_KGL',    parameterName: 'Density @ 15°C (kg/L)',           parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 40, commodityType: 'OIL',         parameterCode: 'CETANE_INDEX',   parameterName: 'Cetane Index / Number',           parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 41, commodityType: 'OIL',         parameterCode: 'DISTILL_T90',    parameterName: 'Distillation T90 (°C)',           parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 42, commodityType: 'OIL',         parameterCode: 'DISTILL_T95',    parameterName: 'Distillation T95 (°C)',           parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 43, commodityType: 'OIL',         parameterCode: 'LUBRICITY',      parameterName: 'Lubricity HFRR (µm)',             parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 44, commodityType: 'OIL',         parameterCode: 'POLYCYCLIC_PCT', parameterName: 'Polycyclic Aromatic HC (%m/m)',   parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 45, commodityType: 'OIL',         parameterCode: 'ETHANOL_PCT',    parameterName: 'Ethanol Blend Content (%vol)',    parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 46, commodityType: 'OIL',         parameterCode: 'FAME_PCT',       parameterName: 'FAME / Biodiesel Content (%vol)', parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 52, commodityType: 'OIL',         parameterCode: 'TAN',            parameterName: 'Total Acid Number (mg KOH/g)',    parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 53, commodityType: 'OIL',         parameterCode: 'CCR_PCT',        parameterName: 'Conradson Carbon Residue (%wt)', parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 54, commodityType: 'OIL',         parameterCode: 'WAX_PCT',        parameterName: 'Wax Content (%wt)',               parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 55, commodityType: 'OIL',         parameterCode: 'ASPHALTENE_PCT', parameterName: 'Asphaltene Content (%wt)',        parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 56, commodityType: 'OIL',         parameterCode: 'DISTILLATE_YIELD',parameterName:'Distillate Yield (%vol)',         parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 57, commodityType: 'OIL',         parameterCode: 'CLOUD_POINT',    parameterName: 'Cloud Point (°C)',                parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 58, commodityType: 'OIL',         parameterCode: 'COLD_FILTER',    parameterName: 'Cold Filter Plugging Point (°C)', parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  // GAS
  { parameterId: 14, commodityType: 'GAS',         parameterCode: 'GCV_MJSCM',      parameterName: 'Gross Calorific Value (MJ/scm)', parameterCategory: 'ENERGY',     dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 15, commodityType: 'GAS',         parameterCode: 'WOBBE_INDEX',    parameterName: 'Wobbe Index (MJ/scm)',            parameterCategory: 'ENERGY',     dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 16, commodityType: 'GAS',         parameterCode: 'METHANE_PCT',    parameterName: 'Methane Content (%mol)',          parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 17, commodityType: 'GAS',         parameterCode: 'CO2_PCT',        parameterName: 'CO2 Content (%mol)',              parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 18, commodityType: 'GAS',         parameterCode: 'H2S_MG',         parameterName: 'H2S Content (mg/Nm³)',            parameterCategory: 'SAFETY',     dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 19, commodityType: 'GAS',         parameterCode: 'WATER_DEW',      parameterName: 'Water Dew Point (°C at bar)',     parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 20, commodityType: 'GAS',         parameterCode: 'HC_DEW',         parameterName: 'Hydrocarbon Dew Point (°C)',      parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 21, commodityType: 'GAS',         parameterCode: 'OXYGEN_PPM',     parameterName: 'Oxygen Content (ppm mol)',        parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 22, commodityType: 'GAS',         parameterCode: 'TOTAL_SULPHUR',  parameterName: 'Total Sulphur (mg/Nm³)',          parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 2  },
  { parameterId: 47, commodityType: 'GAS',         parameterCode: 'ETHANE_PCT',     parameterName: 'Ethane Content (%mol)',           parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 48, commodityType: 'GAS',         parameterCode: 'NITROGEN_PCT',   parameterName: 'Nitrogen Content (%mol)',         parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 59, commodityType: 'GAS',         parameterCode: 'PROPANE_PCT',    parameterName: 'Propane Content (%mol)',          parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 60, commodityType: 'GAS',         parameterCode: 'BUTANE_PCT',     parameterName: 'Butane Content (%mol)',           parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 61, commodityType: 'GAS',         parameterCode: 'C5PLUS_PCT',     parameterName: 'C5+ Heavier Hydrocarbons (%mol)',parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 62, commodityType: 'GAS',         parameterCode: 'RELATIVE_DENSITY',parameterName: 'Relative Density (vs air)',     parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 63, commodityType: 'GAS',         parameterCode: 'OXYGEN_PCT',     parameterName: 'Oxygen Content (%mol)',           parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  // METALS
  { parameterId: 30, commodityType: 'METALS',      parameterCode: 'PURITY_PCT',     parameterName: 'Purity (%)',                      parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 31, commodityType: 'METALS',      parameterCode: 'LME_BRAND',      parameterName: 'LME Approved Brand',              parameterCategory: 'REGULATORY', dataType: 'BOOLEAN', decimalPlaces: 0  },
  { parameterId: 32, commodityType: 'METALS',      parameterCode: 'COPPER_PCT',     parameterName: 'Copper Content (%)',              parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 33, commodityType: 'METALS',      parameterCode: 'ZINC_PCT',       parameterName: 'Zinc Content (%)',                parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 34, commodityType: 'METALS',      parameterCode: 'LEAD_PCT',       parameterName: 'Lead Content (%)',                parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 50, commodityType: 'METALS',      parameterCode: 'SILVER_PCT',     parameterName: 'Silver Content (%)',              parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 64, commodityType: 'METALS',      parameterCode: 'ALUMINIUM_PCT',  parameterName: 'Aluminium Impurity (%)',          parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 65, commodityType: 'METALS',      parameterCode: 'IRON_PCT',       parameterName: 'Iron Impurity (%)',               parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 66, commodityType: 'METALS',      parameterCode: 'ANTIMONY_PCT',   parameterName: 'Antimony Impurity (%)',           parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 67, commodityType: 'METALS',      parameterCode: 'ARSENIC_PCT',    parameterName: 'Arsenic Impurity (%)',            parameterCategory: 'CHEMICAL',   dataType: 'DECIMAL', decimalPlaces: 4  },
  { parameterId: 68, commodityType: 'METALS',      parameterCode: 'GOLD_FINENESS',  parameterName: 'Gold Fineness (ppt)',             parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 69, commodityType: 'METALS',      parameterCode: 'NICKEL_PURITY',  parameterName: 'Nickel Purity (%)',               parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 3  },
  // AGRICULTURAL
  { parameterId: 23, commodityType: 'AGRICULTURAL',parameterCode: 'MOISTURE_PCT',   parameterName: 'Moisture Content (%)',            parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 24, commodityType: 'AGRICULTURAL',parameterCode: 'PROTEIN_PCT',    parameterName: 'Protein Content (%)',             parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 25, commodityType: 'AGRICULTURAL',parameterCode: 'TEST_WEIGHT',    parameterName: 'Test Weight (kg/hl)',             parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 26, commodityType: 'AGRICULTURAL',parameterCode: 'FOREIGN_MATTER', parameterName: 'Foreign Matter (%)',              parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 27, commodityType: 'AGRICULTURAL',parameterCode: 'BROKEN_KERNELS', parameterName: 'Broken/Damaged Kernels (%)',      parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 28, commodityType: 'AGRICULTURAL',parameterCode: 'AFLATOXIN_PPB',  parameterName: 'Aflatoxin (ppb)',                 parameterCategory: 'SAFETY',     dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 29, commodityType: 'AGRICULTURAL',parameterCode: 'GMO_STATUS',     parameterName: 'GMO Status',                      parameterCategory: 'REGULATORY', dataType: 'BOOLEAN', decimalPlaces: 0  },
  { parameterId: 51, commodityType: 'AGRICULTURAL',parameterCode: 'FALLING_NUMBER', parameterName: 'Falling Number (sec)',            parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 0  },
  { parameterId: 52, commodityType: 'AGRICULTURAL',parameterCode: 'GLUTEN_PCT',     parameterName: 'Wet Gluten Content (%)',          parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 70, commodityType: 'AGRICULTURAL',parameterCode: 'OIL_CONTENT_PCT',parameterName: 'Oil Content (%)',                 parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 71, commodityType: 'AGRICULTURAL',parameterCode: 'STARCH_PCT',     parameterName: 'Starch Content (%)',              parameterCategory: 'QUALITY',    dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 72, commodityType: 'AGRICULTURAL',parameterCode: 'HECTOLITRE_WT',  parameterName: 'Hectolitre Weight (kg/hl)',       parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  // POWER
  { parameterId: 35, commodityType: 'POWER',       parameterCode: 'VOLTAGE_KV',     parameterName: 'Voltage (kV)',                    parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 36, commodityType: 'POWER',       parameterCode: 'FREQUENCY_HZ',   parameterName: 'Frequency (Hz)',                  parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 37, commodityType: 'POWER',       parameterCode: 'POWER_FACTOR',   parameterName: 'Power Factor',                    parameterCategory: 'PHYSICAL',   dataType: 'DECIMAL', decimalPlaces: 3  },
  { parameterId: 38, commodityType: 'POWER',       parameterCode: 'GEN_SOURCE',     parameterName: 'Generation Source',               parameterCategory: 'REGULATORY', dataType: 'TEXT',    decimalPlaces: 0  },
  { parameterId: 73, commodityType: 'POWER',       parameterCode: 'CO2_INTENSITY',  parameterName: 'CO2 Intensity (g/kWh)',           parameterCategory: 'REGULATORY', dataType: 'DECIMAL', decimalPlaces: 1  },
  { parameterId: 74, commodityType: 'POWER',       parameterCode: 'RENEWABLE_CERT', parameterName: 'Renewable Energy Certificate',    parameterCategory: 'REGULATORY', dataType: 'BOOLEAN', decimalPlaces: 0  },
  { parameterId: 75, commodityType: 'POWER',       parameterCode: 'LOAD_FACTOR',    parameterName: 'Load Factor / Capacity Factor (%)',parameterCategory: 'QUALITY',   dataType: 'DECIMAL', decimalPlaces: 1  },
];

// ─── COUNTRIES ────────────────────────────────────────────────────────────────
const countriesStore: unknown[] = [
  { countryCode: 'GB', countryName: 'United Kingdom', region: 'EUROPE', phoneCode: '+44', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'US', countryName: 'United States', region: 'AMERICAS', phoneCode: '+1', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'NL', countryName: 'Netherlands', region: 'EUROPE', phoneCode: '+31', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'DE', countryName: 'Germany', region: 'EUROPE', phoneCode: '+49', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'NO', countryName: 'Norway', region: 'EUROPE', phoneCode: '+47', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'SA', countryName: 'Saudi Arabia', region: 'MIDDLE_EAST', phoneCode: '+966', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'AE', countryName: 'United Arab Emirates', region: 'MIDDLE_EAST', phoneCode: '+971', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'SG', countryName: 'Singapore', region: 'ASIA_PACIFIC', phoneCode: '+65', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'JP', countryName: 'Japan', region: 'ASIA_PACIFIC', phoneCode: '+81', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'CN', countryName: 'China', region: 'ASIA_PACIFIC', phoneCode: '+86', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'AU', countryName: 'Australia', region: 'ASIA_PACIFIC', phoneCode: '+61', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'IN', countryName: 'India', region: 'ASIA_PACIFIC', phoneCode: '+91', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'RU', countryName: 'Russia', region: 'CIS', phoneCode: '+7', fatfStatus: 'GREY_LIST', sanctionStatus: 'EU_SANCTIONS', isActive: true },
  { countryCode: 'IR', countryName: 'Iran', region: 'MIDDLE_EAST', phoneCode: '+98', fatfStatus: 'BLACK_LIST', sanctionStatus: 'OFAC', isActive: true },
  { countryCode: 'VE', countryName: 'Venezuela', region: 'AMERICAS', phoneCode: '+58', fatfStatus: 'GREY_LIST', sanctionStatus: 'OFAC', isActive: true },
  { countryCode: 'FR', countryName: 'France', region: 'EUROPE', phoneCode: '+33', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'CA', countryName: 'Canada', region: 'AMERICAS', phoneCode: '+1', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
  { countryCode: 'QA', countryName: 'Qatar', region: 'MIDDLE_EAST', phoneCode: '+974', fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true },
];

// ─── INCOTERMS REFERENCE ──────────────────────────────────────────────────────
const incotermsRefStore: unknown[] = [
  { incotermId: 1, incotermCode: 'EXW', incotermName: 'Ex Works', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'At seller\'s named premises', costResponsibility: 'Buyer bears all costs from seller\'s door', titleTransfer: 'At collection', isActive: true },
  { incotermId: 2, incotermCode: 'FCA', incotermName: 'Free Carrier', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'When handed to first carrier at named place', costResponsibility: 'Seller loads, buyer arranges onward transport', titleTransfer: 'At delivery to carrier', isActive: true },
  { incotermId: 3, incotermCode: 'CPT', incotermName: 'Carriage Paid To', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'When handed to first carrier', costResponsibility: 'Seller pays freight to destination; buyer bears risk from first carrier', titleTransfer: null, isActive: true },
  { incotermId: 4, incotermCode: 'CIP', incotermName: 'Carriage & Insurance Paid To', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'When handed to first carrier', costResponsibility: 'Seller pays freight + insurance (ICC-A) to destination', titleTransfer: null, isActive: true },
  { incotermId: 5, incotermCode: 'DAP', incotermName: 'Delivered at Place', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'At named destination ready to unload', costResponsibility: 'Seller bears all costs to destination; buyer unloads + clears import', titleTransfer: null, isActive: true },
  { incotermId: 6, incotermCode: 'DPU', incotermName: 'Delivered at Place Unloaded', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'After unloading at named destination', costResponsibility: 'Seller bears all costs including unloading; buyer clears import', titleTransfer: null, isActive: true },
  { incotermId: 7, incotermCode: 'DDP', incotermName: 'Delivered Duty Paid', version: 'INCOTERMS_2020', transportMode: 'ANY', riskTransferPoint: 'At destination, import cleared', costResponsibility: 'Seller bears maximum responsibility including import duties', titleTransfer: null, isActive: true },
  { incotermId: 8, incotermCode: 'FAS', incotermName: 'Free Alongside Ship', version: 'INCOTERMS_2020', transportMode: 'SEA_INLAND', riskTransferPoint: 'Alongside vessel at named load port', costResponsibility: 'Seller delivers to quay; buyer loads + pays freight', titleTransfer: 'Alongside vessel', isActive: true },
  { incotermId: 9, incotermCode: 'FOB', incotermName: 'Free On Board', version: 'INCOTERMS_2020', transportMode: 'SEA_INLAND', riskTransferPoint: 'On board vessel at named load port', costResponsibility: 'Seller loads; buyer pays freight + insurance from load port', titleTransfer: 'Ship\'s rail / on board', isActive: true },
  { incotermId: 10, incotermCode: 'CFR', incotermName: 'Cost and Freight', version: 'INCOTERMS_2020', transportMode: 'SEA_INLAND', riskTransferPoint: 'On board vessel at load port', costResponsibility: 'Seller pays freight; risk transfers at load port; buyer insures', titleTransfer: 'Ship\'s rail at load port', isActive: true },
  { incotermId: 11, incotermCode: 'CIF', incotermName: 'Cost Insurance and Freight', version: 'INCOTERMS_2020', transportMode: 'SEA_INLAND', riskTransferPoint: 'On board vessel at load port', costResponsibility: 'Seller pays freight + min insurance (ICC-C); risk at load port', titleTransfer: 'Ship\'s rail at load port', isActive: true },
];

// ─── REFERENCE LOOKUP TABLES (used to denormalize names on trade create/update)
const counterpartiesRef = [
  { counterpartyId: 1,  counterpartyCode: 'SHELL-TRD', name: 'Shell Trading International', countryCode: 'GB' },
  { counterpartyId: 2,  counterpartyCode: 'BP-OIL',    name: 'BP Oil Trading',              countryCode: 'GB' },
  { counterpartyId: 3,  counterpartyCode: 'EQUINOR',   name: 'Equinor Energy AS',           countryCode: 'NO' },
  { counterpartyId: 4,  counterpartyCode: 'GLENCORE',  name: 'Glencore Metals',             countryCode: 'CH' },
  { counterpartyId: 5,  counterpartyCode: 'RWE-ST',    name: 'RWE Supply & Trading',        countryCode: 'DE' },
  { counterpartyId: 6,  counterpartyCode: 'CENTRICA',  name: 'Centrica Energy Trading',     countryCode: 'GB' },
  { counterpartyId: 7,  counterpartyCode: 'VITOL',     name: 'Vitol SA',                    countryCode: 'CH' },
  { counterpartyId: 8,  counterpartyCode: 'CARGILL',   name: 'Cargill International SA',    countryCode: 'CH' },
  { counterpartyId: 9,  counterpartyCode: 'TRAFIGURA', name: 'Trafigura PTE Ltd',           countryCode: 'SG' },
  { counterpartyId: 10, counterpartyCode: 'MERCURIA',  name: 'Mercuria Energy Trading SA',  countryCode: 'CH' },
];
const legalEntitiesRef = [
  { legalEntityId: 1, entityCode: 'SETRM-LTD', name: 'NonameETRM Trading Ltd' },
  { legalEntityId: 2, entityCode: 'SETRM-NL',  name: 'NonameETRM BV Netherlands' },
  { legalEntityId: 3, entityCode: 'SETRM-SG',  name: 'NonameETRM Pte Ltd Singapore' },
];

function denormalizeTrade(input: Record<string, unknown>): Record<string, unknown> {
  const cpId = input['counterpartyId'] as number | null;
  const traderId = input['traderId'] as number | null;
  const bookId = input['bookId'] as number | null;
  const leId = input['legalEntityId'] as number | null;
  const brokerId = input['brokerId'] as number | null;

  const cp = counterpartiesRef.find((c) => c.counterpartyId === cpId);
  const trader = (tradersStore as Array<Record<string, unknown>>).find((t) => t['traderId'] === traderId);
  const book = (booksStore as Array<Record<string, unknown>>).find((b) => b['bookId'] === bookId);
  const le = legalEntitiesRef.find((e) => e.legalEntityId === leId);
  const broker = brokerId != null
    ? (brokersStore as Array<Record<string, unknown>>).find((b) => b['brokerId'] === brokerId)
    : null;

  return {
    ...input,
    counterpartyName:  cp?.name       ?? (input['counterpartyName'] as string | null)  ?? null,
    traderCode:        String(trader?.['traderCode']  ?? input['traderCode']  ?? ''),
    bookCode:          String(book?.['bookCode']      ?? input['bookCode']    ?? ''),
    legalEntityName:   le?.name       ?? (input['legalEntityName'] as string | null) ?? null,
    brokerCode:        broker ? String(broker['brokerCode']) : (input['brokerCode'] as string | null) ?? null,
    brokerName:        broker ? String(broker['brokerName']) : (input['brokerName'] as string | null) ?? null,
  };
}

// ─── BROKERS (IDB only — FCM/PRIME firms are Counterparties) ─────────────────
const brokersStore: unknown[] = [
  { brokerId: 1, brokerCode: 'ICAP',      brokerName: 'ICAP Energy',                  brokerType: 'VOICE',      description: 'Leading OTC voice IDB for crude oil, products, and natural gas. FCA authorised. Covers North Sea, Mediterranean, and US physical markets. Standard OBA in place.',                              countryCode: 'GB', contactName: 'David Clarke',   contactEmail: 'dclarke@icap.com',           contactPhone: '+44 20 7000 1000', website: 'https://www.icap.com',             legalDocId: 'OBA-ICAP-2024-001',      commissionUomCode: 'BBL', commissionNotes: 'Standard rate $0.02/BBL crude oil, $0.015/BBL products. Vol rebate >1M BBL/month.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { brokerId: 2, brokerCode: 'GFI',       brokerName: 'GFI Group Commodities',        brokerType: 'HYBRID',     description: 'OTC IDB for power, gas, and emissions. Strong European gas and power coverage including TTF, NBP, and EEX. Voice desk alongside Trayport-connected electronic platform.',                          countryCode: 'US', contactName: 'Sarah Miller',   contactEmail: 'smiller@gfi.com',            contactPhone: '+1 212 968 4100',  website: 'https://www.gfigroup.com',         legalDocId: 'OBA-GFI-2023-007',       commissionUomCode: 'MWH', commissionNotes: '$0.015/MWH gas, EUR 0.01/MWH power. Emissions: 0.02 EUR/EUA.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { brokerId: 3, brokerCode: 'BGC',       brokerName: 'BGC Partners Energy',          brokerType: 'VOICE',      description: 'OTC voice IDB for crude oil, refined products, and freight. Strong tanker freight and Mediterranean crude coverage. FCA/CFTC dual regulated.',                                                   countryCode: 'GB', contactName: 'James Walker',   contactEmail: 'jwalker@bgcpartners.com',    contactPhone: '+44 20 7894 7000', website: 'https://www.bgcpartners.com',      legalDocId: 'OBA-BGC-2024-003',       commissionUomCode: 'BBL', commissionNotes: '$0.03/BBL crude, $0.025/BBL distillates. Freight: $2,500 flat per VLCC voyage.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { brokerId: 4, brokerCode: 'TRADITION', brokerName: 'Tradition Financial Services', brokerType: 'VOICE',      description: 'Voice IDB specialising in tanker freight, crude oil, and LNG. Primary contact for TD3C, TC2, and Baltic Dirty Tanker routes. BIMCO proforma preferred.',                                         countryCode: 'GB', contactName: 'Emma Thompson',  contactEmail: 'ethompson@tradition.com',    contactPhone: '+44 20 7621 5555', website: 'https://www.tradition.com',        legalDocId: 'OBA-TRAD-2023-012',      commissionUomCode: null,  commissionNotes: 'Freight: $2,000–$3,500 per voyage depending on route and vessel size. LNG: $1,500 per cargo.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { brokerId: 5, brokerCode: 'TP-ICAP',   brokerName: 'TP ICAP Global Broking',       brokerType: 'HYBRID',     description: 'Largest OTC IDB globally. Covers all energy commodities. Operates Parameta Solutions electronic platform alongside traditional voice brokerage across oil, gas, power, and freight.',           countryCode: 'GB', contactName: 'Richard Haines', contactEmail: 'rhaines@tpicap.com',         contactPhone: '+44 20 7200 7000', website: 'https://www.tpicap.com',           legalDocId: 'OBA-TPICAP-2024-002',    commissionUomCode: 'MWH', commissionNotes: 'Gas: EUR 0.01/MWH. Power: EUR 0.008/MWH electronic, EUR 0.012/MWH voice.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { brokerId: 6, brokerCode: 'TULLETT',   brokerName: 'Tullett Prebon',               brokerType: 'VOICE',      description: 'Voice IDB for metals and base commodities. Covers LME copper, aluminium, zinc, and nickel. Retained brand within TP ICAP group for metals brokerage.',                                          countryCode: 'GB', contactName: 'Susan Park',     contactEmail: 'spark@tullettprebon.com',    contactPhone: '+44 20 7200 7000', website: 'https://www.tullettprebon.com',    legalDocId: 'OBA-TULLETT-2023-008',   commissionUomCode: 'MT',  commissionNotes: 'LME base metals: $1.50/MT. Precious metals: 0.02% of notional.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { brokerId: 7, brokerCode: 'SPARK',     brokerName: 'Spark Commodities',            brokerType: 'ELECTRONIC', description: 'Pure electronic LNG and freight platform. Digital order book for JKM spot, FOB Atlantic, and Pacific freight. No voice desk — fully algorithmic matching.',                                     countryCode: 'SG', contactName: 'Wei Chen',       contactEmail: 'wchen@sparkcommodities.com', contactPhone: '+65 6511 0000',    website: 'https://www.sparkcommodities.com', legalDocId: 'SPARK-AGREE-2024-001',   commissionUomCode: null,  commissionNotes: 'LNG: $0.50/MMBTU per cargo. Freight: 0.10% of worldscale notional.', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── TRADES (master deal headers — no delivery-level fields) ─────────────────
// Delivery fields (qty, price, period, product, commodity detail) live on TradeOrder.
const tradesStore: unknown[] = [
  { tradeId: 1,  tradeReference: 'TRD-2026-00001', contractNumber: 'SHE-2026-OIL-4421',      tradeDate: '2026-06-01', executionDatetime: '2026-06-01T09:30:00Z', commodityType: 'OIL',          tradeType: 'PHYSICAL',  direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'SPOT',    status: 'CONFIRMED', counterpartyId: 1, counterpartyName: 'Shell Trading International', traderId: 1, traderCode: 'JDO', bookId: 1, bookCode: 'CRUDE-PROP',   legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: null, brokerCode: null, brokerName: null, brokerFeeType: null, brokerFee: null, brokerFeeCurrencyCode: null, creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 41225000, gtcReference: 'EFET-OIL-2007',     hedgeFlag: false, cin: 'CIN-2026-00001', paymentCalendarCode: 'LON-USD', contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'Forties blend cargo',                  parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'PHYSICAL', createdAt: '2026-06-01T09:30:00Z', updatedAt: '2026-06-01T09:30:00Z' },
  { tradeId: 2,  tradeReference: 'TRD-2026-00002', contractNumber: null,                      tradeDate: '2026-06-03', executionDatetime: '2026-06-03T10:15:00Z', commodityType: 'OIL',          tradeType: 'FINANCIAL', direction: 'SELL', termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 2, counterpartyName: 'BP Oil Trading',            traderId: 4, traderCode: 'MJL', bookId: 2, bookCode: 'CRUDE-HEDGE',  legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 1,    brokerCode: 'ICAP',      brokerName: 'ICAP Energy',                  brokerFeeType: 'FIXED', brokerFee: 0.02,  brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 8310000,  gtcReference: 'ISDA-2002',         hedgeFlag: true,  cin: 'CIN-2026-00002', paymentCalendarCode: 'LON-USD', contractPeriodicity: 'MONTHLY', contractStatus: 'ACTIVE', specialReference: null, notes: 'Hedge against physical inventory',     parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'SWAP_FIXED_FLOAT', createdAt: '2026-06-03T10:15:00Z', updatedAt: '2026-06-03T10:15:00Z' },
  { tradeId: 3,  tradeReference: 'TRD-2026-00003', contractNumber: 'EQ-TTF-2026-M07-M08',    tradeDate: '2026-06-05', executionDatetime: '2026-06-05T08:45:00Z', commodityType: 'GAS',          tradeType: 'PHYSICAL',  direction: 'BUY',  termType: 'RFP',  dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 3, counterpartyName: 'Equinor Energy AS',         traderId: 2, traderCode: 'ASM', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: 40000, rfpMaxQty: 60000, rfpStartDate: '2026-07-01', rfpEndDate: '2026-08-31', rfpFrequency: 'MONTHLY', brokerId: 5, brokerCode: 'TP-ICAP', brokerName: 'TP ICAP Global Broking', brokerFeeType: 'FIXED', brokerFee: 0.01, brokerFeeCurrencyCode: 'EUR', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 1727500, gtcReference: 'EFET-GAS-2002', hedgeFlag: false, cin: 'CIN-2026-00003', paymentCalendarCode: 'FRA-EUR', contractPeriodicity: 'MONTHLY', contractStatus: 'ACTIVE', specialReference: null, notes: 'TTF Jul-Aug monthly contract',         parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 2, instrumentType: 'PHYSICAL', createdAt: '2026-06-05T08:45:00Z', updatedAt: '2026-06-05T08:45:00Z' },
  { tradeId: 4,  tradeReference: 'TRD-2026-00004', contractNumber: 'GLC-LME-CU-2026-06',     tradeDate: '2026-06-10', executionDatetime: '2026-06-10T11:00:00Z', commodityType: 'METALS',       tradeType: 'PHYSICAL',  direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'SPOT',    status: 'CONFIRMED', counterpartyId: 4, counterpartyName: 'Glencore Metals',           traderId: 3, traderCode: 'RKP', bookId: 4, bookCode: 'LME-CU-ARB',   legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: null, brokerCode: null, brokerName: null, brokerFeeType: null, brokerFee: null, brokerFeeCurrencyCode: null, creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 2461250,  gtcReference: 'LME-RULEBOOK-2023', hedgeFlag: false, cin: 'CIN-2026-00004', paymentCalendarCode: 'LON-USD', contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'Grade A cathode',                      parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'PHYSICAL', createdAt: '2026-06-10T11:00:00Z', updatedAt: '2026-06-10T11:00:00Z' },
  { tradeId: 5,  tradeReference: 'TRD-2026-00005', contractNumber: null,                      tradeDate: '2026-06-12', executionDatetime: '2026-06-12T09:00:00Z', commodityType: 'POWER',        tradeType: 'FINANCIAL', direction: 'SELL', termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 5, counterpartyName: 'RWE Supply & Trading',      traderId: 6, traderCode: 'SWN', bookId: 5, bookCode: 'POWER-CLIENT', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 2,    brokerCode: 'GFI',       brokerName: 'GFI Group Commodities',        brokerFeeType: 'FIXED', brokerFee: 0.015, brokerFeeCurrencyCode: 'EUR', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 687500,   gtcReference: 'EFET-POWER-2022',   hedgeFlag: true,  cin: null,             paymentCalendarCode: 'FRA-EUR', contractPeriodicity: 'MONTHLY', contractStatus: 'ACTIVE', specialReference: null, notes: 'Baseload monthly',                     parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'SWAP_FIXED_FLOAT', createdAt: '2026-06-12T09:00:00Z', updatedAt: '2026-06-12T09:00:00Z' },
  { tradeId: 6,  tradeReference: 'TRD-2026-00006', contractNumber: 'CEN-NBP-PHYS-07-2026',   tradeDate: '2026-06-15', executionDatetime: '2026-06-15T14:30:00Z', commodityType: 'GAS',          tradeType: 'PHYSICAL',  direction: 'SELL', termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'DRAFT',     counterpartyId: 6, counterpartyName: 'Centrica Energy Trading',   traderId: 5, traderCode: 'PLN', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: null, brokerCode: null, brokerName: null, brokerFeeType: null, brokerFee: null, brokerFeeCurrencyCode: null, creditTermCode: 'NET_14', creditApprovalStatus: 'PENDING',  creditLimitUsed: null,     gtcReference: 'GTMA-2002',         hedgeFlag: false, cin: null,             paymentCalendarCode: 'LON-GBP', contractPeriodicity: null,      contractStatus: 'DRAFT',  specialReference: null, notes: 'NBP physical day-ahead swing',         parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'PHYSICAL', createdAt: '2026-06-15T14:30:00Z', updatedAt: '2026-06-15T14:30:00Z' },
  { tradeId: 7,  tradeReference: 'TRD-2026-00007', contractNumber: 'VIT-2026-URALS-001',     tradeDate: '2026-06-20', executionDatetime: '2026-06-20T10:00:00Z', commodityType: 'OIL',          tradeType: 'PHYSICAL',  direction: 'SELL', termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'SPOT',    status: 'CONFIRMED', counterpartyId: 7, counterpartyName: 'Vitol SA',                  traderId: 1, traderCode: 'JDO', bookId: 1, bookCode: 'CRUDE-PROP',   legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 3,    brokerCode: 'BGC',       brokerName: 'BGC Partners Energy',          brokerFeeType: 'FIXED', brokerFee: 0.03,  brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 59962500, gtcReference: 'EFET-OIL-2007',     hedgeFlag: false, cin: 'CIN-2026-00007', paymentCalendarCode: 'LON-USD', contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: 'Side letter 2026-06: 5-day BWAVE pricing override, Med grade', notes: 'Urals Med grade, 5-day BWAVE pricing', parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'PHYSICAL', createdAt: '2026-06-20T10:00:00Z', updatedAt: '2026-06-20T10:00:00Z' },
  { tradeId: 8,  tradeReference: 'TRD-2026-00008', contractNumber: null,                      tradeDate: '2026-06-22', executionDatetime: '2026-06-22T11:30:00Z', commodityType: 'AGRICULTURAL', tradeType: 'PHYSICAL',  direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'SPOT',    status: 'DRAFT',     counterpartyId: 8, counterpartyName: 'Cargill International SA',  traderId: 2, traderCode: 'ASM', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: null, brokerCode: null, brokerName: null, brokerFeeType: null, brokerFee: null, brokerFeeCurrencyCode: null, creditTermCode: 'NET_30', creditApprovalStatus: 'PENDING',  creditLimitUsed: null,     gtcReference: null,                hedgeFlag: false, cin: null,             paymentCalendarCode: null,      contractPeriodicity: null,      contractStatus: 'DRAFT',  specialReference: null, notes: 'EU milling wheat, protein min 12%',    parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'PHYSICAL', createdAt: '2026-06-22T11:30:00Z', updatedAt: '2026-06-22T11:30:00Z' },
  { tradeId: 9,  tradeReference: 'TRD-2026-00009', contractNumber: 'BIMCO-TD3C-202607',      tradeDate: '2026-06-25', executionDatetime: '2026-06-25T11:00:00Z', commodityType: 'FREIGHT',      tradeType: 'PHYSICAL',  direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'SPOT',    status: 'DRAFT',     counterpartyId: 1, counterpartyName: 'Shell Trading International', traderId: 1, traderCode: 'JDO', bookId: 1, bookCode: 'CRUDE-PROP',   legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 4,    brokerCode: 'TRADITION', brokerName: 'Tradition Financial Services', brokerFeeType: 'FIXED', brokerFee: 2500,  brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'PENDING',  creditLimitUsed: null,     gtcReference: 'BIMCO-GENCON-94',   hedgeFlag: false, cin: null,             paymentCalendarCode: 'LON-USD', contractPeriodicity: null,      contractStatus: 'DRAFT',  specialReference: null, notes: 'TD3C VLCC voyage, Ras Tanura to Chiba Japan', parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'TRANSPORT_AGREEMENT', createdAt: '2026-06-25T11:00:00Z', updatedAt: '2026-06-25T11:00:00Z' },
  // TRD-010: OIL FINANCIAL BUY — WTI TAS (2 legs — CLZ26 and CLF27)
  { tradeId: 10, tradeReference: 'TRD-2026-00010', contractNumber: 'CME-TAS-WTI-2026-001',   tradeDate: '2026-06-28', executionDatetime: '2026-06-28T14:05:00Z', commodityType: 'OIL',          tradeType: 'FINANCIAL', direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 3, counterpartyName: 'Trafigura Group',            traderId: 1, traderCode: 'JDO', bookId: 2, bookCode: 'CRUDE-HEDGE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 1,    brokerCode: 'ICAP',      brokerName: 'ICAP Energy',                  brokerFeeType: 'FIXED', brokerFee: 0.01,  brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 7245000,  gtcReference: 'ISDA-2002',         hedgeFlag: true,  cin: 'CIN-2026-00010', paymentCalendarCode: 'NY-USD',  contractPeriodicity: 'MONTHLY', contractStatus: 'ACTIVE', specialReference: null, notes: 'WTI CL TAS +2 ticks for Dec/Jan strip',       parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 2, instrumentType: 'FUTURES', createdAt: '2026-06-28T14:05:00Z', updatedAt: '2026-06-28T14:05:00Z' },
  // TRD-011: GAS FINANCIAL SELL — NG TAS (1 leg — NGF27 locked)
  { tradeId: 11, tradeReference: 'TRD-2026-00011', contractNumber: 'CME-TAS-NG-2026-001',    tradeDate: '2026-06-27', executionDatetime: '2026-06-27T13:55:00Z', commodityType: 'GAS',          tradeType: 'FINANCIAL', direction: 'SELL', termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 5, counterpartyName: 'ExxonMobil Global Trading',  traderId: 4, traderCode: 'MJL', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 2,    brokerCode: 'MAREX',     brokerName: 'Marex Spectron',               brokerFeeType: 'FIXED', brokerFee: 0.005, brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 345500,   gtcReference: 'ISDA-2002',         hedgeFlag: true,  cin: 'CIN-2026-00011', paymentCalendarCode: 'NY-USD',  contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'NG TAS -1 tick Jan 27 — price locked',        parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'FUTURES', createdAt: '2026-06-27T13:55:00Z', updatedAt: '2026-06-27T13:55:00Z' },
  // TRD-012: OIL FINANCIAL BUY — WTI BALMO Jul 2026 (booked mid-month, prices from Jul 14)
  { tradeId: 12, tradeReference: 'TRD-2026-00012', contractNumber: 'CME-BALMO-WTI-2026-001', tradeDate: '2026-07-01', executionDatetime: '2026-07-01T10:30:00Z', commodityType: 'OIL',          tradeType: 'FINANCIAL', direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 2, counterpartyName: 'BP Energy Europe',           traderId: 1, traderCode: 'JDO', bookId: 2, bookCode: 'CRUDE-HEDGE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 1,    brokerCode: 'ICAP',      brokerName: 'ICAP Energy',                  brokerFeeType: 'FIXED', brokerFee: 0.005, brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 7200000,  gtcReference: 'ISDA-2002',         hedgeFlag: true,  cin: 'CIN-2026-00012', paymentCalendarCode: 'NY-USD',  contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'WTI BALMO Jul26 — booked Jul 1, prices from Jul 1 to Jul 31', parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'FUTURES', createdAt: '2026-07-01T10:30:00Z', updatedAt: '2026-07-01T10:30:00Z' },
  // TRD-013: OIL FINANCIAL SELL — ICE Brent BALMO Jul 2026
  { tradeId: 13, tradeReference: 'TRD-2026-00013', contractNumber: 'ICE-BALMO-BZ-2026-001',  tradeDate: '2026-07-01', executionDatetime: '2026-07-01T14:10:00Z', commodityType: 'OIL',          tradeType: 'FINANCIAL', direction: 'SELL', termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 6, counterpartyName: 'Glencore Energy UK',         traderId: 1, traderCode: 'JDO', bookId: 2, bookCode: 'CRUDE-HEDGE', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 2,    brokerCode: 'MAREX',     brokerName: 'Marex Spectron',               brokerFeeType: 'FIXED', brokerFee: 0.005, brokerFeeCurrencyCode: 'USD', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 5000000,  gtcReference: 'ISDA-2002',         hedgeFlag: true,  cin: 'CIN-2026-00013', paymentCalendarCode: 'LON-USD', contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'Brent BALMO Jul26 — sell side hedge', parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'FUTURES', createdAt: '2026-07-01T14:10:00Z', updatedAt: '2026-07-01T14:10:00Z' },
  // RINS — D6 conventional ethanol RINs, separated, spot certificate transfer via EPA EMTS
  { tradeId: 14, tradeReference: 'TRD-2026-00014', contractNumber: 'EMTS-2026-D6-0455',      tradeDate: '2026-07-02', executionDatetime: '2026-07-02T15:20:00Z', commodityType: 'RINS',         tradeType: 'PHYSICAL',  direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'SPOT',    status: 'CONFIRMED', counterpartyId: 8, counterpartyName: 'Cargill International SA',  traderId: 2, traderCode: 'ASM', bookId: 2, bookCode: 'CRUDE-HEDGE',  legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: null, brokerCode: null, brokerName: null, brokerFeeType: null, brokerFee: null, brokerFeeCurrencyCode: null, creditTermCode: 'NET_14', creditApprovalStatus: 'APPROVED', creditLimitUsed: 4250000,  gtcReference: 'RFS2-MSA-2024',     hedgeFlag: false, cin: 'CIN-2026-00014', paymentCalendarCode: 'NY-USD',  contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'D6 2026 vintage separated RINs for RVO compliance', parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'CERTIFICATE_TRANSFER', createdAt: '2026-07-02T15:20:00Z', updatedAt: '2026-07-02T15:20:00Z' },
  // ENVIRONMENTAL — EUA Dec-26 futures on ICE, physical delivery of allowances at expiry
  { tradeId: 15, tradeReference: 'TRD-2026-00015', contractNumber: 'ICE-EUA-Z26-7731',        tradeDate: '2026-07-02', executionDatetime: '2026-07-02T09:45:00Z', commodityType: 'ENVIRONMENTAL', tradeType: 'FINANCIAL', direction: 'BUY',  termType: 'SPOT', dealIndicator: 'EXTERNAL', contractType: 'MONTHLY', status: 'CONFIRMED', counterpartyId: 5, counterpartyName: 'RWE Supply & Trading',      traderId: 6, traderCode: 'SWN', bookId: 5, bookCode: 'POWER-CLIENT', legalEntityId: 1, legalEntityName: 'NonameETRM Trading Ltd', rfpMinQty: null, rfpMaxQty: null, rfpStartDate: null, rfpEndDate: null, rfpFrequency: null, brokerId: 2,    brokerCode: 'GFI',       brokerName: 'GFI Group Commodities',        brokerFeeType: 'FIXED', brokerFee: 0.01,  brokerFeeCurrencyCode: 'EUR', creditTermCode: 'NET_30', creditApprovalStatus: 'APPROVED', creditLimitUsed: 3625000,  gtcReference: 'ICE-ENDEX-RULES',   hedgeFlag: true,  cin: 'CIN-2026-00015', paymentCalendarCode: 'FRA-EUR', contractPeriodicity: null,      contractStatus: 'ACTIVE', specialReference: null, notes: 'EUA Dec26 futures — hedge for power book carbon exposure', parentTradeId: null, amendmentNumber: 0, isLatestVersion: true, orderCount: 1, instrumentType: 'FUTURES', createdAt: '2026-07-02T09:45:00Z', updatedAt: '2026-07-02T09:45:00Z' },
];

// ─── TRADE ORDERS (delivery legs — one per period) ───────────────────────────
let orderIdSeq = 100;
const tradeOrdersStore: unknown[] = [
  // TRD-001: OIL PHYSICAL BUY — 1 leg (spot cargo)
  { orderId: 1,  tradeId: 1,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00001-01', status: 'CONFIRMED', periodCode: 'M2026-07', riskStartDate: '2026-07-10', riskEndDate: '2026-07-12', productId: 1,    productCode: 'BRENT-CRUDE',   productName: 'Brent Crude Oil',          marketId: 5, marketCode: 'OTC_NS_CRUDE', pricingRuleId: 1,    pricingRuleCode: 'FLT-DTBRT-AVG',  quantity: 500000, uomCode: 'BBL',   price: 82.45, currencyCode: 'USD', incotermCode: 'FOB',  deliveryLocationCode: 'SULLOM-VOE',  settlementType: 'PHYSICAL',   toleranceType: 'RATE', tolerancePlus: 2, toleranceMinus: 2, toleranceForScheduling: false, notes: 'Forties blend cargo', oilDetail: { crudeGrade: 'FORTIES', apiGravity: 40.7, sulphurPct: 0.26, motType: 'TANKER', loadLocationCode: 'SULLOM-VOE', dischargeLocationCode: 'ROTTERDAM', titleTransferLocationCode: 'SULLOM-VOE', vesselName: 'NORDIC LUNA', laycanStart: '2026-07-10', laycanEnd: '2026-07-12', blDate: null, norsTenderedDate: null, codDate: null, pipelineId: null }, originCountryCode: 'GB', demurrageRate: 32500, demurrageCurrency: 'USD', demurrageBasis: 'NON_REVERSIBLE', allowedLaytimeHours: 72, despatchRate: 16250, priceAdjustments: [{ adjustmentType: 'API_GRAVITY', adjustmentValue: 0.176, adjustmentCurrency: 'USD', adjustmentUomCode: 'BBL', notes: 'API 40.7° vs ref 38.5°: +2.2° × $0.08/°' }, { adjustmentType: 'SULFUR', adjustmentValue: 0.02, adjustmentCurrency: 'USD', adjustmentUomCode: 'BBL', notes: 'Sweet crude 0.26%wt vs ref 0.30%wt: small sweet premium' }], createdAt: '2026-06-01T09:30:00Z', updatedAt: '2026-06-01T09:30:00Z' },
  // TRD-002: OIL FINANCIAL SELL — 1 leg (monthly hedge)
  { orderId: 2,  tradeId: 2,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00002-01', status: 'CONFIRMED', periodCode: 'M2026-07', riskStartDate: '2026-07-01', riskEndDate: '2026-07-31', productId: 3,    productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures',      marketId: 1, marketCode: 'ICE_BRENT',    pricingRuleId: 3,    pricingRuleCode: 'FLT-WTI-PROMPT',  quantity: 100000, uomCode: 'BBL',   price: 83.10, currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'Hedge against physical inventory', originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-03T10:15:00Z', updatedAt: '2026-06-03T10:15:00Z' },
  // TRD-003: GAS PHYSICAL BUY Equinor — 2 legs (Jul template, Aug detail)
  { orderId: 3,  tradeId: 3,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00003-01', status: 'CONFIRMED', periodCode: 'M2026-07', riskStartDate: '2026-07-01', riskEndDate: '2026-07-31', productId: 4,    productCode: 'TTF-GAS',       productName: 'TTF Natural Gas',          marketId: 4, marketCode: 'ICE_TTF',      pricingRuleId: 5,    pricingRuleCode: 'FLT-TTF-MONTHLY', quantity: 50000,  uomCode: 'MWH',   price: 34.55, currencyCode: 'EUR', incotermCode: null,   deliveryLocationCode: 'TTF-NL',      settlementType: 'FINANCIAL',  toleranceType: 'RATE', tolerancePlus: 5, toleranceMinus: 5, toleranceForScheduling: true,  notes: null, gasDetail: { deliveryHub: 'TTF-NL', gasDeliveryStart: '2026-07-01', gasDeliveryEnd: '2026-07-31', swingPct: 10, gasDayType: 'STANDARD', nominationType: 'FIRM' }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-05T08:45:00Z', updatedAt: '2026-06-05T08:45:00Z' },
  { orderId: 4,  tradeId: 3,  orderSequence: 2, isTemplate: false, orderReference: 'TRD-2026-00003-02', status: 'WORKING',   periodCode: 'M2026-08', riskStartDate: '2026-08-01', riskEndDate: '2026-08-31', productId: 4,    productCode: 'TTF-GAS',       productName: 'TTF Natural Gas',          marketId: 4, marketCode: 'ICE_TTF',      pricingRuleId: 5,    pricingRuleCode: 'FLT-TTF-MONTHLY', quantity: 50000,  uomCode: 'MWH',   price: null,  currencyCode: 'EUR', incotermCode: null,   deliveryLocationCode: 'TTF-NL',      settlementType: 'FINANCIAL',  toleranceType: 'RATE', tolerancePlus: 5, toleranceMinus: 5, toleranceForScheduling: true,  notes: 'Aug leg — price TBD', gasDetail: { deliveryHub: 'TTF-NL', gasDeliveryStart: '2026-08-01', gasDeliveryEnd: '2026-08-31', swingPct: 10, gasDayType: 'STANDARD', nominationType: 'FIRM' }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-05T08:45:00Z', updatedAt: '2026-06-05T08:45:00Z' },
  // TRD-004: METALS PHYSICAL BUY — 1 leg (LME copper spot)
  { orderId: 5,  tradeId: 4,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00004-01', status: 'CONFIRMED', periodCode: 'SPOT',     riskStartDate: '2026-06-13', riskEndDate: '2026-06-13', productId: 6,    productCode: 'LME-COPPER',    productName: 'LME Grade A Copper',       marketId: 3, marketCode: 'LME_COPPER',   pricingRuleId: 6,    pricingRuleCode: 'FLT-LME-CU-CASH', quantity: 250,    uomCode: 'MT',    price: 9845, currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: 'LME-WAREHOUSE', settlementType: 'PHYSICAL', toleranceType: 'FLAT', tolerancePlus: 5, toleranceMinus: 5, toleranceForScheduling: false, notes: 'Grade A cathode, LME approved warehouse', metalsDetail: { metalGrade: 'GRADE_A', shape: 'CATHODE', motType: 'TRUCK', lmeDate: '2026-06-13', warehouseLocationCode: 'LME-WAREHOUSE', titleTransferLocationCode: 'LME-WAREHOUSE', brand: 'AURUBIS' }, originCountryCode: 'CL', demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [{ adjustmentType: 'ASSAY', adjustmentValue: -12.5, adjustmentCurrency: 'USD', adjustmentUomCode: 'MT', notes: 'Payable copper 99.99% — assay deduction vs LME ref' }], createdAt: '2026-06-10T11:00:00Z', updatedAt: '2026-06-10T11:00:00Z' },
  // TRD-005: POWER FINANCIAL SELL — 1 leg (EEX DE baseload Jul)
  { orderId: 6,  tradeId: 5,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00005-01', status: 'CONFIRMED', periodCode: 'M2026-07', riskStartDate: '2026-07-01', riskEndDate: '2026-07-31', productId: 8,    productCode: 'EEX-DE-POWER',  productName: 'EEX German Power Baseload', marketId: 6, marketCode: 'EEX_DE_POWER', pricingRuleId: null, pricingRuleCode: null,               quantity: 10000,  uomCode: 'MWH',   price: 68.75, currencyCode: 'EUR', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'Baseload monthly', powerDetail: { loadType: 'BASELOAD', mwCapacity: 50, mwhVolume: 37200, gridNodeCode: 'DE-AT-LU', interconnector: null, deliveryStart: '2026-07-01', deliveryEnd: '2026-07-31' }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-12T09:00:00Z', updatedAt: '2026-06-12T09:00:00Z' },
  // TRD-006: GAS PHYSICAL SELL Centrica — 1 leg (NBP Jul)
  { orderId: 7,  tradeId: 6,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00006-01', status: 'WORKING',   periodCode: 'M2026-07', riskStartDate: '2026-07-01', riskEndDate: '2026-07-31', productId: 5,    productCode: 'NBP-GAS',       productName: 'NBP Natural Gas',          marketId: 8, marketCode: 'OTC_NBP',      pricingRuleId: null, pricingRuleCode: null,               quantity: 75000,  uomCode: 'THERM', price: 92.30, currencyCode: 'GBP', incotermCode: null,   deliveryLocationCode: 'NBP-UK',      settlementType: 'PHYSICAL',   toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'NBP physical day-ahead swing', gasDetail: { deliveryHub: 'NBP-UK', gasDeliveryStart: '2026-07-01', gasDeliveryEnd: '2026-07-31', swingPct: 15, gasDayType: 'STANDARD', nominationType: 'INTERRUPTIBLE' }, originCountryCode: 'GB', demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [{ adjustmentType: 'HEAT_CONTENT', adjustmentValue: -0.015, adjustmentCurrency: 'GBP', adjustmentUomCode: 'THERM', notes: 'Calorific value 38.2 MJ/m³ vs ref 39.0 MJ/m³' }], createdAt: '2026-06-15T14:30:00Z', updatedAt: '2026-06-15T14:30:00Z' },
  // TRD-007: OIL PHYSICAL SELL Vitol — 1 leg (Urals spot cargo)
  { orderId: 8,  tradeId: 7,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00007-01', status: 'CONFIRMED', periodCode: 'M2026-07', riskStartDate: '2026-07-15', riskEndDate: '2026-07-17', productId: 1,    productCode: 'BRENT-CRUDE',   productName: 'Brent Crude Oil',          marketId: 5, marketCode: 'OTC_NS_CRUDE', pricingRuleId: 2,    pricingRuleCode: 'DIFF-URALS-MED',  quantity: 750000, uomCode: 'BBL',   price: 79.95, currencyCode: 'USD', incotermCode: 'CIF',  deliveryLocationCode: 'ROTTERDAM',   settlementType: 'PHYSICAL',   toleranceType: 'RATE', tolerancePlus: 3, toleranceMinus: 3, toleranceForScheduling: false, notes: 'Urals Med grade, 5-day BWAVE pricing', oilDetail: { crudeGrade: 'URALS', apiGravity: 31.8, sulphurPct: 1.35, motType: 'TANKER', loadLocationCode: 'RAS-TANURA', dischargeLocationCode: 'ROTTERDAM', titleTransferLocationCode: 'ROTTERDAM', vesselName: 'FRONT ALTAIR', laycanStart: '2026-07-15', laycanEnd: '2026-07-18', blDate: null, norsTenderedDate: null, codDate: null, pipelineId: null }, originCountryCode: 'RU', demurrageRate: 32500, demurrageCurrency: 'USD', demurrageBasis: 'NON_REVERSIBLE', allowedLaytimeHours: 72, despatchRate: 16250, priceAdjustments: [{ adjustmentType: 'API_GRAVITY', adjustmentValue: -0.536, adjustmentCurrency: 'USD', adjustmentUomCode: 'BBL', notes: 'API 31.8° vs ref 38.5°: -6.7° × $0.08/°' }, { adjustmentType: 'SULFUR', adjustmentValue: -0.85, adjustmentCurrency: 'USD', adjustmentUomCode: 'BBL', notes: 'Sour crude 1.35%wt sulfur content — sour discount' }], createdAt: '2026-06-20T10:00:00Z', updatedAt: '2026-06-20T10:00:00Z' },
  // TRD-008: AGRI PHYSICAL BUY Cargill — 1 leg (EU wheat Aug)
  { orderId: 9,  tradeId: 8,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00008-01', status: 'WORKING',   periodCode: 'M2026-08', riskStartDate: '2026-08-01', riskEndDate: '2026-08-31', productId: 16,   productCode: 'WHEAT-EU',      productName: 'Euronext Milling Wheat',   marketId: null, marketCode: null,          pricingRuleId: null, pricingRuleCode: null,               quantity: 5000,   uomCode: 'MT',    price: 225.50, currencyCode: 'EUR', incotermCode: 'FOB',  deliveryLocationCode: 'ROTTERDAM',   settlementType: 'PHYSICAL',   toleranceType: 'RATE', tolerancePlus: 5, toleranceMinus: 5, toleranceForScheduling: true,  notes: 'EU milling wheat, protein min 12%', agriDetail: { cropYear: 2026, gradeQuality: 'EU MILLING WHEAT MIN 12% PROTEIN', originCountry: 'FR', deliveryBasis: 'FOB ROUEN', motType: 'SHIP' }, originCountryCode: 'FR', demurrageRate: 9500, demurrageCurrency: 'USD', demurrageBasis: 'REVERSIBLE', allowedLaytimeHours: 96, despatchRate: 4750, priceAdjustments: [{ adjustmentType: 'PROTEIN', adjustmentValue: 1.5, adjustmentCurrency: 'EUR', adjustmentUomCode: 'MT', notes: 'Protein 13.2% vs min 12%: +1.2% × €1.25/0.1%' }, { adjustmentType: 'MOISTURE', adjustmentValue: -0.8, adjustmentCurrency: 'EUR', adjustmentUomCode: 'MT', notes: 'Moisture 14.5% vs max 14%: -0.5% over limit' }], createdAt: '2026-06-22T11:30:00Z', updatedAt: '2026-06-22T11:30:00Z' },
  // TRD-009: FREIGHT BUY Shell — 1 leg (VLCC TD3C)
  { orderId: 10, tradeId: 9,  orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00009-01', status: 'WORKING',   periodCode: null,        riskStartDate: '2026-07-10', riskEndDate: '2026-07-15', productId: null, productCode: null,            productName: null,                        marketId: null, marketCode: null,          pricingRuleId: null, pricingRuleCode: null,               quantity: 280000, uomCode: 'MT',    price: 15.50, currencyCode: 'USD', incotermCode: 'FOB',  deliveryLocationCode: 'RAS-TANURA',  settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'TD3C VLCC voyage, Ras Tanura to Chiba Japan', freightDetail: { vesselType: 'VLCC', routeCode: 'TD3C', loadLocationCode: 'RAS-TANURA', dischargeLocationCode: 'CHIBA-JP', cargoSizeMT: 280000, freightRateType: 'WORLDSCALE', freightRate: 75.00, laycanStart: '2026-07-10', laycanEnd: '2026-07-13', charterType: 'VOYAGE' }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-25T11:00:00Z', updatedAt: '2026-06-25T11:00:00Z' },
  // TRD-010: OIL TAS BUY Trafigura — 2 legs (CLZ26 +2 ticks AWAITING; CLF27 0 ticks AWAITING)
  { orderId: 11, tradeId: 10, orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00010-01', status: 'WORKING',   periodCode: 'M2026-12',  riskStartDate: '2026-12-01', riskEndDate: '2026-12-31', productId: 3,    productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures',      marketId: 2, marketCode: 'NYMEX_WTI',    pricingRuleId: 9,    pricingRuleCode: 'TAS-NYMEX-CL',    quantity: 100000, uomCode: 'BBL',   price: null,  currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'TAS +2 ticks vs Dec26 settlement', tasDetail: { tasContractTicker: 'CLZ26', tasDifferential: 2, tasStatus: 'AWAITING_SETTLEMENT', tasLockedPrice: null, tasSettlementDate: null }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-28T14:05:00Z', updatedAt: '2026-06-28T14:05:00Z' },
  { orderId: 12, tradeId: 10, orderSequence: 2, isTemplate: false, orderReference: 'TRD-2026-00010-02', status: 'WORKING',   periodCode: 'M2027-01',  riskStartDate: '2027-01-01', riskEndDate: '2027-01-31', productId: 3,    productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures',      marketId: 2, marketCode: 'NYMEX_WTI',    pricingRuleId: 9,    pricingRuleCode: 'TAS-NYMEX-CL',    quantity: 100000, uomCode: 'BBL',   price: null,  currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'TAS flat (0 ticks) vs Jan27 settlement', tasDetail: { tasContractTicker: 'CLF27', tasDifferential: 0, tasStatus: 'AWAITING_SETTLEMENT', tasLockedPrice: null, tasSettlementDate: null }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-28T14:05:00Z', updatedAt: '2026-06-28T14:05:00Z' },
  // TRD-011: GAS TAS SELL ExxonMobil — 1 leg (NGF27 -1 tick PRICE_LOCKED at 3.455)
  { orderId: 13, tradeId: 11, orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00011-01', status: 'CONFIRMED', periodCode: 'M2027-01',  riskStartDate: '2027-01-01', riskEndDate: '2027-01-31', productId: 4,    productCode: 'TTF-GAS',       productName: 'TTF Natural Gas',          marketId: 4, marketCode: 'ICE_TTF',      pricingRuleId: 10,   pricingRuleCode: 'TAS-NYMEX-NG',    quantity: 25000,  uomCode: 'MMBTU', price: 3.455, currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'NGF27 TAS -1 tick, locked on 30-Jun settle', tasDetail: { tasContractTicker: 'NGF27', tasDifferential: -1, tasStatus: 'PRICE_LOCKED', tasLockedPrice: 3.455, tasSettlementDate: '2026-06-30' }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-06-27T13:55:00Z', updatedAt: '2026-06-30T21:35:00Z' },
  // TRD-012: OIL BALMO BUY BP — 1 leg (WTI BALMO Jul26, booked Jul 1, pricing Jul 1→31)
  { orderId: 14, tradeId: 12, orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00012-01', status: 'WORKING',   periodCode: 'M2026-07',  riskStartDate: '2026-07-01', riskEndDate: '2026-07-31', productId: 3,    productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures',      marketId: 2, marketCode: 'NYMEX_WTI',    pricingRuleId: 13,   pricingRuleCode: 'BALMO-CME-CL',    quantity: 200000, uomCode: 'BBL',   price: null,  currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'WTI BALMO Jul26 — 200k BBL buy, full month pricing CLN26', balmoDetail: { balmoProductId: 1, pricingStartDate: '2026-07-01', pricingEndDate: '2026-07-31', contractMonth: '2026-07', balmoStatus: 'ACTIVE', runningAvgPrice: 72.31, elapsedPricingDays: 1, totalPricingDays: 23, finalSettledPrice: null }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-07-01T10:30:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  // TRD-013: OIL BALMO SELL Glencore — 1 leg (ICE Brent BALMO Jul26)
  { orderId: 15, tradeId: 13, orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00013-01', status: 'WORKING',   periodCode: 'M2026-07',  riskStartDate: '2026-07-01', riskEndDate: '2026-07-31', productId: 3,    productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures',      marketId: 1, marketCode: 'ICE_BRENT',    pricingRuleId: 14,   pricingRuleCode: 'BALMO-ICE-BZ',    quantity: 150000, uomCode: 'BBL',   price: null,  currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'FINANCIAL',  toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, notes: 'Brent BALMO Jul26 — 150k BBL sell, full month BZN26', balmoDetail: { balmoProductId: 3, pricingStartDate: '2026-07-01', pricingEndDate: '2026-07-31', contractMonth: '2026-07', balmoStatus: 'ACTIVE', runningAvgPrice: 76.23, elapsedPricingDays: 1, totalPricingDays: 23, finalSettledPrice: null }, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], createdAt: '2026-07-01T14:10:00Z', updatedAt: '2026-07-01T21:30:00Z' },
  // RINS leg — 5M D6 RINs, separated, MOT = CERTIFICATE (no physical transport)
  { orderId: 16, tradeId: 14, orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00014-01', status: 'CONFIRMED', periodCode: 'SPOT',      riskStartDate: '2026-07-02', riskEndDate: '2026-07-02', productId: null, productCode: null,            productName: null,                        marketId: null, marketCode: null,          pricingRuleId: null, pricingRuleCode: null,               quantity: 5000000, uomCode: 'GAL',  price: 0.85,  currencyCode: 'USD', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'PHYSICAL',   toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, originCountryCode: 'US', demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], notes: 'D6 2026 separated RINs @ $0.85/RIN via EMTS', rinDetail: { dCode: 'D6', vintageYear: 2026, assignmentStatus: 'SEPARATED', fuelCategoryCode: 'CORN-ETHANOL', epaBatchNumber: 'EMTS-2026-88121', emtsTransferRef: null }, createdAt: '2026-07-02T15:20:00Z', updatedAt: '2026-07-02T15:20:00Z' },
  // ENVIRONMENTAL leg — 50,000 EUAs (50 lots x 1000) Dec26 futures
  { orderId: 17, tradeId: 15, orderSequence: 1, isTemplate: true,  orderReference: 'TRD-2026-00015-01', status: 'CONFIRMED', periodCode: 'M2026-12',  riskStartDate: '2026-12-01', riskEndDate: '2026-12-31', productId: null, productCode: null,            productName: null,                        marketId: null, marketCode: null,          pricingRuleId: null, pricingRuleCode: null,               quantity: 50000,   uomCode: 'MT',   price: 72.50, currencyCode: 'EUR', incotermCode: null,   deliveryLocationCode: null,          settlementType: 'PHYSICAL',   toleranceType: null,   tolerancePlus: null, toleranceMinus: null, toleranceForScheduling: false, originCountryCode: null, demurrageRate: null, demurrageCurrency: null, demurrageBasis: null, allowedLaytimeHours: null, despatchRate: null, priceAdjustments: [], notes: 'EUA Dec26 @ EUR72.50/t — delivery to Union Registry at expiry', environmentalDetail: { envProductType: 'ALLOWANCE', schemeCode: 'EU_ETS', registryCode: 'EU-UNION-REG', vintageYear: 2026, projectCode: null, serialNumberRange: null, retirementFlag: false }, createdAt: '2026-07-02T09:45:00Z', updatedAt: '2026-07-02T09:45:00Z' },
];

// ─── TRADE ITEMS (line items within orders) ───────────────────────────────────
let itemIdSeq = 50;
const tradeItemsStore: unknown[] = [
  { itemId: 1, orderId: 1, itemSequence: 1, productId: 1, productCode: 'BRENT-CRUDE', description: 'Forties Crude — Main Cargo', quantity: 490000, uomCode: 'BBL', unitPrice: 82.45, currencyCode: 'USD', notes: null, createdAt: '2026-06-01T09:30:00Z' },
  { itemId: 2, orderId: 1, itemSequence: 2, productId: null, productCode: null, description: 'Operational Tolerance (±2%)',        quantity: 10000,  uomCode: 'BBL', unitPrice: 82.45, currencyCode: 'USD', notes: 'Within ±2% cargo tolerance clause', createdAt: '2026-06-01T09:30:00Z' },
];

// ─── POSITIONS ────────────────────────────────────────────────────────────────
// Positions are aggregated from trades by (book, product, period).
// netQuantityBase is computed from the product's pricing basis fields:
//   OIL   (BBL): MT  = BBL × 0.158987 m³/BBL × densityEstimateKgM3 / 1000
//   GAS   (SCM): MWH = SCM × cvGrossMjScm / 3600
//   ENERGY unit: MWH = qty × fixed energy ratio (THERM→MWH, MMBTU→MWH, GJ→MWH)
//   MT/MWH already: netQuantityBase = netQuantity, conversionSource = 'SAME_UOM'
const positionStore: unknown[] = [
  // Book 1: CRUDE-PROP / BRENT-CRUDE / M2026-07 (BUY 500k - SELL 750k = SHORT 250k BBL)
  // density 857 kg/m3 → 1 BBL = 0.158987 × 857 / 1000 = 0.136250 MT
  { positionId: 1, positionType: 'COMMODITY', bookId: 1, bookCode: 'CRUDE-PROP', bookName: 'Crude Proprietary', productId: 1, productCode: 'BRENT-CRUDE', productName: 'Brent Crude Oil', commodityType: 'OIL', periodCode: 'M2026-07', netQuantity: -250000, grossBuyQuantity: 500000, grossSellQuantity: 750000, quantityUomCode: 'BBL', netQuantityBase: -34062.5, baseUomCode: 'MT', conversionSource: 'DENSITY_ESTIMATE', avgPrice: 80.95, currencyCode: 'USD', tradeCount: 2, calculatedAt: '2026-06-28T00:00:00Z' },
  // Book 2: CRUDE-HEDGE / BRENT-FUTURES / M2026-07 (SELL 100k BBL)
  // density 857 kg/m3 → -100,000 × 0.136250 = -13,625 MT
  { positionId: 2, positionType: 'COMMODITY', bookId: 2, bookCode: 'CRUDE-HEDGE', bookName: 'Crude Hedge', productId: 3, productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures', commodityType: 'OIL', periodCode: 'M2026-07', netQuantity: -100000, grossBuyQuantity: 0, grossSellQuantity: 100000, quantityUomCode: 'BBL', netQuantityBase: -13625.0, baseUomCode: 'MT', conversionSource: 'DENSITY_ESTIMATE', avgPrice: 83.10, currencyCode: 'USD', tradeCount: 1, calculatedAt: '2026-06-28T00:00:00Z' },
  // Book 3: GAS-EU-TRADE / TTF-GAS / M2026-07 (BUY 50,000 MWH — already in base UoM)
  { positionId: 3, positionType: 'COMMODITY', bookId: 3, bookCode: 'GAS-EU-TRADE', bookName: 'Gas EU Trading', productId: 4, productCode: 'TTF-GAS', productName: 'TTF Natural Gas', commodityType: 'GAS', periodCode: 'M2026-07', netQuantity: 50000, grossBuyQuantity: 50000, grossSellQuantity: 0, quantityUomCode: 'MWH', netQuantityBase: 50000, baseUomCode: 'MWH', conversionSource: 'SAME_UOM', avgPrice: 34.55, currencyCode: 'EUR', tradeCount: 1, calculatedAt: '2026-06-28T00:00:00Z' },
  // Book 3: GAS-EU-TRADE / NBP-GAS / M2026-07 (SELL 75,000 THERM)
  // THERM→MWH: fixed ratio 1 THERM = 0.0293071 MWH → -75,000 × 0.0293071 = -2,198.0 MWH
  { positionId: 4, positionType: 'COMMODITY', bookId: 3, bookCode: 'GAS-EU-TRADE', bookName: 'Gas EU Trading', productId: 5, productCode: 'NBP-GAS', productName: 'NBP Natural Gas', commodityType: 'GAS', periodCode: 'M2026-07', netQuantity: -75000, grossBuyQuantity: 0, grossSellQuantity: 75000, quantityUomCode: 'THERM', netQuantityBase: -2198.0, baseUomCode: 'MWH', conversionSource: 'ENERGY_CONVERSION', avgPrice: 92.30, currencyCode: 'GBP', tradeCount: 1, calculatedAt: '2026-06-28T00:00:00Z' },
  // Book 4: LME-CU-ARB / LME-COPPER / SPOT (BUY 250 MT — already in base UoM)
  { positionId: 5, positionType: 'COMMODITY', bookId: 4, bookCode: 'LME-CU-ARB', bookName: 'LME Copper Arbitrage', productId: 6, productCode: 'LME-COPPER', productName: 'LME Grade A Copper', commodityType: 'METALS', periodCode: 'SPOT', netQuantity: 250, grossBuyQuantity: 250, grossSellQuantity: 0, quantityUomCode: 'MT', netQuantityBase: 250, baseUomCode: 'MT', conversionSource: 'SAME_UOM', avgPrice: 9845.00, currencyCode: 'USD', tradeCount: 1, calculatedAt: '2026-06-28T00:00:00Z' },
  // Book 5: POWER-CLIENT / EEX-DE-POWER / M2026-07 (SELL 10,000 MWH — already in base UoM)
  { positionId: 6, positionType: 'COMMODITY', bookId: 5, bookCode: 'POWER-CLIENT', bookName: 'Power Client Desk', productId: 8, productCode: 'EEX-DE-POWER', productName: 'EEX German Power Baseload', commodityType: 'POWER', periodCode: 'M2026-07', netQuantity: -10000, grossBuyQuantity: 0, grossSellQuantity: 10000, quantityUomCode: 'MWH', netQuantityBase: -10000, baseUomCode: 'MWH', conversionSource: 'SAME_UOM', avgPrice: 68.75, currencyCode: 'EUR', tradeCount: 1, calculatedAt: '2026-06-28T00:00:00Z' },
  // Book 3: GAS-EU-TRADE / WHEAT-EU / M2026-08 (BUY 5,000 MT — already in base UoM)
  { positionId: 7, positionType: 'COMMODITY', bookId: 3, bookCode: 'GAS-EU-TRADE', bookName: 'Gas EU Trading', productId: 16, productCode: 'WHEAT-EU', productName: 'Euronext Milling Wheat (EU)', commodityType: 'AGRICULTURAL', periodCode: 'M2026-08', netQuantity: 5000, grossBuyQuantity: 5000, grossSellQuantity: 0, quantityUomCode: 'MT', netQuantityBase: 5000, baseUomCode: 'MT', conversionSource: 'SAME_UOM', avgPrice: 225.50, currencyCode: 'EUR', tradeCount: 1, calculatedAt: '2026-06-28T00:00:00Z' },
];

// ─── GENERIC CRUD FACTORY ─────────────────────────────────────────────────────
function crudHandlers<T extends { [K: string]: unknown }>(
  path: string,
  store: T[],
  idField: keyof T,
) {
  return [
    http.get(`${API}/${path}`, () => HttpResponse.json(store)),
    http.post(`${API}/${path}`, async ({ request }) => {
      const input = (await request.json()) as T;
      const row = { ...input, [idField]: nextId(), createdAt: now() } as T;
      store.push(row);
      return HttpResponse.json(row, { status: 201 });
    }),
    http.put(`${API}/${path}/:id`, async ({ params, request }) => {
      const rawId = params.id as string;
      const id = isNaN(Number(rawId)) ? rawId : Number(rawId);
      const idx = store.findIndex((r) => r[idField] === id);
      if (idx === -1) return problem(404, 'Not Found', `${String(idField)} ${params.id} not found.`);
      const input = (await request.json()) as Partial<T>;
      store[idx] = { ...store[idx], ...input };
      return HttpResponse.json(store[idx]);
    }),
    http.patch(`${API}/${path}/:id/deactivate`, ({ params }) => {
      const rawId = params.id as string;
      const id = isNaN(Number(rawId)) ? rawId : Number(rawId);
      const idx = store.findIndex((r) => r[idField] === id);
      if (idx === -1) return problem(404, 'Not Found', `${String(idField)} ${params.id} not found.`);
      store[idx] = { ...store[idx], isActive: false };
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

// ─── MARKETS (trading markets, not exchanges) ──────────────────────────────────
const marketsStore: unknown[] = [
  { marketId: 1, exchangeId: 1, exchangeCode: 'ICE', commodityType: 'OIL', marketCode: 'ICE_BRENT', marketName: 'ICE Brent Crude Futures', marketType: 'EXCHANGE', settlementType: 'FINANCIAL', currencyCode: 'USD', timezone: 'Europe/London', countryCode: 'GB', clearingHouse: 'ICE Clear Europe', contractSize: 1000, contractUomCode: 'BBL', priceQuotation: 'USD per barrel', tickSize: 0.01, goLiveDate: '1988-06-23', closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 2, exchangeId: 2, exchangeCode: 'NYMEX', commodityType: 'OIL', marketCode: 'NYMEX_WTI', marketName: 'NYMEX WTI Light Sweet Crude Futures', marketType: 'EXCHANGE', settlementType: 'PHYSICAL', currencyCode: 'USD', timezone: 'America/New_York', countryCode: 'US', clearingHouse: 'CME Clearing', contractSize: 1000, contractUomCode: 'BBL', priceQuotation: 'USD per barrel', tickSize: 0.01, goLiveDate: '1983-03-30', closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 3, exchangeId: 3, exchangeCode: 'LME', commodityType: 'METALS', marketCode: 'LME_COPPER', marketName: 'LME Copper Cash & 3M', marketType: 'EXCHANGE', settlementType: 'PHYSICAL', currencyCode: 'USD', timezone: 'Europe/London', countryCode: 'GB', clearingHouse: 'LME Clear', contractSize: 25, contractUomCode: 'MT', priceQuotation: 'USD per metric tonne', tickSize: 0.5, goLiveDate: null, closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 4, exchangeId: 1, exchangeCode: 'ICE', commodityType: 'GAS', marketCode: 'ICE_TTF', marketName: 'ICE TTF Natural Gas Futures', marketType: 'EXCHANGE', settlementType: 'FINANCIAL', currencyCode: 'EUR', timezone: 'Europe/Amsterdam', countryCode: 'NL', clearingHouse: 'ICE Clear Europe', contractSize: 1, contractUomCode: 'MWH', priceQuotation: 'EUR per MWh', tickSize: 0.001, goLiveDate: null, closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 5, exchangeId: null, exchangeCode: null, commodityType: 'OIL', marketCode: 'OTC_NS_CRUDE', marketName: 'OTC North Sea Crude (Physical)', marketType: 'OTC_BILATERAL', settlementType: 'PHYSICAL', currencyCode: 'USD', timezone: 'Europe/London', countryCode: 'GB', clearingHouse: null, contractSize: 500000, contractUomCode: 'BBL', priceQuotation: 'USD per barrel vs Dated Brent', tickSize: 0.01, goLiveDate: null, closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 6, exchangeId: 4, exchangeCode: 'EEX', commodityType: 'POWER', marketCode: 'EEX_DE_POWER', marketName: 'EEX German Power Base/Peak Futures', marketType: 'EXCHANGE', settlementType: 'FINANCIAL', currencyCode: 'EUR', timezone: 'Europe/Berlin', countryCode: 'DE', clearingHouse: 'ECC', contractSize: 1, contractUomCode: 'MW', priceQuotation: 'EUR per MWh', tickSize: 0.01, goLiveDate: null, closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 7, exchangeId: 3, exchangeCode: 'LME', commodityType: 'METALS', marketCode: 'LME_ALUMINIUM', marketName: 'LME Primary Aluminium Cash & 3M', marketType: 'EXCHANGE', settlementType: 'PHYSICAL', currencyCode: 'USD', timezone: 'Europe/London', countryCode: 'GB', clearingHouse: 'LME Clear', contractSize: 25, contractUomCode: 'MT', priceQuotation: 'USD per metric tonne', tickSize: 0.5, goLiveDate: null, closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { marketId: 8, exchangeId: null, exchangeCode: null, commodityType: 'GAS', marketCode: 'OTC_NBP', marketName: 'OTC UK NBP Gas (Physical)', marketType: 'OTC_CLEARED', settlementType: 'PHYSICAL', currencyCode: 'GBP', timezone: 'Europe/London', countryCode: 'GB', clearingHouse: 'ICE Clear Europe', contractSize: 1, contractUomCode: 'THERM', priceQuotation: 'pence per therm', tickSize: 0.001, goLiveDate: null, closeDate: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// Market-Product links
const marketProductsStore: unknown[] = [
  { marketProductId: 1, marketId: 1, productId: 3, productCode: 'BRENT-FUTURES', productName: 'Brent Futures', ticker: 'B', currencyCode: null, uomCode: null, lotSize: 1000, minQuantity: 1000, maxQuantity: 500000, pricePrecision: 2, settlementType: null, firstNoticeDayOffset: null, lastTradingDayOffset: -1, listedDate: '1988-06-23', delistedDate: null, isActive: true },
  { marketProductId: 2, marketId: 2, productId: 2, productCode: 'WTI-CRUDE', productName: 'West Texas Intermediate', ticker: 'CL', currencyCode: null, uomCode: null, lotSize: 1000, minQuantity: 1000, maxQuantity: 500000, pricePrecision: 2, settlementType: null, firstNoticeDayOffset: 3, lastTradingDayOffset: -3, listedDate: '1983-03-30', delistedDate: null, isActive: true },
  { marketProductId: 3, marketId: 3, productId: 6, productCode: 'LME-COPPER', productName: 'LME Copper', ticker: 'CA', currencyCode: null, uomCode: null, lotSize: 25, minQuantity: 25, maxQuantity: 5000, pricePrecision: 0, settlementType: null, firstNoticeDayOffset: null, lastTradingDayOffset: null, listedDate: null, delistedDate: null, isActive: true },
  { marketProductId: 4, marketId: 4, productId: 4, productCode: 'TTF-GAS', productName: 'TTF Natural Gas', ticker: 'TTF', currencyCode: null, uomCode: null, lotSize: 1, minQuantity: 1, maxQuantity: 1000000, pricePrecision: 3, settlementType: null, firstNoticeDayOffset: null, lastTradingDayOffset: -3, listedDate: null, delistedDate: null, isActive: true },
  { marketProductId: 5, marketId: 5, productId: 1, productCode: 'BRENT-CRUDE', productName: 'Brent Crude Oil', ticker: null, currencyCode: null, uomCode: null, lotSize: 500000, minQuantity: 250000, maxQuantity: 2000000, pricePrecision: 4, settlementType: 'PHYSICAL', firstNoticeDayOffset: null, lastTradingDayOffset: null, listedDate: null, delistedDate: null, isActive: true },
];

// Market-Product-Period links
const marketProductPeriodsStore: unknown[] = [
  { mppId: 1, marketProductId: 1, periodId: 1, periodCode: 'M+0', periodName: 'Prompt Month', periodType: 'MONTH', curveLabel: 'M+0', isActive: true },
  { mppId: 2, marketProductId: 1, periodId: 2, periodCode: 'M+1', periodName: 'Second Month', periodType: 'MONTH', curveLabel: 'M+1', isActive: true },
  { mppId: 3, marketProductId: 1, periodId: 3, periodCode: 'M+2', periodName: 'Third Month', periodType: 'MONTH', curveLabel: 'M+2', isActive: true },
  { mppId: 4, marketProductId: 1, periodId: 8, periodCode: 'Q+0', periodName: 'Current Quarter', periodType: 'QUARTER', curveLabel: 'Q+0', isActive: true },
  { mppId: 5, marketProductId: 1, periodId: 9, periodCode: 'Q+1', periodName: 'Next Quarter', periodType: 'QUARTER', curveLabel: 'Q+1', isActive: true },
  { mppId: 6, marketProductId: 2, periodId: 1, periodCode: 'M+0', periodName: 'Prompt Month', periodType: 'MONTH', curveLabel: 'M+0', isActive: true },
  { mppId: 7, marketProductId: 2, periodId: 2, periodCode: 'M+1', periodName: 'Second Month', periodType: 'MONTH', curveLabel: 'M+1', isActive: true },
  { mppId: 8, marketProductId: 3, periodId: 1, periodCode: 'M+0', periodName: 'Prompt Month', periodType: 'MONTH', curveLabel: 'M+0', isActive: true },
  { mppId: 9, marketProductId: 3, periodId: 31, periodCode: 'MET-3M', periodName: 'Metals 3 Month', periodType: 'MONTH', curveLabel: '3M', isActive: true },
  { mppId: 10, marketProductId: 3, periodId: 32, periodCode: 'MET-15M', periodName: 'Metals 15 Month', periodType: 'MONTH', curveLabel: '15M', isActive: true },
];

// Market-Product-Source links
const marketProductSourcesStore: unknown[] = [
  { mpsId: 1, marketProductId: 1, priceSourceId: 5, sourceCode: 'ICE_DATA', sourceName: 'ICE Data Services', sourceRole: 'PRIMARY_MTM', sourceTicker: 'B', sourceFieldCode: null, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { mpsId: 2, marketProductId: 1, priceSourceId: 3, sourceCode: 'BLOOMBERG', sourceName: 'Bloomberg', sourceRole: 'BACKUP', sourceTicker: 'CO1 Comdty', sourceFieldCode: null, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { mpsId: 3, marketProductId: 2, priceSourceId: 6, sourceCode: 'NYMEX_DATA', sourceName: 'CME Group Market Data', sourceRole: 'PRIMARY_MTM', sourceTicker: 'CL1', sourceFieldCode: null, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { mpsId: 4, marketProductId: 2, priceSourceId: 6, sourceCode: 'NYMEX_DATA', sourceName: 'CME Group Market Data', sourceRole: 'SETTLEMENT', sourceTicker: 'CL', sourceFieldCode: 'CL_SETTLE', effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { mpsId: 5, marketProductId: 3, priceSourceId: 7, sourceCode: 'LME_DATA', sourceName: 'LME Official Prices', sourceRole: 'PRIMARY_MTM', sourceTicker: 'LMCADY', sourceFieldCode: null, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { mpsId: 6, marketProductId: 3, priceSourceId: 7, sourceCode: 'LME_DATA', sourceName: 'LME Official Prices', sourceRole: 'SETTLEMENT', sourceTicker: 'LMCADS', sourceFieldCode: 'CU_OFFICIAL', effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
];

// ─── PRICE SOURCES ─────────────────────────────────────────────────────────────
const priceSourcesStore: unknown[] = [
  { priceSourceId: 1, sourceCode: 'PLATTS', sourceName: 'S&P Global Platts', sourceType: 'VENDOR', deliveryMethod: 'API', frequency: 'EOD', timezone: 'Europe/London', baseUrl: 'https://api.platts.com/price/v1', credentialsRef: 'prod/platts/api-key', slaMinutes: 60, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 2, sourceCode: 'ARGUS', sourceName: 'Argus Media', sourceType: 'VENDOR', deliveryMethod: 'API', frequency: 'EOD', timezone: 'Europe/London', baseUrl: 'https://api.argusmedia.com/v1', credentialsRef: 'prod/argus/api-key', slaMinutes: 75, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 3, sourceCode: 'BLOOMBERG', sourceName: 'Bloomberg', sourceType: 'BLOOMBERG', deliveryMethod: 'REAL_TIME_FEED', frequency: 'REAL_TIME', timezone: 'America/New_York', baseUrl: null, credentialsRef: 'prod/bloomberg/bpipe-key', slaMinutes: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 4, sourceCode: 'REUTERS', sourceName: 'Refinitiv/Reuters Eikon', sourceType: 'REUTERS', deliveryMethod: 'REAL_TIME_FEED', frequency: 'REAL_TIME', timezone: 'America/New_York', baseUrl: null, credentialsRef: 'prod/refinitiv/elektron-key', slaMinutes: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 5, sourceCode: 'ICE_DATA', sourceName: 'ICE Data Services', sourceType: 'EXCHANGE', deliveryMethod: 'API', frequency: 'EOD', timezone: 'Europe/London', baseUrl: 'https://api.theice.com/publicdata', credentialsRef: 'prod/ice/data-key', slaMinutes: 30, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 6, sourceCode: 'NYMEX_DATA', sourceName: 'CME Group Market Data', sourceType: 'EXCHANGE', deliveryMethod: 'API', frequency: 'EOD', timezone: 'America/New_York', baseUrl: 'https://api.cmegroup.com/v1', credentialsRef: 'prod/cme/market-data-key', slaMinutes: 30, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 7, sourceCode: 'LME_DATA', sourceName: 'LME Official Prices', sourceType: 'EXCHANGE', deliveryMethod: 'FTP', frequency: 'EOD', timezone: 'Europe/London', baseUrl: 'sftp://prices.lme.com', credentialsRef: 'prod/lme/sftp-key', slaMinutes: 90, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 8, sourceCode: 'EEX_DATA', sourceName: 'EEX Market Data', sourceType: 'EXCHANGE', deliveryMethod: 'API', frequency: 'EOD', timezone: 'Europe/Berlin', baseUrl: 'https://api.eex.com/v1', credentialsRef: 'prod/eex/api-key', slaMinutes: 45, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 9, sourceCode: 'ICIS', sourceName: 'ICIS Price Assessments', sourceType: 'VENDOR', deliveryMethod: 'FTP', frequency: 'EOD', timezone: 'Europe/London', baseUrl: 'sftp://data.icis.com', credentialsRef: 'prod/icis/sftp-key', slaMinutes: 120, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { priceSourceId: 10, sourceCode: 'INTERNAL', sourceName: 'Internal / Manual Entry', sourceType: 'INTERNAL', deliveryMethod: 'MANUAL', frequency: 'MANUAL', timezone: 'UTC', baseUrl: null, credentialsRef: null, slaMinutes: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// Price Index → Source links
const priceIndexSourcesStore: unknown[] = [
  { pisId: 1, priceIndexId: 1, priceIndexCode: 'DTBRT', priceIndexName: 'Platts Dated Brent', priceSourceId: 1, sourceCode: 'PLATTS', sourceName: 'S&P Global Platts', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'PCAAS00', sourceTicker: null, priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 2, priceIndexId: 1, priceIndexCode: 'DTBRT', priceIndexName: 'Platts Dated Brent', priceSourceId: 3, sourceCode: 'BLOOMBERG', sourceName: 'Bloomberg', sourceRole: 'BACKUP', sourceFieldCode: null, sourceTicker: 'PCAAS00 Index', priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 3, priceIndexId: 2, priceIndexCode: 'WTI-NYMEX', priceIndexName: 'NYMEX WTI Front Month', priceSourceId: 6, sourceCode: 'NYMEX_DATA', sourceName: 'CME Group Market Data', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'CL_SETTLE', sourceTicker: 'CL1', priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 4, priceIndexId: 3, priceIndexCode: 'TTF-ICE', priceIndexName: 'ICE TTF Natural Gas', priceSourceId: 5, sourceCode: 'ICE_DATA', sourceName: 'ICE Data Services', sourceRole: 'PRIMARY_MTM', sourceFieldCode: null, sourceTicker: 'TTF', priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 5, priceIndexId: 6, priceIndexCode: 'LME-CU-CASH', priceIndexName: 'LME Copper Cash', priceSourceId: 7, sourceCode: 'LME_DATA', sourceName: 'LME Official Prices', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'CU_OFFICIAL', sourceTicker: 'LMCADY', priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 6, priceIndexId: 6, priceIndexCode: 'LME-CU-CASH', priceIndexName: 'LME Copper Cash', priceSourceId: 3, sourceCode: 'BLOOMBERG', sourceName: 'Bloomberg', sourceRole: 'BACKUP', sourceFieldCode: null, sourceTicker: 'LMCADY Comdty', priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 7, priceIndexId: 9, priceIndexCode: 'ARGUS-URALS', priceIndexName: 'Argus Urals Med', priceSourceId: 2, sourceCode: 'ARGUS', sourceName: 'Argus Media', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'AP-0001', sourceTicker: null, priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
];

// ─── FIELD PERMISSIONS DATA ────────────────────────────────────────────────────

const fieldRegistryStore: unknown[] = [
  // Core trade fields
  { fieldId: 1,  fieldKey: 'tradeDate',            fieldLabel: 'Trade Date',            fieldGroup: 'Trade Header',  isRequiredField: true,  sortOrder: 10 },
  { fieldId: 2,  fieldKey: 'executionDatetime',     fieldLabel: 'Execution Time',        fieldGroup: 'Trade Header',  isRequiredField: false, sortOrder: 11 },
  { fieldId: 3,  fieldKey: 'commodityType',         fieldLabel: 'Commodity Type',        fieldGroup: 'Trade Header',  isRequiredField: true,  sortOrder: 12 },
  { fieldId: 4,  fieldKey: 'tradeType',             fieldLabel: 'Trade Type',            fieldGroup: 'Trade Header',  isRequiredField: true,  sortOrder: 13 },
  { fieldId: 5,  fieldKey: 'direction',             fieldLabel: 'Direction (Buy/Sell)',  fieldGroup: 'Trade Header',  isRequiredField: true,  sortOrder: 14 },
  { fieldId: 6,  fieldKey: 'status',                fieldLabel: 'Status',                fieldGroup: 'Trade Header',  isRequiredField: true,  sortOrder: 15 },
  { fieldId: 7,  fieldKey: 'notes',                 fieldLabel: 'Notes',                 fieldGroup: 'Trade Header',  isRequiredField: false, sortOrder: 19 },
  // Counterparty / book
  { fieldId: 10, fieldKey: 'counterpartyId',        fieldLabel: 'Counterparty',          fieldGroup: 'Counterparty',  isRequiredField: true,  sortOrder: 20 },
  { fieldId: 11, fieldKey: 'traderId',              fieldLabel: 'Trader',                fieldGroup: 'Counterparty',  isRequiredField: true,  sortOrder: 21 },
  { fieldId: 12, fieldKey: 'bookId',                fieldLabel: 'Book',                  fieldGroup: 'Counterparty',  isRequiredField: true,  sortOrder: 22 },
  { fieldId: 13, fieldKey: 'legalEntityId',         fieldLabel: 'Legal Entity',          fieldGroup: 'Counterparty',  isRequiredField: true,  sortOrder: 23 },
  // Product / pricing
  { fieldId: 20, fieldKey: 'productId',             fieldLabel: 'Product',               fieldGroup: 'Product',       isRequiredField: true,  sortOrder: 30 },
  { fieldId: 21, fieldKey: 'marketId',              fieldLabel: 'Market',                fieldGroup: 'Product',       isRequiredField: false, sortOrder: 31 },
  { fieldId: 22, fieldKey: 'pricingRuleId',         fieldLabel: 'Pricing Rule',          fieldGroup: 'Product',       isRequiredField: false, sortOrder: 32 },
  { fieldId: 23, fieldKey: 'periodCode',            fieldLabel: 'Delivery Period',       fieldGroup: 'Product',       isRequiredField: true,  sortOrder: 33 },
  // Quantity / price
  { fieldId: 30, fieldKey: 'quantity',              fieldLabel: 'Quantity',              fieldGroup: 'Quantity & Price', isRequiredField: true, sortOrder: 40 },
  { fieldId: 31, fieldKey: 'uomCode',               fieldLabel: 'Unit of Measure',       fieldGroup: 'Quantity & Price', isRequiredField: true, sortOrder: 41 },
  { fieldId: 32, fieldKey: 'price',                 fieldLabel: 'Price',                 fieldGroup: 'Quantity & Price', isRequiredField: true, sortOrder: 42 },
  { fieldId: 33, fieldKey: 'currencyCode',          fieldLabel: 'Currency',              fieldGroup: 'Quantity & Price', isRequiredField: true, sortOrder: 43 },
  { fieldId: 34, fieldKey: 'settlementType',        fieldLabel: 'Settlement Type',       fieldGroup: 'Quantity & Price', isRequiredField: true, sortOrder: 44 },
  // Logistics
  { fieldId: 40, fieldKey: 'incotermCode',          fieldLabel: 'Incoterms',             fieldGroup: 'Logistics',     isRequiredField: false, sortOrder: 50 },
  { fieldId: 41, fieldKey: 'deliveryLocationCode',  fieldLabel: 'Delivery Location',     fieldGroup: 'Logistics',     isRequiredField: false, sortOrder: 51 },
  // V29 — Trade core (contract type, risk, broker, credit)
  { fieldId: 3,  fieldKey: 'contractType',           fieldLabel: 'Contract Type',         fieldGroup: 'Trade ID',      isRequiredField: false, sortOrder: 5  },
  { fieldId: 4,  fieldKey: 'riskStartDate',          fieldLabel: 'Risk Start Date',       fieldGroup: 'Risk Period',   isRequiredField: true,  sortOrder: 6  },
  { fieldId: 5,  fieldKey: 'riskEndDate',            fieldLabel: 'Risk End Date',         fieldGroup: 'Risk Period',   isRequiredField: true,  sortOrder: 7  },
  { fieldId: 6,  fieldKey: 'brokerId',               fieldLabel: 'Broker',                fieldGroup: 'Broker',        isRequiredField: false, sortOrder: 8  },
  { fieldId: 7,  fieldKey: 'brokerFeeType',          fieldLabel: 'Broker Fee Type',       fieldGroup: 'Broker',        isRequiredField: false, sortOrder: 9  },
  { fieldId: 8,  fieldKey: 'brokerFee',              fieldLabel: 'Broker Fee',            fieldGroup: 'Broker',        isRequiredField: false, sortOrder: 10 },
  { fieldId: 9,  fieldKey: 'brokerFeeCurrencyCode',  fieldLabel: 'Broker Fee Currency',   fieldGroup: 'Broker',        isRequiredField: false, sortOrder: 11 },
  { fieldId: 42, fieldKey: 'creditTermCode',         fieldLabel: 'Credit Terms',          fieldGroup: 'Credit & Legal', isRequiredField: false, sortOrder: 52 },
  { fieldId: 43, fieldKey: 'creditApprovalStatus',   fieldLabel: 'Credit Approval',       fieldGroup: 'Credit & Legal', isRequiredField: false, sortOrder: 53 },
  { fieldId: 44, fieldKey: 'creditLimitUsed',        fieldLabel: 'Credit Limit Used',     fieldGroup: 'Credit & Legal', isRequiredField: false, sortOrder: 54 },
  { fieldId: 45, fieldKey: 'gtcReference',           fieldLabel: 'GTC Reference',         fieldGroup: 'Credit & Legal', isRequiredField: false, sortOrder: 55 },
  // OIL detail
  { fieldId: 50, fieldKey: 'oilDetail.crudeGrade',              fieldLabel: 'Crude Grade',            fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 60 },
  { fieldId: 51, fieldKey: 'oilDetail.apiGravity',              fieldLabel: 'API Gravity',            fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 61 },
  { fieldId: 52, fieldKey: 'oilDetail.sulphurPct',              fieldLabel: 'Sulphur (%wt)',          fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 62 },
  { fieldId: 53, fieldKey: 'oilDetail.motType',                 fieldLabel: 'MOT',                    fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 63 },
  { fieldId: 54, fieldKey: 'oilDetail.loadLocationCode',        fieldLabel: 'Load Location',          fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 64 },
  { fieldId: 55, fieldKey: 'oilDetail.dischargeLocationCode',   fieldLabel: 'Discharge Location',     fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 65 },
  { fieldId: 56, fieldKey: 'oilDetail.titleTransferLocationCode', fieldLabel: 'Title Transfer Point', fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 66 },
  { fieldId: 57, fieldKey: 'oilDetail.vesselName',              fieldLabel: 'Vessel Name',            fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 67 },
  { fieldId: 58, fieldKey: 'oilDetail.pipelineId',              fieldLabel: 'Pipeline',               fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 68 },
  { fieldId: 59, fieldKey: 'oilDetail.laycanStart',             fieldLabel: 'Laycan Start',           fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 69 },
  { fieldId: 60, fieldKey: 'oilDetail.laycanEnd',               fieldLabel: 'Laycan End',             fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 70 },
  { fieldId: 61, fieldKey: 'oilDetail.blDate',                  fieldLabel: 'B/L Date',               fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 71 },
  { fieldId: 62, fieldKey: 'oilDetail.norsTenderedDate',        fieldLabel: 'NOR Tendered Date',      fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 72 },
  { fieldId: 63, fieldKey: 'oilDetail.codDate',                 fieldLabel: 'COD Date',               fieldGroup: 'OIL Detail',    isRequiredField: false, sortOrder: 73 },
  // GAS detail
  { fieldId: 70, fieldKey: 'gasDetail.deliveryHub',       fieldLabel: 'Delivery Hub',          fieldGroup: 'GAS Detail',    isRequiredField: false, sortOrder: 80 },
  { fieldId: 71, fieldKey: 'gasDetail.nominationType',    fieldLabel: 'Nomination Type',       fieldGroup: 'GAS Detail',    isRequiredField: false, sortOrder: 81 },
  { fieldId: 72, fieldKey: 'gasDetail.swingPct',          fieldLabel: 'Swing (%)',             fieldGroup: 'GAS Detail',    isRequiredField: false, sortOrder: 82 },
  { fieldId: 73, fieldKey: 'gasDetail.gasDeliveryStart',  fieldLabel: 'Gas Delivery Start',    fieldGroup: 'GAS Detail',    isRequiredField: false, sortOrder: 83 },
  { fieldId: 74, fieldKey: 'gasDetail.gasDeliveryEnd',    fieldLabel: 'Gas Delivery End',      fieldGroup: 'GAS Detail',    isRequiredField: false, sortOrder: 84 },
  { fieldId: 75, fieldKey: 'gasDetail.gasDayType',        fieldLabel: 'Gas Day Type',          fieldGroup: 'GAS Detail',    isRequiredField: false, sortOrder: 85 },
  // POWER detail
  { fieldId: 80, fieldKey: 'powerDetail.loadType',        fieldLabel: 'Load Type',             fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 90 },
  { fieldId: 81, fieldKey: 'powerDetail.mwCapacity',      fieldLabel: 'MW Capacity',           fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 91 },
  { fieldId: 82, fieldKey: 'powerDetail.mwhVolume',       fieldLabel: 'MWh Volume',            fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 92 },
  { fieldId: 83, fieldKey: 'powerDetail.deliveryStart',   fieldLabel: 'Delivery Start',        fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 93 },
  { fieldId: 84, fieldKey: 'powerDetail.deliveryEnd',     fieldLabel: 'Delivery End',          fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 94 },
  { fieldId: 85, fieldKey: 'powerDetail.gridNodeCode',    fieldLabel: 'Grid Node',             fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 95 },
  { fieldId: 86, fieldKey: 'powerDetail.interconnector',  fieldLabel: 'Interconnector',        fieldGroup: 'POWER Detail',  isRequiredField: false, sortOrder: 96 },
  // LNG detail
  { fieldId: 87, fieldKey: 'lngDetail.loadTerminalCode',          fieldLabel: 'Load Terminal',         fieldGroup: 'LNG Detail',    isRequiredField: false, sortOrder: 97  },
  { fieldId: 88, fieldKey: 'lngDetail.dischargeTerminalCode',     fieldLabel: 'Discharge Terminal',    fieldGroup: 'LNG Detail',    isRequiredField: false, sortOrder: 98  },
  { fieldId: 89, fieldKey: 'lngDetail.titleTransferLocationCode', fieldLabel: 'Title Transfer Point',  fieldGroup: 'LNG Detail',    isRequiredField: false, sortOrder: 99  },
  { fieldId: 90, fieldKey: 'lngDetail.motType',                   fieldLabel: 'MOT',                   fieldGroup: 'LNG Detail',    isRequiredField: false, sortOrder: 100 },
  { fieldId: 91, fieldKey: 'lngDetail.cargoVolumeMmbtu',          fieldLabel: 'Cargo Volume (MMBtu)',  fieldGroup: 'LNG Detail',    isRequiredField: false, sortOrder: 101 },
  { fieldId: 92, fieldKey: 'lngDetail.priceBasis',                fieldLabel: 'Price Basis',           fieldGroup: 'LNG Detail',    isRequiredField: false, sortOrder: 102 },
  // METALS detail
  { fieldId: 93, fieldKey: 'metalsDetail.metalGrade',              fieldLabel: 'Metal Grade',          fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 103 },
  { fieldId: 94, fieldKey: 'metalsDetail.shape',                   fieldLabel: 'Shape',                fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 104 },
  { fieldId: 95, fieldKey: 'metalsDetail.motType',                 fieldLabel: 'MOT',                  fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 105 },
  { fieldId: 96, fieldKey: 'metalsDetail.lmeDate',                 fieldLabel: 'LME Date',             fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 106 },
  { fieldId: 97, fieldKey: 'metalsDetail.warehouseLocationCode',   fieldLabel: 'Warehouse',            fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 107 },
  { fieldId: 98, fieldKey: 'metalsDetail.titleTransferLocationCode', fieldLabel: 'Title Transfer Point', fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 108 },
  { fieldId: 99, fieldKey: 'metalsDetail.brand',                   fieldLabel: 'Brand',                fieldGroup: 'METALS Detail', isRequiredField: false, sortOrder: 109 },
  // AGRI detail
  { fieldId: 110, fieldKey: 'agriDetail.cropYear',        fieldLabel: 'Crop Year',             fieldGroup: 'AGRI Detail',    isRequiredField: false, sortOrder: 110 },
  { fieldId: 111, fieldKey: 'agriDetail.gradeQuality',    fieldLabel: 'Grade / Quality',       fieldGroup: 'AGRI Detail',    isRequiredField: false, sortOrder: 111 },
  { fieldId: 112, fieldKey: 'agriDetail.originCountry',   fieldLabel: 'Origin Country',        fieldGroup: 'AGRI Detail',    isRequiredField: false, sortOrder: 112 },
  { fieldId: 113, fieldKey: 'agriDetail.deliveryBasis',   fieldLabel: 'Delivery Basis',        fieldGroup: 'AGRI Detail',    isRequiredField: false, sortOrder: 113 },
  { fieldId: 114, fieldKey: 'agriDetail.motType',         fieldLabel: 'MOT',                   fieldGroup: 'AGRI Detail',    isRequiredField: false, sortOrder: 114 },
  // FREIGHT detail (V30)
  { fieldId: 120, fieldKey: 'freightDetail.vesselType',          fieldLabel: 'Vessel Type',          fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 120 },
  { fieldId: 121, fieldKey: 'freightDetail.charterType',         fieldLabel: 'Charter Type',         fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 121 },
  { fieldId: 122, fieldKey: 'freightDetail.routeCode',           fieldLabel: 'Route Code',           fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 122 },
  { fieldId: 123, fieldKey: 'freightDetail.loadLocationCode',    fieldLabel: 'Load Port',            fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 123 },
  { fieldId: 124, fieldKey: 'freightDetail.dischargeLocationCode', fieldLabel: 'Discharge Port',     fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 124 },
  { fieldId: 125, fieldKey: 'freightDetail.cargoSizeMT',         fieldLabel: 'Cargo Size (MT)',      fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 125 },
  { fieldId: 126, fieldKey: 'freightDetail.freightRateType',     fieldLabel: 'Rate Type',            fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 126 },
  { fieldId: 127, fieldKey: 'freightDetail.freightRate',         fieldLabel: 'Freight Rate',         fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 127 },
  { fieldId: 128, fieldKey: 'freightDetail.laycanStart',         fieldLabel: 'Laycan Start',         fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 128 },
  { fieldId: 129, fieldKey: 'freightDetail.laycanEnd',           fieldLabel: 'Laycan End',           fieldGroup: 'FREIGHT Detail', isRequiredField: false, sortOrder: 129 },
];

const profileStore: unknown[] = [
  { profileId: 1, profileCode: 'TRADE_BLOTTER_TRADER',     profileName: 'Trader — Full Access',    description: 'Full edit access to all commercial and logistics fields.', screenCode: 'TRADE_BLOTTER', isActive: true },
  { profileId: 2, profileCode: 'TRADE_BLOTTER_CREDIT_MGR', profileName: 'Credit Manager',          description: 'Can view commercial terms; cannot edit price or quantity.', screenCode: 'TRADE_BLOTTER', isActive: true },
  { profileId: 3, profileCode: 'TRADE_BLOTTER_VIEWER',     profileName: 'Read-Only Viewer',        description: 'View-only access to trade data. Cannot edit any field.', screenCode: 'TRADE_BLOTTER', isActive: true },
];

// Per-profile field rules: profileId + fieldId → AccessLevel
// Profile 1 (Trader): full EDIT on everything
// Profile 2 (Credit Mgr): VIEW on price/quantity, HIDDEN on logistics details, EDIT on rest
// Profile 3 (Viewer): VIEW on everything
const profileRulesStore: unknown[] = (() => {
  const reg = fieldRegistryStore as Array<{ fieldId: number; fieldKey: string }>;
  const rules: Array<{ profileId: number; fieldId: number; fieldPermission: string }> = [];
  reg.forEach(({ fieldId, fieldKey }) => {
    // Profile 1 — Trader: EDIT everything
    rules.push({ profileId: 1, fieldId, fieldPermission: 'EDIT' });
    // Profile 2 — Credit Manager
    let perm2 = 'EDIT';
    if (['price', 'quantity', 'uomCode', 'currencyCode'].includes(fieldKey)) perm2 = 'VIEW';
    if (fieldKey.startsWith('oilDetail.') || fieldKey.startsWith('gasDetail.') ||
        fieldKey.startsWith('powerDetail.') || fieldKey.startsWith('lngDetail.') ||
        fieldKey.startsWith('metalsDetail.') || fieldKey.startsWith('agriDetail.') ||
        fieldKey.startsWith('freightDetail.')) perm2 = 'HIDDEN';
    rules.push({ profileId: 2, fieldId, fieldPermission: perm2 });
    // Profile 3 — Read-Only Viewer: VIEW everything
    rules.push({ profileId: 3, fieldId, fieldPermission: 'VIEW' });
  });
  return rules;
})();

export const etrmHandlers = [
  // Markets (trading markets)
  ...crudHandlers('markets', marketsStore as Array<Record<string, unknown>>, 'marketId'),
  // Market-Product sub-resource
  http.get(`${API}/markets/:id/products`, ({ params }) => {
    const marketId = Number(params.id);
    return HttpResponse.json((marketProductsStore as Array<Record<string, unknown>>).filter((mp) => mp['marketId'] === marketId));
  }),
  http.post(`${API}/markets/:id/products`, async ({ params, request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const product = (productsStore as Array<Record<string, unknown>>).find((p) => p['productId'] === input['productId']);
    const row = {
      ...input, marketProductId: nextId(), marketId: Number(params.id), createdAt: now(),
      productCode: product?.['productCode'] ?? null, productName: product?.['productName'] ?? null,
    };
    marketProductsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.patch(`${API}/markets/:id/products/:mpId/deactivate`, ({ params }) => {
    const idx = (marketProductsStore as Array<Record<string, unknown>>).findIndex((mp) => mp.marketProductId === Number(params.mpId));
    if (idx >= 0) (marketProductsStore as Array<Record<string, unknown>>)[idx].isActive = false;
    return new HttpResponse(null, { status: 204 });
  }),
  // Market-Product-Period sub-resource
  http.get(`${API}/market-products/:mpId/periods`, ({ params }) => {
    const mpId = Number(params.mpId);
    return HttpResponse.json((marketProductPeriodsStore as Array<Record<string, unknown>>).filter((p) => p['marketProductId'] === mpId));
  }),
  http.post(`${API}/market-products/:mpId/periods`, async ({ params, request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const row = { ...input, mppId: nextId(), marketProductId: Number(params.mpId), isActive: true };
    marketProductPeriodsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.patch(`${API}/market-product-periods/:id/deactivate`, ({ params }) => {
    const idx = (marketProductPeriodsStore as Array<Record<string, unknown>>).findIndex((p) => p.mppId === Number(params.id));
    if (idx >= 0) (marketProductPeriodsStore as Array<Record<string, unknown>>)[idx].isActive = false;
    return new HttpResponse(null, { status: 204 });
  }),
  // Market-Product-Source sub-resource
  http.get(`${API}/market-products/:mpId/sources`, ({ params }) => {
    const mpId = Number(params.mpId);
    return HttpResponse.json((marketProductSourcesStore as Array<Record<string, unknown>>).filter((s) => s['marketProductId'] === mpId));
  }),

  // Price Sources
  ...crudHandlers('price-sources', priceSourcesStore as Array<Record<string, unknown>>, 'priceSourceId'),
  // Price Index Source sub-resource
  http.get(`${API}/price-sources/:id/index-links`, ({ params }) => {
    const sourceId = Number(params.id);
    return HttpResponse.json((priceIndexSourcesStore as Array<Record<string, unknown>>).filter((p) => p['priceSourceId'] === sourceId));
  }),
  http.get(`${API}/price-index-sources`, () => HttpResponse.json(priceIndexSourcesStore)),
  http.post(`${API}/price-index-sources`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const row = { ...input, pisId: nextId(), isActive: true, createdAt: now() };
    priceIndexSourcesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/price-index-sources/:id`, async ({ params, request }) => {
    const idx = (priceIndexSourcesStore as Array<Record<string, unknown>>).findIndex((p) => p.pisId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Price index source ${params.id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    (priceIndexSourcesStore as Array<Record<string, unknown>>)[idx] = { ...(priceIndexSourcesStore as Array<Record<string, unknown>>)[idx], ...input };
    return HttpResponse.json((priceIndexSourcesStore as Array<Record<string, unknown>>)[idx]);
  }),
  http.patch(`${API}/price-index-sources/:id/deactivate`, ({ params }) => {
    const idx = (priceIndexSourcesStore as Array<Record<string, unknown>>).findIndex((p) => p.pisId === Number(params.id));
    if (idx >= 0) (priceIndexSourcesStore as Array<Record<string, unknown>>)[idx].isActive = false;
    return new HttpResponse(null, { status: 204 });
  }),

  ...crudHandlers('desks', desksStore as Array<Record<string, unknown>>, 'deskId'),
  ...crudHandlers('books', booksStore as Array<Record<string, unknown>>, 'bookId'),
  ...crudHandlers('traders', tradersStore as Array<Record<string, unknown>>, 'traderId'),
  ...crudHandlers('products', productsStore as Array<Record<string, unknown>>, 'productId'),
  // Product-PriceIndex sub-resource
  http.get(`${API}/products/:id/price-indices`, ({ params }) => {
    const productId = Number(params.id);
    return HttpResponse.json((productPriceIndexStore as Array<Record<string, unknown>>).filter((r) => r['productId'] === productId));
  }),
  http.post(`${API}/products/:id/price-indices`, async ({ params, request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const priceIndexId = Number(input['priceIndexId']);
    const idx = (priceIndicesStore as Array<Record<string, unknown>>).find((pi) => pi['priceIndexId'] === priceIndexId);
    if (!idx) return problem(404, 'Not Found', `Price index ${priceIndexId} not found.`);
    const row: Record<string, unknown> = {
      ...input,
      productIndexId: nextId(),
      productId: Number(params.id),
      indexCode: idx['indexCode'],
      indexName: idx['indexName'],
      publicationSource: idx['publicationSource'],
      currencyCode: idx['currencyCode'],
      uomCode: idx['uomCode'],
      isActive: true,
    };
    productPriceIndexStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.delete(`${API}/products/:id/price-indices/:linkId`, ({ params }) => {
    const linkId = Number(params.linkId);
    const idx = (productPriceIndexStore as Array<Record<string, unknown>>).findIndex((r) => r['productIndexId'] === linkId);
    if (idx >= 0) productPriceIndexStore.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  // Product-Market sub-resource (read-only — joined view from marketProductsStore)
  http.get(`${API}/products/:id/markets`, ({ params }) => {
    const productId = Number(params.id);
    const links = (marketProductsStore as Array<Record<string, unknown>>).filter((mp) => mp['productId'] === productId);
    const joined = links.map((mp) => {
      const market = (marketsStore as Array<Record<string, unknown>>).find((m) => m['marketId'] === mp['marketId']) ?? {};
      return {
        marketProductId: mp['marketProductId'],
        marketId: mp['marketId'],
        marketCode: market['marketCode'] ?? null,
        marketName: market['marketName'] ?? null,
        ticker: mp['ticker'] ?? null,
        currencyCode: mp['currencyCode'] ?? market['currencyCode'] ?? null,
        uomCode: mp['uomCode'] ?? null,
        lotSize: mp['lotSize'] ?? null,
        pricePrecision: mp['pricePrecision'] ?? null,
        settlementType: mp['settlementType'] ?? null,
        lastTradingDayOffset: mp['lastTradingDayOffset'] ?? null,
        listedDate: mp['listedDate'] ?? null,
        delistedDate: mp['delistedDate'] ?? null,
        isActive: mp['isActive'] ?? true,
      };
    });
    return HttpResponse.json(joined);
  }),
  // ── Spec templates ────────────────────────────────────────────────────────────
  http.get(`${API}/products/:id/spec-templates`, ({ params }) => {
    const productId = Number(params.id);
    const rows = (productSpecTemplateStore as Array<Record<string, unknown>>).filter((t) => t['productId'] === productId);
    return HttpResponse.json(rows);
  }),
  http.post(`${API}/products/:id/spec-templates`, async ({ params, request }) => {
    const productId = Number(params.id);
    const body = await request.json() as Record<string, unknown>;
    const next = { templateId: Date.now(), productId, createdAt: new Date().toISOString(), isActive: true, ...body };
    (productSpecTemplateStore as Array<Record<string, unknown>>).push(next);
    return HttpResponse.json(next, { status: 201 });
  }),
  http.put(`${API}/products/:id/spec-templates/:templateId`, async ({ params, request }) => {
    const templateId = Number(params.templateId);
    const store = productSpecTemplateStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((t) => t['templateId'] === templateId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    store[idx] = { ...store[idx], ...body };
    return HttpResponse.json(store[idx]);
  }),

  // ── Spec values ───────────────────────────────────────────────────────────────
  http.get(`${API}/spec-templates/:id/values`, ({ params }) => {
    const templateId = Number(params.id);
    const rows = (productSpecValueStore as Array<Record<string, unknown>>).filter((v) => v['templateId'] === templateId);
    return HttpResponse.json(rows);
  }),
  http.post(`${API}/spec-templates/:id/values`, async ({ params, request }) => {
    const templateId = Number(params.id);
    const body = await request.json() as Record<string, unknown>;
    const next = { specValueId: Date.now(), templateId, ...body };
    (productSpecValueStore as Array<Record<string, unknown>>).push(next);
    return HttpResponse.json(next, { status: 201 });
  }),
  http.put(`${API}/spec-templates/:templateId/values/:valueId`, async ({ params, request }) => {
    const valueId = Number(params.valueId);
    const store = productSpecValueStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((v) => v['specValueId'] === valueId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    store[idx] = { ...store[idx], ...body };
    return HttpResponse.json(store[idx]);
  }),
  http.delete(`${API}/spec-templates/:templateId/values/:valueId`, ({ params }) => {
    const valueId = Number(params.valueId);
    const store = productSpecValueStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((v) => v['specValueId'] === valueId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    store.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Blend components ──────────────────────────────────────────────────────────
  http.get(`${API}/products/:id/blend-components`, ({ params }) => {
    const productId = Number(params.id);
    const rows = (productBlendComponentStore as Array<Record<string, unknown>>).filter((c) => c['parentProductId'] === productId);
    return HttpResponse.json(rows);
  }),
  http.post(`${API}/products/:id/blend-components`, async ({ params, request }) => {
    const parentProductId = Number(params.id);
    const body = await request.json() as Record<string, unknown>;
    const comp = (productsStore as Array<Record<string, unknown>>).find((p) => p['productId'] === body['componentProductId']);
    const next = {
      blendComponentId: Date.now(),
      parentProductId,
      componentCode: comp?.['productCode'] ?? null,
      componentName: comp?.['productName'] ?? null,
      isActive: true,
      ...body,
    };
    (productBlendComponentStore as Array<Record<string, unknown>>).push(next);
    return HttpResponse.json(next, { status: 201 });
  }),
  http.put(`${API}/products/:id/blend-components/:blendComponentId`, async ({ params, request }) => {
    const blendComponentId = Number(params.blendComponentId);
    const store = productBlendComponentStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((c) => c['blendComponentId'] === blendComponentId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    const comp = (productsStore as Array<Record<string, unknown>>).find((p) => p['productId'] === body['componentProductId']);
    store[idx] = {
      ...store[idx],
      ...body,
      componentCode: comp?.['productCode'] ?? store[idx]['componentCode'],
      componentName: comp?.['productName'] ?? store[idx]['componentName'],
    };
    return HttpResponse.json(store[idx]);
  }),
  http.delete(`${API}/products/:id/blend-components/:blendComponentId`, ({ params }) => {
    const blendComponentId = Number(params.blendComponentId);
    const store = productBlendComponentStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((c) => c['blendComponentId'] === blendComponentId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    store.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Reporting groups ──────────────────────────────────────────────────────────
  http.get(`${API}/products/:id/reporting-groups`, ({ params }) => {
    const productId = Number(params.id);
    const rows = (productReportingGroupStore as Array<Record<string, unknown>>).filter((r) => r['productId'] === productId);
    return HttpResponse.json(rows);
  }),
  http.post(`${API}/products/:id/reporting-groups`, async ({ params, request }) => {
    const productId = Number(params.id);
    const body = await request.json() as Record<string, unknown>;
    const meta = REPORTING_GROUP_LOOKUP[body['reportingGroupId'] as number];
    const store = productReportingGroupStore as Array<Record<string, unknown>>;
    // One reporting_group per classification axis per product (V64) — a
    // product can have only one POSITION group, one VAR group, etc.
    const dup = store.some((r) => r['productId'] === productId && r['classificationTypeId'] === meta?.classificationTypeId);
    if (dup) {
      return HttpResponse.json({ message: 'This product already has a reporting group assigned for that classification.' }, { status: 409 });
    }
    const next = {
      productReportingGroupId: Date.now(),
      productId,
      ...body,
      ...meta,
    };
    store.push(next);
    return HttpResponse.json(next, { status: 201 });
  }),
  http.delete(`${API}/products/:id/reporting-groups/:productReportingGroupId`, ({ params }) => {
    const productReportingGroupId = Number(params.productReportingGroupId);
    const store = productReportingGroupStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((r) => r['productReportingGroupId'] === productReportingGroupId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    store.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  ...crudHandlers('price-indices', priceIndicesStore as Array<Record<string, unknown>>, 'priceIndexId'),
  ...crudHandlers('exchanges', exchangesStore as Array<Record<string, unknown>>, 'exchangeId'),
  ...crudHandlers('locations', locationsStore as Array<Record<string, unknown>>, 'locationId'),
  ...crudHandlers('vessels', vesselsStore as Array<Record<string, unknown>>, 'vesselId'),
  ...crudHandlers('pipelines', pipelinesStore as Array<Record<string, unknown>>, 'pipelineId'),
  ...crudHandlers('holiday-calendars', holidayCalendarsStore as Array<Record<string, unknown>>, 'calendarId'),
  ...crudHandlers('periods', periodsStore as Array<Record<string, unknown>>, 'periodId'),
  ...crudHandlers('pricing-rules', pricingRulesStore as Array<Record<string, unknown>>, 'pricingRuleId'),

  // Holiday dates sub-resource
  http.get(`${API}/holiday-calendars/:id/holidays`, ({ params }) => {
    const calendarId = Number(params.id);
    return HttpResponse.json(holidayDates[calendarId] ?? []);
  }),

  // Trades
  http.get(`${API}/trades`, ({ request }) => {
    const url = new URL(request.url);
    const commodityType = url.searchParams.get('commodityType');
    const status = url.searchParams.get('status');
    const direction = url.searchParams.get('direction');
    let results = (tradesStore as Array<Record<string, unknown>>).slice();
    if (commodityType) results = results.filter((t: Record<string, unknown>) => t['commodityType'] === commodityType);
    if (status) results = results.filter((t: Record<string, unknown>) => t['status'] === status);
    if (direction) results = results.filter((t: Record<string, unknown>) => t['direction'] === direction);
    return HttpResponse.json(results);
  }),
  http.get(`${API}/trades/:id`, ({ params }) => {
    const trade = (tradesStore as Array<Record<string, unknown>>).find((t) => t.tradeId === Number(params.id));
    if (!trade) return problem(404, 'Not Found', `Trade ${params.id} not found.`);
    return HttpResponse.json(trade);
  }),
  http.post(`${API}/trades`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const year = new Date().getFullYear();
    const seq = String(tradesStore.length + 1).padStart(5, '0');
    const row = {
      ...denormalizeTrade(input),
      tradeId: nextId(),
      tradeReference: `TRD-${year}-${seq}`,
      amendmentNumber: 0,
      isLatestVersion: true,
      orderCount: 0,
      parentTradeId: null,
      createdAt: now(),
      updatedAt: now(),
    };
    tradesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/trades/:id`, async ({ params, request }) => {
    const idx = (tradesStore as Array<Record<string, unknown>>).findIndex((t) => t.tradeId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Trade ${params.id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    (tradesStore as Array<Record<string, unknown>>)[idx] = {
      ...(tradesStore as Array<Record<string, unknown>>)[idx],
      ...denormalizeTrade(input),
      updatedAt: now(),
    };
    return HttpResponse.json((tradesStore as Array<Record<string, unknown>>)[idx]);
  }),
  http.patch(`${API}/trades/:id/cancel`, ({ params }) => {
    const idx = (tradesStore as Array<Record<string, unknown>>).findIndex((t) => t.tradeId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Trade ${params.id} not found.`);
    (tradesStore as Array<Record<string, unknown>>)[idx].status = 'CANCELLED';
    (tradesStore as Array<Record<string, unknown>>)[idx].updatedAt = now();
    return HttpResponse.json((tradesStore as Array<Record<string, unknown>>)[idx]);
  }),
  http.patch(`${API}/trades/:id/confirm`, ({ params }) => {
    const idx = (tradesStore as Array<Record<string, unknown>>).findIndex((t) => t.tradeId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Trade ${params.id} not found.`);
    (tradesStore as Array<Record<string, unknown>>)[idx].status = 'CONFIRMED';
    (tradesStore as Array<Record<string, unknown>>)[idx].updatedAt = now();
    return HttpResponse.json((tradesStore as Array<Record<string, unknown>>)[idx]);
  }),

  // Trade Orders
  http.get(`${API}/trade-orders`, ({ request }) => {
    const tradeId = Number(new URL(request.url).searchParams.get('tradeId'));
    const rows = (tradeOrdersStore as Array<Record<string, unknown>>).filter((o) => o['tradeId'] === tradeId);
    return HttpResponse.json(rows);
  }),
  http.post(`${API}/trade-orders`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const tradeId = input['tradeId'] as number;
    const existingOrders = (tradeOrdersStore as Array<Record<string, unknown>>).filter((o) => o['tradeId'] === tradeId);
    const nextSeq = existingOrders.length + 1;
    const trade = (tradesStore as Array<Record<string, unknown>>).find((t) => t['tradeId'] === tradeId);
    const ref = trade ? `${String(trade['tradeReference'])}-${String(nextSeq).padStart(2, '0')}` : `ORD-${orderIdSeq}`;
    const row = { ...input, orderId: orderIdSeq++, orderSequence: nextSeq, orderReference: ref, createdAt: now(), updatedAt: now() };
    tradeOrdersStore.push(row);
    // increment orderCount on parent trade
    const tIdx = (tradesStore as Array<Record<string, unknown>>).findIndex((t) => t['tradeId'] === tradeId);
    if (tIdx !== -1) (tradesStore as Array<Record<string, unknown>>)[tIdx]['orderCount'] = nextSeq;
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/trade-orders/:id`, async ({ params, request }) => {
    const idx = (tradeOrdersStore as Array<Record<string, unknown>>).findIndex((o) => o['orderId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Order ${params.id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    (tradeOrdersStore as Array<Record<string, unknown>>)[idx] = { ...(tradeOrdersStore as Array<Record<string, unknown>>)[idx], ...input, updatedAt: now() };
    return HttpResponse.json((tradeOrdersStore as Array<Record<string, unknown>>)[idx]);
  }),
  http.patch(`${API}/trade-orders/:id/cancel`, ({ params }) => {
    const idx = (tradeOrdersStore as Array<Record<string, unknown>>).findIndex((o) => o['orderId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Order ${params.id} not found.`);
    (tradeOrdersStore as Array<Record<string, unknown>>)[idx]['status'] = 'CANCELLED';
    (tradeOrdersStore as Array<Record<string, unknown>>)[idx]['updatedAt'] = now();
    return HttpResponse.json((tradeOrdersStore as Array<Record<string, unknown>>)[idx]);
  }),
  http.patch(`${API}/trade-orders/:id/confirm`, ({ params }) => {
    const idx = (tradeOrdersStore as Array<Record<string, unknown>>).findIndex((o) => o['orderId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Order ${params.id} not found.`);
    (tradeOrdersStore as Array<Record<string, unknown>>)[idx]['status'] = 'CONFIRMED';
    (tradeOrdersStore as Array<Record<string, unknown>>)[idx]['updatedAt'] = now();
    return HttpResponse.json((tradeOrdersStore as Array<Record<string, unknown>>)[idx]);
  }),

  // Trade Items
  http.get(`${API}/trade-items`, ({ request }) => {
    const orderId = Number(new URL(request.url).searchParams.get('orderId'));
    const rows = (tradeItemsStore as Array<Record<string, unknown>>).filter((i) => i['orderId'] === orderId);
    return HttpResponse.json(rows);
  }),
  http.post(`${API}/trade-items`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const orderId = input['orderId'] as number;
    const existingItems = (tradeItemsStore as Array<Record<string, unknown>>).filter((i) => i['orderId'] === orderId);
    const row = { ...input, itemId: itemIdSeq++, itemSequence: existingItems.length + 1, createdAt: now() };
    tradeItemsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/trade-items/:id`, async ({ params, request }) => {
    const idx = (tradeItemsStore as Array<Record<string, unknown>>).findIndex((i) => i['itemId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Item ${params.id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    (tradeItemsStore as Array<Record<string, unknown>>)[idx] = { ...(tradeItemsStore as Array<Record<string, unknown>>)[idx], ...input };
    return HttpResponse.json((tradeItemsStore as Array<Record<string, unknown>>)[idx]);
  }),
  http.delete(`${API}/trade-items/:id`, ({ params }) => {
    const idx = (tradeItemsStore as Array<Record<string, unknown>>).findIndex((i) => i['itemId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Item ${params.id} not found.`);
    tradeItemsStore.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // New master data domains
  ...crudHandlers('admin/users', systemUsersStore as Array<Record<string, unknown>>, 'userId'),
  ...crudHandlers('payment-terms', paymentTermsStore as Array<Record<string, unknown>>, 'paymentTermId'),
  ...crudHandlers('payment-methods', paymentMethodsStore as Array<Record<string, unknown>>, 'paymentMethodId'),
  ...crudHandlers('gtcs', gtcsStore as Array<Record<string, unknown>>, 'gtcId'),
  ...crudHandlers('broker-fee-agreements', brokerFeeAgreementsStore as Array<Record<string, unknown>>, 'agreementId'),
  ...crudHandlers('trucks', trucksStore as Array<Record<string, unknown>>, 'vehicleId'),
  ...crudHandlers('storage', storageStore as Array<Record<string, unknown>>, 'storageId'),
  ...crudHandlers('currencies', currenciesStore as Array<Record<string, unknown>>, 'currencyId'),
  ...crudHandlers('uom', uomStore as Array<Record<string, unknown>>, 'uomId'),

  // ── UoM Conversions ──────────────────────────────────────────────────────────
  http.get(`${API}/uom-conversions`, ({ request }) => {
    const url = new URL(request.url);
    const commodityType = url.searchParams.get('commodityType');
    const store = uomConversionStore as Array<Record<string, unknown>>;
    const result = commodityType
      ? store.filter((r) => r['commodityType'] === commodityType || r['commodityType'] === null)
      : store;
    return HttpResponse.json(result);
  }),
  http.post(`${API}/uom-conversions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const store = uomConversionStore as Array<Record<string, unknown>>;
    const maxId = store.reduce((m, r) => Math.max(m, r['conversionId'] as number), 0);
    const row = { ...body, conversionId: maxId + 1 };
    store.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/uom-conversions/:id`, async ({ request, params }) => {
    const id = Number(params['id']);
    const body = (await request.json()) as Record<string, unknown>;
    const store = uomConversionStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((r) => r['conversionId'] === id);
    if (idx === -1) return HttpResponse.json({ title: 'Not Found' }, { status: 404 });
    store[idx] = { ...store[idx], ...body, conversionId: id };
    return HttpResponse.json(store[idx]);
  }),
  http.delete(`${API}/uom-conversions/:id`, ({ params }) => {
    const id = Number(params['id']);
    const store = uomConversionStore as Array<Record<string, unknown>>;
    const idx = store.findIndex((r) => r['conversionId'] === id);
    if (idx === -1) return HttpResponse.json({ title: 'Not Found' }, { status: 404 });
    store.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Spec Parameter Catalog ────────────────────────────────────────────────────
  http.get(`${API}/spec-parameters`, ({ request }) => {
    const url = new URL(request.url);
    const commodityType = url.searchParams.get('commodityType');
    const store = specParameterStore as Array<Record<string, unknown>>;
    const result = commodityType
      ? store.filter((r) => r['commodityType'] === commodityType)
      : store;
    return HttpResponse.json(result);
  }),

  ...crudHandlers('countries', countriesStore as Array<Record<string, unknown>>, 'countryCode'),
  http.get(`${API}/incoterms-ref`, () => HttpResponse.json(incotermsRefStore)),
  ...crudHandlers('incoterms-ref', incotermsRefStore as Array<Record<string, unknown>>, 'incotermId'),

  // Brokers — full CRUD (also used as reference data dropdown in trade capture)
  ...crudHandlers('brokers', brokersStore as Array<Record<string, unknown>>, 'brokerId'),

  http.get(`${API}/counterparties`, () => HttpResponse.json(counterpartiesRef)),
  http.get(`${API}/legal-entities`, () => HttpResponse.json(legalEntitiesRef)),

  // Commodity → allowed instrument types config (read-only; only changed via DB migration)
  http.get(`${API}/commodity-instrument-map`, () => HttpResponse.json({
    OIL:           ['PHYSICAL','FUTURES','FORWARD','SWAP_FIXED_FLOAT','SWAP_FLOAT_FLOAT','OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_ASIAN','OPTION_OTC_EUROPEAN','STORAGE_AGREEMENT','TRANSPORT_AGREEMENT'],
    GAS:           ['PHYSICAL','FUTURES','FORWARD','SWAP_FIXED_FLOAT','SWAP_FLOAT_FLOAT','OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_ASIAN','OPTION_OTC_EUROPEAN','STORAGE_AGREEMENT','TRANSPORT_AGREEMENT'],
    POWER:         ['PHYSICAL','FUTURES','FORWARD','SWAP_FIXED_FLOAT','SWAP_FLOAT_FLOAT','OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_EUROPEAN','STORAGE_AGREEMENT'],
    LNG:           ['PHYSICAL','FUTURES','FORWARD','SWAP_FIXED_FLOAT','SWAP_FLOAT_FLOAT','OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_ASIAN','OPTION_OTC_EUROPEAN','STORAGE_AGREEMENT','TRANSPORT_AGREEMENT'],
    AGRICULTURAL:  ['PHYSICAL','FUTURES','FORWARD','SWAP_FIXED_FLOAT','OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_EUROPEAN','STORAGE_AGREEMENT','TRANSPORT_AGREEMENT'],
    METALS:        ['PHYSICAL','FUTURES','FORWARD','SWAP_FIXED_FLOAT','SWAP_FLOAT_FLOAT','OPTION_LISTED','OPTION_OTC_AMERICAN','OPTION_OTC_ASIAN','OPTION_OTC_EUROPEAN','STORAGE_AGREEMENT','TRANSPORT_AGREEMENT'],
    FREIGHT:       ['PHYSICAL','FORWARD','SWAP_FIXED_FLOAT','TRANSPORT_AGREEMENT','OPTION_OTC_EUROPEAN'],
    RINS:          ['CERTIFICATE_TRANSFER','FUTURES','FORWARD','OPTION_LISTED','OPTION_OTC_EUROPEAN'],
    ENVIRONMENTAL: ['CERTIFICATE_TRANSFER','FUTURES','FORWARD','OPTION_LISTED','OPTION_OTC_EUROPEAN'],
  })),
  http.get(`${API}/incoterms`, () => HttpResponse.json([
    { incotermId: 1, incotermCode: 'FOB', incotermName: 'Free On Board', applicableModes: 'SEA' },
    { incotermId: 2, incotermCode: 'CIF', incotermName: 'Cost Insurance Freight', applicableModes: 'SEA' },
    { incotermId: 3, incotermCode: 'CFR', incotermName: 'Cost and Freight', applicableModes: 'SEA' },
    { incotermId: 4, incotermCode: 'DES', incotermName: 'Delivered Ex Ship', applicableModes: 'SEA' },
    { incotermId: 5, incotermCode: 'DAP', incotermName: 'Delivered at Place', applicableModes: 'ALL' },
    { incotermId: 6, incotermCode: 'FCA', incotermName: 'Free Carrier', applicableModes: 'ALL' },
    { incotermId: 7, incotermCode: 'EXW', incotermName: 'Ex Works', applicableModes: 'ALL' },
  ])),

  // ─── FIELD-LEVEL PERMISSIONS ────────────────────────────────────────────────

  // Field registry — one row per configurable field on TRADE_BLOTTER
  // Demonstrates all three permission states: EDIT, VIEW (locked), HIDDEN
  http.get(`${API}/permissions/effective-fields`, ({ request }) => {
    const url = new URL(request.url);
    const tradeStatus = url.searchParams.get('tradeStatus');
    const hasInvoice  = url.searchParams.get('hasInvoice') === 'true';

    // All fields default to EDIT
    const permissions: Record<string, string> = {
      tradeDate: 'EDIT', executionDatetime: 'EDIT', commodityType: 'EDIT',
      tradeType: 'EDIT', direction: 'EDIT', status: 'EDIT', notes: 'EDIT',
      contractType: 'EDIT', riskStartDate: 'EDIT', riskEndDate: 'EDIT',
      counterpartyId: 'EDIT', traderId: 'EDIT', bookId: 'EDIT', legalEntityId: 'EDIT',
      productId: 'EDIT', marketId: 'EDIT', pricingRuleId: 'EDIT', periodCode: 'EDIT',
      quantity: 'EDIT', uomCode: 'EDIT', price: 'EDIT', currencyCode: 'EDIT', settlementType: 'EDIT',
      incotermCode: 'EDIT', deliveryLocationCode: 'EDIT',
      brokerId: 'EDIT', brokerFeeType: 'EDIT', brokerFee: 'EDIT', brokerFeeCurrencyCode: 'EDIT',
      creditTermCode: 'EDIT', creditApprovalStatus: 'EDIT', creditLimitUsed: 'EDIT', gtcReference: 'EDIT',
      'oilDetail.crudeGrade': 'EDIT', 'oilDetail.apiGravity': 'EDIT', 'oilDetail.sulphurPct': 'EDIT',
      'oilDetail.motType': 'EDIT', 'oilDetail.loadLocationCode': 'EDIT', 'oilDetail.dischargeLocationCode': 'EDIT',
      'oilDetail.titleTransferLocationCode': 'EDIT',
      'oilDetail.vesselName': 'EDIT', 'oilDetail.laycanStart': 'EDIT', 'oilDetail.laycanEnd': 'EDIT',
      'oilDetail.blDate': 'EDIT', 'oilDetail.norsTenderedDate': 'EDIT', 'oilDetail.codDate': 'EDIT',
      'oilDetail.pipelineId': 'EDIT',
      'gasDetail.deliveryHub': 'EDIT', 'gasDetail.gasDeliveryStart': 'EDIT', 'gasDetail.gasDeliveryEnd': 'EDIT',
      'gasDetail.swingPct': 'EDIT', 'gasDetail.gasDayType': 'EDIT', 'gasDetail.nominationType': 'EDIT',
      'powerDetail.loadType': 'EDIT', 'powerDetail.mwCapacity': 'EDIT', 'powerDetail.mwhVolume': 'EDIT',
      'powerDetail.gridNodeCode': 'EDIT', 'powerDetail.interconnector': 'EDIT',
      'powerDetail.deliveryStart': 'EDIT', 'powerDetail.deliveryEnd': 'EDIT',
      'lngDetail.loadTerminalCode': 'EDIT', 'lngDetail.dischargeTerminalCode': 'EDIT',
      'lngDetail.titleTransferLocationCode': 'EDIT', 'lngDetail.motType': 'EDIT',
      'lngDetail.cargoVolumeMmbtu': 'EDIT', 'lngDetail.priceBasis': 'EDIT',
      'metalsDetail.metalGrade': 'EDIT', 'metalsDetail.shape': 'EDIT',
      'metalsDetail.motType': 'EDIT', 'metalsDetail.lmeDate': 'EDIT',
      'metalsDetail.warehouseLocationCode': 'EDIT', 'metalsDetail.titleTransferLocationCode': 'EDIT',
      'metalsDetail.brand': 'EDIT',
      'agriDetail.cropYear': 'EDIT', 'agriDetail.gradeQuality': 'EDIT',
      'agriDetail.originCountry': 'EDIT', 'agriDetail.deliveryBasis': 'EDIT', 'agriDetail.motType': 'EDIT',
      'freightDetail.vesselType': 'EDIT', 'freightDetail.charterType': 'EDIT', 'freightDetail.routeCode': 'EDIT',
      'freightDetail.loadLocationCode': 'EDIT', 'freightDetail.dischargeLocationCode': 'EDIT',
      'freightDetail.cargoSizeMT': 'EDIT', 'freightDetail.freightRateType': 'EDIT', 'freightDetail.freightRate': 'EDIT',
      'freightDetail.laycanStart': 'EDIT', 'freightDetail.laycanEnd': 'EDIT',
    };

    const lockedFields: Record<string, string> = {};

    // Layer 1: simulate lifecycle locks when trade is confirmed/closed
    const lockedStatuses = ['CONFIRMED', 'MATURED', 'CLOSED', 'CANCELLED'];
    if (tradeStatus && lockedStatuses.includes(tradeStatus)) {
      const commercialFields = [
        'counterpartyId', 'traderId', 'bookId', 'legalEntityId', 'commodityType',
        'tradeType', 'direction', 'quantity', 'uomCode', 'price', 'currencyCode',
        'incotermCode', 'periodCode', 'settlementType',
        'contractType', 'riskStartDate', 'riskEndDate',
        'brokerId', 'brokerFeeType', 'brokerFee', 'brokerFeeCurrencyCode',
        'creditTermCode', 'gtcReference',
      ];
      const reason = tradeStatus === 'CANCELLED'
        ? 'Cancelled trade is read-only'
        : 'Trade is confirmed — commercial terms are locked';
      commercialFields.forEach((k) => { permissions[k] = 'VIEW'; lockedFields[k] = reason; });
      if (['CANCELLED', 'MATURED', 'CLOSED'].includes(tradeStatus)) {
        Object.keys(permissions).forEach((k) => { permissions[k] = 'VIEW'; lockedFields[k] = reason; });
      }
    }
    if (hasInvoice) {
      ['quantity', 'price', 'currencyCode'].forEach((k) => {
        permissions[k] = 'VIEW';
        lockedFields[k] = 'Invoice issued — pricing fields are locked';
      });
    }

    return HttpResponse.json({ screenCode: 'TRADE_BLOTTER', permissions, lockedFields, fieldRegistry: [] });
  }),

  http.get(`${API}/permissions/profiles`, () => HttpResponse.json(profileStore)),

  // ── Field permission profile detail + rules ───────────────────────────────────
  http.get(`${API}/permissions/profiles/:id`, ({ params }) => {
    const profileId = Number(params.id);
    const profile = (profileStore as Array<Record<string, unknown>>).find((p) => p['profileId'] === profileId);
    if (!profile) return new HttpResponse(null, { status: 404 });
    const rules = (profileRulesStore as Array<Record<string, unknown>>)
      .filter((r) => r['profileId'] === profileId)
      .map((r) => {
        const field = (fieldRegistryStore as Array<Record<string, unknown>>).find((f) => f['fieldId'] === r['fieldId']);
        return { ...field, fieldPermission: r['fieldPermission'] };
      });
    return HttpResponse.json({ ...profile, rules });
  }),

  // Positions
  http.get(`${API}/positions`, ({ request }) => {
    const url = new URL(request.url);
    const commodityType = url.searchParams.get('commodityType');
    const bookId = url.searchParams.get('bookId');
    const periodCode = url.searchParams.get('periodCode');
    let results = (positionStore as Array<Record<string, unknown>>).slice();
    if (commodityType) results = results.filter((p) => p['commodityType'] === commodityType);
    if (bookId) results = results.filter((p) => String(p['bookId']) === bookId);
    if (periodCode) results = results.filter((p) => p['periodCode'] === periodCode);
    return HttpResponse.json(results);
  }),

  // ─── CREDIT — Margin Agreements ──────────────────────────────────────────────
  ...crudHandlers('credit/margin-agreements', marginAgreementsStore as Array<Record<string, unknown>>, 'marginAgreementId'),

  // ─── CREDIT — Bank Guarantees ─────────────────────────────────────────────────
  http.post(`${API}/credit/bank-guarantees`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (bankGuaranteesStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['bgId'])), 0);
    const row = { ...computeBankGuarantee(input), bgId: maxId + 1, createdAt: now(), updatedAt: now() };
    bankGuaranteesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/credit/bank-guarantees/:id`, async ({ params, request }) => {
    const s = bankGuaranteesStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['bgId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Bank guarantee ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeBankGuarantee({ ...s[idx], ...input }), updatedAt: now() };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('credit/bank-guarantees', bankGuaranteesStore as Array<Record<string, unknown>>, 'bgId'),

  // ─── CREDIT — Insurance Policies ──────────────────────────────────────────────
  http.post(`${API}/credit/insurance-policies`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (insurancePoliciesStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['policyId'])), 0);
    const row = { ...computeInsurancePolicy(input), policyId: maxId + 1, createdAt: now(), updatedAt: now() };
    insurancePoliciesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/credit/insurance-policies/:id`, async ({ params, request }) => {
    const s = insurancePoliciesStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['policyId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Insurance policy ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeInsurancePolicy({ ...s[idx], ...input }), updatedAt: now() };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('credit/insurance-policies', insurancePoliciesStore as Array<Record<string, unknown>>, 'policyId'),

  // ─── CREDIT — Margin Accounts ─────────────────────────────────────────────────
  http.post(`${API}/credit/margin-accounts`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (marginAccountsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['marginAccountId'])), 0);
    const row = { ...computeMarginAccount(input), marginAccountId: maxId + 1, createdAt: now() };
    marginAccountsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/credit/margin-accounts/:id`, async ({ params, request }) => {
    const s = marginAccountsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['marginAccountId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Margin account ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeMarginAccount({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('credit/margin-accounts', marginAccountsStore as Array<Record<string, unknown>>, 'marginAccountId'),

  // ─── CREDIT — Collateral ──────────────────────────────────────────────────────
  http.post(`${API}/credit/collateral`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (collateralStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['collateralId'])), 0);
    const row = { ...computeCollateral(input), collateralId: maxId + 1, createdAt: now(), updatedAt: now() };
    collateralStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/credit/collateral/:id`, async ({ params, request }) => {
    const s = collateralStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['collateralId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Collateral ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeCollateral({ ...s[idx], ...input }), updatedAt: now() };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('credit/collateral', collateralStore as Array<Record<string, unknown>>, 'collateralId'),

  // ─── LOGISTICS — Vessel Certificates ──────────────────────────────────────────
  http.post(`${API}/logistics/vessel-certificates`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (vesselCertificatesStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['certId'])), 0);
    const row = { ...computeVesselCertificate(input), certId: maxId + 1, createdAt: now() };
    vesselCertificatesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/logistics/vessel-certificates/:id`, async ({ params, request }) => {
    const s = vesselCertificatesStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['certId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Vessel certificate ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeVesselCertificate({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('logistics/vessel-certificates', vesselCertificatesStore as Array<Record<string, unknown>>, 'certId'),

  // ─── LOGISTICS — Railcars ──────────────────────────────────────────────────────
  http.post(`${API}/logistics/railcars`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (railcarsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['railcarId'])), 0);
    const row = { ...computeRailcar(input), railcarId: maxId + 1, createdAt: now() };
    railcarsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/logistics/railcars/:id`, async ({ params, request }) => {
    const s = railcarsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['railcarId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Railcar ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeRailcar({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('logistics/railcars', railcarsStore as Array<Record<string, unknown>>, 'railcarId'),

  // ─── LOGISTICS — Containers ─────────────────────────────────────────────────────
  http.post(`${API}/logistics/containers`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (containersStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['containerId'])), 0);
    const row = { ...computeContainer(input), containerId: maxId + 1, createdAt: now() };
    containersStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/logistics/containers/:id`, async ({ params, request }) => {
    const s = containersStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['containerId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Container ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeContainer({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('logistics/containers', containersStore as Array<Record<string, unknown>>, 'containerId'),

  // ─── LOGISTICS — Tanks ──────────────────────────────────────────────────────────
  http.post(`${API}/logistics/tanks`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (tanksStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['tankId'])), 0);
    const row = { ...computeTank(input), tankId: maxId + 1, createdAt: now(), updatedAt: now() };
    tanksStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/logistics/tanks/:id`, async ({ params, request }) => {
    const s = tanksStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['tankId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Tank ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeTank({ ...s[idx], ...input }), updatedAt: now() };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('logistics/tanks', tanksStore as Array<Record<string, unknown>>, 'tankId'),

  // ─── LOGISTICS — Pipeline Segments ──────────────────────────────────────────────
  http.post(`${API}/logistics/pipeline-segments`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (pipelineSegmentsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['segmentId'])), 0);
    const row = { ...computePipelineSegment(input), segmentId: maxId + 1 };
    pipelineSegmentsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/logistics/pipeline-segments/:id`, async ({ params, request }) => {
    const s = pipelineSegmentsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['segmentId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Pipeline segment ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computePipelineSegment({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('logistics/pipeline-segments', pipelineSegmentsStore as Array<Record<string, unknown>>, 'segmentId'),

  // ─── LOGISTICS — Pipeline Tariffs ────────────────────────────────────────────────
  http.post(`${API}/logistics/pipeline-tariffs`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (pipelineTariffsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['tariffId'])), 0);
    const row = { ...computePipelineTariff(input), tariffId: maxId + 1 };
    pipelineTariffsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/logistics/pipeline-tariffs/:id`, async ({ params, request }) => {
    const s = pipelineTariffsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['tariffId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Pipeline tariff ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computePipelineTariff({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('logistics/pipeline-tariffs', pipelineTariffsStore as Array<Record<string, unknown>>, 'tariffId'),

  // ─── COUNTERPARTIES — Netting Agreements ─────────────────────────────────────
  // Custom POST/PUT (before crudHandlers) to denormalize legalEntityName/
  // counterpartyName against the REAL legalEntityStore/counterpartyStore
  // (not this file's internal counterpartiesRef shadow array — see the
  // CRITICAL note on the two legal-entity mock stores; the same shadow-vs-
  // real distinction applies to counterparties).
  http.post(`${API}/counterparties/netting-agreements`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (nettingAgreementsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['nettingId'])), 0);
    const row = { ...computeNettingAgreement(input), nettingId: maxId + 1, createdAt: now() };
    nettingAgreementsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/counterparties/netting-agreements/:id`, async ({ params, request }) => {
    const s = nettingAgreementsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['nettingId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Netting agreement ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeNettingAgreement({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('counterparties/netting-agreements', nettingAgreementsStore as Array<Record<string, unknown>>, 'nettingId'),

  // ─── COUNTERPARTIES — CP Commercial Terms ────────────────────────────────────
  http.post(`${API}/counterparties/commercial-terms`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (cpCommercialTermsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['cpTermsId'])), 0);
    const row = { ...computeCpCommercialTerms(input), cpTermsId: maxId + 1, createdAt: now(), updatedAt: now() };
    cpCommercialTermsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/counterparties/commercial-terms/:id`, async ({ params, request }) => {
    const s = cpCommercialTermsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['cpTermsId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Commercial terms ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeCpCommercialTerms({ ...s[idx], ...input }), updatedAt: now() };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('counterparties/commercial-terms', cpCommercialTermsStore as Array<Record<string, unknown>>, 'cpTermsId'),

  // ─── COUNTERPARTIES — CP GTC Agreements ──────────────────────────────────────
  http.post(`${API}/counterparties/gtc-agreements`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (cpGtcAgreementsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['cpGtcId'])), 0);
    const row = { ...computeCpGtcAgreement(input), cpGtcId: maxId + 1, createdAt: now() };
    cpGtcAgreementsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/counterparties/gtc-agreements/:id`, async ({ params, request }) => {
    const s = cpGtcAgreementsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['cpGtcId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `GTC agreement ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeCpGtcAgreement({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('counterparties/gtc-agreements', cpGtcAgreementsStore as Array<Record<string, unknown>>, 'cpGtcId'),

  // ─── CREDIT — Credit Limits ───────────────────────────────────────────────────
  // Custom POST/PUT (registered before crudHandlers so they win): denormalize
  // counterparty name/country + analyst name, compute availability/utilisation/
  // traffic light, and auto-derive next review date.
  http.post(`${API}/credit/limits`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (creditLimitsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['creditLimitId'])), 0);
    const row = { ...computeCreditLimit(input), creditLimitId: maxId + 1, alerts: [], createdAt: now(), updatedAt: now() };
    creditLimitsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/credit/limits/:id`, async ({ params, request }) => {
    const s = creditLimitsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['creditLimitId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Credit limit ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeCreditLimit({ ...s[idx], ...input }), updatedAt: now() };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('credit/limits', creditLimitsStore as Array<Record<string, unknown>>, 'creditLimitId'),
  http.patch(`${API}/credit/limits/:id/suspend`, ({ params }) => {
    const s = creditLimitsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['creditLimitId'] === Number(params.id));
    if (idx !== -1) { s[idx] = { ...s[idx], status: 'SUSPENDED' }; }
    return HttpResponse.json(s[idx]);
  }),
  http.patch(`${API}/credit/limits/:id/reinstate`, ({ params }) => {
    const s = creditLimitsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['creditLimitId'] === Number(params.id));
    if (idx !== -1) { s[idx] = { ...s[idx], status: 'ACTIVE' }; }
    return HttpResponse.json(s[idx]);
  }),

  // ─── CREDIT — Letters of Credit ──────────────────────────────────────────────
  ...crudHandlers('credit/letters-of-credit', lettersOfCreditStore as Array<Record<string, unknown>>, 'lcId'),
  http.patch(`${API}/credit/letters-of-credit/:id/cancel`, ({ params }) => {
    const s = lettersOfCreditStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['lcId'] === Number(params.id));
    if (idx !== -1) { s[idx] = { ...s[idx], status: 'CANCELLED' }; }
    return HttpResponse.json(s[idx]);
  }),

  http.put(`${API}/permissions/profiles/:id/rules`, async ({ params, request }) => {
    const profileId = Number(params.id);
    const updates = await request.json() as Array<{ fieldId: number; fieldPermission: string }>;
    const store = profileRulesStore as Array<Record<string, unknown>>;
    updates.forEach(({ fieldId, fieldPermission }) => {
      const idx = store.findIndex((r) => r['profileId'] === profileId && r['fieldId'] === fieldId);
      if (idx !== -1) store[idx] = { ...store[idx], fieldPermission };
      else store.push({ profileId, fieldId, fieldPermission });
    });
    // Return updated profile detail
    const profile = (profileStore as Array<Record<string, unknown>>).find((p) => p['profileId'] === profileId);
    const rules = store
      .filter((r) => r['profileId'] === profileId)
      .map((r) => {
        const field = (fieldRegistryStore as Array<Record<string, unknown>>).find((f) => f['fieldId'] === r['fieldId']);
        return { ...field, fieldPermission: r['fieldPermission'] };
      });
    return HttpResponse.json({ ...profile, rules });
  }),

  // ─── CARBON & ENVIRONMENTAL ─────────────────────────────────────────────────
  ...crudHandlers('emission-schemes',       emissionSchemesStore       as Array<Record<string, unknown>>, 'schemeId'),
  ...crudHandlers('environmental-products', environmentalProductsStore  as Array<Record<string, unknown>>, 'productId'),
  ...crudHandlers('carbon-registries',      carbonRegistriesStore       as Array<Record<string, unknown>>, 'registryId'),
  ...crudHandlers('emission-obligations',   emissionObligationsStore    as Array<Record<string, unknown>>, 'obligationId'),

  // ─── FINANCE — GL ACCOUNTS ──────────────────────────────────────────────────
  // Custom POST/PUT (registered before crudHandlers so they win): denormalize
  // legal entity / book / parent account display codes.
  http.post(`${API}/gl-accounts`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (glAccountsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['accountId'])), 0);
    const row = { ...computeGlAccount(input), accountId: maxId + 1, createdAt: now() };
    glAccountsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/gl-accounts/:id`, async ({ params, request }) => {
    const s = glAccountsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['accountId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `GL account ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeGlAccount({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('gl-accounts', glAccountsStore as Array<Record<string, unknown>>, 'accountId'),

  // ─── RINS — RENEWABLE FUEL STANDARD ─────────────────────────────────────────
  ...crudHandlers('rin-fuel-categories', rinFuelCategoriesStore as Array<Record<string, unknown>>, 'categoryId'),
  ...crudHandlers('rin-accounts',        rinAccountsStore       as Array<Record<string, unknown>>, 'accountId'),

  // RIN transactions: POST + GET + PATCH void (no PUT — immutable ledger)
  http.get(`${API}/rin-transactions`, () => HttpResponse.json(rinTransactionsStore)),
  http.post(`${API}/rin-transactions`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const row = { ...input, transactionId: nextId(), createdAt: now() };
    rinTransactionsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.patch(`${API}/rin-transactions/:id/void`, ({ params }) => {
    const id = Number(params.id);
    const idx = (rinTransactionsStore as Array<Record<string, unknown>>).findIndex((t) => t['transactionId'] === id);
    if (idx === -1) return problem(404, 'Not Found', `Transaction ${id} not found.`);
    if ((rinTransactionsStore as Array<Record<string, unknown>>)[idx]['status'] !== 'PENDING')
      return problem(400, 'Invalid State', 'Only PENDING transactions can be voided.');
    (rinTransactionsStore as Array<Record<string, unknown>>)[idx] = { ...(rinTransactionsStore as Array<Record<string, unknown>>)[idx], status: 'VOID' };
    return HttpResponse.json((rinTransactionsStore as Array<Record<string, unknown>>)[idx]);
  }),

  // RIN inventory: read-only
  http.get(`${API}/rin-inventory`, () => HttpResponse.json(rinInventoryStore)),

  // Settlement prices — CRUD
  ...crudHandlers('settlement-prices', settlementPricesStore as Array<Record<string, unknown>>, 'settlementPriceId'),
  http.patch(`${API}/settlement-prices/:id/confirm`, ({ params }) => {
    const id = Number(params.id);
    const idx = (settlementPricesStore as Array<Record<string, unknown>>).findIndex((s) => s['settlementPriceId'] === id);
    if (idx === -1) return problem(404, 'Not Found', `Settlement price ${id} not found.`);
    (settlementPricesStore as Array<Record<string, unknown>>)[idx] = { ...(settlementPricesStore as Array<Record<string, unknown>>)[idx], isConfirmed: true, updatedAt: now() };
    return HttpResponse.json((settlementPricesStore as Array<Record<string, unknown>>)[idx]);
  }),

  // TAS positions — filtered view of orders with tasDetail
  http.get(`${API}/pricing/tas-positions`, () => {
    const orders = (tradeOrdersStore as Array<Record<string, unknown>>).filter((o) => o['tasDetail'] != null);
    const positions = orders.map((o) => {
      const trade = (tradesStore as Array<Record<string, unknown>>).find((t) => t['tradeId'] === o['tradeId']);
      const rule  = (pricingRulesStore as Array<Record<string, unknown>>).find((r) => r['pricingRuleId'] === o['pricingRuleId']);
      return {
        ...o,
        tradeReference:   trade?.['tradeReference']   ?? null,
        counterpartyName: trade?.['counterpartyName'] ?? null,
        direction:        trade?.['direction']        ?? null,
        ruleCode:         rule?.['ruleCode']          ?? null,
        tasExchange:      rule?.['tasExchange']       ?? null,
        tasContractSeries:rule?.['tasContractSeries'] ?? null,
        tasTickSize:      rule?.['tasTickSize']       ?? null,
      };
    });
    return HttpResponse.json(positions);
  }),

  // TAS lock price — find settlement and apply
  http.patch(`${API}/pricing/tas-positions/:orderId/lock-price`, ({ params }) => {
    const orderId = Number(params.orderId);
    const orderIdx = (tradeOrdersStore as Array<Record<string, unknown>>).findIndex((o) => o['orderId'] === orderId);
    if (orderIdx === -1) return problem(404, 'Not Found', `Order ${orderId} not found.`);
    const order = (tradeOrdersStore as Array<Record<string, unknown>>)[orderIdx];
    const tasDetail = order['tasDetail'] as Record<string, unknown>;
    if (!tasDetail) return problem(400, 'Not a TAS order', 'This order has no TAS detail.');
    if (tasDetail['tasStatus'] === 'PRICE_LOCKED') return problem(400, 'Already locked', 'Price already locked for this TAS order.');
    const ticker = String(tasDetail['tasContractTicker']);
    const diff   = Number(tasDetail['tasDifferential']);
    const rule   = (pricingRulesStore as Array<Record<string, unknown>>).find((r) => r['pricingRuleId'] === order['pricingRuleId']);
    const tickSz = Number(rule?.['tasTickSize'] ?? 0.01);
    const settlement = (settlementPricesStore as Array<Record<string, unknown>>)
      .filter((s) => s['contractTicker'] === ticker && s['isConfirmed'] === true)
      .sort((a, b) => String(b['settleDate']).localeCompare(String(a['settleDate'])))[0];
    if (!settlement) return problem(422, 'No settlement price', `No confirmed settlement price found for ${ticker}.`);
    const lockedPrice = Math.round((Number(settlement['settlePrice']) + diff * tickSz) * 10000) / 10000;
    const updatedDetail = { ...tasDetail, tasStatus: 'PRICE_LOCKED', tasLockedPrice: lockedPrice, tasSettlementDate: String(settlement['settleDate']) };
    (tradeOrdersStore as Array<Record<string, unknown>>)[orderIdx] = { ...order, price: lockedPrice, tasDetail: updatedDetail, updatedAt: now() };
    const updated = (tradeOrdersStore as Array<Record<string, unknown>>)[orderIdx];
    const trade = (tradesStore as Array<Record<string, unknown>>).find((t) => t['tradeId'] === updated['tradeId']);
    return HttpResponse.json({ ...updated, tradeReference: trade?.['tradeReference'] ?? null, counterpartyName: trade?.['counterpartyName'] ?? null, direction: trade?.['direction'] ?? null, ruleCode: rule?.['ruleCode'] ?? null, tasExchange: rule?.['tasExchange'] ?? null, tasContractSeries: rule?.['tasContractSeries'] ?? null, tasTickSize: rule?.['tasTickSize'] ?? null });
  }),

  // ── BOLMO agreements ────────────────────────────────────────────────────────
  http.get(`${API}/bolmo-agreements`, () => {
    const result = (bolmoAgreementsStore as Array<Record<string, unknown>>).map((a) => ({
      ...a,
      legs: (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === a['bolmoId']),
      legCount: (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === a['bolmoId']).length,
    }));
    return HttpResponse.json(result);
  }),

  http.post(`${API}/bolmo-agreements`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const id = nextId();
    const year = new Date().getFullYear();
    const seq = String(id).padStart(5, '0');
    const row = {
      ...input,
      bolmoId: id,
      bolmoReference: `BKO-${year}-${seq}`,
      counterpartyName: null,
      legalEntityName: 'NonameETRM Trading Ltd',
      createdAt: now(), updatedAt: now(),
      legs: [], legCount: 0,
    };
    bolmoAgreementsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),

  http.put(`${API}/bolmo-agreements/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const idx = (bolmoAgreementsStore as Array<Record<string, unknown>>).findIndex((a) => a['bolmoId'] === id);
    if (idx === -1) return problem(404, 'Not Found', `BOLMO ${id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    (bolmoAgreementsStore as Array<Record<string, unknown>>)[idx] = {
      ...(bolmoAgreementsStore as Array<Record<string, unknown>>)[idx],
      ...input, updatedAt: now(),
    };
    const a = (bolmoAgreementsStore as Array<Record<string, unknown>>)[idx];
    return HttpResponse.json({
      ...a,
      legs: (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === id),
      legCount: (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === id).length,
    });
  }),

  ...(['agree', 'complete', 'dispute', 'cancel'] as const).map((action) =>
    http.patch(`${API}/bolmo-agreements/:id/${action}`, ({ params }) => {
      const id = Number(params.id);
      const idx = (bolmoAgreementsStore as Array<Record<string, unknown>>).findIndex((a) => a['bolmoId'] === id);
      if (idx === -1) return problem(404, 'Not Found', `BOLMO ${id} not found.`);
      const statusMap = { agree: 'AGREED', complete: 'COMPLETED', dispute: 'DISPUTED', cancel: 'CANCELLED' } as const;
      (bolmoAgreementsStore as Array<Record<string, unknown>>)[idx] = {
        ...(bolmoAgreementsStore as Array<Record<string, unknown>>)[idx],
        status: statusMap[action], updatedAt: now(),
      };
      const a = (bolmoAgreementsStore as Array<Record<string, unknown>>)[idx];
      return HttpResponse.json({
        ...a,
        legs: (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === id),
        legCount: (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === id).length,
      });
    }),
  ),

  http.get(`${API}/bolmo-agreements/:id/legs`, ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json((bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === id));
  }),

  http.post(`${API}/bolmo-agreements/:id/legs`, async ({ params, request }) => {
    const bolmoId = Number(params.id);
    const input = (await request.json()) as Record<string, unknown>;
    const leg = { ...input, legId: nextId(), bolmoId, orderReference: null, createdAt: now() };
    bolmoLegsStore.push(leg);
    // Update legCount on parent
    const pidx = (bolmoAgreementsStore as Array<Record<string, unknown>>).findIndex((a) => a['bolmoId'] === bolmoId);
    if (pidx !== -1) {
      const legCount = (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === bolmoId).length;
      (bolmoAgreementsStore as Array<Record<string, unknown>>)[pidx] = { ...(bolmoAgreementsStore as Array<Record<string, unknown>>)[pidx], legCount, updatedAt: now() };
    }
    return HttpResponse.json(leg, { status: 201 });
  }),

  http.delete(`${API}/bolmo-legs/:legId`, ({ params }) => {
    const legId = Number(params.legId);
    const idx = (bolmoLegsStore as Array<Record<string, unknown>>).findIndex((l) => l['legId'] === legId);
    if (idx === -1) return problem(404, 'Not Found', `Leg ${legId} not found.`);
    const bolmoId = (bolmoLegsStore as Array<Record<string, unknown>>)[idx]['bolmoId'] as number;
    bolmoLegsStore.splice(idx, 1);
    // Update legCount on parent
    const pidx = (bolmoAgreementsStore as Array<Record<string, unknown>>).findIndex((a) => a['bolmoId'] === bolmoId);
    if (pidx !== -1) {
      const legCount = (bolmoLegsStore as Array<Record<string, unknown>>).filter((l) => l['bolmoId'] === bolmoId).length;
      (bolmoAgreementsStore as Array<Record<string, unknown>>)[pidx] = { ...(bolmoAgreementsStore as Array<Record<string, unknown>>)[pidx], legCount, updatedAt: now() };
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // BALMO products CRUD
  ...crudHandlers('balmo-products', balmoProductsStore as Array<Record<string, unknown>>, 'balmoProductId'),

  // BALMO positions — orders where balmoDetail is populated
  http.get(`${API}/pricing/balmo-positions`, () => {
    const orders = tradeOrdersStore as Array<Record<string, unknown>>;
    const trades = tradesStore as Array<Record<string, unknown>>;
    const positions = orders
      .filter((o) => o['balmoDetail'] != null)
      .map((o) => {
        const trade = trades.find((t) => t['tradeId'] === o['tradeId']);
        const bd = o['balmoDetail'] as Record<string, unknown>;
        return {
          orderId: o['orderId'],
          orderReference: o['orderReference'],
          tradeReference: trade?.['tradeReference'] ?? null,
          counterpartyName: trade?.['counterpartyName'] ?? null,
          direction: trade?.['direction'] ?? null,
          quantity: o['quantity'],
          uomCode: o['uomCode'],
          currencyCode: o['currencyCode'],
          contractMonth: bd['contractMonth'],
          contractSeries: (pricingRulesStore as Array<Record<string, unknown>>).find((r) => r['pricingRuleId'] === o['pricingRuleId'])?.['balmoSeries'] ?? null,
          exchange: (pricingRulesStore as Array<Record<string, unknown>>).find((r) => r['pricingRuleId'] === o['pricingRuleId'])?.['balmoExchange'] ?? null,
          settlementPriceTicker: (balmoProductsStore as Array<Record<string, unknown>>).find((p) => p['balmoProductId'] === bd['balmoProductId'])?.['settlementPriceTicker'] ?? null,
          pricingStartDate: bd['pricingStartDate'],
          pricingEndDate: bd['pricingEndDate'],
          balmoStatus: bd['balmoStatus'],
          elapsedPricingDays: bd['elapsedPricingDays'],
          totalPricingDays: bd['totalPricingDays'],
          runningAvgPrice: bd['runningAvgPrice'],
          finalSettledPrice: bd['finalSettledPrice'],
          bookCode: trade?.['bookCode'] ?? null,
          commodityType: trade?.['commodityType'] ?? null,
        };
      });
    return HttpResponse.json(positions);
  }),

  // BALMO running average update (recomputes from settlement_price table — simplified mock)
  http.patch(`${API}/pricing/balmo-positions/:orderId/update-avg`, ({ params }) => {
    const orderId = Number(params.orderId);
    const orders = tradeOrdersStore as Array<Record<string, unknown>>;
    const idx = orders.findIndex((o) => o['orderId'] === orderId);
    if (idx === -1) return problem(404, 'Not Found', `Order ${orderId} not found.`);
    const bd = orders[idx]['balmoDetail'] as Record<string, unknown> | null;
    if (!bd) return problem(400, 'Bad Request', 'Order does not have a BALMO detail.');
    // Simple mock: average the settlement_price rows matching the ticker
    const ticker = (balmoProductsStore as Array<Record<string, unknown>>).find((p) => p['balmoProductId'] === bd['balmoProductId'])?.['settlementPriceTicker'];
    const settles = (settlementPricesStore as Array<Record<string, unknown>>).filter((s) => s['contractTicker'] === ticker);
    const avg = settles.length ? settles.reduce((sum, s) => sum + (s['settlePrice'] as number), 0) / settles.length : null;
    orders[idx] = { ...orders[idx], balmoDetail: { ...bd, runningAvgPrice: avg ? Math.round(avg * 10000) / 10000 : bd['runningAvgPrice'], elapsedPricingDays: (bd['elapsedPricingDays'] as number ?? 0) + 1 }, updatedAt: now() };
    return HttpResponse.json(orders[idx]);
  }),

  // RIN obligations: GET + POST + PUT (no deactivate)
  http.get(`${API}/rin-obligations`, () => HttpResponse.json(rinObligationsStore)),
  http.post(`${API}/rin-obligations`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const req = Number(input['requiredQuantity'] ?? 0);
    const ret = Number(input['retiredQuantity'] ?? 0);
    const row = { ...input, obligationId: nextId(), shortfallQuantity: req - ret, createdAt: now(), updatedAt: now() };
    rinObligationsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/rin-obligations/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const idx = (rinObligationsStore as Array<Record<string, unknown>>).findIndex((o) => o['obligationId'] === id);
    if (idx === -1) return problem(404, 'Not Found', `Obligation ${id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    const req = Number(input['requiredQuantity'] ?? 0);
    const ret = Number(input['retiredQuantity'] ?? 0);
    (rinObligationsStore as Array<Record<string, unknown>>)[idx] = { ...(rinObligationsStore as Array<Record<string, unknown>>)[idx], ...input, shortfallQuantity: req - ret, updatedAt: now() };
    return HttpResponse.json((rinObligationsStore as Array<Record<string, unknown>>)[idx]);
  }),

  // ─── PRICING — Formula Templates ─────────────────────────────────────────────
  http.post(`${API}/pricing/formula-templates`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (formulaTemplatesStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['templateId'])), 0);
    const row = { ...input, templateId: maxId + 1, createdAt: now() };
    formulaTemplatesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/pricing/formula-templates/:id`, async ({ params, request }) => {
    const s = formulaTemplatesStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['templateId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Formula template ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...input };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('pricing/formula-templates', formulaTemplatesStore as Array<Record<string, unknown>>, 'templateId'),

  // ─── COMPLIANCE — Regulatory Obligations ─────────────────────────────────────
  http.post(`${API}/compliance/obligations`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    const maxId = (regulatoryObligationsStore as Array<Record<string, unknown>>).reduce((m, r) => Math.max(m, Number(r['obligationId'])), 0);
    const row = { ...computeRegulatoryObligation(input), obligationId: maxId + 1, createdAt: now() };
    regulatoryObligationsStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/compliance/obligations/:id`, async ({ params, request }) => {
    const s = regulatoryObligationsStore as Array<Record<string, unknown>>;
    const idx = s.findIndex((r) => r['obligationId'] === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Regulatory obligation ${String(params.id)} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    s[idx] = { ...s[idx], ...computeRegulatoryObligation({ ...s[idx], ...input }) };
    return HttpResponse.json(s[idx]);
  }),
  ...crudHandlers('compliance/obligations', regulatoryObligationsStore as Array<Record<string, unknown>>, 'obligationId'),
];

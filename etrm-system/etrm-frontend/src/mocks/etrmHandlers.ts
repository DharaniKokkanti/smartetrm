/**
 * MSW handlers for all new ETRM master data domains:
 * Organization (desks, books, traders), Markets (products, price-indices, exchanges),
 * Logistics (locations, vessels, pipelines), Calendar (holiday-calendars, periods),
 * Pricing (pricing-rules)
 */
import { http, HttpResponse } from 'msw';

const API = '/api/v1';
function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}
let _id = 1000;
const nextId = () => ++_id;
const now = () => new Date().toISOString();

// ─── DESKS ────────────────────────────────────────────────────────────────────
const desksStore: unknown[] = [
  { deskId: 1, deskCode: 'OIL-CRUDE', deskName: 'Crude Oil Trading', legalEntityId: 1, commodityType: 'OIL', headTraderId: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 2, deskCode: 'GAS-EU', deskName: 'European Gas', legalEntityId: 1, commodityType: 'GAS', headTraderId: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 3, deskCode: 'METALS-BASE', deskName: 'Base Metals', legalEntityId: 1, commodityType: 'METALS', headTraderId: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 4, deskCode: 'POWER-EU', deskName: 'European Power', legalEntityId: 1, commodityType: 'POWER', headTraderId: null, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { deskId: 5, deskCode: 'AGR-GRAINS', deskName: 'Grains & Oilseeds', legalEntityId: 2, commodityType: 'AGRICULTURAL', headTraderId: null, isActive: false, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── BOOKS ────────────────────────────────────────────────────────────────────
const booksStore: unknown[] = [
  { bookId: 1, bookCode: 'CRUDE-PROP', bookName: 'Crude Proprietary', deskId: 1, bookType: 'TRADING', positionLimit: 5000000, pnlLimit: 500000, varLimit: 250000, currencyCode: 'USD', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { bookId: 2, bookCode: 'CRUDE-HEDGE', bookName: 'Crude Hedge Book', deskId: 1, bookType: 'HEDGING', positionLimit: 10000000, pnlLimit: null, varLimit: 100000, currencyCode: 'USD', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { bookId: 3, bookCode: 'GAS-EU-TRADE', bookName: 'EU Gas Trading', deskId: 2, bookType: 'TRADING', positionLimit: 2000000, pnlLimit: 200000, varLimit: 50000, currencyCode: 'EUR', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { bookId: 4, bookCode: 'LME-CU-ARB', bookName: 'Copper Arbitrage', deskId: 3, bookType: 'ARBITRAGE', positionLimit: 1000, pnlLimit: 100000, varLimit: 25000, currencyCode: 'USD', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { bookId: 5, bookCode: 'POWER-CLIENT', bookName: 'Power Client Book', deskId: 4, bookType: 'CLIENT', positionLimit: 500000, pnlLimit: null, varLimit: null, currencyCode: 'EUR', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── TRADERS ──────────────────────────────────────────────────────────────────
const tradersStore: unknown[] = [
  { traderId: 1, traderCode: 'JDO', fullName: 'John Doe', email: 'john.doe@smartetrm.com', userId: 101, deskId: 1, deskCode: 'OIL-CRUDE', deskName: 'Crude Oil Trading', commodityTypes: ['OIL'], commodityLimits: [{ commodityType: 'OIL', singleTradeLimit: 25000000, dailyTradeLimit: 100000000, positionLimit: 250000000 }], approverTraderId: null, approverName: null, goLiveDate: '2020-03-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 2, traderCode: 'ASM', fullName: 'Alice Smith', email: 'alice.smith@smartetrm.com', userId: 102, deskId: 2, deskCode: 'GAS-EU', deskName: 'European Gas', commodityTypes: ['GAS', 'POWER'], commodityLimits: [{ commodityType: 'GAS', singleTradeLimit: 10000000, dailyTradeLimit: 40000000, positionLimit: 100000000 }, { commodityType: 'POWER', singleTradeLimit: 5000000, dailyTradeLimit: 20000000, positionLimit: 50000000 }], approverTraderId: null, approverName: null, goLiveDate: '2019-06-15', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 3, traderCode: 'RKP', fullName: 'Raj Kumar Patel', email: 'raj.patel@smartetrm.com', userId: 103, deskId: 3, deskCode: 'METALS-BASE', deskName: 'Base Metals', commodityTypes: ['METALS'], commodityLimits: [{ commodityType: 'METALS', singleTradeLimit: 5000000, dailyTradeLimit: 20000000, positionLimit: 50000000 }], approverTraderId: 1, approverName: 'John Doe', goLiveDate: '2022-01-10', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 4, traderCode: 'MJL', fullName: 'Maria Jensen', email: 'maria.jensen@smartetrm.com', userId: 104, deskId: 1, deskCode: 'OIL-CRUDE', deskName: 'Crude Oil Trading', commodityTypes: ['OIL'], commodityLimits: [{ commodityType: 'OIL', singleTradeLimit: 12500000, dailyTradeLimit: 50000000, positionLimit: 100000000 }], approverTraderId: 1, approverName: 'John Doe', goLiveDate: '2023-09-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 5, traderCode: 'PLN', fullName: 'Pierre Lefebvre', email: 'pierre.lefebvre@smartetrm.com', userId: 105, deskId: 2, deskCode: 'GAS-EU', deskName: 'European Gas', commodityTypes: ['GAS', 'LNG'], commodityLimits: [{ commodityType: 'GAS', singleTradeLimit: 8000000, dailyTradeLimit: 30000000, positionLimit: 80000000 }], approverTraderId: 2, approverName: 'Alice Smith', goLiveDate: '2021-04-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { traderId: 6, traderCode: 'SWN', fullName: 'Sarah Wong', email: 'sarah.wong@smartetrm.com', userId: 106, deskId: 4, deskCode: 'POWER-EU', deskName: 'European Power', commodityTypes: ['POWER'], commodityLimits: [{ commodityType: 'POWER', singleTradeLimit: 3000000, dailyTradeLimit: 15000000, positionLimit: 30000000 }], approverTraderId: 2, approverName: 'Alice Smith', goLiveDate: '2024-02-01', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
const productsStore: unknown[] = [
  { productId: 1, productCode: 'BRENT-CRUDE', productName: 'Brent Crude Oil', commodityType: 'OIL', settlementType: 'PHYSICAL', defaultUomCode: 'BBL', lotSize: 500000, minQty: 50000, maxQty: 5000000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 2, productCode: 'WTI-CRUDE', productName: 'West Texas Intermediate', commodityType: 'OIL', settlementType: 'PHYSICAL', defaultUomCode: 'BBL', lotSize: 1000, minQty: 1000, maxQty: 5000000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 3, productCode: 'BRENT-FUTURES', productName: 'Brent Futures', commodityType: 'OIL', settlementType: 'FINANCIAL', defaultUomCode: 'BBL', lotSize: 1000, minQty: 1000, maxQty: 1000000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 4, productCode: 'TTF-GAS', productName: 'TTF Natural Gas', commodityType: 'GAS', settlementType: 'FINANCIAL', defaultUomCode: 'MWH', lotSize: 1, minQty: 1, maxQty: 1000000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 5, productCode: 'NBP-GAS', productName: 'NBP Natural Gas', commodityType: 'GAS', settlementType: 'PHYSICAL', defaultUomCode: 'MMBTU', lotSize: 1, minQty: 1, maxQty: 500000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 6, productCode: 'LME-COPPER', productName: 'LME Copper', commodityType: 'METALS', settlementType: 'PHYSICAL', defaultUomCode: 'MT', lotSize: 25, minQty: 25, maxQty: 10000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 7, productCode: 'LME-ALUMINIUM', productName: 'LME Primary Aluminium', commodityType: 'METALS', settlementType: 'PHYSICAL', defaultUomCode: 'MT', lotSize: 25, minQty: 25, maxQty: 25000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 8, productCode: 'EEX-DE-POWER', productName: 'EEX German Power', commodityType: 'POWER', settlementType: 'FINANCIAL', defaultUomCode: 'MWH', lotSize: 1, minQty: 1, maxQty: 100000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 9, productCode: 'ICE-BRENT-OPT', productName: 'ICE Brent Options', commodityType: 'OIL', settlementType: 'OPTIONS', defaultUomCode: 'BBL', lotSize: 1000, minQty: 1000, maxQty: 500000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { productId: 10, productCode: 'HEATING-OIL', productName: 'Heating Oil / Gas Oil', commodityType: 'OIL', settlementType: 'PHYSICAL', defaultUomCode: 'MT', lotSize: 100, minQty: 100, maxQty: 50000, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
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
  { vesselId: 1, imoNumber: 'IMO 9741060', vesselName: 'NORDIC LUNA', vesselType: 'VLCC', dwt: 307285, grossTonnage: 162028, buildYear: 2016, flag: 'MH', owner: 'Nordic Tankers AS', operator: 'Trafigura Maritime Logistics', classificationSociety: 'DNV', vettingExpiry: '2026-09-15', sireInspectionDate: '2025-09-15', cdiBerthStatus: 'APPROVED', statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 2, imoNumber: 'IMO 9634454', vesselName: 'FRONT ALTAIR', vesselType: 'SUEZMAX', dwt: 158000, grossTonnage: 86402, buildYear: 2013, flag: 'LR', owner: 'Frontline Ltd', operator: 'Frontline Management', classificationSociety: 'LR', vettingExpiry: '2026-08-01', sireInspectionDate: '2025-08-01', cdiBerthStatus: 'APPROVED', statusCode: 'ON_CHARTER', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 3, imoNumber: 'IMO 9387890', vesselName: 'SCF SAKHALIN', vesselType: 'AFRAMAX', dwt: 105936, grossTonnage: 60196, buildYear: 2009, flag: 'CY', owner: 'Sovcomflot PAO', operator: 'Sovcomflot', classificationSociety: 'BV', vettingExpiry: '2026-07-10', sireInspectionDate: '2025-07-10', cdiBerthStatus: null, statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 4, imoNumber: 'IMO 9812744', vesselName: 'MARATHON TS', vesselType: 'MR', dwt: 49900, grossTonnage: 28500, buildYear: 2020, flag: 'PA', owner: 'Marathon Tanker AS', operator: 'Hafnia Management', classificationSociety: 'ABS', vettingExpiry: '2026-12-31', sireInspectionDate: '2025-12-31', cdiBerthStatus: 'APPROVED', statusCode: 'ACTIVE', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 5, imoNumber: 'IMO 9462082', vesselName: 'ENERGY INNOVATOR', vesselType: 'LNG_CARRIER', dwt: 88000, grossTonnage: 107000, buildYear: 2011, flag: 'MH', owner: 'Teekay LNG AS', operator: 'Teekay LNG Partners', classificationSociety: 'LR', vettingExpiry: '2026-06-01', sireInspectionDate: '2025-06-01', cdiBerthStatus: null, statusCode: 'ON_CHARTER', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { vesselId: 6, imoNumber: 'IMO 9203536', vesselName: 'BUNGA KASTURI LIMA', vesselType: 'VLCC', dwt: 298337, grossTonnage: 160283, buildYear: 2001, flag: 'MY', owner: 'MISC Berhad', operator: 'MISC Petroleum', classificationSociety: 'LR', vettingExpiry: '2026-05-15', sireInspectionDate: '2025-05-15', cdiBerthStatus: 'CONDITIONAL', statusCode: 'IN_DRYDOCK', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
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
  { periodId: 1, periodCode: 'M2026-01', periodName: 'January 2026', periodType: 'MONTHLY', startDate: '2026-01-01', endDate: '2026-01-31', deliveryStartDate: '2026-01-01', deliveryEndDate: '2026-01-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'LOCKED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 2, periodCode: 'M2026-02', periodName: 'February 2026', periodType: 'MONTHLY', startDate: '2026-02-01', endDate: '2026-02-28', deliveryStartDate: '2026-02-01', deliveryEndDate: '2026-02-28', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 3, periodCode: 'M2026-03', periodName: 'March 2026', periodType: 'MONTHLY', startDate: '2026-03-01', endDate: '2026-03-31', deliveryStartDate: '2026-03-01', deliveryEndDate: '2026-03-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 4, periodCode: 'M2026-04', periodName: 'April 2026', periodType: 'MONTHLY', startDate: '2026-04-01', endDate: '2026-04-30', deliveryStartDate: '2026-04-01', deliveryEndDate: '2026-04-30', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 5, periodCode: 'M2026-05', periodName: 'May 2026', periodType: 'MONTHLY', startDate: '2026-05-01', endDate: '2026-05-31', deliveryStartDate: '2026-05-01', deliveryEndDate: '2026-05-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'CLOSED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 6, periodCode: 'M2026-06', periodName: 'June 2026', periodType: 'MONTHLY', startDate: '2026-06-01', endDate: '2026-06-30', deliveryStartDate: '2026-06-01', deliveryEndDate: '2026-06-30', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 7, periodCode: 'M2026-07', periodName: 'July 2026', periodType: 'MONTHLY', startDate: '2026-07-01', endDate: '2026-07-31', deliveryStartDate: '2026-07-01', deliveryEndDate: '2026-07-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 8, periodCode: 'Q2026-Q1', periodName: 'Q1 2026', periodType: 'QUARTERLY', startDate: '2026-01-01', endDate: '2026-03-31', deliveryStartDate: '2026-01-01', deliveryEndDate: '2026-03-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'LOCKED', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 9, periodCode: 'Q2026-Q2', periodName: 'Q2 2026', periodType: 'QUARTERLY', startDate: '2026-04-01', endDate: '2026-06-30', deliveryStartDate: '2026-04-01', deliveryEndDate: '2026-06-30', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 10, periodCode: 'Y2026', periodName: 'Calendar Year 2026', periodType: 'ANNUAL', startDate: '2026-01-01', endDate: '2026-12-31', deliveryStartDate: '2026-01-01', deliveryEndDate: '2026-12-31', pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { periodId: 11, periodCode: 'SPOT', periodName: 'Spot', periodType: 'SPOT', startDate: '2026-06-27', endDate: '2026-06-27', deliveryStartDate: null, deliveryEndDate: null, pricingCalendarCode: 'LON', settlementCalendarCode: 'NYC', statusCode: 'OPEN', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── PRICING RULES ────────────────────────────────────────────────────────────
const pricingRulesStore: unknown[] = [
  { pricingRuleId: 1, ruleCode: 'FLT-DTBRT-AVG', ruleName: 'Dated Brent Monthly Average', pricingType: 'AVERAGE', priceIndexCode: 'DTBRT', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null, averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'PLATTS', rounding: 'ROUND_4DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 2, ruleCode: 'DIFF-URALS-MED', ruleName: 'Urals Med vs Dated Brent', pricingType: 'DIFFERENTIAL', priceIndexCode: 'DTBRT', differentialAmount: -2.5, differentialCurrencyCode: 'USD', differentialUomCode: 'BBL', formulaExpression: null, averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'ARGUS', rounding: 'ROUND_4DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 3, ruleCode: 'FLT-WTI-PROMPT', ruleName: 'WTI NYMEX Prompt Month', pricingType: 'FLOATING', priceIndexCode: 'WTI-NYMEX', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null, averagingMethod: null, pricingCalendarCode: 'NYC', publicationSource: 'NYMEX', rounding: 'ROUND_2DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 4, ruleCode: 'FORMULA-JCC-LNG', ruleName: 'JCC-Linked LNG Formula', pricingType: 'FORMULA', priceIndexCode: 'JCC', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: 'JCC * 0.1485 + 0.50', averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'NYC', publicationSource: 'REUTERS', rounding: 'ROUND_4DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 5, ruleCode: 'FLT-TTF-MONTHLY', ruleName: 'TTF Gas Monthly Average', pricingType: 'AVERAGE', priceIndexCode: 'TTF-ICE', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null, averagingMethod: 'ARITHMETIC', pricingCalendarCode: 'LON', publicationSource: 'ICE', rounding: 'ROUND_4DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 6, ruleCode: 'FLT-LME-CU-CASH', ruleName: 'LME Copper Cash Settlement', pricingType: 'FLOATING', priceIndexCode: 'LME-CU-CASH', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null, averagingMethod: null, pricingCalendarCode: 'LME', publicationSource: 'LME', rounding: 'ROUND_2DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 7, ruleCode: 'PLT-BRENT-MOC', ruleName: 'Platts Brent MOC Window', pricingType: 'PLATTS_WINDOW', priceIndexCode: 'DTBRT', differentialAmount: null, differentialCurrencyCode: null, differentialUomCode: null, formulaExpression: null, averagingMethod: null, pricingCalendarCode: 'LON', publicationSource: 'PLATTS', rounding: 'ROUND_4DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { pricingRuleId: 8, ruleCode: 'FIXED-75.00-USD', ruleName: 'Fixed Price USD 75.00/BBL', pricingType: 'FIXED', priceIndexCode: null, differentialAmount: 75.0, differentialCurrencyCode: 'USD', differentialUomCode: 'BBL', formulaExpression: null, averagingMethod: null, pricingCalendarCode: null, publicationSource: null, rounding: 'ROUND_2DP', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── TRADES ───────────────────────────────────────────────────────────────────
const tradesStore: unknown[] = [
  { tradeId: 1, tradeReference: 'TRD-2026-00001', tradeDate: '2026-06-01', executionDatetime: '2026-06-01T09:30:00Z', commodityType: 'OIL', tradeType: 'PHYSICAL', direction: 'BUY', counterpartyId: 1, counterpartyName: 'Shell Trading International', traderId: 1, traderCode: 'JDO', bookId: 1, bookCode: 'CRUDE-PROP', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 1, productCode: 'BRENT-CRUDE', marketId: 5, marketCode: 'OTC_NS_CRUDE', pricingRuleId: 1, pricingRuleCode: 'FLT-DTBRT-AVG', quantity: 500000, uomCode: 'BBL', price: 82.45, currencyCode: 'USD', incotermCode: 'FOB', deliveryLocationCode: 'SULLOM-VOE', periodCode: 'M2026-07', settlementType: 'PHYSICAL', status: 'CONFIRMED', notes: 'Forties blend cargo', amendmentNumber: 0, isLatestVersion: true, oilDetail: { crudeGrade: 'FORTIES', apiGravity: 40.7, sulphurPct: 0.26, loadLocationCode: 'SULLOM-VOE', dischargeLocationCode: 'ROTTERDAM', vesselName: 'NORDIC LUNA', laycanStart: '2026-07-10', laycanEnd: '2026-07-12', blDate: null, norsTenderedDate: null, codDate: null, pipelineId: null }, createdAt: '2026-06-01T09:30:00Z', updatedAt: '2026-06-01T09:30:00Z' },
  { tradeId: 2, tradeReference: 'TRD-2026-00002', tradeDate: '2026-06-03', executionDatetime: '2026-06-03T10:15:00Z', commodityType: 'OIL', tradeType: 'FINANCIAL', direction: 'SELL', counterpartyId: 2, counterpartyName: 'BP Oil Trading', traderId: 4, traderCode: 'MJL', bookId: 2, bookCode: 'CRUDE-HEDGE', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 3, productCode: 'BRENT-FUTURES', marketId: 1, marketCode: 'ICE_BRENT', pricingRuleId: 3, pricingRuleCode: 'FLT-WTI-PROMPT', quantity: 100000, uomCode: 'BBL', price: 83.10, currencyCode: 'USD', incotermCode: null, deliveryLocationCode: null, periodCode: 'M2026-07', settlementType: 'FINANCIAL', status: 'CONFIRMED', notes: 'Hedge against physical inventory', amendmentNumber: 0, isLatestVersion: true, oilDetail: null, createdAt: '2026-06-03T10:15:00Z', updatedAt: '2026-06-03T10:15:00Z' },
  { tradeId: 3, tradeReference: 'TRD-2026-00003', tradeDate: '2026-06-05', executionDatetime: '2026-06-05T08:45:00Z', commodityType: 'GAS', tradeType: 'PHYSICAL', direction: 'BUY', counterpartyId: 3, counterpartyName: 'Equinor Energy AS', traderId: 2, traderCode: 'ASM', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 4, productCode: 'TTF-GAS', marketId: 4, marketCode: 'ICE_TTF', pricingRuleId: 5, pricingRuleCode: 'FLT-TTF-MONTHLY', quantity: 50000, uomCode: 'MWH', price: 34.55, currencyCode: 'EUR', incotermCode: null, deliveryLocationCode: 'TTF-NL', periodCode: 'M2026-07', settlementType: 'FINANCIAL', status: 'CONFIRMED', notes: null, amendmentNumber: 0, isLatestVersion: true, gasDetail: { deliveryHub: 'TTF-NL', gasDeliveryStart: '2026-07-01', gasDeliveryEnd: '2026-07-31', swingPct: 10, gasDayType: 'STANDARD', nominationType: 'FIRM' }, createdAt: '2026-06-05T08:45:00Z', updatedAt: '2026-06-05T08:45:00Z' },
  { tradeId: 4, tradeReference: 'TRD-2026-00004', tradeDate: '2026-06-10', executionDatetime: '2026-06-10T11:00:00Z', commodityType: 'METALS', tradeType: 'PHYSICAL', direction: 'BUY', counterpartyId: 4, counterpartyName: 'Glencore Metals', traderId: 3, traderCode: 'RKP', bookId: 4, bookCode: 'LME-CU-ARB', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 6, productCode: 'LME-COPPER', marketId: 3, marketCode: 'LME_COPPER', pricingRuleId: 6, pricingRuleCode: 'FLT-LME-CU-CASH', quantity: 250, uomCode: 'MT', price: 9845.00, currencyCode: 'USD', incotermCode: null, deliveryLocationCode: 'LME-WAREHOUSE', periodCode: 'SPOT', settlementType: 'PHYSICAL', status: 'CONFIRMED', notes: 'Grade A cathode, LME approved warehouse', amendmentNumber: 0, isLatestVersion: true, metalsDetail: { metalGrade: 'GRADE_A', shape: 'CATHODE', lmeDate: '2026-06-13', warehouseLocationCode: 'LME-WAREHOUSE', brand: 'AURUBIS' }, createdAt: '2026-06-10T11:00:00Z', updatedAt: '2026-06-10T11:00:00Z' },
  { tradeId: 5, tradeReference: 'TRD-2026-00005', tradeDate: '2026-06-12', executionDatetime: '2026-06-12T09:00:00Z', commodityType: 'POWER', tradeType: 'FINANCIAL', direction: 'SELL', counterpartyId: 5, counterpartyName: 'RWE Supply & Trading', traderId: 6, traderCode: 'SWN', bookId: 5, bookCode: 'POWER-CLIENT', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 8, productCode: 'EEX-DE-POWER', marketId: 6, marketCode: 'EEX_DE_POWER', pricingRuleId: null, pricingRuleCode: null, quantity: 10000, uomCode: 'MWH', price: 68.75, currencyCode: 'EUR', incotermCode: null, deliveryLocationCode: null, periodCode: 'M2026-07', settlementType: 'FINANCIAL', status: 'CONFIRMED', notes: 'Baseload monthly', amendmentNumber: 0, isLatestVersion: true, powerDetail: { loadType: 'BASELOAD', mwCapacity: 50, mwhVolume: 37200, gridNodeCode: null, interconnector: null, deliveryStart: '2026-07-01', deliveryEnd: '2026-07-31' }, createdAt: '2026-06-12T09:00:00Z', updatedAt: '2026-06-12T09:00:00Z' },
  { tradeId: 6, tradeReference: 'TRD-2026-00006', tradeDate: '2026-06-15', executionDatetime: '2026-06-15T14:30:00Z', commodityType: 'GAS', tradeType: 'PHYSICAL', direction: 'SELL', counterpartyId: 6, counterpartyName: 'Centrica Energy Trading', traderId: 5, traderCode: 'PLN', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 5, productCode: 'NBP-GAS', marketId: 8, marketCode: 'OTC_NBP', pricingRuleId: null, pricingRuleCode: null, quantity: 75000, uomCode: 'THERM', price: 92.30, currencyCode: 'GBP', incotermCode: null, deliveryLocationCode: 'NBP-UK', periodCode: 'M2026-07', settlementType: 'PHYSICAL', status: 'DRAFT', notes: 'NBP physical day-ahead swing', amendmentNumber: 0, isLatestVersion: true, gasDetail: { deliveryHub: 'NBP-UK', gasDeliveryStart: '2026-07-01', gasDeliveryEnd: '2026-07-31', swingPct: 15, gasDayType: 'STANDARD', nominationType: 'INTERRUPTIBLE' }, createdAt: '2026-06-15T14:30:00Z', updatedAt: '2026-06-15T14:30:00Z' },
  { tradeId: 7, tradeReference: 'TRD-2026-00007', tradeDate: '2026-06-20', executionDatetime: '2026-06-20T10:00:00Z', commodityType: 'OIL', tradeType: 'PHYSICAL', direction: 'SELL', counterpartyId: 7, counterpartyName: 'Vitol SA', traderId: 1, traderCode: 'JDO', bookId: 1, bookCode: 'CRUDE-PROP', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: 1, productCode: 'BRENT-CRUDE', marketId: 5, marketCode: 'OTC_NS_CRUDE', pricingRuleId: 2, pricingRuleCode: 'DIFF-URALS-MED', quantity: 750000, uomCode: 'BBL', price: 79.95, currencyCode: 'USD', incotermCode: 'CIF', deliveryLocationCode: 'ROTTERDAM', periodCode: 'M2026-07', settlementType: 'PHYSICAL', status: 'CONFIRMED', notes: 'Urals Med grade, 5-day BWAVE pricing', amendmentNumber: 0, isLatestVersion: true, oilDetail: { crudeGrade: 'URALS', apiGravity: 31.8, sulphurPct: 1.35, loadLocationCode: 'RAS-TANURA', dischargeLocationCode: 'ROTTERDAM', vesselName: 'FRONT ALTAIR', laycanStart: '2026-07-15', laycanEnd: '2026-07-18', blDate: null, norsTenderedDate: null, codDate: null, pipelineId: null }, createdAt: '2026-06-20T10:00:00Z', updatedAt: '2026-06-20T10:00:00Z' },
  { tradeId: 8, tradeReference: 'TRD-2026-00008', tradeDate: '2026-06-22', executionDatetime: '2026-06-22T11:30:00Z', commodityType: 'AGRICULTURAL', tradeType: 'PHYSICAL', direction: 'BUY', counterpartyId: 8, counterpartyName: 'Cargill International SA', traderId: 2, traderCode: 'ASM', bookId: 3, bookCode: 'GAS-EU-TRADE', legalEntityId: 1, legalEntityName: 'SmartETRM Trading Ltd', productId: null, productCode: 'WHEAT-EU', marketId: null, marketCode: null, pricingRuleId: null, pricingRuleCode: null, quantity: 5000, uomCode: 'MT', price: 225.50, currencyCode: 'EUR', incotermCode: 'FOB', deliveryLocationCode: 'ROTTERDAM', periodCode: 'M2026-08', settlementType: 'PHYSICAL', status: 'DRAFT', notes: 'EU milling wheat, protein min 12%', amendmentNumber: 0, isLatestVersion: true, agriDetail: { cropYear: 2026, gradeQuality: 'EU MILLING WHEAT MIN 12% PROTEIN', originCountry: 'FR', deliveryBasis: 'FOB ROUEN' }, createdAt: '2026-06-22T11:30:00Z', updatedAt: '2026-06-22T11:30:00Z' },
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
      const idx = store.findIndex((r) => r[idField] === Number(params.id));
      if (idx === -1) return problem(404, 'Not Found', `${String(idField)} ${params.id} not found.`);
      const input = (await request.json()) as Partial<T>;
      store[idx] = { ...store[idx], ...input };
      return HttpResponse.json(store[idx]);
    }),
    http.patch(`${API}/${path}/:id/deactivate`, ({ params }) => {
      const idx = store.findIndex((r) => r[idField] === Number(params.id));
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
  { pisId: 1, priceIndexId: 1, priceIndexCode: 'DTBRT', priceIndexName: 'Platts Dated Brent', priceSourceId: 1, sourceCode: 'PLATTS', sourceName: 'S&P Global Platts', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'PCAAS00', sourceTicker: null, priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 2, priceIndexId: 1, priceIndexCode: 'DTBRT', priceIndexName: 'Platts Dated Brent', priceSourceId: 3, sourceCode: 'BLOOMBERG', sourceName: 'Bloomberg', sourceRole: 'BACKUP', sourceFieldCode: null, sourceTicker: 'PCAAS00 Index', priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 3, priceIndexId: 2, priceIndexCode: 'WTI-NYMEX', priceIndexName: 'NYMEX WTI Front Month', priceSourceId: 6, sourceCode: 'NYMEX_DATA', sourceName: 'CME Group Market Data', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'CL_SETTLE', sourceTicker: 'CL1', priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 4, priceIndexId: 3, priceIndexCode: 'TTF-ICE', priceIndexName: 'ICE TTF Natural Gas', priceSourceId: 5, sourceCode: 'ICE_DATA', sourceName: 'ICE Data Services', sourceRole: 'PRIMARY_MTM', sourceFieldCode: null, sourceTicker: 'TTF', priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 5, priceIndexId: 6, priceIndexCode: 'LME-CU-CASH', priceIndexName: 'LME Copper Cash', priceSourceId: 7, sourceCode: 'LME_DATA', sourceName: 'LME Official Prices', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'CU_OFFICIAL', sourceTicker: 'LMCADY', priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 6, priceIndexId: 6, priceIndexCode: 'LME-CU-CASH', priceIndexName: 'LME Copper Cash', priceSourceId: 3, sourceCode: 'BLOOMBERG', sourceName: 'Bloomberg', sourceRole: 'BACKUP', sourceFieldCode: null, sourceTicker: 'LMCADY Comdty', priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
  { pisId: 7, priceIndexId: 9, priceIndexCode: 'ARGUS-URALS', priceIndexName: 'Argus Urals Med', priceSourceId: 2, sourceCode: 'ARGUS', sourceName: 'Argus Media', sourceRole: 'PRIMARY_MTM', sourceFieldCode: 'AP-0001', sourceTicker: null, priceMultiplier: 1, priceOffset: 0, effectiveFrom: '2020-01-01', effectiveTo: null, isActive: true },
];

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
    const row = { ...input, marketProductId: nextId(), marketId: Number(params.id), createdAt: now() };
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
    const row = { ...input, tradeId: nextId(), tradeReference: `TRD-${year}-${seq}`, amendmentNumber: 0, isLatestVersion: true, createdAt: now(), updatedAt: now() };
    tradesStore.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.put(`${API}/trades/:id`, async ({ params, request }) => {
    const idx = (tradesStore as Array<Record<string, unknown>>).findIndex((t) => t.tradeId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Trade ${params.id} not found.`);
    const input = (await request.json()) as Record<string, unknown>;
    (tradesStore as Array<Record<string, unknown>>)[idx] = { ...(tradesStore as Array<Record<string, unknown>>)[idx], ...input, updatedAt: now() };
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

  // Reference data lookups for trade capture dropdowns
  http.get(`${API}/counterparties`, () => HttpResponse.json([
    { counterpartyId: 1, counterpartyCode: 'SHELL-TRD', name: 'Shell Trading International' },
    { counterpartyId: 2, counterpartyCode: 'BP-OIL', name: 'BP Oil Trading' },
    { counterpartyId: 3, counterpartyCode: 'EQUINOR', name: 'Equinor Energy AS' },
    { counterpartyId: 4, counterpartyCode: 'GLENCORE', name: 'Glencore Metals' },
    { counterpartyId: 5, counterpartyCode: 'RWE-ST', name: 'RWE Supply & Trading' },
    { counterpartyId: 6, counterpartyCode: 'CENTRICA', name: 'Centrica Energy Trading' },
    { counterpartyId: 7, counterpartyCode: 'VITOL', name: 'Vitol SA' },
    { counterpartyId: 8, counterpartyCode: 'CARGILL', name: 'Cargill International SA' },
    { counterpartyId: 9, counterpartyCode: 'TRAFIGURA', name: 'Trafigura PTE Ltd' },
    { counterpartyId: 10, counterpartyCode: 'MERCURIA', name: 'Mercuria Energy Trading SA' },
  ])),
  http.get(`${API}/legal-entities`, () => HttpResponse.json([
    { legalEntityId: 1, entityCode: 'SETRM-LTD', name: 'SmartETRM Trading Ltd', countryCode: 'GB' },
    { legalEntityId: 2, entityCode: 'SETRM-NL', name: 'SmartETRM BV Netherlands', countryCode: 'NL' },
    { legalEntityId: 3, entityCode: 'SETRM-SG', name: 'SmartETRM Pte Ltd Singapore', countryCode: 'SG' },
  ])),
  http.get(`${API}/incoterms`, () => HttpResponse.json([
    { incotermId: 1, incotermCode: 'FOB', incotermName: 'Free On Board', applicableModes: 'SEA' },
    { incotermId: 2, incotermCode: 'CIF', incotermName: 'Cost Insurance Freight', applicableModes: 'SEA' },
    { incotermId: 3, incotermCode: 'CFR', incotermName: 'Cost and Freight', applicableModes: 'SEA' },
    { incotermId: 4, incotermCode: 'DES', incotermName: 'Delivered Ex Ship', applicableModes: 'SEA' },
    { incotermId: 5, incotermCode: 'DAP', incotermName: 'Delivered at Place', applicableModes: 'ALL' },
    { incotermId: 6, incotermCode: 'FCA', incotermName: 'Free Carrier', applicableModes: 'ALL' },
    { incotermId: 7, incotermCode: 'EXW', incotermName: 'Ex Works', applicableModes: 'ALL' },
  ])),
];

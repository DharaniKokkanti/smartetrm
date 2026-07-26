import ExcelJS from 'exceljs';
import { downloadBlob } from '@features/tier1/legal-entity/excelTemplate';
import { PERIOD_TYPES, PERIOD_STATUS_CODES } from './types';
import type { MarketProductLinkOption } from './types';

export { downloadBlob };

export const PERIOD_COLUMNS = [
  { header: 'Market Code*', key: 'marketCode', width: 14 },
  { header: 'Product Code*', key: 'productCode', width: 16 },
  { header: 'Period Code*', key: 'periodCode', width: 16 },
  { header: 'Period Name*', key: 'periodName', width: 24 },
  { header: 'Period Type*', key: 'periodType', width: 14 },
  { header: 'Start Date* (YYYY-MM-DD)', key: 'startDate', width: 18 },
  { header: 'End Date* (YYYY-MM-DD)', key: 'endDate', width: 18 },
  { header: 'Exch Product Code', key: 'exchProductCode', width: 16 },
  { header: 'First Trade Date', key: 'firstTradeDate', width: 16 },
  { header: 'Expiry Date', key: 'expiryDate', width: 16 },
  { header: 'Last Trade Date', key: 'lastTradeDate', width: 16 },
  { header: 'Option Exp Date', key: 'optionExpDate', width: 16 },
  { header: 'Settlement Date', key: 'settlementDate', width: 16 },
  { header: 'First Notice Date', key: 'firstNoticeDate', width: 16 },
  { header: 'Last Notice Date', key: 'lastNoticeDate', width: 16 },
  { header: 'Delivery Start', key: 'deliveryStartDate', width: 16 },
  { header: 'Delivery End', key: 'deliveryEndDate', width: 16 },
  { header: 'Pricing Calendar', key: 'pricingCalendarCode', width: 16 },
  { header: 'Settlement Calendar', key: 'settlementCalendarCode', width: 18 },
  { header: 'Status', key: 'statusCode', width: 12 },
  { header: 'Notes', key: 'notes', width: 30 },
] as const;

/** Downloadable upload template — headers, one example row, and reference
 *  sheets listing valid period types/statuses and today's market/product
 *  combinations (an admin has to pick a real Market Code + Product Code
 *  pair, matching an existing market_product row). */
export async function generatePeriodTemplate(marketProducts: MarketProductLinkOption[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ETRM';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Periods');
  sheet.columns = PERIOD_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };

  sheet.addRow({
    marketCode: marketProducts[0]?.marketCode ?? 'NYMEX',
    productCode: marketProducts[0]?.productCode ?? 'WTI',
    periodCode: 'FEB-27',
    periodName: 'February 2027',
    periodType: 'MONTH',
    startDate: '2027-02-01',
    endDate: '2027-02-28',
    exchProductCode: 'CLG27',
    firstTradeDate: '',
    expiryDate: '2027-01-20',
    lastTradeDate: '2027-01-20',
    optionExpDate: '',
    settlementDate: '2027-01-20',
    firstNoticeDate: '2027-01-24',
    lastNoticeDate: '',
    deliveryStartDate: '',
    deliveryEndDate: '',
    pricingCalendarCode: '',
    settlementCalendarCode: '',
    statusCode: 'OPEN',
    notes: '',
  });

  const refSheet = workbook.addWorksheet('Valid Values');
  refSheet.columns = [
    { header: 'period_type', key: 'pt', width: 16 },
    { header: 'status_code', key: 'sc', width: 16 },
    { header: 'market_code / product_code', key: 'mp', width: 30 },
  ];
  refSheet.getRow(1).font = { bold: true };
  const maxRows = Math.max(PERIOD_TYPES.length, PERIOD_STATUS_CODES.length, marketProducts.length);
  for (let i = 0; i < maxRows; i++) {
    refSheet.addRow({
      pt: PERIOD_TYPES[i] ?? '',
      sc: PERIOD_STATUS_CODES[i] ?? '',
      mp: marketProducts[i] ? `${marketProducts[i].marketCode} / ${marketProducts[i].productCode}` : '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

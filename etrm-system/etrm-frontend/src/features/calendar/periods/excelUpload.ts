import ExcelJS from 'exceljs';
import { PERIOD_TYPES, PERIOD_STATUS_CODES } from './types';
import type { MarketProductLinkOption, Period, PeriodUploadRow } from './types';

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in value) return String(value.text ?? '');
  if (typeof value === 'object' && 'result' in value) return String(value.result ?? '');
  return String(value).trim();
}

function cellDate(value: ExcelJS.CellValue): string | null {
  const text = cellText(value);
  if (!text) return null;
  return Number.isNaN(Date.parse(text)) ? null : new Date(text).toISOString().slice(0, 10);
}

/**
 * Parses an uploaded .xlsx into validated rows — mirrors
 * parseLegalEntityUpload's convention: duplicates (same period_code within
 * one market_product, whether against existing rows or within the same
 * upload batch) are REJECTED with a reason, never silently skipped or
 * merged.
 */
export function parsePeriodUpload(
  file: File,
  existingPeriods: Period[],
  marketProducts: MarketProductLinkOption[],
): Promise<PeriodUploadRow[]> {
  return (async () => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const seenInBatch = new Set<string>();
    const rows: PeriodUploadRow[] = [];

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      if (row.cellCount === 0 || row.values === undefined || (row.values as []).length === 0) continue;

      const marketCode = cellText(row.getCell(1).value).toUpperCase();
      const productCode = cellText(row.getCell(2).value).toUpperCase();
      const periodCode = cellText(row.getCell(3).value).toUpperCase();
      const periodName = cellText(row.getCell(4).value);
      const periodType = cellText(row.getCell(5).value).toUpperCase();
      const startDate = cellDate(row.getCell(6).value);
      const endDate = cellDate(row.getCell(7).value);
      const exchProductCode = cellText(row.getCell(8).value) || null;
      const firstTradeDate = cellDate(row.getCell(9).value);
      const expiryDate = cellDate(row.getCell(10).value);
      const lastTradeDate = cellDate(row.getCell(11).value);
      const optionExpDate = cellDate(row.getCell(12).value);
      const settlementDate = cellDate(row.getCell(13).value);
      const firstNoticeDate = cellDate(row.getCell(14).value);
      const lastNoticeDate = cellDate(row.getCell(15).value);
      const deliveryStartDate = cellDate(row.getCell(16).value);
      const deliveryEndDate = cellDate(row.getCell(17).value);
      const pricingCalendarCode = cellText(row.getCell(18).value) || null;
      const settlementCalendarCode = cellText(row.getCell(19).value) || null;
      const statusRaw = cellText(row.getCell(20).value).toUpperCase();
      const notes = cellText(row.getCell(21).value) || null;

      if (!marketCode && !productCode && !periodCode) continue;

      const errors: string[] = [];
      if (!periodCode) errors.push('Period Code is required.');
      if (!periodName) errors.push('Period Name is required.');
      if (!(PERIOD_TYPES as readonly string[]).includes(periodType)) {
        errors.push(`Period Type must be one of: ${PERIOD_TYPES.join(', ')}.`);
      }
      if (!startDate) errors.push('Start Date is required and must be a valid date.');
      if (!endDate) errors.push('End Date is required and must be a valid date.');

      const mp = marketProducts.find(
        (m) => m.marketCode?.toUpperCase() === marketCode && m.productCode?.toUpperCase() === productCode,
      );
      if (!mp) {
        errors.push(`No market product found for Market Code "${marketCode}" / Product Code "${productCode}".`);
      }

      const statusCode = (PERIOD_STATUS_CODES as readonly string[]).includes(statusRaw) ? statusRaw : 'OPEN';

      const dupKey = mp ? `${mp.marketProductLinkId}::${periodCode}` : null;
      if (periodCode && mp) {
        const existsAlready = existingPeriods.some(
          (p) => p.marketProductLinkId === mp.marketProductLinkId && p.periodCode.toUpperCase() === periodCode,
        );
        if (existsAlready) {
          errors.push(`Period Code "${periodCode}" already exists for this market product.`);
        } else if (dupKey && seenInBatch.has(dupKey)) {
          errors.push(`Period Code "${periodCode}" is duplicated within this upload for the same market product.`);
        } else if (dupKey) {
          seenInBatch.add(dupKey);
        }
      }

      rows.push({
        _rowNumber: rowNum,
        _errors: errors,
        marketProductLinkId: mp?.marketProductLinkId ?? 0,
        periodCode,
        periodName,
        exchProductCode,
        periodType: periodType as PeriodUploadRow['periodType'],
        isRolling: false,
        rollOffset: null,
        rollUnit: null,
        isTradingPeriod: true,
        isRiskPeriod: true,
        isSettlementPeriod: false,
        startDate: startDate ?? '',
        endDate: endDate ?? '',
        deliveryStartDate,
        deliveryEndDate,
        curveLabel: null,
        firstTradeDate,
        expiryDate,
        lastTradeDate,
        optionExpDate,
        settlementDate,
        firstNoticeDate,
        lastNoticeDate,
        pricingCalendarCode,
        settlementCalendarCode,
        loadType: null,
        gasDayType: null,
        startTimeUtc: null,
        endTimeUtc: null,
        cropYearOffsetMonths: null,
        statusCode: statusCode as PeriodUploadRow['statusCode'],
        notes,
        isActive: true,
        rowVersion: 0,
      });
    }

    return rows;
  })();
}

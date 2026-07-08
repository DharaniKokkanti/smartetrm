import ExcelJS from 'exceljs';
import type { CalendarHoliday, HolidayUploadRow } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object' && 'text' in value) return String(value.text ?? '');
  if (typeof value === 'object' && 'result' in value) return String(value.result ?? '');
  return String(value).trim();
}

function parseYN(raw: string, defaultValue: boolean): boolean {
  const v = raw.trim().toUpperCase();
  if (!v) return defaultValue;
  return v === 'Y' || v === 'YES' || v === 'TRUE';
}

/**
 * Parses an uploaded .xlsx of holiday dates for a single calendar. Duplicates
 * are REJECTED, not upserted — same convention as the legal-entity upload —
 * against both the calendar's existing holiday dates and duplicate dates
 * within this batch (mirrors the DB's uq_holiday_date (calendar_id, holiday_date)).
 */
export async function parseHolidayUpload(
  file: File,
  calendarId: number,
  existingHolidays: CalendarHoliday[],
): Promise<HolidayUploadRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const existingDates = new Set(existingHolidays.map((h) => h.holidayDate));
  const seenInBatch = new Set<string>();
  const rows: HolidayUploadRow[] = [];

  // header row = 1, data starts row 2
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    if (row.cellCount === 0 || row.values === undefined || (row.values as []).length === 0) continue;

    const holidayDate = cellText(row.getCell(1).value);
    const holidayName = cellText(row.getCell(2).value);
    const settlementRaw = cellText(row.getCell(3).value);
    const tradingRaw = cellText(row.getCell(4).value);

    if (!holidayDate && !holidayName) continue;

    const errors: string[] = [];
    if (!DATE_RE.test(holidayDate) || Number.isNaN(Date.parse(holidayDate))) {
      errors.push('Date must be a valid date in YYYY-MM-DD format.');
    }
    if (!holidayName) errors.push('Holiday Name is required.');

    if (DATE_RE.test(holidayDate)) {
      if (existingDates.has(holidayDate)) {
        errors.push(`A holiday already exists on ${holidayDate} for this calendar — row rejected.`);
      } else if (seenInBatch.has(holidayDate)) {
        errors.push(`${holidayDate} is duplicated within this upload — row rejected.`);
      } else {
        seenInBatch.add(holidayDate);
      }
    }

    rows.push({
      _rowNumber: rowNum,
      _errors: errors,
      calendarId,
      holidayDate,
      holidayName,
      isSettlementHoliday: parseYN(settlementRaw, true),
      isTradingHoliday: parseYN(tradingRaw, true),
    });
  }

  return rows;
}

import ExcelJS from 'exceljs';

export const HOLIDAY_COLUMNS = [
  { header: 'Date* (YYYY-MM-DD)', key: 'holidayDate', width: 20 },
  { header: 'Holiday Name*', key: 'holidayName', width: 32 },
  { header: 'Settlement Holiday (Y/N)', key: 'isSettlementHoliday', width: 22 },
  { header: 'Trading Holiday (Y/N)', key: 'isTradingHoliday', width: 20 },
] as const;

/** Generates the downloadable holiday upload template for a single calendar —
 *  headers plus one example row. Calendar is fixed by context (the drawer the
 *  user downloaded it from), so it isn't a column in the sheet. */
export async function generateHolidayTemplate(calendarCode: string): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ETRM';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${calendarCode} Holidays`);
  sheet.columns = HOLIDAY_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  sheet.addRow({
    holidayDate: '2027-01-01',
    holidayName: "New Year's Day",
    isSettlementHoliday: 'Y',
    isTradingHoliday: 'Y',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

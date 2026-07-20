import ExcelJS from 'exceljs';
import type { ColumnMetadata, ReferenceDataRow } from '@models/referenceData';
import dayjs from 'dayjs';

/** Columns a bulk upload never asks for — server-managed, same set the
 *  Add/Edit form already hides (see ReferenceDataTable's editableColumns
 *  filter, which is where uploadableColumns below draws from). */
export interface UploadRow {
  rowNumber: number;
  values: ReferenceDataRow;
  errors: string[];
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in value) return String(value.text ?? '');
  if (typeof value === 'object' && 'result' in value) return String(value.result ?? '');
  return String(value).trim();
}

/**
 * Downloads a .xlsx template for the given table: header row = column
 * labels (in the same left-to-right order as uploadableColumns), plus a
 * second "instructions" row documenting the expected format for any column
 * whose plain-text representation isn't self-evident (enum's allowed
 * values, foreign_key's "enter the numeric id" convention, boolean's Y/N,
 * date's YYYY-MM-DD) — bulk-upload users fill in a spreadsheet with no UI
 * hints otherwise, unlike the Add/Edit form's Select/DatePicker/Switch.
 */
export async function downloadUploadTemplate(tableName: string, columns: ColumnMetadata[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(tableName);
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.name, width: 24 }));

  const instructions: Record<string, string> = {};
  columns.forEach((c) => {
    if (c.kind === 'enum' && c.enumValues) instructions[c.name] = `One of: ${c.enumValues.join(', ')}`;
    else if (c.kind === 'foreign_key') instructions[c.name] = 'Enter the numeric id';
    else if (c.kind === 'boolean') instructions[c.name] = 'Y or N';
    else if (c.kind === 'date') instructions[c.name] = 'YYYY-MM-DD';
    else if (!c.nullable) instructions[c.name] = 'Required';
  });
  const instructionRow = sheet.addRow(columns.map((c) => instructions[c.name] ?? ''));
  instructionRow.font = { italic: true, color: { argb: 'FF888888' } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tableName}-upload-template.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function coerceCell(col: ColumnMetadata, raw: string): { value: ReferenceDataRow[string]; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    if (!col.nullable) return { value: null, error: `${col.label} is required.` };
    return { value: null, error: null };
  }
  switch (col.kind) {
    case 'number': {
      const n = Number(trimmed);
      return Number.isNaN(n) ? { value: null, error: `${col.label} must be a number.` } : { value: n, error: null };
    }
    case 'boolean': {
      const upper = trimmed.toUpperCase();
      if (['Y', 'YES', 'TRUE', '1'].includes(upper)) return { value: true, error: null };
      if (['N', 'NO', 'FALSE', '0'].includes(upper)) return { value: false, error: null };
      return { value: null, error: `${col.label} must be Y or N.` };
    }
    case 'date': {
      const d = dayjs(trimmed);
      return d.isValid()
        ? { value: d.format('YYYY-MM-DD'), error: null }
        : { value: null, error: `${col.label} is not a valid date (use YYYY-MM-DD).` };
    }
    case 'enum': {
      const match = col.enumValues?.find((v) => v.toUpperCase() === trimmed.toUpperCase());
      return match
        ? { value: match, error: null }
        : { value: null, error: `${col.label} must be one of: ${col.enumValues?.join(', ')}.` };
    }
    case 'foreign_key': {
      const n = Number(trimmed);
      return Number.isNaN(n) ? { value: null, error: `${col.label} must be a numeric id.` } : { value: n, error: null };
    }
    default:
      return { value: trimmed, error: null };
  }
}

/** Parses an uploaded .xlsx against the table's real column metadata —
 *  matches header cells to columns by label (case-insensitive), so a
 *  template downloaded via downloadUploadTemplate() round-trips exactly,
 *  but doesn't require exact column order if a user reorders columns.
 *  Blank rows are skipped; every other row is returned with its own error
 *  list rather than aborting the whole batch on the first bad row. */
export async function parseUploadFile(file: File, columns: ColumnMetadata[]): Promise<UploadRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const columnByIndex = new Map<number, ColumnMetadata>();
  headerRow.eachCell((cell, colNumber) => {
    const label = cellText(cell.value).toLowerCase();
    const col = columns.find((c) => c.label.toLowerCase() === label || c.name.toLowerCase() === label);
    if (col) columnByIndex.set(colNumber, col);
  });

  const rows: UploadRow[] = [];
  // row 1 = header, row 2 = instructions (see downloadUploadTemplate) — data starts row 3.
  for (let rowNum = 3; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    if (row.cellCount === 0) continue;
    const values: ReferenceDataRow = {};
    const errors: string[] = [];
    let hasAnyValue = false;

    columnByIndex.forEach((col, colNumber) => {
      const raw = cellText(row.getCell(colNumber).value);
      if (raw !== '') hasAnyValue = true;
      const { value, error } = coerceCell(col, raw);
      values[col.name] = value;
      if (error) errors.push(error);
    });

    if (!hasAnyValue) continue;
    rows.push({ rowNumber: rowNum, values, errors });
  }
  return rows;
}

import ExcelJS from 'exceljs';
import { ENTITY_TYPES, type LegalEntity, type LegalEntityUploadRow } from './types';

const ISO2 = /^[A-Z]{2}$/;
const ISO3 = /^[A-Z]{3}$/;

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in value) return String(value.text ?? '');
  if (typeof value === 'object' && 'result' in value) return String(value.result ?? '');
  return String(value).trim();
}

/**
 * Parses an uploaded .xlsx into validated rows. Per the original prototype's
 * explicit design choice: duplicates are REJECTED, not upserted and not
 * silently skipped — every rejected row carries a reason so the user can
 * fix and re-upload rather than wondering what happened to it.
 *
 * Validates against the row itself (required fields, enum/format) AND
 * against the entity_code of every existing legal entity already in the
 * system, plus duplicate entity_codes within the same upload batch.
 */
export async function parseLegalEntityUpload(
  file: File,
  existingEntities: LegalEntity[],
): Promise<LegalEntityUploadRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const existingCodes = new Set(existingEntities.map((e) => e.entityCode.toUpperCase()));
  const seenInBatch = new Set<string>();
  const rows: LegalEntityUploadRow[] = [];

  // header row = 1, data starts row 2
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    if (row.cellCount === 0 || row.values === undefined || (row.values as []).length === 0) continue;

    const entityCode = cellText(row.getCell(1).value).toUpperCase();
    const entityName = cellText(row.getCell(2).value);
    const shortName = cellText(row.getCell(3).value);
    const leiCode = cellText(row.getCell(4).value) || null;
    const entityType = cellText(row.getCell(5).value).toUpperCase();
    const parentEntityCode = cellText(row.getCell(6).value);
    const jurisdiction = cellText(row.getCell(7).value).toUpperCase();
    const incorporationCountry = cellText(row.getCell(8).value).toUpperCase() || null;
    const incorporationNumber = cellText(row.getCell(9).value) || null;
    const baseCurrency = cellText(row.getCell(10).value).toUpperCase();
    const defaultTimezone = cellText(row.getCell(11).value) || null;
    const regulator = cellText(row.getCell(12).value) || null;
    const regulatoryLicence = cellText(row.getCell(13).value) || null;
    const isInternalRaw = cellText(row.getCell(14).value).toUpperCase();
    const goLiveDate = cellText(row.getCell(15).value) || null;
    const notes = cellText(row.getCell(16).value) || null;

    // skip fully blank rows
    if (!entityCode && !entityName && !shortName) continue;

    const errors: string[] = [];

    if (!entityCode) errors.push('Entity Code is required.');
    if (!entityName) errors.push('Entity Name is required.');
    if (!shortName) errors.push('Short Name is required.');
    if (!ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])) {
      errors.push(`Entity Type must be one of: ${ENTITY_TYPES.join(', ')}.`);
    }
    if (!ISO2.test(jurisdiction)) errors.push('Jurisdiction must be a 2-letter ISO country code.');
    if (incorporationCountry && !ISO2.test(incorporationCountry)) {
      errors.push('Incorporation Country must be a 2-letter ISO country code.');
    }
    if (!ISO3.test(baseCurrency)) errors.push('Base Currency must be a 3-letter ISO currency code.');
    if (goLiveDate && Number.isNaN(Date.parse(goLiveDate))) {
      errors.push('Go Live Date is not a valid date (use YYYY-MM-DD).');
    }

    // duplicate rejection — against existing DB records and within this batch
    if (entityCode) {
      if (existingCodes.has(entityCode)) {
        errors.push(`Entity Code "${entityCode}" already exists — row rejected.`);
      } else if (seenInBatch.has(entityCode)) {
        errors.push(`Entity Code "${entityCode}" is duplicated within this upload — row rejected.`);
      } else {
        seenInBatch.add(entityCode);
      }
    }

    const parentEntityId = parentEntityCode
      ? (existingEntities.find((e) => e.entityCode.toUpperCase() === parentEntityCode.toUpperCase())
          ?.legalEntityId ?? null)
      : null;
    if (parentEntityCode && parentEntityId === null) {
      errors.push(`Parent Entity Code "${parentEntityCode}" was not found.`);
    }

    rows.push({
      _rowNumber: rowNum,
      _errors: errors,
      entityCode,
      entityName,
      shortName,
      leiCode,
      entityType: (errors.length ? entityType : (entityType as (typeof ENTITY_TYPES)[number])) as never,
      parentInd: parentEntityId !== null,
      parentEntityId,
      jurisdiction,
      incorporationCountry,
      incorporationNumber,
      baseCurrency,
      defaultTimezone,
      regulator,
      regulatoryLicence,
      isInternal: isInternalRaw === 'Y' || isInternalRaw === 'YES' || isInternalRaw === 'TRUE',
      goLiveDate,
      notes,
    });
  }

  return rows;
}

import ExcelJS from 'exceljs';

export const LEGAL_ENTITY_COLUMNS = [
  { header: 'Entity Code*', key: 'entityCode', width: 16 },
  { header: 'Entity Name*', key: 'entityName', width: 32 },
  { header: 'Short Name*', key: 'shortName', width: 20 },
  { header: 'LEI Code', key: 'leiCode', width: 22 },
  { header: 'Entity Type*', key: 'entityType', width: 18 },
  { header: 'Parent Entity Code', key: 'parentEntityCode', width: 18 },
  { header: 'Jurisdiction* (ISO 2)', key: 'jurisdiction', width: 18 },
  { header: 'Incorporation Country (ISO 2)', key: 'incorporationCountry', width: 24 },
  { header: 'Incorporation Number', key: 'incorporationNumber', width: 20 },
  { header: 'Base Currency* (ISO 3)', key: 'baseCurrency', width: 18 },
  { header: 'Default Timezone', key: 'defaultTimezone', width: 22 },
  { header: 'Regulator', key: 'regulator', width: 20 },
  { header: 'Regulatory Licence', key: 'regulatoryLicence', width: 20 },
  { header: 'Is Internal (Y/N)', key: 'isInternal', width: 14 },
  { header: 'Go Live Date (YYYY-MM-DD)', key: 'goLiveDate', width: 20 },
  { header: 'Notes', key: 'notes', width: 30 },
] as const;

/** Generates the downloadable upload template — headers, one example row,
 *  and a reference sheet listing valid entity_type values (mirrors the DB
 *  CHECK constraint so the spreadsheet can't be filled out wrong). */
export async function generateLegalEntityTemplate(entityTypeCodes: string[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ETRM';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Legal Entities');
  sheet.columns = LEGAL_ENTITY_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F3864' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  sheet.addRow({
    entityCode: 'ACME-UK',
    entityName: 'Acme Trading UK Limited',
    shortName: 'Acme UK',
    leiCode: '213800ABCDEFGH12345',
    entityType: 'TRADING_COMPANY',
    parentEntityCode: '',
    jurisdiction: 'GB',
    incorporationCountry: 'GB',
    incorporationNumber: '01234567',
    baseCurrency: 'GBP',
    defaultTimezone: 'Europe/London',
    regulator: 'FCA',
    regulatoryLicence: '',
    isInternal: 'Y',
    goLiveDate: '2026-01-01',
    notes: '',
  });

  const refSheet = workbook.addWorksheet('Valid Values');
  refSheet.columns = [{ header: 'entity_type', key: 'v', width: 24 }];
  refSheet.getRow(1).font = { bold: true };
  entityTypeCodes.forEach((t) => refSheet.addRow({ v: t }));

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

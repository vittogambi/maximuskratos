import * as XLSX from 'xlsx';
import type { SheetMatrix, WorkbookTables } from './read-table';

export function loadWorkbookTables(bytes: Buffer): WorkbookTables {
  const workbook = XLSX.read(bytes, { type: 'buffer', raw: true, cellDates: false });
  const tables: WorkbookTables = {};
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    tables[name] = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      raw: true,
    }) as SheetMatrix;
  }
  return tables;
}

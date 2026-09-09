import { asString } from '../slug';

export type Row = Record<string, unknown>;
export type SheetMatrix = unknown[][];

export interface WorkbookTables {
  [sheetName: string]: SheetMatrix;
}

export function readSheetTable(
  workbook: WorkbookTables,
  sheetName: string,
  idColumn: string,
): { headers: string[]; rows: Row[] } {
  const matrix = workbook[sheetName];
  if (!matrix) {
    throw new Error(`missing sheet ${sheetName}`);
  }

  let headerIndex = -1;
  let headers: string[] = [];
  for (let i = 0; i < matrix.length; i += 1) {
    const first = matrix[i]?.[0];
    if (asString(first) === idColumn) {
      headerIndex = i;
      headers = (matrix[i] ?? []).map((cell, index) => {
        const name = asString(cell);
        return name || `COL${index}`;
      });
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error(`sheet ${sheetName} has no header starting with ${idColumn}`);
  }

  const rows: Row[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i += 1) {
    const values = matrix[i] ?? [];
    const first = values[0];
    if (first == null) continue;
    const record: Row = {};
    for (let c = 0; c < headers.length; c += 1) {
      record[headers[c]] = values[c] ?? null;
    }
    rows.push(record);
  }

  return { headers, rows };
}

export function catalogsByCategory(
  rows: Row[],
): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const row of rows) {
    const category = asString(row.Categoría ?? row.Categoria);
    const value = asString(row.Valor);
    if (!category || !value) continue;
    if (!out[category]) out[category] = new Set();
    out[category].add(value);
  }
  return out;
}

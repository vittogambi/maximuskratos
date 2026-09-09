import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadWorkbookTables } from '../import/load-xlsx';
import { loadSourceMappings, type SourceMapping } from '../source-mapping';

export type LegacyCatalogStatus = 'Conservado' | 'Transformado' | 'Sin confirmar';

export type LegacyCatalogRow = {
  element: string;
  usage: string;
  equivalent: string;
  status: LegacyCatalogStatus;
  catalog: string;
  human_group: string | null;
};

const SKIP_CATALOGS = new Set([
  'PUNTAJE',
  'SECCIÓN 5: IDENTIDAD',
  'SECCION 5: IDENTIDAD',
  'VALOR RASGOS PERSONALIDAD',
  '(CÓD.: E-PER-006)',
  '(COD.: E-PER-006)',
]);

const GENERIC_VALUES = new Set([
  'si',
  'no',
  'otro',
  'otros',
  'todas',
  'todos',
  'otras',
  'nada',
  'bajo',
  'alto',
  'media',
  'medio',
  'regular',
  'bien',
  'mal',
  'mas o menos',
  'usualmente',
]);

const FICHA_NUMERIC = new Set(['EDAD', 'ALTURA', 'PESO', 'PESO ', '% GRASA']);

function cell(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function usageFor(catalog: string): string {
  const name = catalog.toUpperCase();
  if (name.includes('IKIGAI')) return 'ayuda / ejemplo de propósito';
  if (name.includes('ARQUETIPO') || name.includes('SOMBRA')) return 'arquetipo';
  if (name.includes('VALOR')) return 'catálogo de valores';
  if (name.includes('ANTEPASAD') || name.includes('CUALIDAD')) return 'catálogo auxiliar';
  if (name.includes('OBJETIVO') || name.includes('VECTOR')) return 'catálogo auxiliar';
  if (name.includes('FICHA') || FICHA_NUMERIC.has(catalog)) return 'dato de ficha';
  return 'ayuda / opción de formulario';
}

function skipValue(value: string): boolean {
  if (!value) return true;
  if (/^otro:\s*_/i.test(value)) return true;
  const asNumber = Number(String(value).replace(',', '.'));
  if (Number.isFinite(asNumber) && asNumber > 5) return true;
  return false;
}

function isCatalogHeader(headerRow: number, col: number, name: string): boolean {
  if (!name || SKIP_CATALOGS.has(name.toUpperCase()) || FICHA_NUMERIC.has(name)) return false;
  if (headerRow === 1) return true;
  if (headerRow === 9) return col === 0 || col === 1 || /IKIGAI/i.test(name);
  if (headerRow === 21) return col === 0 || col === 2;
  if (headerRow === 33) return col === 0 || col === 2;
  return false;
}

function collectColumn(
  rows: unknown[][],
  headerRow: number,
  col: number,
  headerRows: number[],
): string[] {
  const values: string[] = [];
  let empty = 0;
  for (let i = headerRow + 1; i < rows.length; i += 1) {
    const value = cell(rows[i]?.[col]);
    if (headerRows.includes(i) && value && isCatalogHeader(i, col, value)) break;
    if (!value) {
      empty += 1;
      if (empty >= 8) break;
      continue;
    }
    empty = 0;
    if (skipValue(value)) continue;
    values.push(value);
  }
  return values;
}

export function extractNoBorrarItems(rows: unknown[][]): Array<{ catalog: string; value: string }> {
  const headerRows = [1, 9, 21, 33, 38];
  const seen = new Set<string>();
  const items: Array<{ catalog: string; value: string }> = [];

  const add = (catalog: string, value: string) => {
    const name = catalog.trim();
    const text = value.trim();
    if (!name || SKIP_CATALOGS.has(name.toUpperCase())) return;
    if (FICHA_NUMERIC.has(name)) return;
    const key = `${normalize(name)}::${normalize(text)}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ catalog: name, value: text });
  };

  add('Ficha antropométrica', 'Edad, altura, peso y porcentaje de grasa');

  for (const headerRow of [1, 9, 21, 33]) {
    const header = rows[headerRow] ?? [];
    for (let col = 0; col < header.length; col += 1) {
      const catalog = cell(header[col]);
      if (!isCatalogHeader(headerRow, col, catalog)) continue;
      const name = headerRow === 33 && col === 0 ? 'Sexo (ficha)' : catalog;
      for (const value of collectColumn(rows, headerRow, col, headerRows)) add(name, value);
    }
  }

  return items;
}

export function ideaLabelsFromSource(src: string): string[] {
  const labels = new Set<string>();
  for (const match of src.matchAll(/idea\(\s*'[^']+',\s*'([^']+)'/g)) {
    if (match[1]) labels.add(match[1]);
  }
  for (const match of src.matchAll(/\{ id: '[^']+', label: '([^']+)' \}/g)) {
    if (match[1]) labels.add(match[1]);
  }
  return [...labels];
}

export function humanGroupForCatalog(catalog: string): string | null {
  const name = catalog.toUpperCase();
  if (name.includes('ARQUETIPO') || name.includes('SOMBRA') || name.includes('ANTEPASAD') || name.includes('CUALIDAD')) {
    return 'FID-LINAJE';
  }
  if (name.includes('IKIGAI')) return 'FID-IKIGAI';
  return null;
}

function classifyFromMappings(
  value: string,
  mappings: SourceMapping[],
): { status: LegacyCatalogStatus; equivalent: string } {
  const needle = normalize(value);
  if (!needle || GENERIC_VALUES.has(needle) || needle.length < 8) {
    return { status: 'Sin confirmar', equivalent: 'sin evidencia estructurada' };
  }
  const hits = mappings.filter(
    (item) => item.source_question && normalize(item.source_question) === needle,
  );
  if (!hits.length) {
    return { status: 'Sin confirmar', equivalent: 'sin evidencia estructurada' };
  }
  const unchanged = hits.find((item) => item.transformation_type === 'UNCHANGED');
  if (unchanged) {
    return { status: 'Conservado', equivalent: unchanged.v2_question_id };
  }
  const hit = hits[0]!;
  return { status: 'Transformado', equivalent: hit.v2_question_id };
}

export function diffNoBorrarCatalogs(input: {
  noBorrar: unknown[][];
  mappings?: SourceMapping[];
}): LegacyCatalogRow[] {
  const mappings = input.mappings ?? [];
  return extractNoBorrarItems(input.noBorrar).map((item) => {
    const classified = classifyFromMappings(item.value, mappings);
    return {
      element: item.value,
      usage: usageFor(item.catalog),
      equivalent: classified.equivalent,
      status: classified.status,
      catalog: item.catalog,
      human_group: humanGroupForCatalog(item.catalog),
    };
  });
}

export function loadLegacyCatalogDiffFromRepo(repoRoot: string): LegacyCatalogRow[] {
  const forms = loadWorkbookTables(
    readFileSync(resolve(repoRoot, 'docs/philosophy/260529-FORMULARIOS-X-PASO.xlsx')),
  );
  return diffNoBorrarCatalogs({
    noBorrar: forms['NO BORRAR'] ?? [],
    mappings: loadSourceMappings(),
  });
}

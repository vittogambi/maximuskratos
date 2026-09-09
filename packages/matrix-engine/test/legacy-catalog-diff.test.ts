import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractNoBorrarItems, loadLegacyCatalogDiffFromRepo } from '../src/legacy/no-borrar-diff';
import { loadWorkbookTables } from '../src/import/load-xlsx';
import { readFileSync } from 'node:fs';

const ROOT = resolve(__dirname, '../../..');

describe('NO BORRAR catalog diff', () => {
  const rows = loadLegacyCatalogDiffFromRepo(ROOT);

  it('reads the full auxiliary sheet instead of inventing the inventory', () => {
    const forms = loadWorkbookTables(
      readFileSync(resolve(ROOT, 'docs/philosophy/260529-FORMULARIOS-X-PASO.xlsx')),
    );
    const extracted = extractNoBorrarItems(forms['NO BORRAR'] ?? []);
    expect(extracted.some((item) => item.value === 'El Rey')).toBe(true);
    expect(extracted.some((item) => /IKIGAI/i.test(item.catalog))).toBe(true);
    expect(rows.length).toBe(extracted.length);
    expect(rows.length).toBeGreaterThan(80);
  });

  it('does not treat a string coincidence as a methodological mapping', () => {
    const rey = rows.find((item) => item.element === 'El Rey');
    expect(rey?.status).toBe('Sin confirmar');
    expect(rey?.usage).toBe('arquetipo');
    expect(rey?.human_group).toBe('FID-LINAJE');

    const generic = rows.filter((item) => /^(sí|si|no|< 3)$/i.test(item.element.trim()));
    expect(generic.every((item) => item.status === 'Sin confirmar')).toBe(true);
    expect(rows.every((item) => item.equivalent !== 'IKIGAI')).toBe(true);
    expect(rows.every((item) => item.equivalent !== '08_PROPOSITO')).toBe(true);
  });

  it('does not treat MIG-14 as proof that every auxiliary item was preserved', () => {
    expect(rows.some((item) => item.status === 'Sin confirmar')).toBe(true);
    expect(rows.filter((item) => item.status === 'Transformado' && item.equivalent === 'IKIGAI')).toHaveLength(0);
  });
});

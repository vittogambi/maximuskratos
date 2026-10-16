import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..', '..');
const ROOTS = [
  'apps/api/src/instrumentos',
  'apps/api/src/journey',
  'apps/api/src/diagnostic',
  'packages/database/src',
];

const FORBIDDEN = [
  /@mk\/matrix-engine/,
  /@mk\/experience-engine/,
  /evaluateSafety/,
  /matrix-v2/,
  /MATRIZ_MAESTRA/,
  /\bP-PRO-\d/,
  /\bD-(REL|FIN|CUE|MEN)-\d+/,
];

function files(dir: string): string[] {
  const full = join(ROOT, dir);
  try {
    return readdirSync(full).flatMap((name) => {
      const path = join(full, name);
      if (statSync(path).isDirectory()) return files(join(dir, name));
      if (name === 'lab-reset.ts') return [];
      return path.endsWith('.ts') ? [path] : [];
    });
  } catch {
    return [];
  }
}

describe('formulario completo isolation from matrix v2', () => {
  it('does not import matrix engines from the member journey', () => {
    const hits: string[] = [];
    for (const file of ROOTS.flatMap(files)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) hits.push(`${file}: ${pattern}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('would notice a forbidden helper import', () => {
    const sample = "import { evaluateSafety } from '@mk/matrix-engine';";
    expect(FORBIDDEN.some((pattern) => pattern.test(sample))).toBe(true);
  });
});

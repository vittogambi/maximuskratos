import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('LAB-069 no Hoja de Ruta in the Lab editor', () => {
  it('does not mention HdRP or Hoja de Ruta in Lab components', () => {
    try {
      const found = execFileSync(
        'rg',
        ['-n', 'Hoja de Ruta|E-PER-HdRP|Contrato de compromiso soberano', 'apps/web/components/admin/lab'],
        { cwd: resolve(__dirname, '../../..'), encoding: 'utf8' },
      );
      expect(found).toBe('');
    } catch (error) {
      const err = error as { status?: number };
      expect(err.status).toBe(1);
    }
  });
});

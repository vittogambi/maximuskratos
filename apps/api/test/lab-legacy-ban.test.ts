import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../../..');

function rg(pattern: string, paths: string[]) {
  try {
    return execFileSync('rg', ['-n', pattern, ...paths], { cwd: ROOT, encoding: 'utf8' });
  } catch (error) {
    const err = error as { status?: number; stdout?: string };
    if (err.status === 1) return '';
    throw error;
  }
}

describe('LAB-067 legacy form logic stays out of the Lab', () => {
  it('does not copy forbidden diagnosis strings into product code', () => {
    expect(
      rg('NIVEL REESTRUCTURACIÓN|NIVEL CALIBRACIÓN|Desalineación Total|Mentalidad exploradora e ideal', [
        'apps/web/components/admin/lab',
        'apps/api/src/lab',
        'packages/matrix-engine/src',
      ]),
    ).toBe('');
  });
});

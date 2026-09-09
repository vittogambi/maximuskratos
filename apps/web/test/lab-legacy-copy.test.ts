import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
  }
  return files;
}

describe('LAB-050 and LAB-053 copy bans', () => {
  it('has no juicio in Lab UI copy', () => {
    const files = walk(join(root, 'components/admin/lab'));
    const hits = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return [...text.matchAll(/juicio/gi)].map(() => file);
    });
    expect(hits).toEqual([]);
  });

  it('has no stepper symbols in Lab UI', () => {
    const files = [...walk(join(root, 'components/admin')), ...walk(join(root, 'lib/lab-ui'))];
    const hits = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return [...text.matchAll(/[✓●○🔒⚠]/g)].map((match) => `${file}:${match[0]}`);
    });
    expect(hits).toEqual([]);
  });
});

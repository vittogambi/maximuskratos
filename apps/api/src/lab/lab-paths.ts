import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MatrixDefinition } from '@mk/matrix-engine';

function firstExisting(candidates: string[]): string | null {
  return candidates.find((path) => existsSync(path)) ?? null;
}

export function frozenDefinitionPath(): string {
  const found = firstExisting([
    join(process.cwd(), 'packages/matrix-engine/definitions/matrix-v2.0.json'),
    join(process.cwd(), '../../packages/matrix-engine/definitions/matrix-v2.0.json'),
    join(__dirname, '../../../../packages/matrix-engine/definitions/matrix-v2.0.json'),
  ]);
  if (!found) {
    throw new Error('matrix-v2.0.json not found');
  }
  return found;
}

export function casebookDir(): string {
  const found = firstExisting([
    join(process.cwd(), 'packages/matrix-engine/test/cases/rafa-casebook'),
    join(process.cwd(), '../../packages/matrix-engine/test/cases/rafa-casebook'),
    join(__dirname, '../../../../packages/matrix-engine/test/cases/rafa-casebook'),
  ]);
  if (!found) {
    throw new Error('rafa-casebook not found');
  }
  return found;
}

export function loadFrozenDefinition(): MatrixDefinition {
  return JSON.parse(readFileSync(frozenDefinitionPath(), 'utf8')) as MatrixDefinition;
}

export function listCasebookFiles(): string[] {
  return readdirSync(casebookDir())
    .filter((name) => /^R\d+[A-Z]?\.json$/.test(name))
    .sort();
}

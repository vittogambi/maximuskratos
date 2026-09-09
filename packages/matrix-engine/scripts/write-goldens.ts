import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { MatrixDefinition } from '../src/types';
import { listFixtureCases, runMaterialized, stripGeneratedAt, goldenName } from '../src/fixtures/run-fixture';

function loadFrozen(): MatrixDefinition {
  return JSON.parse(
    readFileSync(resolve(__dirname, '../definitions/matrix-v2.0.json'), 'utf8'),
  ) as MatrixDefinition;
}

async function main(): Promise<void> {
  const definition = loadFrozen();
  const outDir = resolve(__dirname, '../test/golden');
  await mkdir(outDir, { recursive: true });
  const fixtures = listFixtureCases(definition);
  let written = 0;
  for (const fixture of fixtures) {
    if (!fixture.golden) continue;
    const snapshot = stripGeneratedAt(runMaterialized(definition, fixture));
    const name = goldenName(fixture.family_key, fixture.case_id);
    await writeFile(resolve(outDir, `${name}.json`), `${JSON.stringify(snapshot, null, 2)}\n`);
    written += 1;
  }
  process.stdout.write(`wrote ${written} goldens from ${fixtures.length} fixture cases\n`);
}

void main();

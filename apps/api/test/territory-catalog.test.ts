import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildTerritorySourcesFromCatalog,
  territoryCoverage,
  territoryForSourceRef,
} from '../src/instrumentos/territory-catalog';

type Catalog = { modules: { questions: { sourceRef: string }[] }[] };

function loadCatalog(revision: number): Catalog {
  const path = join(__dirname, '../../../packages/database/definitions', `formulario-completo@${revision}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as Catalog;
}

function allQuestions(catalog: Catalog) {
  return catalog.modules.flatMap((module) => module.questions);
}

describe('territory catalog @2..@6', () => {
  for (const revision of [2, 3, 4, 5, 6]) {
    it(`revision @${revision} has disjoint territories covering audit and radiografías`, () => {
      const questions = allQuestions(loadCatalog(revision));
      const byTerritory = buildTerritorySourcesFromCatalog(questions);
      const assigned = new Set(Object.values(byTerritory).flat());
      const inScope = questions.map((q) => q.sourceRef).filter((ref) => territoryForSourceRef(ref) != null);
      for (const ref of inScope) {
        expect(assigned.has(ref)).toBe(true);
      }
      const flat = Object.values(byTerritory).flat();
      expect(new Set(flat).size).toBe(flat.length);
      for (const ref of questions.map((q) => q.sourceRef)) {
        if (ref.includes('E-PER-') || ref.includes('R56') || ref.includes('R57')) {
          expect(territoryForSourceRef(ref)).toBeNull();
        }
      }
      if (revision === 6) {
        // eslint-disable-next-line no-console
        console.log('Territory refs for Rafa (@6):', JSON.stringify(byTerritory, null, 2));
      }
    });
  }

  it('hides condition-origin questions from the denominator', () => {
    const coverage = territoryCoverage(
      [
        { sourceRef: 'formulario-v1:E-AUD-001!R26', exceptionOrigin: 'CONDITION' },
        { sourceRef: 'formulario-v1:E-AUD-001!R27' },
      ],
      {},
    );
    const mental = coverage.find((row) => row.territory === 'MENTALIDAD');
    expect(mental?.required).toBe(1);
  });

  it('PENDING does not resolve; exceptions do', () => {
    const questions = [{ sourceRef: 'formulario-v1:E-AUD-001!R6' }, { sourceRef: 'formulario-v1:E-AUD-001!R7' }];
    const pending = territoryCoverage(questions, {
      'formulario-v1:E-AUD-001!R6': { exceptionKind: 'PENDING' },
      'formulario-v1:E-AUD-001!R7': { exceptionKind: 'UNKNOWN' },
    });
    const row = pending.find((item) => item.territory === 'MENTALIDAD');
    expect(row?.settled).toBe(1);
    expect(row?.pending).toBe(1);
    expect(row?.exceptions.UNKNOWN).toBe(1);
  });
});

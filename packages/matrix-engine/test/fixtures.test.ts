import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIXTURE_KEYS, fixtureCatalog } from '../src/fixtures/catalog';
import { goldenName, listFixtureCases, runMaterialized, stripGeneratedAt } from '../src/fixtures/run-fixture';
import { itemWeightedDomainScore } from '../src/engine/score';
import { loadFrozen } from './helpers/assessment';

const definition = loadFrozen();
const GOLDEN_DIR = resolve(__dirname, 'golden');

describe('P0-08 fixtures', () => {
  const families = fixtureCatalog(definition);
  const cases = listFixtureCases(definition);

  it('exposes the 32 catalog keys', () => {
    expect(FIXTURE_KEYS).toHaveLength(32);
    expect(families.map((family) => family.key)).toEqual([...FIXTURE_KEYS]);
  });

  it('has 25 golden families', () => {
    expect(families.filter((family) => family.golden)).toHaveLength(25);
    expect(families.filter((family) => !family.golden).map((family) => family.key)).toEqual([
      'F19_SAME_SCORE_DIFFERENT_CAUSE',
      'F20_SAME_PRIORITY_DIFFERENT_CONTEXT',
      'F21_MIND_HIGH_BODY_LOW',
      'F22_FINANCE_ONLY_LOW',
      'F23_PURPOSE_EMPTY',
      'F25_FULL_VS_BRANCH',
      'F27_CONTRADICTORY',
    ]);
  });

  it('runs every fixture case without throwing', () => {
    for (const fixture of cases) {
      expect(() => runMaterialized(definition, fixture)).not.toThrow();
    }
  });

  it('matches frozen goldens', () => {
    for (const fixture of cases.filter((item) => item.golden)) {
      const snapshot = stripGeneratedAt(runMaterialized(definition, fixture));
      const path = resolve(GOLDEN_DIR, `${goldenName(fixture.family_key, fixture.case_id)}.json`);
      const expected = JSON.parse(readFileSync(path, 'utf8')) as typeof snapshot;
      expect(snapshot, goldenName(fixture.family_key, fixture.case_id)).toEqual(expected);
    }
  });

  it('INV-20: purpose never has domain score, state or plan', () => {
    for (const fixture of cases) {
      const snapshot = runMaterialized(definition, fixture);
      expect(snapshot.purpose.domain_score).toBeNull();
      expect(snapshot.purpose.stage).toBeNull();
      expect(snapshot.priority.purpose_excluded).toBe(true);
      expect(snapshot.domains.every((domain) => domain.key !== 'PROPÓSITO')).toBe(true);
    }
  });

  it('INV-33: snapshot domains are the four plan domains', () => {
    const snapshot = runMaterialized(definition, cases[0]);
    expect(snapshot.domains.map((domain) => domain.key)).toEqual([
      'MENTALIDAD',
      'RELACIONES',
      'FINANZAS',
      'CUERPO',
    ]);
  });

  it('F11 documents the 39/40 cliff', () => {
    const k37 = cases.find((item) => item.family_key === 'F11_BOUNDARY_39_40' && item.case_id === 'k37');
    const k38 = cases.find((item) => item.family_key === 'F11_BOUNDARY_39_40' && item.case_id === 'k38');
    const a = runMaterialized(definition, k37!);
    const b = runMaterialized(definition, k38!);
    const menA = a.domains.find((item) => item.key === 'MENTALIDAD');
    const menB = b.domains.find((item) => item.key === 'MENTALIDAD');
    expect(menA?.score_display).toBe(39);
    expect(menA?.state_final).toBe('CONTENCIÓN');
    expect(menB?.score_display).toBe(40);
    expect(menB?.state_final).toBe('ESTABILIZACIÓN');
  });

  it('F04 critical is not diluted by score 100', () => {
    const fixture = cases.find((item) => item.family_key === 'F04_CRITICAL_HIGH_SCORE');
    const snapshot = runMaterialized(definition, fixture!);
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.score_display).toBe(100);
    expect(cuerpo?.state_final).toBe('CONTENCIÓN');
    expect(snapshot.recommendations.primary?.executable_recommendation).toBe('BLOCKED');
  });

  it('F26 AUD_ONLY does not classify', () => {
    const fixture = cases.find((item) => item.family_key === 'F26_AUD_ONLY_NO_CLASSIFY');
    const snapshot = runMaterialized(definition, fixture!);
    expect(snapshot.domains.every((domain) => domain.classification === 'NO_CLASIFICADO')).toBe(true);
    expect(snapshot.priority.domain).toBeNull();
    expect(snapshot.recommendations.primary).toBeNull();
  });

  it('F18 exposes the single-item CUERPO dimension', () => {
    const fixture = cases.find((item) => item.family_key === 'F18_SINGLE_ITEM_DIMENSION');
    const snapshot = runMaterialized(definition, fixture!);
    const seguridad = snapshot.dimensions.find((item) => item.key === 'CUE.seguridad_y_restricciones');
    expect(seguridad?.score).toBe(0);
    expect(seguridad?.items_scoreable).toBe(1);
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    const weighted = itemWeightedDomainScore(definition, fixture!.responses, 'CUERPO');
    expect(cuerpo?.score).not.toBeNull();
    expect(weighted).not.toBeNull();
    expect(cuerpo?.score).not.toBe(weighted);
  });

  it('INV-15: F25 coverage_definition matches across policies', () => {
    const full = cases.find((item) => item.family_key === 'F25_FULL_VS_BRANCH' && item.case_id === 'full');
    const branch = cases.find((item) => item.family_key === 'F25_FULL_VS_BRANCH' && item.case_id === 'branch');
    const a = runMaterialized(definition, full!);
    const b = runMaterialized(definition, branch!);
    for (let i = 0; i < a.domains.length; i += 1) {
      expect(a.domains[i]?.coverage_definition).toBe(b.domains[i]?.coverage_definition);
    }
  });
});

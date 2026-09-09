import { beforeAll, describe, expect, it } from 'vitest';
import type { MatrixDefinition } from '../src/types';
import { loadFrozen, makeResponses, runFrozen } from './helpers/assessment';

let definition: MatrixDefinition;

beforeAll(() => {
  definition = loadFrozen();
});

describe('P0-05 priority, maintenance and recommendation', () => {
  it('all high: tie breaks to MENTALIDAD and lookup is unique', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 5, riskValue: 0 }),
    );
    expect(snapshot.domains.every((domain) => domain.state_final === 'EXPANSIÓN')).toBe(true);
    expect(snapshot.priority.domain).toBe('MENTALIDAD');
    expect(snapshot.priority.tier).toBe('STATE');
    expect(snapshot.maintenance.domain).toBe('CUERPO');
    expect(snapshot.recommendations.primary?.plan_id).toBe('MEN-EXP');
    expect(snapshot.recommendations.maintenance?.plan_id).toBe('CUE-EXP');
    expect(snapshot.recommendations.primary?.executable_recommendation).toBe('ALLOWED');
    expect(snapshot.recommendations.primary?.label).toBe('MATRIX RECOMMENDATION');
  });

  it('all low: CONTENCIÓN everywhere, MENTALIDAD still wins the tie', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 1, riskValue: 0 }),
    );
    expect(snapshot.priority.domain).toBe('MENTALIDAD');
    expect(snapshot.recommendations.primary?.plan_id).toBe('MEN-CON');
  });

  it('critical priority beats a worse state elsewhere', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        firstScoreable: { MENTALIDAD: { count: 24, value: 1 } },
        answers: { 'D-CUE-05': 1 },
      }),
    );
    expect(snapshot.priority.domain).toBe('CUERPO');
    expect(snapshot.priority.tier).toBe('CRITICA');
    expect(snapshot.domains.find((item) => item.key === 'MENTALIDAD')?.state_final).toBe(
      'CONTENCIÓN',
    );
  });

  it('high priority wins over state', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 1,
        riskValue: 0,
        answers: { 'D-FIN-09': { raw: 1, qualitativeConfirmed: true } },
      }),
    );
    expect(snapshot.priority.domain).toBe('FINANZAS');
    expect(snapshot.priority.tier).toBe('ALTA');
  });

  it('unclassified without alert cannot be priority', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        firstScoreable: {
          MENTALIDAD: { count: 4, value: 3 },
          RELACIONES: { count: 4, value: 3 },
          FINANZAS: { count: 4, value: 3 },
          CUERPO: { count: 4, value: 3 },
        },
        riskValue: 0,
      }),
    );
    expect(snapshot.domains.every((domain) => domain.classification === 'NO_CLASIFICADO')).toBe(
      true,
    );
    expect(snapshot.priority.domain).toBeNull();
    expect(snapshot.priority.reason).toBe('INSUFFICIENT_COVERAGE');
    expect(snapshot.maintenance.domain).toBeNull();
    expect(snapshot.recommendations.primary).toBeNull();
  });

  it('unclassified with ALTA can be priority without fabricating a plan', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        firstScoreable: {
          MENTALIDAD: { count: 4, value: 3 },
          RELACIONES: { count: 4, value: 3 },
          FINANZAS: { count: 9, value: 3 },
          CUERPO: { count: 4, value: 3 },
        },
        answers: { 'D-FIN-09': { raw: 2, qualitativeConfirmed: null } },
      }),
    );
    expect(snapshot.priority.domain).toBe('FINANZAS');
    expect(snapshot.priority.tier).toBe('ALTA');
    expect(snapshot.domains.find((item) => item.key === 'FINANZAS')?.state_final).toBeNull();
    expect(snapshot.recommendations.primary?.plan_id).toBeNull();
  });

  it('INV-20 and INV-33: PROPÓSITO is excluded and domains has exactly four plan scopes', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 4, riskValue: 0 }),
    );
    expect(snapshot.domains).toHaveLength(4);
    expect(snapshot.domains.map((item) => item.key)).toEqual([
      'MENTALIDAD',
      'RELACIONES',
      'FINANZAS',
      'CUERPO',
    ]);
    expect(snapshot.priority.domain).not.toBe('PROPÓSITO');
    expect(snapshot.purpose.domain_score).toBeNull();
    expect(snapshot.purpose.stage).toBeNull();
    expect(snapshot.priority.purpose_excluded).toBe(true);
    expect(snapshot.priority.criteria_not_evaluated.map((item) => item.criterion)).toEqual([
      'deterioro',
      'palanca',
      'proposito',
    ]);
  });

  it('maintenance is the second classified candidate and at most one', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 3, riskValue: 0 }),
    );
    expect(snapshot.priority.domain).toBe('MENTALIDAD');
    expect(snapshot.maintenance.domain).toBe('CUERPO');
    expect(snapshot.recommendations.maintenance?.plan_id).toBe('CUE-EST');
  });

  it('does not invent a second plan when only one candidate is classified', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        firstScoreable: { MENTALIDAD: { count: 24, value: 3 } },
        riskValue: 0,
      }),
    );
    expect(snapshot.priority.domain).toBe('MENTALIDAD');
    expect(snapshot.maintenance.domain).toBeNull();
    expect(snapshot.recommendations.maintenance).toBeNull();
  });
});

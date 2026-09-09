import { beforeAll, describe, expect, it } from 'vitest';
import type { MatrixDefinition } from '../src/types';
import { loadFrozen, makeResponses, runFrozen } from './helpers/assessment';

let definition: MatrixDefinition;

beforeAll(() => {
  definition = loadFrozen();
});

describe('P0-04 safety and overrides', () => {
  it('INV-03: critical alert is not diluted by score 100', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-05': 1 },
      }),
    );
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.score_display).toBe(100);
    expect(cuerpo?.state_from_band).toBe('EXPANSIÓN');
    expect(cuerpo?.state_final).toBe('CONTENCIÓN');
    expect(cuerpo?.state_source).toBe('FORCED_BY_R-OVR-01');
    expect(snapshot.safety.alerts.some((alert) => alert.question_id === 'D-CUE-05' && alert.fired)).toBe(
      true,
    );
  });

  it('INV-32: override source is kept when the band already was CONTENCIÓN', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        firstScoreable: { CUERPO: { count: 21, value: 1 } },
        answers: { 'D-CUE-05': 1 },
      }),
    );
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.state_from_band).toBe('CONTENCIÓN');
    expect(cuerpo?.state_final).toBe('CONTENCIÓN');
    expect(cuerpo?.state_source).toBe('FORCED_BY_R-OVR-01');
  });

  it('caps a classified domain at ESTABILIZACIÓN when ALTA fires', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-01': 1 },
      }),
    );
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.state_from_band).toBe('EXPANSIÓN');
    expect(cuerpo?.state_final).toBe('ESTABILIZACIÓN');
    expect(cuerpo?.state_source).toBe('CAPPED_BY_R-OVR-02');
    expect(cuerpo?.score_display).toBe(100);
  });

  it('INV-19: MEDIA never changes state', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-03': 1 },
      }),
    );
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.state_final).toBe('EXPANSIÓN');
    expect(cuerpo?.state_source).toBe('BAND');
    expect(
      snapshot.safety.alerts.some((alert) => alert.question_id === 'D-CUE-03' && alert.fired),
    ).toBe(true);
  });

  it('INV-18: state_final different from the band always has an override source', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-05': 1 },
      }),
    );
    for (const domain of snapshot.domains) {
      if (domain.state_final !== domain.state_from_band) {
        expect(domain.state_source === 'FORCED_BY_R-OVR-01' || domain.state_source === 'CAPPED_BY_R-OVR-02').toBe(
          true,
        );
      }
    }
  });

  it('forces CONTENCIÓN and null score when CRITICA meets NO_CLASIFICADO', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        firstScoreable: { CUERPO: { count: 4, value: 5 } },
        answers: { 'D-CUE-05': 1 },
      }),
    );
    const cuerpo = snapshot.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.classification).toBe('NO_CLASIFICADO');
    expect(cuerpo?.score).toBeNull();
    expect(cuerpo?.state_from_band).toBeNull();
    expect(cuerpo?.state_final).toBe('CONTENCIÓN');
    expect(cuerpo?.state_source).toBe('FORCED_BY_R-OVR-01');
  });

  it('INV-28: ALTA on an unclassified domain leaves state and plan null', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        firstScoreable: { FINANZAS: { count: 9, value: 5 } },
        answers: { 'D-FIN-09': { raw: 1, qualitativeConfirmed: true } },
      }),
    );
    const finanzas = snapshot.domains.find((item) => item.key === 'FINANZAS');
    expect(finanzas?.classification).toBe('NO_CLASIFICADO');
    expect(finanzas?.state_final).toBeNull();
    expect(finanzas?.score).toBeNull();
    expect(snapshot.priority.domain).toBe('FINANZAS');
    expect(snapshot.priority.tier).toBe('ALTA');
    expect(snapshot.recommendations.primary?.plan_id).toBeNull();
    expect(snapshot.recommendations.primary?.executable_recommendation).toBe('BLOCKED');
    expect(snapshot.recommendations.primary?.derivation_required).toBe(true);
  });

  it('LAB-SAFETY-01 FULL / PARTIAL / SUPPRESSED_BY_INPUT', () => {
    const full = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-REL-15': { raw: 1, qualitativeConfirmed: true } },
      }),
    );
    const partial = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-REL-15': { raw: 1, qualitativeConfirmed: null } },
      }),
    );
    const suppressed = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-REL-15': { raw: 1, qualitativeConfirmed: false } },
      }),
    );

    const fullRel = full.domains.find((item) => item.key === 'RELACIONES');
    const partialRel = partial.domains.find((item) => item.key === 'RELACIONES');
    const suppressedRel = suppressed.domains.find((item) => item.key === 'RELACIONES');

    expect(full.safety.alerts.find((alert) => alert.question_id === 'D-REL-15')).toMatchObject({
      fired: true,
      condition_confirmed: 'FULL',
      override_applied: 'R-OVR-01',
    });
    expect(partial.safety.alerts.find((alert) => alert.question_id === 'D-REL-15')).toMatchObject({
      fired: true,
      condition_confirmed: 'PARTIAL',
      override_applied: 'R-OVR-01',
    });
    expect(suppressed.safety.alerts.find((alert) => alert.question_id === 'D-REL-15')).toMatchObject({
      fired: false,
      condition_confirmed: 'SUPPRESSED_BY_INPUT',
      override_applied: null,
    });
    expect(fullRel?.state_final).toBe('CONTENCIÓN');
    expect(partialRel?.state_final).toBe('CONTENCIÓN');
    expect(suppressedRel?.state_final).toBe('EXPANSIÓN');
    expect(suppressedRel?.state_source).toBe('BAND');
  });

  it('INV-14: unanswered risk is NOT_EVALUATED, never SAFE', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 3 }),
    );
    expect(snapshot.safety.not_evaluated).toEqual([
      'D-REL-15',
      'D-FIN-09',
      'D-CUE-01',
      'D-CUE-02',
      'D-CUE-03',
      'D-CUE-04',
      'D-CUE-05',
      'D-CUE-25',
    ]);
    expect(snapshot.safety.risk_coverage).toBe(0);
    expect(snapshot.safety.safety_incomplete).toBe(true);
    expect(snapshot.safety.alerts).toHaveLength(0);
  });

  it('INV-29: qualitative false records the alert and does not override', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-FIN-09': { raw: 1, qualitativeConfirmed: false } },
      }),
    );
    const finanzas = snapshot.domains.find((item) => item.key === 'FINANZAS');
    expect(finanzas?.state_final).toBe('EXPANSIÓN');
    expect(
      snapshot.safety.alerts.some(
        (alert) =>
          alert.question_id === 'D-FIN-09' &&
          alert.condition_confirmed === 'SUPPRESSED_BY_INPUT',
      ),
    ).toBe(true);
  });

  it('INV-30: active alert blocks executable recommendation and keeps catalog lookup', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-05': 1 },
      }),
    );
    const primary = snapshot.recommendations.primary;
    expect(primary?.domain).toBe('CUERPO');
    expect(primary?.plan_id).toBe('CUE-CON');
    expect(primary?.objectives).toHaveLength(3);
    expect(primary?.activities).toHaveLength(6);
    expect(primary?.executable_recommendation).toBe('BLOCKED');
    expect(primary?.catalog_lookup).toBe(true);
    expect(primary?.activities_unfiltered_warning).toBe(true);
    expect(primary?.derivation_required).toBe(true);
    expect(primary?.label).toBe('MATRIX RECOMMENDATION');
  });

  it('YN_DETAIL fires on 1 and not on 0', () => {
    const yes = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-02': 1 },
      }),
    );
    const no = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-02': 0 },
      }),
    );
    expect(yes.safety.alerts.some((alert) => alert.question_id === 'D-CUE-02' && alert.fired)).toBe(
      true,
    );
    expect(no.safety.alerts.some((alert) => alert.question_id === 'D-CUE-02')).toBe(false);
  });

  it('keeps a finance alert even when another domain is the priority', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: {
          'D-CUE-05': 1,
          'D-FIN-09': { raw: 1, qualitativeConfirmed: true },
        },
      }),
    );
    expect(snapshot.priority.domain).toBe('CUERPO');
    expect(snapshot.priority.tier).toBe('CRITICA');
    const finanzas = snapshot.domains.find((item) => item.key === 'FINANZAS');
    expect(snapshot.safety.alerts.some((alert) => alert.question_id === 'D-FIN-09' && alert.fired)).toBe(
      true,
    );
    expect(finanzas?.state_source).toBe('CAPPED_BY_R-OVR-02');
    expect(finanzas?.state_final).toBe('ESTABILIZACIÓN');
  });

  it('applies critical and high alerts together, with critical winning inside the same domain', () => {
    const across = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: {
          'D-CUE-05': 1,
          'D-FIN-09': { raw: 1, qualitativeConfirmed: true },
        },
      }),
    );
    const cuerpo = across.domains.find((item) => item.key === 'CUERPO');
    const finanzas = across.domains.find((item) => item.key === 'FINANZAS');
    expect(cuerpo?.state_source).toBe('FORCED_BY_R-OVR-01');
    expect(cuerpo?.state_final).toBe('CONTENCIÓN');
    expect(finanzas?.state_source).toBe('CAPPED_BY_R-OVR-02');

    const same = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-05': 1, 'D-CUE-01': 1 },
      }),
    );
    const cuerpoSame = same.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpoSame?.state_source).toBe('FORCED_BY_R-OVR-01');
    expect(cuerpoSame?.state_final).toBe('CONTENCIÓN');
  });
});

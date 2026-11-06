import { describe, expect, it } from 'vitest';
import {
  buildOutcomeContract,
  contractFromPlanRow,
  digestOutcomeContract,
  outcomeCheckDue,
  parseAssessmentStatus,
  mergeReviewWithOutcome,
  outcomeContractMeta,
  reviewHintFromLayers,
  reviseContract,
  suggestIndicatorLink,
} from '../src/journey/plan-outcome-contract';

describe('plan outcome contract', () => {
  it('builds digest for review invalidation', () => {
    const store = {
      current: buildOutcomeContract({
        change: 'Enseñar mi método',
        soughtOutcome: 'Otra persona lo aplica',
        criterion: 'Alguien lo usa sin mi ayuda',
        revision: 2,
      }),
      history: [],
    };
    const digest = digestOutcomeContract(store, {
      status: 'NOT_YET',
      text: 'Nadie lo probó',
      contractRevision: 2,
      observedOn: '2026-10-20',
      periodStart: '2026-10-20',
    });
    expect(digest).toContain('"revision":2');
    expect(digest).toContain('NOT_YET');
  });

  it('does not infer achievement from empty note', () => {
    expect(parseAssessmentStatus('ACHIEVED')).toBe('ACHIEVED');
    expect(parseAssessmentStatus('DONE')).toBeNull();
  });

  it('backfills legacy plans without json contract', () => {
    const store = contractFromPlanRow({
      title: 'Cambio',
      outcome: 'Resultado buscado',
      criterionText: 'Lo veo cuando pasa X',
      criterionStatus: 'CONFIRMED',
      reviewAt: new Date('2026-11-01T12:00:00.000Z'),
    });
    expect(store?.current.soughtOutcome).toBe('Resultado buscado');
    expect(store?.current.criterionStatus).toBe('PROVISIONAL');
  });

  it('versions contract on criterion change', () => {
    const initial = {
      current: buildOutcomeContract({
        change: 'A',
        soughtOutcome: 'B',
        criterion: 'C',
        revision: 1,
      }),
      history: [],
    };
    const next = reviseContract(initial, { criterion: 'C2' }, '2026-10-27');
    expect(next.current.revision).toBe(2);
    expect(next.history).toHaveLength(1);
    expect(next.current.effectiveFrom).toBe('2026-10-27');
  });

  it('suggests indicator link when criterion overlaps question', () => {
    const ref = suggestIndicatorLink('¿Pasó a la etapa que definiste?', {
      ref: 'ind-x@1',
      role: 'RESULT',
      question: '¿Pasó a la etapa que definiste?',
      kind: 'YES_NO',
      better: 'UP',
    });
    expect(ref).toBe('ind-x@1');
  });

  it('review hint separates execution from outcome', () => {
    const hint = reviewHintFromLayers({
      executionLevel: 'SUFFICIENT',
      coverage: 'FULL',
      assessment: 'NOT_YET',
      checkDue: 'DUE',
    });
    expect(hint).toContain('resultado propio');
  });

  it('legacy backfill marks pending fields, not complete agreement', () => {
    const meta = outcomeContractMeta({
      title: 'Antiguo',
      outcome: 'Resultado',
      criterionText: 'Criterio',
      criterionStatus: 'CONFIRMED',
    });
    expect(meta.recoveredFromLegacy).toBe(true);
    expect(meta.complete).toBe(false);
    expect(meta.pendingFields).toContain('EVIDENCE');
  });

  it('outcome assessment governs review while execution unchanged', () => {
    const base = { code: 'KEEP' as const, text: 'Hiciste el plan y hubo avance.' };
    const exec = { assessment: 'NOT_YET' as const, executionLevel: 'SUFFICIENT' };
    const notYet = mergeReviewWithOutcome(base, exec);
    const achieved = mergeReviewWithOutcome(base, { ...exec, assessment: 'ACHIEVED' });
    const insufficient = mergeReviewWithOutcome(base, { ...exec, assessment: 'INSUFFICIENT' });
    expect(notYet.code).toBe('CHECK');
    expect(achieved.code).toBe('KEEP');
    expect(insufficient.code).toBe('NO_RECORDS');
    expect(notYet.outcomeText).toMatch(/resultado que buscabas/);
    expect(notYet.choices).toContain('MODIFY');
    expect(achieved.choices).toEqual(['KEEP', 'REDUCE']);
    expect(insufficient.choices).toEqual(['NO_RECORDS', 'KEEP']);
    expect(notYet.outcomeText).not.toBe(achieved.outcomeText);
  });

  it('check due respects review date', () => {
    const c = buildOutcomeContract({
      change: 'x',
      soughtOutcome: 'y',
      criterion: 'z',
      checkAt: '2026-11-01',
    });
    expect(outcomeCheckDue(c, '2026-10-27')).toBe('NOT_YET');
    expect(outcomeCheckDue(c, '2026-11-02')).toBe('DUE');
  });
});

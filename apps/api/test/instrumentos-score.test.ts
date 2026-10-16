import { describe, expect, it } from 'vitest';
import { alignmentReading, scoreIad, type IadAnswer, type IadId, IAD_IDS } from '../src/instrumentos/iad';
import { decideAction } from '../src/instrumentos/restrictions';
import {
  AUDIT_IDS,
  IDENTITY_ROWS,
  SENSE_ROWS,
  auditId,
  difficultyId,
  identityId,
  personalityId,
  scoreAudit,
  scoreDifficulties,
  scoreIdentity,
  scorePersonality,
  scoreSense,
} from '../src/instrumentos/score';
import { auditSignals, bodyFatAlert, sleepAlert } from '../src/instrumentos/signals';
import type { FormularioAnswer } from '../src/instrumentos/types';

function fill(ids: string[], value: number): FormularioAnswer[] {
  return ids.map((id) => ({ id, value }));
}

function iad(values: number[]): Record<IadId, IadAnswer> {
  return Object.fromEntries(
    IAD_IDS.map((id, index) => [id, { value: values[index], unknown: false }]),
  ) as Record<IadId, IadAnswer>;
}

describe('formulario audit', () => {
  it('sums 23 items to 115 and keeps section 6 out', () => {
    const all = fill(AUDIT_IDS, 5);
    const result = scoreAudit(all);
    expect(AUDIT_IDS).toHaveLength(23);
    expect(result.calculable).toBe(true);
    expect(result.value).toBe(115);
    expect(result.descriptor).toContain('92 a 115');
    expect(scoreSense(fill(SENSE_ROWS.map(auditId), 5)).value).toBe(50);
    expect(scoreAudit([...all, ...fill(SENSE_ROWS.map(auditId), 1)]).value).toBe(115);
  });

  it('does not invent a total or a category when one answer is missing', () => {
    const answers = fill(AUDIT_IDS.slice(1), 5);
    const result = scoreAudit(answers);
    expect(result.value).toBeNull();
    expect(result.calculable).toBe(false);
    expect(result.partial).toBe(110);
    expect(result.descriptor).toContain('parcial');
  });

  it('places the category cuts at 45, 46, 68, 69, 91 and 92', () => {
    const at = (value: number) => scoreAudit(spread(value)).descriptor;
    expect(at(45)).toContain('por debajo de 46');
    expect(at(46)).toContain('46 a 68');
    expect(at(68)).toContain('46 a 68');
    expect(at(69)).toContain('69 a 91');
    expect(at(91)).toContain('69 a 91');
    expect(at(92)).toContain('92 a 115');
  });
});

function spread(total: number): FormularioAnswer[] {
  const answers = fill(AUDIT_IDS, 1);
  let left = total - 23;
  for (const answer of answers) {
    const add = Math.min(4, left);
    answer.value = 1 + add;
    left -= add;
  }
  return answers;
}

describe('formulario alerts', () => {
  it('fires item 1 only at 1, section 3 at 1 and 2, and sections 4 and 5 with the adaptation', () => {
    const answers = fill(AUDIT_IDS, 5);
    const first = answers.find((answer) => answer.id === auditId(6))!;
    first.value = 1;
    const section3 = answers.find((answer) => answer.id === auditId(26))!;
    section3.value = 2;
    const section4 = answers.find((answer) => answer.id === auditId(37))!;
    section4.value = 1;
    const signals = auditSignals(answers);
    expect(signals.find((signal) => signal.questionId === auditId(6))?.status).toBe('FIRED');
    expect(auditSignals(fill(AUDIT_IDS, 2)).find((signal) => signal.questionId === auditId(6))?.status).toBe('NOT_FIRED');
    expect(signals.find((signal) => signal.questionId === auditId(26))?.status).toBe('FIRED');
    const debt = signals.find((signal) => signal.questionId === auditId(37));
    expect(debt?.status).toBe('FIRED');
    expect(debt?.nativeRule).toBe('equals 2');
    expect(debt?.productRule).toContain('adaptation');
  });

  it('treats a declined answer as not evaluated and converts UI percent before the fat rule', () => {
    const answers = fill(AUDIT_IDS, 3);
    answers[0] = { id: auditId(6), value: null, exception: 'DECLINED' };
    expect(auditSignals(answers)[0]?.status).toBe('NOT_EVALUATED');
    expect(sleepAlert('< 6', false).status).toBe('FIRED');
    expect(sleepAlert('6 a 8', false).status).toBe('NOT_FIRED');
    expect(bodyFatAlert(20).status).toBe('FIRED');
    expect(bodyFatAlert(19).status).toBe('NOT_FIRED');
  });
});

describe('identity and difficulties', () => {
  it('keeps 34 and 35 as totals without a false category', () => {
    for (const total of [10, 33, 34, 35, 40]) {
      const answers = fill(IDENTITY_ROWS.map(identityId), 1);
      let left = total - 10;
      for (const answer of answers) {
        const add = Math.min(3, left);
        answer.value = 1 + add;
        left -= add;
      }
      const result = scoreIdentity(answers);
      expect(result.value).toBe(total);
      expect(result.descriptor).not.toContain('FALSE');
      expect(result.descriptor).toContain('en definición');
    }
    expect(scoreIdentity(fill(IDENTITY_ROWS.slice(1).map(identityId), 4)).calculable).toBe(false);
  });

  it('scores five groups of 0 to 18 and does not mix them', () => {
    const answers: FormularioAnswer[] = [];
    for (const group of ['PR', 'ER', 'PY', 'D', 'IN'] as const) {
      for (let index = 1; index <= 9; index += 1) {
        answers.push({ id: difficultyId(group, index), value: index === 1 ? 1 : 2 });
      }
    }
    const result = scoreDifficulties(answers);
    expect(result.value).toBeNull();
    expect(result.descriptor).toContain('separadas');
    const pr = result.parts.PR as { value: number };
    expect(pr.value).toBe(17);
    expect(result.discrepancies.join(' ')).toContain('90');
  });
});

describe('personality and IAD', () => {
  it('inverts the middle item and withholds a factor with a gap', () => {
    const answers = fill(Array.from({ length: 15 }, (_, index) => personalityId(index + 1)), 5);
    answers[1]!.value = 1;
    const result = scorePersonality(answers);
    const opening = result.parts.Apertura as { value: number };
    expect(opening.value).toBeCloseTo((5 + (6 - 1) + 5) / 3);
    answers[2] = { id: personalityId(3), value: null, exception: 'UNKNOWN' };
    const gap = scorePersonality(answers).parts.Apertura as { calculable: boolean; value: number | null };
    expect(gap.calculable).toBe(false);
    expect(gap.value).toBeNull();
  });

  it('reproduces 0, 100, 50 and 58.33 without renormalizing', () => {
    expect(scoreIad(iad([1, 1, 1, 1, 1, 1, 1, 1, 1])).total).toBe(0);
    expect(scoreIad(iad([5, 5, 5, 5, 5, 5, 5, 5, 5])).total).toBe(100);
    const mid = scoreIad(iad([4, 4, 4, 3, 3, 3, 2, 2, 2]));
    expect(mid.E).toBe(75);
    expect(mid.M).toBe(50);
    expect(mid.C).toBe(25);
    expect(mid.total).toBe(50);
    const raised = scoreIad(iad([4, 4, 4, 4, 4, 4, 2, 2, 2]));
    expect(raised.C).toBe(25);
    expect(raised.total).toBeCloseTo(58.333, 2);
    const partial = iad([4, 4, 4, 3, 3, 3, 2, 2, 2]);
    partial.C3 = { value: null, unknown: true };
    const pending = scoreIad(partial);
    expect(pending.total).toBeNull();
    expect(pending.E).toBe(75);
    expect(pending.M).toBe(50);
  });

  it('reads a stored ficha without recomputing it', () => {
    const saved = alignmentReading({
      directionStatus: 'EXPLORANDO',
      iad: {
        methodVersion: 'iad-mk-0.1-borrador',
        savedAt: '2026-10-07T22:00:00.000Z',
        answers: Object.fromEntries(IAD_IDS.map((id) => [id, { value: 3, unknown: false }])),
        results: { E: 75, M: 50, C: 25, total: 50 },
      },
    }, 2);
    expect(saved.status).toBe('saved');
    expect(saved.total).toBe(50);
    expect(saved.revision).toBe(2);
    expect(saved.directionStatus).toBe('EXPLORANDO');
    expect(saved.coverage).toEqual({ answered: 9, required: 9 });
    const partial = alignmentReading({
      iad: {
        answers: { E1: { value: 4, unknown: false }, E2: { value: null, unknown: true } },
        results: { E: null, M: null, C: null, total: null },
      },
    }, 1);
    expect(partial.status).toBe('partial');
    expect(partial.total).toBeNull();
    expect(alignmentReading({}, null).status).toBe('none');
  });
});

describe('restrictions', () => {
  const clear = {
    illness: 'NO' as const,
    injuryHistory: 'YES' as const,
    injuryLimitsNow: false,
    medication: 'NO' as const,
    pain: 'NO' as const,
    medicalLimit: 'NO' as const,
    conversationUnsafe: false,
  };

  it('does not block effort because of a past injury alone', () => {
    expect(decideAction(['PHYSICAL_EXERTION'], clear).allowed).toBe(true);
  });

  it('blocks a current limit and still allows recording to stay outside this check', () => {
    const blocked = decideAction(['PHYSICAL_EXERTION'], { ...clear, medicalLimit: 'YES' });
    expect(blocked.allowed).toBe(false);
    expect(blocked.alternatives.length).toBeGreaterThan(0);
    expect(decideAction(['INVESTMENT'], clear).allowed).toBe(false);
  });
});

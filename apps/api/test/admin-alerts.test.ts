import { describe, expect, it } from 'vitest';
import { withoutInternalAlerts } from '../src/admin/public-reading';
import { alertOccurrenceKey, answersForAlerts } from '../src/instrumentos/alert-store';
import { auditId } from '../src/instrumentos/score';
import { auditSignals } from '../src/instrumentos/signals';

describe('questionnaire alerts', () => {
  it('fires the real audit rule only for the triggering answer', () => {
    const fired = auditSignals([{ id: auditId(6), value: 1 }]).find((signal) => signal.questionId === auditId(6));
    const calm = auditSignals([{ id: auditId(6), value: 5 }]).find((signal) => signal.questionId === auditId(6));
    const unknown = auditSignals(answersForAlerts([{
      revision: 1,
      answeredAt: new Date(),
      skipped: false,
      exceptionKind: 'UNKNOWN',
      freeText: null,
      selectedOptions: [{ value: '0' }],
      question: { sourceRef: auditId(6), instrument: null },
    }])).find((signal) => signal.questionId === auditId(6));
    expect(fired?.status).toBe('FIRED');
    expect(calm?.status).toBe('NOT_FIRED');
    expect(unknown?.status).toBe('NOT_EVALUATED');
  });

  it('keeps occurrence keys inside one account', () => {
    const left = alertOccurrenceKey('user-a', 'session-a', auditId(6), 'alertas-aud@1', 1);
    const right = alertOccurrenceKey('user-b', 'session-a', auditId(6), 'alertas-aud@1', 1);
    expect(left).not.toBe(right);
    expect(left).toContain('user-a');
  });

  it('removes internal alert fields and keeps index signals', () => {
    const clean = withoutInternalAlerts({
      auditTotal: 76,
      alertCount: 4,
      auditAlerts: 2,
      nested: { alertCount: 1, kept: true },
      signals: [{ id: 'E62', raw: 3 }],
    });
    expect(clean).toEqual({
      auditTotal: 76,
      nested: { kept: true },
      signals: [{ id: 'E62', raw: 3 }],
    });
    expect(JSON.stringify(clean)).not.toContain('alertCount');
  });
});

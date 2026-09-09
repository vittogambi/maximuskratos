import { describe, expect, it } from 'vitest';
import {
  countCaseQuestions,
  factualCoverageCopy,
  formatDomainCountLine,
  formatVisibleDetail,
  questionRole,
} from '@/lib/lab-ui/question-counts';

describe('question counters', () => {
  it('splits evaluable, safety and narrative instead of mixing totals', () => {
    const counts = countCaseQuestions([
      { domain: 'CUERPO', scoreable: true, is_risk: false, status: 'ANSWERED' },
      { domain: 'CUERPO', scoreable: true, is_risk: false, status: 'ANSWERED' },
      { domain: 'CUERPO', scoreable: false, is_risk: true, status: 'ANSWERED' },
      { domain: 'CUERPO', scoreable: false, is_risk: false, status: 'ANSWERED' },
      { domain: 'PROPÓSITO', scoreable: false, is_risk: false, status: 'ANSWERED' },
    ]);
    const cuerpo = counts.domains.find((row) => row.domain === 'CUERPO');
    expect(cuerpo).toMatchObject({
      evaluable: 2,
      evaluableAnswered: 2,
      safety: 1,
      narrative: 1,
      visible: 4,
    });
    expect(formatDomainCountLine(cuerpo!)).toBe('2 evaluables · 1 pregunta de seguridad · 1 narrativa');
    expect(formatVisibleDetail(cuerpo!)).toBe('4 respuestas visibles · 2 evaluables · 1 pregunta de seguridad · 1 narrativa');
    expect(formatDomainCountLine({
      domain: 'CUERPO',
      visible: 27,
      visibleAnswered: 8,
      evaluable: 27,
      evaluableAnswered: 8,
      safety: 0,
      safetyAnswered: 0,
      narrative: 0,
      narrativeAnswered: 0,
    })).toBe('8 / 27 evaluables');
  });

  it('never treats a safety question as evaluable', () => {
    expect(questionRole({ domain: 'CUERPO', scoreable: true, is_risk: true, status: 'ANSWERED' })).toBe(
      'safety',
    );
  });

  it('describes coverage without fixture hypotheses', () => {
    const complete = countCaseQuestions(
      ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'].flatMap((domain) =>
        Array.from({ length: 2 }, () => ({
          domain,
          scoreable: true,
          is_risk: false,
          status: 'ANSWERED',
        })),
      ),
    );
    expect(factualCoverageCopy(complete)).toBe('Este caso tiene respuestas en los cuatro ámbitos.');

    const partial = countCaseQuestions([
      { domain: 'FINANZAS', scoreable: true, is_risk: false, status: 'ANSWERED' },
      { domain: 'FINANZAS', scoreable: true, is_risk: false, status: 'UNANSWERED' },
      { domain: 'FINANZAS', scoreable: false, is_risk: true, status: 'ANSWERED' },
    ]);
    expect(factualCoverageCopy(partial)).toContain('Finanzas quedó parcialmente respondido');
    expect(factualCoverageCopy(partial)).toContain('1 pregunta de seguridad respondida');
    expect(factualCoverageCopy(partial)).not.toMatch(/alerta/);
    expect(factualCoverageCopy(partial, 0, true)).toContain('0 alertas activas');
    expect(factualCoverageCopy(partial, 1, true)).toContain('1 alerta activa');
    expect(factualCoverageCopy(partial)).not.toMatch(/crítica|imponerse|debería/);
  });
});

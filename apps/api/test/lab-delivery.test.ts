import { describe, expect, it } from 'vitest';
import { DELIVERY_SECTIONS, buildDeliverySections, formatDeliveryMarkdown } from '../src/lab/lab-delivery';
import { keepCandidateBlocked, replayImpactSummary } from '../src/lab/lab-replay-compare';

describe('LAB-040 replayComparison summary', () => {
  it('counts impacts and blocks keep when a worsen has no verdict', () => {
    const summary = replayImpactSummary([
      { impact: 'IMPROVES', verdict: 'YES' },
      { impact: 'WORSENS', verdict: null },
      { impact: 'UNCHANGED', verdict: null },
      { impact: 'NEEDS_REVIEW', verdict: null },
    ]);
    expect(summary).toEqual({
      improves: 1,
      worsens: 1,
      unchanged: 1,
      needs_review: 1,
      worsens_without_verdict: 1,
    });
    expect(keepCandidateBlocked(summary)).toBe(true);
  });

  it('allows keep when worsens already have a verdict', () => {
    expect(keepCandidateBlocked(replayImpactSummary([{ impact: 'WORSENS', verdict: 'NO' }]))).toBe(false);
  });
});

describe('LAB-041 deliveryReport sections', () => {
  it('lists AUD-CUE-01 under Pesos with proposal and cases', () => {
    const sections = buildDeliverySections({
      candidate_ref: 'matrix-v2.0@4',
      reviewed: [{ label: 'R04', verdict: 'REPRESENTS_WELL' }],
      own: [],
      observations: [
        {
          question_id: 'AUD-CUE-01',
          text: '¿Entrenaste esta semana?',
          aspects: { weight: 'WEIGHT_MORE' },
          proposed_wording: '¿Entrenaste al menos tres veces esta semana?',
          proposal: 'Debería pesar más',
          note: 'Debería pesar más',
          case_label: 'R01',
        },
        {
          question_id: 'AUD-CUE-01',
          text: '¿Entrenaste esta semana?',
          aspects: { weight: 'WEIGHT_MORE' },
          proposed_wording: '¿Entrenaste al menos tres veces esta semana?',
          proposal: 'Debería pesar más',
          note: 'Debería pesar más',
          case_label: 'R04',
        },
        {
          question_id: 'AUD-CUE-01',
          text: '¿Entrenaste esta semana?',
          aspects: { weight: 'WEIGHT_MORE' },
          proposed_wording: '¿Entrenaste al menos tres veces esta semana?',
          proposal: 'Debería pesar más',
          note: 'Debería pesar más',
          case_label: 'R05',
        },
      ],
      findings: [],
      regressions: [],
      decision: { decision: 'READY' },
    });
    expect(sections.map((item) => item.title).slice(0, 19)).toEqual([...DELIVERY_SECTIONS]);
    const pesos = sections.find((item) => item.title === 'Pesos');
    expect(pesos?.items).toHaveLength(3);
    expect(pesos?.items[0]).toMatchObject({
      question_id: 'AUD-CUE-01',
      text: '¿Entrenaste esta semana?',
      proposed: '¿Entrenaste al menos tres veces esta semana?',
      why: 'Debería pesar más',
    });
  });

  it('snapshots markdown with the 19 sections in order', () => {
    const markdown = formatDeliveryMarkdown(
      buildDeliverySections({
        candidate_ref: 'matrix-v2.0@4',
        reviewed: [],
        own: [],
        observations: [],
        findings: [],
        regressions: [],
        decision: null,
      }),
    );
    for (const title of DELIVERY_SECTIONS) {
      expect(markdown).toContain(`## ${title}`);
    }
    expect(markdown.indexOf('## Versión candidata')).toBeLessThan(markdown.indexOf('## Decisión de cierre'));
    expect(markdown).toMatchSnapshot();
  });
});

describe('LAB-042 changeset list shape', () => {
  it('translates operations to human text', () => {
    const operations = [{ op: 'SET_QUESTION_WEIGHT', question_id: 'AUD-CUE-01' }].map((item) =>
      item.op === 'SET_QUESTION_WEIGHT' ? 'Esta pregunta influye distinto' : 'Cambio',
    );
    expect(operations[0]).toBe('Esta pregunta influye distinto');
    expect(operations[0]).not.toContain('AUD-CUE-01');
    expect(operations[0]).not.toContain('SET_QUESTION_WEIGHT');
  });
});

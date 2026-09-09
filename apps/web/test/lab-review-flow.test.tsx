import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepReview, emptyReviewDraft } from '@/components/admin/lab/step-review';
import { StepVerdict } from '@/components/admin/lab/step-verdict';
import { StepChange } from '@/components/admin/lab/step-change';
import { ReplayImpactBoard } from '@/components/admin/lab/replay-impact-board';
import { canCloseWithoutFinding, definitionChangeFromCause, needsFirstProblem } from '@/lib/lab-ui/review-followup';
import { groupReplayRows } from '@/lib/lab-ui/replay-groups';
import { matrixTrackLabel } from '@/lib/lab-ui/status';
import { presetFromFirstProblem } from '@/lib/lab-ui/change-preset';
import { changePath } from '@/lib/lab-ui/change-diagnosis';
import { expectationFixture, questionsFixture, resultFixture, runFixture } from './fixtures';

function text(markup: string): string {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const noop = () => undefined;

describe('Lab review chain', () => {
  it('lets a matching case close without a finding', () => {
    expect(canCloseWithoutFinding('YES')).toBe(true);
    expect(needsFirstProblem('YES')).toBe(false);
    const body = text(
      renderToStaticMarkup(
        <StepReview
          result={resultFixture()}
          questions={questionsFixture()}
          expectation={expectationFixture()}
          saved={null}
          draft={{ ...emptyReviewDraft, overallSense: 'YES', firstDivergence: 'NONE' }}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Cerrar revisión');
    expect(body).not.toContain('¿Dónde aparece la primera diferencia?');
    expect(body).toContain('Puedes cerrar este caso como correcto');
  });

  it('asks for the first divergence before a change when the result does not make sense', () => {
    expect(needsFirstProblem('NO')).toBe(true);
    const empty = text(
      renderToStaticMarkup(
        <StepReview
          result={resultFixture()}
          questions={questionsFixture()}
          expectation={expectationFixture()}
          saved={null}
          draft={{ ...emptyReviewDraft, overallSense: 'NO' }}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(empty).toContain('¿Dónde aparece la primera diferencia?');
    expect(empty).toContain('Registrar hallazgo');
    expect(empty).toContain('Una pregunta');
    expect(empty).toContain('La escala de respuesta');
    expect(empty).toContain('Una alerta');
    expect(empty).not.toContain('Cuánto quieres que influya');
    expect(empty).not.toContain('Probar otro orden de desempate');
  });

  it('keeps wording as a definition finding, not a weight experiment', () => {
    expect(presetFromFirstProblem('RESPONSE_VALIDATION').questionFault).toBe('WORDING');
    expect(presetFromFirstProblem('RESPONSE_VALIDATION').kind).toBeUndefined();
    expect(changePath('QUESTION', 'WORDING')?.mode).toBe('finding');
    expect(changePath('SAFETY')?.mode).toBe('finding');
  });

  it('does not require a change to close a case with a doubt', () => {
    const body = text(
      renderToStaticMarkup(
        <StepVerdict
          run={runFixture({ status: 'REVEALED' })}
          result={resultFixture()}
          expectation={expectationFixture()}
          saved={null}
          reviewDraft={{ ...emptyReviewDraft, overallSense: 'UNSURE' }}
          pending={false}
          onSaved={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Después de ver cómo llegó la Matriz a este resultado, ¿qué concluyes?');
    expect(body).toContain('No tengo suficiente evidencia');
    expect(body).toContain('Duda pendiente');
  });
});

describe('replay grouping', () => {
  it('separates changed, unchanged and worsened cases', () => {
    const grouped = groupReplayRows([
      {
        run_id: '1',
        case_label: 'R04',
        impact: 'IMPROVES',
        domains: [
          {
            key: 'CUERPO',
            from_score: 39,
            to_score: 44,
            from_state: 'CONTENCIÓN',
            to_state: 'ESTABILIZACIÓN',
          },
        ],
        priority: { from: 'CUERPO', to: 'CUERPO' },
        plan: { from: 'a', to: 'a', from_name: 'A', to_name: 'A' },
        safety: { from: 0, to: 0 },
      },
      {
        run_id: '2',
        case_label: 'R01',
        impact: 'UNCHANGED',
        domains: [],
        priority: { from: 'MENTALIDAD', to: 'MENTALIDAD' },
        plan: { from: 'a', to: 'a' },
        safety: { from: 0, to: 0 },
      },
      {
        run_id: '3',
        case_label: 'R11',
        impact: 'WORSENS',
        critical_regression: true,
        domains: [],
        priority: { from: 'CUERPO', to: 'MENTALIDAD' },
        plan: { from: 'a', to: 'b' },
        safety: { from: 1, to: 0 },
      },
    ]);
    expect(grouped.improved.map((row) => row.case_label)).toEqual(['R04']);
    expect(grouped.unchanged.map((row) => row.case_label)).toEqual(['R01']);
    expect(grouped.worsened.map((row) => row.case_label)).toEqual(['R11']);
    expect(grouped.changed.map((row) => row.case_label)).toEqual(['R04']);
    const body = text(
      renderToStaticMarkup(
        <ReplayImpactBoard
          rows={[
            {
              run_id: '1',
              case_label: 'R04',
              impact: 'IMPROVES',
              domains: [
                {
                  key: 'CUERPO',
                  from_score: 39,
                  to_score: 44,
                  from_state: 'CONTENCIÓN',
                  to_state: 'ESTABILIZACIÓN',
                },
              ],
              priority: { from: 'CUERPO', to: 'CUERPO' },
              plan: { from: 'a', to: 'a', from_name: 'A', to_name: 'A' },
              safety: { from: 0, to: 0 },
            },
          ]}
        />,
      ),
    );
    expect(body).toContain('Este cambio nace de un solo caso');
    expect(body).toContain('Cuerpo 39 → 44');
  });
});

describe('case status', () => {
  it('maps a finding in progress to Con hallazgo', () => {
    expect(
      matrixTrackLabel({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_findings: true,
      }),
    ).toBe('Con hallazgo');
  });

  it('maps a complete review to Cerrado', () => {
    expect(
      matrixTrackLabel({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: true,
      }),
    ).toBe('Cerrado');
  });
});

describe('finding before a change', () => {
  it('keeps wording and scale as definition changes, not weights', () => {
    expect(definitionChangeFromCause('RESPONSE_VALIDATION', 'QUESTION_WORDING')).toBe(true);
    expect(definitionChangeFromCause('SCALE_MAP', 'SCALE')).toBe(true);
    expect(definitionChangeFromCause('SAFETY_EVAL', 'SAFETY')).toBe(true);
    expect(definitionChangeFromCause('RESPONSE_VALIDATION', 'QUESTION_IRRELEVANT')).toBe(false);
    expect(definitionChangeFromCause('DIMENSION_SCORE', 'WEIGHT')).toBe(false);
  });

  it('asks scale follow-ups without opening a weight editor', () => {
    const body = text(
      renderToStaticMarkup(
        <StepReview
          result={resultFixture()}
          questions={questionsFixture()}
          expectation={expectationFixture()}
          saved={null}
          draft={{
            ...emptyReviewDraft,
            overallSense: 'NO',
            firstDivergence: 'SCALE_MAP',
            rootCauses: ['SCALE'],
            notes: 'Falta una opción',
          }}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('¿Qué ocurre con la escala?');
    expect(body).not.toContain('La pregunta está bien, pero influye demasiado o demasiado poco');
    expect(body).not.toContain('0,5');
  });
});

describe('replay decision actions', () => {
  it('keeps adjust distinct from discard', () => {
    const result = {
      changeset_id: 'cs-1',
      candidate_ref: 'matrix-v2.0@2',
      summary: 'Esta pregunta contará la mitad.',
      comparison: {
        id: 'cmp-1',
        changeset_id: 'cs-1',
        changeset_status: 'REPLAYED',
        changeset_reason: 'Prueba',
        base_definition_ref: 'matrix-v2.0@1',
        candidate_definition_ref: 'matrix-v2.0@2',
        results: [
          {
            run_id: '1',
            case_label: 'R04',
            attribution: 'change',
            verdict: null,
            impact: 'IMPROVES',
            flags: {},
            domains: [
              {
                key: 'CUERPO',
                from_score: 39,
                to_score: 44,
                from_state: 'CONTENCIÓN',
                to_state: 'ESTABILIZACIÓN',
                from_classification: 'INTERPRETABLE',
                to_classification: 'INTERPRETABLE',
              },
            ],
            priority: { from: 'CUERPO', to: 'CUERPO' },
            plan: { from: 'a', to: 'a', from_name: 'A', to_name: 'A' },
            safety: { from: 0, to: 0 },
          },
        ],
      },
    };
    const body = text(
      renderToStaticMarkup(
        <StepChange
          runId="1"
          options={null}
          reasonSeed=""
          pending={false}
          onSubmit={noop}
          result={result}
          onVerdict={noop}
          onDiscard={noop}
          onAdjust={noop}
        />,
      ),
    );
    expect(body).toContain('Conservar cambio');
    expect(body).toContain('Descartar cambio');
    expect(body).toContain('Quiero ajustarlo');
    expect(body).toContain('Necesito revisar los casos afectados');
    expect(body).toContain('¿Este cambio arregla el problema sin romper otros casos?');
    expect(body).not.toContain('ChangeSet');
  });
});

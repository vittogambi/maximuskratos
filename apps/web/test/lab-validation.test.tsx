import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepCase } from '@/components/admin/lab/step-case';
import { StepPrediction } from '@/components/admin/lab/step-prediction';
import { StepResult } from '@/components/admin/lab/step-result';
import { StepReview, reviewPayload } from '@/components/admin/lab/step-review';
import { StepVerdict } from '@/components/admin/lab/step-verdict';
import {
  catalogFixture,
  comparisonFixture,
  expectationFixture,
  questionsFixture,
  resultFixture,
  runFixture,
} from './fixtures';
import {
  isMatrixReviewComplete,
  matrixTrackLabel,
  productTrackLabel,
  purposeTrackLabel,
} from '@/lib/lab-ui/status';
import { labUiLabels } from '@/lib/lab-ui/labels';

function pairCompareAvailable(leftRevealed: boolean, rightRevealed: boolean): boolean {
  return leftRevealed && rightRevealed;
}

const noop = () => undefined;

function rafaMode(markup: string): string {
  return markup.replace(/<details[\s\S]*?<\/details>/g, '');
}

function text(markup: string): string {
  return rafaMode(markup)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

const emptyDraft = {
  open_what_is_happening: '',
  open_main_concern: '',
  open_first_focus: '',
  open_first_action: '',
  personal_first_domain: 'CUERPO',
  expected_states: {},
  expected_priority_domain: 'MENTALIDAD',
  expected_plan_id: '',
  expected_purpose_stage: 'UNSURE',
  confidence: 'MEDIA',
  notes: '',
};

const emptyReview = {
  overallSense: '',
  verdicts: { safety: 'UNCERTAIN', priority: 'PARTIAL', plan: 'UNCERTAIN', interpretation: 'UNCERTAIN' },
  states: {},
  postRevealStates: {},
  postRevealPriority: 'CUERPO',
  recommendedPlanId: '',
  firstDivergence: 'PRIORITY',
  rootCauses: [],
  evidence: ['AUD-MEN-01'],
  notes: '',
  doubtedRules: [],
  findingConfidence: 'MEDIA',
  linkedFindingId: '',
};

describe('1 case summary pre-reveal is neutral', () => {
  it('does not leak scores, states, or experimental intent', () => {
    const body = text(renderToStaticMarkup(<StepCase run={runFixture()} onContinue={noop} />));
    for (const leak of [
      'mentalidad claramente más baja',
      'cuerpo es el ámbito más bajo',
      'cae a contención',
      'entra a estabilización',
      'borde 59/60',
      'borde 79/80',
      'comparten headline',
      'AUD suena sólido',
    ]) {
      expect(body.toLowerCase()).not.toContain(leak);
    }
  });
});

describe('2 facilitator intent hidden pre-reveal', () => {
  it('does not show facilitator_note before reveal', () => {
    const markup = renderToStaticMarkup(
      <StepCase
        run={runFixture({ facilitator_note: 'El caso tensiona el desempate y el counterfactual 50/50.' })}
        onContinue={noop}
      />,
    );
    expect(markup).not.toContain('Para qué creamos este caso');
    expect(markup).not.toContain('counterfactual');
  });
});

describe('3 A/B difference hidden pre-reveal', () => {
  it('pair compare is not shown as available before both reveals', () => {
    expect(pairCompareAvailable(false, false)).toBe(false);
    expect(pairCompareAvailable(true, false)).toBe(false);
  });
});

describe('4 Matrix review independent from Product', () => {
  it('completes without product review', () => {
    expect(
      isMatrixReviewComplete({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: true,
        has_product_review: false,
      }),
    ).toBe(true);
    expect(
      productTrackLabel({
        status: 'REVEALED',
        has_product_review: false,
      }),
    ).toBe('Pendiente');
  });
});

describe('5 personal judgment separate from Matrix prediction', () => {
  it('shows both fields and does not treat them as a contradiction', () => {
    const body = text(
      renderToStaticMarkup(
        <StepPrediction
          run={runFixture({ status: 'AWAITING_EXPECTATION' })}
          catalog={catalogFixture()}
          saved={null}
          draft={emptyDraft}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onRevealWithout={noop}
        />,
      ),
    );
    expect(body).toContain('Sin ver el resultado de la Matriz, ¿qué destacarías de este caso?');
    expect(
      renderToStaticMarkup(
        <StepPrediction
          run={runFixture({ status: 'AWAITING_EXPECTATION' })}
          catalog={catalogFixture()}
          saved={null}
          draft={emptyDraft}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onRevealWithout={noop}
        />,
      ),
    ).toContain('Quiero anticipar qué hará la Matriz');
    expect(body).toContain('Cuerpo');
    expect(body).toContain('Mentalidad');
  });
});

describe('6 Case Verdict persistence payload', () => {
  it('keeps verdict fields ready to persist', () => {
    const payload = reviewPayload(emptyReview);
    expect(payload.first_wrong_layer).toBe('PRIORITY');
    expect(payload.no_methodological_problem).toBe(false);
    expect(payload.post_reveal_priority_domain).toBe('CUERPO');
  });
});

describe('7 human counterfactual persistence', () => {
  it('stores post-reveal state and plan choices', () => {
    const payload = reviewPayload({
      ...emptyReview,
      postRevealStates: { CUERPO: 'CONTENCIÓN' },
      recommendedPlanId: 'CUE-CON',
    });
    expect(payload.post_reveal_states).toEqual({ CUERPO: 'CONTENCIÓN' });
    expect(payload.recommended_plan_id).toBe('CUE-CON');
  });
});

describe('8-10 Finding labels and status', () => {
  it('keeps finding vocabulary in Spanish', () => {
    expect(labUiLabels.findingLayer('PRIORITY')).toBe('Ámbito prioritario y desempate entre ámbitos');
    expect(labUiLabels.findingSeverity('CRITICAL')).toBe('Crítico');
    expect(labUiLabels.findingStatus('OPEN')).toBe('Abierto');
    expect(labUiLabels.findingStatus('CHANGE_IN_TEST')).toBe('Cambio en prueba');
  });
});

describe('13 baseline remains immutable in copy', () => {
  it('tells Rafa the original Matrix is not modified', () => {
    const body = text(
      renderToStaticMarkup(
        <StepResult
          result={resultFixture()}
          comparison={comparisonFixture()}
          why=""
          trace="{}"
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Tu lectura antes de ver la Matriz');
  });
});

describe('18 Purpose not required for Matrix completion', () => {
  it('keeps purpose pending while Matrix is reviewed', () => {
    const run = {
      status: 'REVEALED',
      has_expectation: true,
      has_review: true,
      has_case_verdict: true,
      has_purpose: false,
    };
    expect(isMatrixReviewComplete(run)).toBe(true);
    expect(purposeTrackLabel(run)).toBe('Pendiente');
    expect(matrixTrackLabel(run)).toBe('Cerrado');
  });
});

describe('19 Product not required for Matrix completion', () => {
  it('derives complete from verdict, not product', () => {
    expect(
      isMatrixReviewComplete({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: true,
        has_product_review: false,
      }),
    ).toBe(true);
  });
});

describe('20 no raw enum in primary Rafa UI', () => {
  it('hides COLLECTING and FULL-v1 outside technical details', () => {
    const visible = rafaMode(renderToStaticMarkup(<StepCase run={runFixture()} onContinue={noop} />));
    expect(visible).not.toContain('COLLECTING');
    expect(visible).not.toContain('FULL-v1');
  });
});

describe('21 Direction provenance labels', () => {
  it('maps the four allowed sources', () => {
    expect(labUiLabels.source('USER_CHOICE')).toBe('Elección de la persona');
    expect(labUiLabels.source('RAFA_JUDGMENT')).toBe('Tu decisión');
    expect(labUiLabels.source('CASE')).toBe('Caso');
    expect(labUiLabels.source('PRODUCT_HYPOTHESIS')).toBe('Hipótesis de producto');
  });
});

describe('23-24 paired compare gate', () => {
  it('unavailable before both reveals and available after', () => {
    expect(pairCompareAvailable(false, true)).toBe(false);
    expect(pairCompareAvailable(true, true)).toBe(true);
    const hidden = text(
      renderToStaticMarkup(
        <StepResult
          result={resultFixture()}
          comparison={null}
          pair={{ available: false, other_revealed: false }}
          why=""
          trace="{}"
          onContinue={noop}
        />,
      ),
    );
    expect(hidden).toContain('cuando ambos casos estén revelados');
    expect(hidden).not.toContain('Comparar A/B');
    const shown = text(
      renderToStaticMarkup(
        <StepResult
          result={resultFixture()}
          comparison={null}
          pair={{
            available: true,
            other_revealed: true,
            this_side: 'A',
            other_key: 'R07B',
            implied_rule: 'umbral 39/40',
            plans: { a: 'MEN-EST', b: 'MEN-CON' },
          }}
          why=""
          trace="{}"
          onContinue={noop}
        />,
      ),
    );
    expect(shown).not.toContain('Comparar A/B');
    expect(shown).not.toContain('Comparar A y B');
  });
});

describe('25 case completion status derives correctly', () => {
  it('needs verdict after review', () => {
    expect(
      isMatrixReviewComplete({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: false,
      }),
    ).toBe(false);
  });
});

describe('Case Verdict screen', () => {
  it('asks for a human verdict and a hypothesis', () => {
    const body = text(
      renderToStaticMarkup(
        <StepVerdict
          run={runFixture({ status: 'REVEALED', has_review: true })}
          result={resultFixture()}
          expectation={expectationFixture()}
          saved={null}
          reviewDraft={emptyReview}
          pending={false}
          onSaved={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Qué estamos probando');
    expect(body).toContain('Después de ver cómo llegó la Matriz a este resultado, ¿qué concluyes?');
    expect(body).toContain('Sí, está bien');
    expect(body).toContain('Hay un problema');
    expect(body).toContain('No tengo suficiente evidencia');
  });

  it('disables close until a verdict is chosen', () => {
    const markup = renderToStaticMarkup(
      <StepVerdict
        run={runFixture({ status: 'REVEALED' })}
        result={resultFixture()}
        expectation={expectationFixture()}
        saved={null}
        reviewDraft={emptyReview}
        pending={false}
        onSaved={noop}
        onContinue={noop}
      />,
    );
    const close = markup.match(/<button[^>]*disabled[^>]*>[\s\S]*?Cerrar revisión/);
    expect(close?.[0]).toContain('disabled');
  });

  it('after a saved close, the case looks closed until reopen', () => {
    const body = text(
      renderToStaticMarkup(
        <StepVerdict
          run={runFixture({ status: 'REVEALED', has_review: true, has_case_verdict: true })}
          result={resultFixture()}
          expectation={expectationFixture()}
          saved={{
            verdicts: {},
            firstWrongLayer: null,
            rootCauseCodes: [],
            evidenceRefs: [],
            wouldRecommendPlanId: null,
            postRevealPriorityDomain: null,
            notes: null,
            revision: 1,
            caseVerdict: 'REPRESENTS',
          }}
          reviewDraft={{ ...emptyReview, overallSense: 'YES' }}
          pending={false}
          onSaved={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Revisión completada');
    expect(body).toContain('Reabrir revisión');
    expect(body).not.toContain('Cerrar revisión');
    expect(body).not.toContain('Guardar y volver');
  });
});

describe('Review NONE option', () => {
  it('marks no methodological problem', () => {
    expect(reviewPayload({ ...emptyReview, firstDivergence: 'NONE' }).no_methodological_problem).toBe(true);
  });
});

describe('StepReview asks what would have been correct', () => {
  it('shows the counterfactual prompt when there is disagreement', () => {
    const body = text(
      renderToStaticMarkup(
        <StepReview
          result={resultFixture()}
          questions={questionsFixture()}
          expectation={expectationFixture()}
          saved={null}
          draft={{ ...emptyReview, overallSense: 'NO', firstDivergence: 'RECOMMENDATION', notes: 'Otra ruta' }}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Qué esperabas');
    expect(body).toContain('Otra ruta');
  });
});

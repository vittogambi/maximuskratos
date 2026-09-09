import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepCase } from '@/components/admin/lab/step-case';
import { StepChange } from '@/components/admin/lab/step-change';
import { StepExperience } from '@/components/admin/lab/step-experience';
import { StepPrediction } from '@/components/admin/lab/step-prediction';
import { StepPurpose } from '@/components/admin/lab/step-purpose';
import { LabQuestionCard } from '@/components/admin/lab/question-card';
import { StepResponses } from '@/components/admin/lab/step-responses';
import { StepResult, buildHumanWhy, tieBreakDecided } from '@/components/admin/lab/step-result';
import { StepReview } from '@/components/admin/lab/step-review';
import { Stepper } from '@/components/admin/lab/primitives';
import { buildLabSteps } from '@/lib/lab-ui/status';
import {
  blockedResultFixture,
  catalogFixture,
  comparisonFixture,
  expectationFixture,
  experienceFixture,
  insufficientResultFixture,
  questionsFixture,
  resultFixture,
  runFixture,
} from './fixtures';

const noop = () => undefined;

/** What Rafa can actually read: the technical disclosures are removed. */
function rafaMode(markup: string): string {
  return markup.replace(/<details[\s\S]*?<\/details>/g, '');
}

function text(markup: string): string {
  return rafaMode(markup)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
}

const emptyExpectationDraft = {
  open_what_is_happening: '',
  open_main_concern: '',
  open_first_focus: '',
  open_first_action: '',
  expected_states: {},
  expected_priority_domain: '',
  expected_plan_id: '',
  expected_purpose_stage: '',
  personal_first_domain: '',
  confidence: '',
  notes: '',
};

const emptyReviewDraft = {
  overallSense: '',
  verdicts: {},
  states: {},
  postRevealStates: {},
  postRevealPriority: '',
  recommendedPlanId: '',
  firstDivergence: '',
  rootCauses: [],
  evidence: [],
  findingConfidence: 'MEDIA',
  notes: '',
  doubtedRules: [],
  linkedFindingId: '',
};

const emptyExperienceDraft = {
  focusChoice: '',
  otherDomain: '',
  selectionReason: '',
  direction: '',
  directionSource: 'RAFA_JUDGMENT',
  objectiveId: '',
  customObjective: '',
  actionText: '',
  cadence: 'MONTHLY' as const,
};

const emptyProductDraft = {
  verdicts: {},
  purposeFeels: '',
  stillMk: '',
  divergence: '',
  wouldChange: '',
  missing: '',
};

describe('UX-05 / UX-06 blindness before the reveal', () => {
  it('never renders a facilitator note while the case is still collecting', () => {
    const markup = renderToStaticMarkup(
      <StepCase run={runFixture({ facilitator_note: null })} onContinue={noop} />,
    );
    expect(markup).not.toContain('Para qué creamos este caso');
    expect(markup).not.toMatch(/facilitador/i);
  });

  it('does not leak the R01 tie reading before the reveal', () => {
    const markup = renderToStaticMarkup(
      <StepCase run={runFixture({ facilitator_note: null })} onContinue={noop} />,
    );
    for (const leak of ['Empate', 'desempate', 'candidato', '50/50']) {
      expect(markup).not.toContain(leak);
    }
  });

  it('shows the internal note only once the run is revealed, clearly separated', () => {
    const note = 'Empate 50/50/50/50. El candidato Matrix es Mentalidad por desempate provisional.';
    const collecting = renderToStaticMarkup(
      <StepCase run={runFixture({ status: 'COLLECTING', facilitator_note: note })} onContinue={noop} />,
    );
    expect(collecting).not.toContain('Empate');

    const revealed = renderToStaticMarkup(
      <StepCase
        run={runFixture({ status: 'REVEALED', has_expectation: true, facilitator_note: note })}
        onContinue={noop}
      />,
    );
    expect(revealed).toContain('Para qué creamos este caso');
    expect(revealed).toContain('Empate');
  });

  it('keeps the case page free of result vocabulary', () => {
    const body = text(
      renderToStaticMarkup(<StepCase run={runFixture()} onContinue={noop} />),
    );
    for (const leak of ['Prioridad', 'Estado', 'Puntaje', 'Plan', 'alerta']) {
      expect(body).not.toContain(leak);
    }
    expect(body).toContain('Respuestas disponibles');
    expect(body).toContain('Continuar');
    expect(body).not.toContain('102 de 187');
  });
});

describe('UX-04 / UX-01 no machine states in the page', () => {
  it('does not print the run status or the policy code in Modo Rafa', () => {
    const markup = renderToStaticMarkup(<StepCase run={runFixture()} onContinue={noop} />);
    const visible = rafaMode(markup);
    expect(visible).not.toContain('COLLECTING');
    expect(visible).not.toContain('FULL-v1');
    expect(visible).not.toContain('Evaluación completa');
    expect(markup).not.toContain('Evaluación completa');
  });

  it('UX-20: does not show definition ref, policy id or engine version', () => {
    const markup = renderToStaticMarkup(<StepCase run={runFixture()} onContinue={noop} />);
    expect(markup).not.toContain('matrix-v2.0@1');
    expect(markup).not.toContain('FULL-v1');
    expect(markup).not.toContain('2.0.0');
    expect(markup).not.toContain('Ver información técnica');
  });
});

describe('UX-07 / UX-08 responses read as questions', () => {
  const markup = renderToStaticMarkup(
    <StepResponses run={runFixture()} questions={questionsFixture()} pending={false} onFreeze={noop} />,
  );

  it('puts the question text before the answer', () => {
    const question = '¿Con qué frecuencia logras mantener el foco';
    expect(markup.indexOf(question)).toBeGreaterThan(-1);
    expect(markup.indexOf(question)).toBeLessThan(markup.indexOf('A veces'));
  });

  it('keeps the id out of the main question line', () => {
    expect(text(markup)).not.toContain('AUD-MEN-01');
  });

  it('renders the answer label instead of the raw number', () => {
    const visible = text(markup);
    expect(visible).toContain('A veces');
    expect(visible).not.toContain('ANSWERED');
    expect(visible).toContain('Sin respuesta');
  });

  it('explains what happened with every response, not only the answered ones', () => {
    const body = text(markup);
    expect(body).toContain('Sin respuesta');
    expect(body).toContain('Cuerpo');
    expect(body).toContain('Este caso tiene respuestas en los cuatro ámbitos.');
    expect(body).toMatch(/1 respuesta/);
  });

  it('keeps question and answer in one card, without a permanent safety warning', () => {
    const body = text(markup);
    expect(body).toContain('A veces');
    expect(body).toContain('Revisar pregunta');
    expect(body).not.toContain('Puede activar una alerta de seguridad.');
  });

  it('shows a safety callout only when an alert actually fired', () => {
    const [mental] = questionsFixture();
    const risk = {
      ...mental,
      id: 'D-CUE-25',
      is_risk: true,
      flagged_here: true,
      text: 'Evito conductas extremas o riesgosas para modificar rápidamente mi apariencia.',
    };
    const quiet = text(
      renderToStaticMarkup(
        <LabQuestionCard question={risk} runId="run-1" revealed={false} />,
      ),
    );
    expect(quiet).toContain('Seguridad');
    expect(quiet).not.toContain('Puede activar una alerta de seguridad.');
    expect(quiet).not.toContain('Alerta de seguridad');
    expect(quiet).toContain('Para revisar');

    const fired = text(
      renderToStaticMarkup(
        <LabQuestionCard question={risk} runId="run-1" revealed fired />,
      ),
    );
    expect(fired).toContain('Alerta activa');
    expect(fired).not.toContain('Alerta de seguridad');
  });

  it('hides the matrix reading before reveal and shows it after', () => {
    const [mental] = questionsFixture();
    const hidden = renderToStaticMarkup(
      <LabQuestionCard question={mental} runId="run-1" revealed={false} />,
    );
    expect(hidden).not.toContain('Cómo la leyó la Matriz');
    const shown = renderToStaticMarkup(
        <LabQuestionCard
          question={{ ...mental, id: 'AUD-CUE-01' }}
          runId="run-1"
          revealed
          itemTrace={{
            question_id: 'AUD-CUE-01',
            text: mental.text,
            domain: 'CUERPO',
            dimension: 'CUE.seguridad_y_restricciones',
            dimension_label: 'Seguridad y restricciones',
            raw_value: 1,
            answer_label: 'Nunca',
            answer_ordinal: '1 de 5',
            scoreable: true,
            normalized_score: 0,
            normalize_rule_id: 'R-SCORE-01',
            excluded_reason: null,
            weight: 1,
            dimension_items_scored: 6,
            dimension_items_scoreable: 6,
            share_in_dimension: 1,
            contribution_to_dimension: 0,
            dimension_score: 12,
            dimension_weight_in_domain: 0.25,
            contribution_to_domain: 0,
            domain_score: 39.29,
            domain_score_display: 39,
            domain_state_from_band: 'CONTENCIÓN',
            domain_state_final: 'CONTENCIÓN',
            domain_state_source: 'BAND',
            is_risk: false,
            alert_fired: false,
          }}
        />,
    );
    expect(shown).toContain('Cómo la leyó la Matriz');
    expect(shown).toContain('Entra al cálculo de Cuerpo con 0 de 100.');
    expect(shown).not.toContain('La Matriz la interpretó');
    expect(shown).not.toContain('Respuesta: Nunca');
  });

  it('hides marks from other cases before reveal', () => {
    const [mental] = questionsFixture();
    const marked = {
      ...mental,
      other_observations: 1,
      other_notes: [
        {
          id: 'obs-1',
          note: 'La escala no distingue fatiga de desorden.',
          issue_types: ['UNCLEAR'],
          case_label: 'R01 · Ignacio',
        },
      ],
    };
    const markup = renderToStaticMarkup(
      <LabQuestionCard question={marked} runId="run-1" revealed={false} />,
    );
    const visible = text(markup);
    expect(visible).not.toContain('1 en otros casos');
    expect(visible).not.toContain('La escala no distingue fatiga de desorden.');
  });

  it('LAB-052 keeps the answer under the question text', () => {
    const [mental] = questionsFixture();
    const markup = renderToStaticMarkup(
      <LabQuestionCard question={mental} runId="run-1" revealed={false} />,
    );
    expect(markup.indexOf('lab-qc__question')).toBeLessThan(markup.indexOf('lab-qc__answer'));
    expect(markup).toContain('Respuesta');
  });

  it('closes the responses with a human CTA and a confirmation', () => {
    expect(markup).toContain('Cerrar respuestas y registrar mi criterio');
    expect(markup).not.toContain('Congelar');
  });

  it('offers a save button for editable answers and does not autosave', () => {
    const catalog = {
      ...catalogFixture(),
      questionnaire: {
        domains: [
          {
            key: 'MENTALIDAD',
            total: 1,
            sections: [{ key: 'FOCO_PERSONAL', label: 'Foco personal', question_ids: ['AUD-MEN-01'] }],
          },
        ],
        purpose_modules: [],
        total_served: 1,
      },
    };
    const body = renderToStaticMarkup(
      <StepResponses
        run={runFixture({ status: 'COLLECTING', responses_editable: true })}
        questions={questionsFixture()}
        catalog={catalog}
        pending={false}
        onFreeze={noop}
        onQuestions={noop}
      />,
    );
    expect(body).toContain('Guardar respuestas');
    expect(body).not.toContain('Guardando…');
    expect(rafaMode(body)).not.toContain('Guardado');
  });

  it('shows Para revisar when the server returns flagged_here', () => {
    const [first, ...rest] = questionsFixture();
    const body = text(
      renderToStaticMarkup(
        <StepResponses
          run={runFixture({ status: 'COLLECTING' })}
          questions={[{ ...first, flagged_here: true }, ...rest]}
          pending={false}
          onFreeze={noop}
        />,
      ),
    );
    expect(body).toContain('Para revisar');
  });

  it('keeps the full list folded on an editable run', () => {
    const catalog = {
      ...catalogFixture(),
      questionnaire: {
        domains: [
          {
            key: 'MENTALIDAD',
            total: 1,
            sections: [{ key: 'FOCO_PERSONAL', label: 'Foco personal', question_ids: ['AUD-MEN-01'] }],
          },
        ],
        purpose_modules: [],
        total_served: 1,
      },
    };
    const body = renderToStaticMarkup(
      <StepResponses
        run={runFixture({ status: 'COLLECTING', responses_editable: true })}
        questions={questionsFixture()}
        catalog={catalog}
        pending={false}
        onFreeze={noop}
        onQuestions={noop}
      />,
    );
    expect(body).toContain('Ver todas las respuestas');
    expect(body).toContain('Puedes guardar y seguir después. Las respuestas se cierran cuando tú lo decidas.');
    expect(body).not.toContain('Buscar pregunta');
    const outside = body.replace(/<details[\s\S]*?<\/details>/g, '');
    expect((outside.match(/class="lab-qc /g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it('does not show coverage sufficiency before reveal', () => {
    const run = runFixture({
      status: 'COLLECTING',
      evidence: {
        domains: [
          {
            key: 'CUERPO',
            answered: 8,
            scoreable: 27,
            coverage: 0.3,
            classification: 'NO_CLASIFICADO',
            evidence_state: 'Insuficiente',
          },
        ],
        purpose: { answered: 0, total: 81 },
        total: { answered: 8, served: 187 },
        bands: { insufficient_below: 0.6, provisional_below: 0.8, rule_ids: [] },
      },
    });
    const visible = text(
      renderToStaticMarkup(
        <StepResponses run={run} questions={questionsFixture()} pending={false} onFreeze={noop} />,
      ),
    );
    expect(visible).toContain('8 / 27');
    expect(visible).not.toContain('Insuficiente');
    expect(visible).not.toContain('NO_CLASIFICADO');
  });
});

describe('UX-09 locked steps look intentional', () => {
  it('carries the reason as the tooltip of a locked step', () => {
    const markup = renderToStaticMarkup(
      <Stepper steps={buildLabSteps({ status: 'COLLECTING' })} active="responses" onSelect={noop} />,
    );
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('title="Disponible después de cerrar las respuestas."');
    expect(markup).toContain('Tu lectura');
  });

  it('LAB-053 uses AppIcon markers instead of symbols', () => {
    const markup = renderToStaticMarkup(
      <Stepper steps={buildLabSteps({ status: 'COLLECTING' })} active="responses" onSelect={noop} />,
    );
    expect(markup).not.toMatch(/✓|●|○|🔒|⚠/);
    expect(markup).toContain('lab-step__marker');
  });
});

describe('UX-10 prediction is frozen after the reveal', () => {
  it('asks the open reading before showing the MK categories', () => {
    const markup = renderToStaticMarkup(
      <StepPrediction
        run={runFixture({ status: 'AWAITING_EXPECTATION' })}
        catalog={catalogFixture()}
        saved={null}
        draft={emptyExpectationDraft}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onRevealWithout={noop}
      />,
    );
    const body = text(markup);
    expect(body).toContain('Sin ver el resultado de la Matriz, ¿qué destacarías de este caso?');
    expect(markup).toContain('Quiero anticipar qué hará la Matriz');
    expect(markup).not.toContain('No lo anticipo');
    expect(markup).toContain('Qué hará la Matriz, no lo que harías tú');
    expect(markup).toContain('Guardar mi lectura y revelar la Matriz');
    expect(markup).toContain('lab-radio');
    expect(markup).toContain('name="criterion-stance"');
    expect(markup).toContain('name="safety-read"');
    expect(body).not.toContain('UNSURE');
    expect(body).toContain('No estoy seguro');
  });

  it('turns into a read only record once the result was revealed', () => {
    const markup = renderToStaticMarkup(
      <StepPrediction
        run={runFixture({ status: 'REVEALED', has_expectation: true })}
        catalog={catalogFixture()}
        saved={expectationFixture()}
        draft={emptyExpectationDraft}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onRevealWithout={noop}
      />,
    );
    expect(markup).not.toContain('<textarea');
    expect(markup).not.toContain('Guardar mi lectura y revelar');
    expect(markup).toContain('Lectura guardada');
    expect(text(markup)).toContain('Cuerpo');
  });

  it('never offers reveal without prediction at the same level as the main action', () => {
    const markup = renderToStaticMarkup(
      <StepPrediction
        run={runFixture({ status: 'AWAITING_EXPECTATION' })}
        catalog={catalogFixture()}
        saved={null}
        draft={emptyExpectationDraft}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onRevealWithout={noop}
      />,
    );
    expect(markup).not.toContain('Ver información técnica');
    const primary = markup.indexOf('Guardar mi lectura y revelar la Matriz');
    expect(primary).toBeGreaterThan(-1);
    expect(markup).not.toContain('Revelar sin criterio');
  });
});

describe('UX-01 result reads as a decision, not as a dump', () => {
  const markup = renderToStaticMarkup(
    <StepResult
      result={resultFixture()}
      comparison={comparisonFixture()}
      why="why text"
      trace="{}"
      onContinue={noop}
    />,
  );

  it('explains the provisional tie instead of printing priority = MENTALIDAD', () => {
    const body = text(markup);
    expect(body).toMatch(/empatados|desempate|primero/);
    expect(body).not.toContain('MENTALIDAD');
    expect(body).toContain('Mentalidad');
  });

  it('states the purpose silence without showing purpose scores', () => {
    const body = text(markup);
    expect(body).toContain('Resultado de la Matriz');
    expect(rafaMode(markup)).not.toContain('72');
  });

  it('compares Rafa against the Matrix and marks the divergences', () => {
    const body = text(markup);
    expect(body).toContain('Tu lectura antes de ver la Matriz');
    expect(body).toContain('Cuerpo');
  });

  it('builds a human why chain before any technical trace', () => {
    const why = buildHumanWhy(resultFixture(), tieBreakDecided(resultFixture()));
    expect(why.length).toBeGreaterThan(2);
    for (const line of why) {
      expect(line).not.toMatch(/[A-Z_]{6,}/);
    }
    expect(why.join(' ')).toMatch(/desempate/);
  });

  it('UX-17: says there is not enough information instead of showing empty values', () => {
    const body = text(
      renderToStaticMarkup(
        <StepResult
          result={insufficientResultFixture()}
          comparison={null}
          why=""
          trace="{}"
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Ningún ámbito');
    expect(body).toMatch(/No hay cobertura suficiente/);
    expect(body).toContain('No clasificado');
    expect(body).not.toContain('Cobertura insuficiente. No clasificado');
    expect(body).not.toMatch(/Cobertura: .*evaluables/);
    expect(body).not.toContain('null');
    expect(body).not.toContain('NaN');
    expect(body).not.toContain('INSUFFICIENT_COVERAGE');
  });

  it('keeps unclassified domains compact: status plus a small ratio', () => {
    const body = text(
      renderToStaticMarkup(
        <StepResult
          result={insufficientResultFixture()}
          comparison={null}
          questions={questionsFixture()}
          why=""
          trace="{}"
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('No clasificado');
    expect(body).toContain('1 de 1');
    expect(body).toContain('0 de 1');
    expect(body).not.toContain('Cobertura insuficiente');
    expect(body).not.toContain('evaluables');
  });

  it('UX-17: the why view also stays in Rafa language when coverage is missing', () => {
    const body = text(
      renderToStaticMarkup(
        <StepResult
          result={insufficientResultFixture()}
          comparison={null}
          why=""
          trace="{}"
          onContinue={noop}
          initialWhyDomain="CUERPO"
        />,
      ),
    );
    expect(body).toContain('No hay cobertura suficiente para proponer un ámbito primero');
    expect(body).toContain('Ningún ámbito');
    expect(body).not.toContain('INSUFFICIENT_COVERAGE');
  });

  it('UX-16: puts the critical alert before the scores and marks the block', () => {
    const markup = renderToStaticMarkup(
      <StepResult
        result={blockedResultFixture()}
        comparison={null}
        why=""
        trace="{}"
        onContinue={noop}
      />,
    );
    const body = text(markup);
    expect(body.indexOf('Atención prioritaria')).toBeLessThan(body.indexOf('Resultado de la Matriz'));
    expect(body).toMatch(/no se puede entregar una recomendación ejecutable/);
    expect(body).toContain('Recomendación bloqueada');
    expect(body).not.toContain('CRITICA');
    expect(body).not.toContain('D-CUE-05');
    expect(body).toMatch(/alerta crítica/);
  });

  it('UX-20: does not show the engine wording of the block', () => {
    const markup = renderToStaticMarkup(
      <StepResult result={blockedResultFixture()} comparison={null} why="" trace="{}" onContinue={noop} />,
    );
    expect(markup).not.toContain('alerta CRITICA activa en CUERPO (D-CUE-05)');
    expect(markup).not.toContain('Ver información técnica');
  });
});

describe('UX-07 / UX-19 methodology review', () => {
  const markup = renderToStaticMarkup(
    <StepReview
      result={resultFixture()}
      questions={questionsFixture()}
      expectation={expectationFixture()}
      saved={null}
      draft={emptyReviewDraft}
      onDraft={noop}
      pending={false}
      onSubmit={noop}
      onContinue={noop}
    />,
  );

  it('asks the first divergence in human words', () => {
    const body = text(markup);
    expect(body).toContain('¿El resultado coincide con lo que esperabas?');
    expect(body).not.toContain('DOMAIN_SCORE');
    expect(body).not.toContain('STATE_BAND');
  });

  it('offers an evidence picker instead of asking for ids', () => {
    const disagree = renderToStaticMarkup(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{ ...emptyReviewDraft, overallSense: 'NO', firstDivergence: 'RESPONSE_VALIDATION' }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(disagree).toContain('Buscar pregunta del caso');
    expect(disagree).not.toMatch(/separados por coma/i);
  });

  it('stays independent from the product review', () => {
    const body = text(markup);
    expect(body).not.toMatch(/se siente como Maximus Kratos/i);
    expect(body).not.toContain('Acción semanal');
  });
});

describe('UX-18 purpose', () => {
  const markup = renderToStaticMarkup(
    <StepPurpose
      result={resultFixture()}
      questions={questionsFixture()}
      assessments={null}
      direction={null}
      draft={{ stage: '', evidence: [], confidence: '', notes: '' }}
      onDraft={noop}
      pending={false}
      onSubmit={noop}
      onContinue={noop}
    />,
  );

  it('separates the Matrix silence from Rafa judgment', () => {
    const body = text(markup);
    expect(body).toContain('Este caso no tiene información de Propósito');
  });

  it('never shows a purpose score in Modo Rafa', () => {
    expect(rafaMode(markup)).not.toContain('72');
    expect(text(markup)).not.toContain('PUR-DIRECCION');
  });

  it('uses human stage names when Purpose has answers', () => {
    const body = text(
      renderToStaticMarkup(
        <StepPurpose
          result={resultFixture()}
          questions={[
            {
              ...questionsFixture()[0],
              id: 'P-PRO-01',
              domain: 'PROPÓSITO',
              status: 'ANSWERED',
              text: '¿Hacia dónde vas?',
            },
          ]}
          assessments={null}
          direction={null}
          draft={{ stage: '', evidence: [], confidence: '', notes: '' }}
          onDraft={noop}
          pending={false}
          onSubmit={noop}
          onContinue={noop}
        />,
      ),
    );
    expect(body).toContain('Hipótesis');
    expect(body).not.toContain('HIPOTETICO');
  });
});

describe('UX-16 / UX-17 / UX-18 product experience', () => {
  it('separates what we know from what the product would decide', () => {
    const body = text(
      renderToStaticMarkup(
        <StepExperience
          result={resultFixture()}
          experience={null}
          purposeStage="HIPOTETICO"
          draft={emptyExperienceDraft}
          onDraft={noop}
          productDraft={emptyProductDraft}
          onProductDraft={noop}
          productSaved={false}
          pending={false}
          onProject={noop}
          onSaveProductReview={noop}
        />,
      ),
    );
    expect(body).toContain('Lo que sabemos');
    expect(body).toContain('Qué decidiríamos para este ciclo');
    expect(body).toContain('Aún no decidido');
    expect(body).toContain('Confirmar Mentalidad, el que propone la Matriz');
    expect(body).not.toContain('AWAITING_SELECTION');
  });

  it('UX-16: does not project an executable action when safety blocks it', () => {
    const body = text(
      renderToStaticMarkup(
        <StepExperience
          result={blockedResultFixture()}
          experience={experienceFixture({ blocked: true })}
          purposeStage="HIPOTETICO"
          draft={emptyExperienceDraft}
          onDraft={noop}
          productDraft={emptyProductDraft}
          onProductDraft={noop}
          productSaved={false}
          pending={false}
          onProject={noop}
          onSaveProductReview={noop}
        />,
      ),
    );
    expect(body).toMatch(/No hay acción ejecutable/);
    expect(body).not.toContain('Apagar pantallas');
  });

  it('UX-18: keeps purpose lab data out of the person view', () => {
    const markup = renderToStaticMarkup(
      <StepExperience
        result={resultFixture()}
        experience={experienceFixture()}
        purposeStage="HIPOTETICO"
        draft={emptyExperienceDraft}
        onDraft={noop}
        productDraft={emptyProductDraft}
        onProductDraft={noop}
        productSaved={false}
        pending={false}
        onProject={noop}
        onSaveProductReview={noop}
      />,
    );
    const userView = markup.slice(markup.indexOf('lab-user'), markup.indexOf('¿Esta experiencia representa MK?'));
    expect(userView).toContain('Construir autonomía');
    expect(userView).not.toContain('72');
    expect(userView).not.toContain('dimension');
    expect(userView).not.toMatch(/desempate/);
    expect(userView).not.toContain('MEN-EST');
  });

  it('UX-19: the product review asks its own questions', () => {
    const body = text(
      renderToStaticMarkup(
        <StepExperience
          result={resultFixture()}
          experience={experienceFixture()}
          purposeStage="HIPOTETICO"
          draft={emptyExperienceDraft}
          onDraft={noop}
          productDraft={emptyProductDraft}
          onProductDraft={noop}
          productSaved={false}
          pending={false}
          onProject={noop}
          onSaveProductReview={noop}
        />,
      ),
    );
    expect(body).toMatch(/¿Esta experiencia representa MK\?/);
    expect(body).toMatch(/¿Qué lugar ocupa Propósito en esta experiencia\?/);
    expect(body).not.toContain('¿Dónde empieza el primer problema?');
  });
});

describe('UX-11 / UX-13 change wizard', () => {
  const options = {
    definition_ref: 'matrix-v2.0@1',
    options: [
      {
        kind: 'RULE_THRESHOLD',
        target_id: 'R-MISS-01.insufficient_below',
        label: 'Cobertura mínima para interpretar un ámbito',
        description: 'Por debajo de este valor el ámbito queda sin clasificar.',
        value_kind: 'RATIO_AS_PERCENT',
        current: 0.6,
        min: 0,
        max: 100,
        step: 1,
        rule_id: 'R-MISS-01',
      },
      {
        kind: 'QUESTION_WEIGHT',
        target_id: 'AUD-MEN-01',
        label: 'Cuánto pesa una pregunta',
        description: 'Prueba qué ocurre si influye más o menos.',
        value_kind: 'WEIGHT',
        current: 1,
      },
    ],
    questions: [
      {
        id: 'AUD-MEN-01',
        text: '¿Con qué frecuencia logras mantener el foco?',
        domain: 'MENTALIDAD',
        dimension: 'FOCO_PERSONAL',
        dimension_label: 'Foco personal',
        weight: 1,
        active: true,
        scoreable: true,
        served: true,
      },
    ],
    inert_interpretation_params: [],
  };

  const markup = renderToStaticMarkup(
    <StepChange
      runId="run-1"
      options={options}
      reasonSeed=""
      pending={false}
      onSubmit={noop}
      result={null}
      onVerdict={noop}
      onDiscard={noop}
    />,
  );

  it('never asks Rafa for an operation code', () => {
    expect(rafaMode(markup)).not.toContain('SET_');
    expect(markup).not.toContain('ChangeSet');
    expect(markup).not.toMatch(/materializar/i);
  });

  it('asks what is wrong before offering a numeric experiment', () => {
    const body = text(markup);
    expect(body).toContain('¿Qué es lo que está mal?');
    expect(body).toContain('La pregunta');
    expect(body).toContain('La dimensión');
    expect(body).toContain('La escala');
    expect(body).toContain('El cálculo');
    expect(body).toContain('La cobertura');
    expect(body).toContain('El estado');
    expect(body).toContain('El ámbito prioritario');
    expect(body).toContain('Alertas');
    expect(body).toContain('La ruta sugerida');
    expect(body).not.toContain('Cambiar cuánto pesa una pregunta');
    expect(body).not.toContain('Cuánto quieres que influya');
  });

  it('UX-13: does not expose a free text field for the technical target', () => {
    expect(markup).not.toMatch(/name="target_id"/);
    expect(markup).not.toMatch(/placeholder="[^"]*destino/i);
  });

  it('explains question weight as influence, not as valor actual vs duplicar peso', () => {
    const body = text(
      renderToStaticMarkup(
        <StepChange
          runId="run-1"
          options={options}
          reasonSeed=""
          pending={false}
          onSubmit={noop}
          result={null}
          onVerdict={noop}
          onDiscard={noop}
          preset={{ kind: 'QUESTION_WEIGHT', target_id: 'AUD-MEN-01', value: '2' }}
        />,
      ),
    );
    expect(body).toContain('¿Qué es lo que está mal?');
    expect(body).toContain('Influye demasiado o demasiado poco');
    expect(body).toContain('La pregunta está bien, pero influye demasiado o demasiado poco');
    expect(body).not.toContain('Cuánto quieres que influya');
    expect(body).toContain('Hoy cuenta 1, igual que el resto de las preguntas que puntúan.');
    expect(body).toContain('Que cuente la mitad');
    expect(body).toContain('Que cuente el doble');
    expect(body).toContain('Número que quieres probar');
    expect(body).toContain('Vas a probar 2: el doble que hoy.');
    expect(body).not.toContain('Valor actual:');
    expect(body).not.toContain('Duplicar peso');
    expect(body).not.toContain('Reducir peso a la mitad');
  });

  it('UX-14: keeps the primary action disabled until the experiment is complete', () => {
    expect(markup).toContain('Revisar el cambio');
    expect(markup).toMatch(/<button type="button" class="lab-btn" disabled/);
    expect(text(markup)).toContain('Di qué está mal. Si se puede simular, completa el experimento y el motivo.');
  });

  it('does not open a candidate when the diagnosis is content, not a number', () => {
    const body = text(
      renderToStaticMarkup(
        <StepChange
          runId="run-1"
          options={options}
          reasonSeed=""
          pending={false}
          onSubmit={noop}
          result={null}
          onVerdict={noop}
          onDiscard={noop}
          preset={{ diagnosis: 'SCALE', target_id: '', value: '' }}
        />,
      ),
    );
    expect(body).toContain('Esto no se simula aquí');
    expect(body).toContain('Esto se anota en el cierre. No se crea una versión en prueba.');
    expect(body).not.toContain('Cuánto quieres que influya');
    expect(body).not.toContain('¿Por qué quieres probar esto?');
  });
});

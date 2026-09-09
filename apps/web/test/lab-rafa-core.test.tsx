import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/lab',
  useRouter: () => ({ push: () => undefined }),
}));

vi.mock('@/components/admin/unsaved-changes', () => ({
  useUnsavedChanges: () => ({ tryNavigate: () => true, register: () => undefined }),
}));

import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabQuestionCard } from '@/components/admin/lab/question-card';
import { StepCase } from '@/components/admin/lab/step-case';
import { StepPrediction, emptyExpectationDraft } from '@/components/admin/lab/step-prediction';
import { StepPurpose } from '@/components/admin/lab/step-purpose';
import { StepResponses } from '@/components/admin/lab/step-responses';
import { StepResult } from '@/components/admin/lab/step-result';
import { StepReview, emptyReviewDraft } from '@/components/admin/lab/step-review';
import { WhyTree } from '@/components/admin/lab/why-tree';
import { presetFromFirstProblem, tryChangeLabel } from '@/lib/lab-ui/change-preset';
import { LAB_PRIMARY_BANNED } from '@/lib/lab-ui/primary-ban';
import { PRIMARY_STEPS, STEP_LABELS } from '@/lib/lab-ui/status';
import {
  expectationFixture,
  questionsFixture,
  r04WhyResultFixture,
  resultFixture,
  runFixture,
  insufficientResultFixture,
} from './fixtures';

function text(node: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(node)
    .replace(/<details class="lab-tech"[\s\S]*?<\/details>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

describe('Rafa core flow without technical language', () => {
  it('keeps three primary steps and human labels', () => {
    expect(PRIMARY_STEPS).toEqual(['case', 'prediction', 'result']);
    expect(STEP_LABELS.case).toBe('Caso');
    expect(STEP_LABELS.prediction).toBe('Tu lectura');
    expect(STEP_LABELS.result).toBe('Resultado');
    expect(STEP_LABELS.experience).toBe('Probar cómo se vería en MK');
  });

  it('hides technical modules from the main nav', () => {
    const html = renderToStaticMarkup(<LabNav />);
    const body = text(<LabNav />);
    expect(body).toContain('Revisión');
    expect(body).toContain('Hallazgos');
    expect(body).toContain('Estado');
    expect(body).not.toContain('Detalles técnicos');
    expect(body).not.toContain('Cambios');
    expect(body).not.toContain('Más opciones');
    expect(body).not.toContain('Banco de preguntas');
    expect(body).not.toContain('QA automático');
    expect(body).not.toContain('Sandbox');
    expect(html).not.toMatch(/<details[^>]*\sopen/);
    expect(body).not.toContain('Versiones candidatas');
    expect(body).not.toContain('Preguntas marcadas');
    expect(body).not.toContain('Información técnica');
    expect(body).not.toContain('Ver información técnica');
  });

  it('does not show Purpose as pending on the case intro when there are no answers', () => {
    const run = runFixture({
      evidence: {
        domains: [
          { key: 'MENTALIDAD', answered: 24, scoreable: 24, coverage: 1, classification: 'INTERPRETABLE', evidence_state: 'OK' },
          { key: 'RELACIONES', answered: 23, scoreable: 23, coverage: 1, classification: 'INTERPRETABLE', evidence_state: 'OK' },
          { key: 'FINANZAS', answered: 23, scoreable: 23, coverage: 1, classification: 'INTERPRETABLE', evidence_state: 'OK' },
          { key: 'CUERPO', answered: 21, scoreable: 24, coverage: 0.8, classification: 'INTERPRETABLE', evidence_state: 'OK' },
        ],
        purpose: { answered: 0, total: 81 },
        total: { answered: 91, served: 187 },
        bands: { insufficient_below: 0.4, provisional_below: 0.6, rule_ids: [] },
      },
    });
    const body = text(<StepCase run={run} onContinue={() => undefined} />);
    expect(body).toContain('Este caso');
    expect(body).toContain('Sin información');
    expect(body).toContain('Continuar');
    expect(body).toContain('preguntas cerradas');
    expect(body).not.toContain('Qué estamos probando');
    expect(body).not.toContain('0 de 81');
    expect(body).not.toContain('no reporta');
  });

  it('asks only for the first domain in Tu lectura', () => {
    const body = text(
      <StepPrediction
        run={runFixture({ status: 'AWAITING_EXPECTATION' })}
        catalog={null}
        saved={null}
        draft={emptyExpectationDraft}
        onDraft={() => undefined}
        pending={false}
        onSubmit={() => undefined}
        onRevealWithout={() => undefined}
      />,
    );
    expect(body).toContain('Sin ver el resultado de la Matriz, ¿qué destacarías de este caso?');
    expect(body).toContain('Guardar mi lectura y revelar la Matriz');
    expect(
      renderToStaticMarkup(
        <StepPrediction
          run={runFixture({ status: 'AWAITING_EXPECTATION' })}
          catalog={null}
          saved={null}
          draft={emptyExpectationDraft}
          onDraft={() => undefined}
          pending={false}
          onSubmit={() => undefined}
          onRevealWithout={() => undefined}
        />,
      ),
    ).toContain('Quiero anticipar qué hará la Matriz');
    expect(body).not.toContain('¿Qué tan clara ves su dirección?');
  });

  it('shows R02-style result without candidate jargon', () => {
    const body = text(
      <StepResult
        result={resultFixture()}
        comparison={null}
        why=""
        trace=""
        onContinue={() => undefined}
      />,
    );
    expect(body).toContain('Resultado de la Matriz');
    expect(body).toContain('Ámbito prioritario');
    expect(body).toContain('Cómo llegó la Matriz aquí');
    expect(body).not.toContain('¿Este resultado te hace sentido?');
    expect(body).not.toContain('Candidato provisional');
    expect(body).not.toContain('Candidato de la Matriz');
  });

  it('does not call Unsure a difference', () => {
    const body = text(
      <StepResult
        result={resultFixture()}
        comparison={{
          expectation: expectationFixture({ personalFirstDomain: 'UNSURE', expectedPriorityDomain: 'UNSURE' }),
          comparison: { first_divergence: 'priority', rows: [], agreements: [], differences: [] },
        }}
        expectation={expectationFixture({ personalFirstDomain: 'UNSURE', expectedPriorityDomain: 'UNSURE' })}
        why=""
        trace=""
        onContinue={() => undefined}
      />,
    );
    expect(body).toContain('No registraste una decisión firme. Puedes revisar el resultado sin forzar una comparación.');
    expect(body).not.toContain('Tú trabajarías primero No estoy seguro');
    expect(body).not.toContain('coinciden en todo lo comparable');
  });

  it('shows the sense question first', () => {
    const body = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture({ personalFirstDomain: 'UNSURE' })}
        saved={null}
        draft={emptyReviewDraft}
        onDraft={() => undefined}
        pending={false}
        onSubmit={() => undefined}
        onContinue={() => undefined}
      />,
    );
    expect(body).toContain('¿El resultado coincide con lo que esperabas?');
    expect(body).not.toContain('¿Crees que esto es un problema?');
  });

  it('explains R04 calculation without weights', () => {
    const body = text(<WhyTree result={r04WhyResultFixture()} domainKey="CUERPO" />);
    expect(body).toContain('Cuerpo');
    expect(body).toContain('cuentan por igual');
    expect(body).toContain('Contención 0 a 39');
    expect(body).not.toContain('pasaría a');
    expect(body).not.toContain('0.25');
    expect(body).not.toContain('contribution');
    expect(body).not.toContain('domain_formula');
  });

  it('hides empty Purpose questions', () => {
    const body = text(
      <StepPurpose
        result={resultFixture()}
        questions={questionsFixture()}
        assessments={null}
        direction={null}
        draft={{ stage: 'UNSURE', evidence: [], confidence: 'MEDIA', notes: '' }}
        onDraft={() => undefined}
        pending={false}
        onSubmit={() => undefined}
        onContinue={() => undefined}
      />,
    );
    expect(body).toContain('Este caso no tiene información de Propósito');
    expect(body).toContain('Volver al caso');
    expect(body).not.toContain('¿En qué respuestas te apoyas?');
  });

  it('does not print a question id on the card', () => {
    const question = { ...questionsFixture()[0], id: 'AUD-MEN-01' };
    const body = text(
      <LabQuestionCard question={question} runId="run-1" revealed={false} />,
    );
    expect(body).not.toContain('AUD-MEN-01');
    expect(body).toContain('Revisar pregunta');
  });

  it('prefills a change from a priority problem without a rule id field', () => {
    expect(tryChangeLabel('PRIORITY')).toBe('Probar otro orden de desempate');
    expect(presetFromFirstProblem('PRIORITY')).toEqual({
      diagnosis: 'PRIORITY',
      kind: 'INTERPRETATION',
      target_id: 'LAB-PRIORITY-01.domain_tie_break',
      value: '',
    });
    const body = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{ ...emptyReviewDraft, overallSense: 'NO', firstDivergence: 'PRIORITY', notes: 'Otro orden' }}
        onDraft={() => undefined}
        pending={false}
        onSubmit={() => undefined}
        onContinue={() => undefined}
      />,
    );
    expect(body).toContain('¿Qué debería ir primero?');
    expect(body).not.toContain('LAB-PRIORITY-01');
  });

  it('keeps banned strings out of the primary flow', () => {
    const screens = [
      text(<LabNav />),
      text(<StepCase run={runFixture()} onContinue={() => undefined} />),
      text(
        <StepPrediction
          run={runFixture({ status: 'AWAITING_EXPECTATION' })}
          catalog={null}
          saved={null}
          draft={emptyExpectationDraft}
          onDraft={() => undefined}
          pending={false}
          onSubmit={() => undefined}
          onRevealWithout={() => undefined}
        />,
      ),
      text(
        <StepResult result={resultFixture()} comparison={null} why="" trace="" onContinue={() => undefined} />,
      ),
      text(<WhyTree result={insufficientResultFixture()} domainKey="CUERPO" />),
    ].join(' ');
    expect(screens).not.toContain('Ver información técnica');
    expect(screens).not.toContain('Información técnica');
    for (const banned of LAB_PRIMARY_BANNED) {
      expect(screens).not.toContain(banned);
    }
  });

  it('keeps the main actions on screen and starts on answered questions', () => {
    const responses = renderToStaticMarkup(
      <StepResponses
        run={runFixture()}
        questions={questionsFixture()}
        pending={false}
        onFreeze={() => undefined}
      />,
    );
    expect(responses).toContain('lab-ctabar--dock');
    expect(responses).toContain('Cerrar respuestas y registrar mi criterio');
    expect(responses.indexOf('Cerrar respuestas y registrar mi criterio')).toBeLessThan(
      responses.indexOf('lab-qc'),
    );
    expect(responses).toMatch(/lab-chip[^>]*is-active[^>]*>Respondidas/);
    expect(responses).toContain('24 evaluables');
    expect(responses).toContain('Por ámbito');
    expect(responses).toContain('Lista');
    expect(responses).not.toContain('Agrupar por ámbito');
    expect(responses).not.toContain('Todos los ámbitos');
    expect(responses).toContain('Este caso tiene respuestas en los cuatro ámbitos.');

    const criterion = renderToStaticMarkup(
      <StepPrediction
        run={runFixture({ status: 'AWAITING_EXPECTATION' })}
        catalog={null}
        saved={null}
        draft={emptyExpectationDraft}
        onDraft={() => undefined}
        pending={false}
        onSubmit={() => undefined}
        onRevealWithout={() => undefined}
      />,
    );
    expect(criterion).toContain('lab-ctabar--dock');
    expect(criterion).toContain('Guardar mi lectura y revelar la Matriz');
    expect(criterion.indexOf('Guardar mi lectura y revelar la Matriz')).toBeLessThan(
      criterion.indexOf('Sin ver el resultado de la Matriz, ¿qué destacarías de este caso?'),
    );

    const result = renderToStaticMarkup(
      <StepResult result={resultFixture()} comparison={null} why="" trace="" onContinue={() => undefined} />,
    );
    expect(result).toContain('lab-details');
    expect(result).toContain('Cómo llegó la Matriz aquí');
    expect(result).toContain('Resultado de la Matriz');

    const review = renderToStaticMarkup(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture({ personalFirstDomain: 'UNSURE' })}
        saved={null}
        draft={emptyReviewDraft}
        onDraft={() => undefined}
        pending={false}
        onSubmit={() => undefined}
        onContinue={() => undefined}
      />,
    );
    expect(review).toContain('lab-ctabar--dock');
    expect(review.indexOf('Responde si coincide')).toBeLessThan(
      review.indexOf('¿El resultado coincide con lo que esperabas?'),
    );

    const intro = renderToStaticMarkup(<StepCase run={runFixture()} onContinue={() => undefined} />);
    expect(intro).toContain('lab-ctabar--dock');
    expect(intro.indexOf('Continuar')).toBeLessThan(intro.indexOf('Este caso'));
  });
});

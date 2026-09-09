import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ObserveButton } from '@/components/admin/lab/question-observe';
import { StepPurpose } from '@/components/admin/lab/step-purpose';
import { StepReview, emptyReviewDraft } from '@/components/admin/lab/step-review';
import { expectationFixture, questionsFixture, resultFixture } from './fixtures';

function text(markup: string): string {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const question = {
  ...questionsFixture()[0],
  id: 'AUD-CUE-01',
  weight: 1,
  is_risk: false,
};

describe('LAB-030 question review panel', () => {
  it('hides score and weight before reveal', () => {
    const body = text(
      renderToStaticMarkup(
        <ObserveButton runId="run-1" question={question} revealed={false} defaultOpen />,
      ),
    );
    expect(body).toContain('Revisar pregunta');
    expect(body).not.toContain('A. Redacción');
    expect(body).not.toContain('Interpretación numérica');
  });

  it('asks whether the question is well posed', () => {
    const body = text(
      renderToStaticMarkup(
        <ObserveButton runId="run-1" question={question} revealed score={0} defaultOpen />,
      ),
    );
    expect(body).toContain('¿La pregunta está bien planteada?');
    expect(body).toContain('Pesa demasiado');
    expect(body).not.toContain('E. Peso');
  });
});

describe('LAB-032 comparison block', () => {
  it('renders agreements and differences from comparison', () => {
    const body = text(
      renderToStaticMarkup(
        <StepReview
          result={resultFixture()}
          questions={questionsFixture()}
          expectation={expectationFixture({ personalFirstDomain: 'CUERPO' })}
          comparison={{
            expectation: null,
            comparison: {
              first_divergence: 'states',
              rows: [],
              agreements: [{ concept: 'Ámbito prioritario', text: 'Ámbito prioritario: Cuerpo' }],
              differences: [
                {
                  concept: 'Cuerpo',
                  expected: 'ESTABILIZACIÓN',
                  actual: 'CONSOLIDACIÓN',
                  text: 'Cuerpo: tú Estabilización, la Matriz Consolidación',
                },
              ],
            },
          }}
          saved={null}
          draft={emptyReviewDraft}
          onDraft={() => undefined}
          pending={false}
          onSubmit={() => undefined}
          onContinue={() => undefined}
        />,
      ),
    );
    expect(body).toContain('¿El resultado coincide con lo que esperabas?');
    expect(body).not.toContain('tú Estabilización, la Matriz Consolidación');
  });
});

describe('LAB-034 purpose saved state', () => {
  it('shows the stored criterion and hides the form until Edit', () => {
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
          assessments={{
            purpose: [
              {
                stage: 'HIPOTETICO',
                notes: 'Quiere orden',
                evidenceRefs: ['P-PRO-01'],
                confidence: 'ALTA',
                revision: 1,
              },
            ],
            safety: [],
            matrix_purpose: 'NO_DOMAIN_OUTPUT',
          }}
          direction={null}
          draft={{ stage: 'HIPOTETICO', evidence: ['P-PRO-01'], confidence: 'ALTA', notes: 'Quiere orden' }}
          onDraft={() => undefined}
          pending={false}
          onSubmit={() => undefined}
          onContinue={() => undefined}
        />,
      ),
    );
    expect(body).toContain('Registrado');
    expect(body).toContain('Editar');
    expect(body).toContain('Criterio guardado');
    expect(body).not.toContain('¿Cómo describirías su dirección?');
    expect(body).not.toContain('dimension_scores');
    expect(body).not.toContain('Cobertura de módulos de Propósito');
  });
});

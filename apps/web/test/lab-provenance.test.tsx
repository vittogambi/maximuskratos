import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabProvenance, LabQuestionCard } from '@/components/admin/lab/question-card';
import { ObserveButton } from '@/components/admin/lab/question-observe';
import { questionsFixture } from './fixtures';
import type { LabSourceMapping } from '@/lib/lab-api';

const high: LabSourceMapping = {
  v2_question_id: 'AUD-CUE-04',
  v2_question: 'Realizo actividad física o entrenamiento con una frecuencia sostenible.',
  v2_domain: 'CUERPO',
  v2_dimension: 'Movimiento y entrenamiento',
  v2_variable_type: 'ESTADO',
  v2_phase: 'AUDITORÍA',
  v2_instrumento: 'AUD-001',
  source_form: 'E-AUD-001',
  source_section: 'SECCIÓN 2: HÁBITOS Y ACCIONES',
  source_question_number: '6',
  source_question: '¿Qué tan seguido realiza entrenamiento físico?',
  source_response_type: 'Likert 1 a 5',
  source_alert_logic: null,
  transformation_type: 'REFORMULATED',
  why_changed: 'Banco neutral; lenguaje firme reservado para devolución editorial.',
  confidence: 'HIGH',
  review_needed_by_rafa: 'NO',
};

const unclear: LabSourceMapping = {
  ...high,
  v2_question_id: 'AUD-MEN-01',
  source_question: null,
  source_section: null,
  transformation_type: 'UNCLEAR',
  why_changed: 'REQUIRES HUMAN AUTHORING',
  confidence: 'LOW',
  review_needed_by_rafa: 'YES',
};

const created: LabSourceMapping = {
  ...high,
  v2_question_id: 'P-PRO-071',
  source_form: 'NUEVA',
  source_question: null,
  transformation_type: 'NEW_IN_V2',
  why_changed: 'Crear hipótesis completas y evaluarlas en seis criterios.',
};

function body(node: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('LAB-062 provenance disclosure', () => {
  it('renders a HIGH mapping with the original training question', () => {
    const markup = renderToStaticMarkup(<LabProvenance mapping={high} onEvaluate={() => undefined} />);
    const text = body(<LabProvenance mapping={high} onEvaluate={() => undefined} />);
    expect(markup).toContain('lab-provenance');
    expect(text).not.toContain('Ver de dónde viene esta pregunta');
    expect(text).toContain('Origen y cambios');
    expect(text).toContain('Matriz v2');
    expect(text).toContain('E-AUD-001');
    expect(text).toContain('¿Qué tan seguido realiza entrenamiento físico?');
    expect(text).toContain('Se reformuló');
    expect(text).toContain('Revisar el origen');
  });

  it('shows pending origin so UNCLEAR is not hidden', () => {
    const markup = renderToStaticMarkup(<LabProvenance mapping={unclear} />);
    const text = body(<LabProvenance mapping={unclear} />);
    expect(markup).toContain('lab-provenance');
    expect(text).toContain('Origen pendiente de confirmar');
    expect(text).not.toContain('REQUIRES HUMAN AUTHORING');
    expect(text).not.toContain('UNCLEAR');
  });

  it('explains NEW_IN_V2', () => {
    const text = body(<LabProvenance mapping={created} />);
    expect(text).toContain('Es nueva');
  });

  it('omits origin from the question card even when a mapping exists', () => {
    const question = { ...questionsFixture()[0], source_mapping: high };
    const markup = renderToStaticMarkup(
      <LabQuestionCard question={question} runId="run-1" revealed={false} />,
    );
    const text = body(
      <LabQuestionCard question={question} runId="run-1" revealed={false} />,
    );
    expect(markup).not.toContain('lab-provenance');
    expect(text).not.toContain('Ver de dónde viene esta pregunta');
    expect(text).not.toContain('Origen de esta pregunta');
  });

  it('shows origin as a secondary disclosure after reveal', () => {
    const question = { ...questionsFixture()[0], source_mapping: high };
    const markup = renderToStaticMarkup(
      <LabQuestionCard question={question} runId="run-1" revealed />,
    );
    const text = body(<LabQuestionCard question={question} runId="run-1" revealed />);
    expect(markup).toContain('lab-provenance');
    expect(text).toContain('Ver de dónde viene esta pregunta');
    expect(text).toContain('Qué había antes');
    expect(text).toContain('Qué existe ahora');
    expect(text).toContain('¿Qué tan seguido realiza entrenamiento físico?');
  });

  it('omits the disclosure when there is no mapping', () => {
    const question = questionsFixture()[0];
    const markup = renderToStaticMarkup(
      <LabQuestionCard question={question} runId="run-1" revealed={false} />,
    );
    expect(markup).not.toContain('lab-provenance');
  });
});

describe('LAB-063 fidelity block', () => {
  it('shows fidelity under quality when a mapping exists', () => {
    const question = { ...questionsFixture()[0], id: 'AUD-MEN-01', source_mapping: high, is_risk: false };
    const text = body(<ObserveButton runId="run-1" question={question} revealed defaultOpen />);
    expect(text).toContain('¿Se conservó la intención original?');
  });
});

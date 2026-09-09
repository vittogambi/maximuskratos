import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Questionnaire } from '@/components/admin/lab/questionnaire';
import { StepPurpose } from '@/components/admin/lab/step-purpose';
import { questionsFixture, resultFixture, runFixture } from './fixtures';

function text(node: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('LAB-065 own-case phases', () => {
  it('opens on Auditoría and lists the six chips', () => {
    const questions = [
      { ...questionsFixture()[0], id: 'AUD-MEN-01', domain: 'MENTALIDAD' },
      { ...questionsFixture()[1], id: 'D-CUE-01', domain: 'CUERPO' },
    ];
    const body = text(
      <Questionnaire
        run={runFixture({ case_kind: 'SELF', responses_editable: true, status: 'COLLECTING' })}
        questions={questions}
        catalog={{
          definition_ref: 'matrix-v2.0@1',
          plans: [],
          objectives: [],
          dimension_labels: {},
          questionnaire: {
            domains: [],
            purpose_modules: [],
            phases: [
              { key: 'auditoria', chip: 'Auditoría', title: 'Auditoría inicial', help: 'Primera lectura.', question_ids: ['AUD-MEN-01'] },
              { key: 'cuerpo', chip: 'Cuerpo', title: 'Radiografía de cuerpo', help: null, question_ids: ['D-CUE-01'] },
              { key: 'relaciones', chip: 'Relaciones', title: 'Radiografía de relaciones', help: null, question_ids: [] },
              { key: 'finanzas', chip: 'Finanzas', title: 'Radiografía de finanzas', help: null, question_ids: [] },
              { key: 'mentalidad', chip: 'Mentalidad', title: 'Diagnóstico de mentalidad', help: null, question_ids: [] },
              { key: 'proposito', chip: 'Propósito', title: 'Propósito', help: 'El Manifiesto se arma después.', question_ids: [] },
            ],
            total_served: 2,
          },
        }}
        dirty={false}
        saving={false}
        onChange={() => undefined}
        onSave={() => undefined}
      />,
    );
    expect(body).toContain('Auditoría');
    expect(body).toContain('Auditoría inicial');
    expect(body.indexOf('Auditoría')).toBeLessThan(body.indexOf('Cuerpo'));
    expect(body).not.toContain('Hoja de Ruta');
    expect(body).not.toContain('Revisar pregunta');
    expect(body).toContain('Siguiente');
  });
});

describe('typed and choice questions', () => {
  const catalog = {
    definition_ref: 'matrix-v2.0@1',
    plans: [],
    objectives: [],
    dimension_labels: {},
    questionnaire: {
      domains: [],
      purpose_modules: [],
      phases: [
        {
          key: 'cuerpo',
          chip: 'Cuerpo',
          title: 'Radiografía de cuerpo',
          help: 'Sueño, movimiento, alimentación, seguridad y objetivo.',
          question_ids: ['D-CUE-06', 'D-CUE-07'],
        },
      ],
      total_served: 1,
    },
  };

  function play(question: ReturnType<typeof questionsFixture>[number]) {
    return renderToStaticMarkup(
      <Questionnaire
        run={runFixture({ case_kind: 'SELF', responses_editable: true, status: 'COLLECTING' })}
        questions={[{ ...question, domain: 'CUERPO' }]}
        catalog={{
          ...catalog,
          questionnaire: {
            ...catalog.questionnaire,
            phases: catalog.questionnaire.phases.map((phase) => ({
              ...phase,
              question_ids: [question.id],
            })),
          },
        }}
        dirty={false}
        saving={false}
        onChange={() => undefined}
        onSave={() => undefined}
      />,
    );
  }

  it('shows labeled numeric fields for basal data, not a Valor numérico button', () => {
    const html = play({
      ...questionsFixture()[0],
      id: 'D-CUE-06',
      text: 'Edad, estatura, peso, cintura y otros datos basales autorizados.',
      scale_id: 'NUMERIC',
      scale_kind: 'NUMBER',
      status: 'UNANSWERED',
      raw_value: null,
      answer_label: null,
      scale: {
        id: 'NUMERIC',
        kind: 'NUMBER',
        anchors: [{ value: null, label: 'Valor numérico', score: null }],
      },
    });
    expect(html).toContain('Edad');
    expect(html).toContain('Estatura');
    expect(html).toContain('Peso');
    expect(html).toContain('Cintura');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('Valor numérico');
  });

  it('shows a hours field for sleep and does not accept a free text dump', () => {
    const html = play({
      ...questionsFixture()[0],
      id: 'D-CUE-07',
      text: 'Horas promedio de sueño por noche durante las últimas dos semanas.',
      scale_id: 'SLEEP_HOURS',
      scale_kind: 'NUMBER',
      status: 'UNANSWERED',
      raw_value: null,
      answer_label: null,
      scale: {
        id: 'SLEEP_HOURS',
        kind: 'NUMBER',
        anchors: [{ value: null, label: 'Horas promedio con decimal', score: null }],
      },
    });
    expect(html).toContain('<input');
    expect(html.toLowerCase()).toContain('inputmode="decimal"');
    expect(html).toContain('horas');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('Horas promedio con decimal');
  });

  it('splits physique options so Hipertrofiado is a real choice', () => {
    const html = play({
      ...questionsFixture()[0],
      text: 'Arquitectura física preferida: mantenimiento, atlética, musculada, hipertrofiada u otra.',
      scale_id: 'BODY_GOAL',
      scale_kind: 'CHOICE',
      status: 'UNANSWERED',
      raw_value: null,
      answer_label: null,
      scale: {
        id: 'BODY_GOAL',
        kind: 'CHOICE',
        anchors: [
          {
            value: null,
            label: 'Mantenimiento / Atlético / Musculado / Hipertrofiado / Otro',
            score: null,
          },
        ],
      },
    });
    expect(html).toContain('Hipertrofiado');
    expect(html).toContain('Atlético');
    expect(html).not.toContain('Mantenimiento / Atlético');
  });
});

describe('LAB-066 purpose coverage', () => {
  it('says which modules are needed for Dirección', () => {
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
  });
});

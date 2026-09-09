import { LabCard } from './primitives';
import type { LabPairCompare } from '@/lib/lab-api';
import { formatState } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export function pairPrompt(): string {
  return '¿Esta diferencia en las respuestas debería producir esta diferencia en el resultado?';
}

function questionDiffLabel(pair: LabPairCompare, count: number): string {
  const directionOnly =
    Boolean(pair.diagnostic_equal) && pair.direction && !pair.direction.fingerprint_equal;
  const noun = directionOnly ? 'respuestas sobre hacia dónde quiere ir' : 'respuestas';
  if (count === 1) return 'Los casos difieren en una respuesta.';
  return `Los casos difieren en ${count} ${noun}.`;
}

function QuestionDiffs({
  pair,
  aColumn,
  bColumn,
}: {
  pair: LabPairCompare;
  aColumn: string;
  bColumn: string;
}) {
  const questions = pair.changed_questions ?? [];
  if (questions.length === 0) return <p className="lab-muted">Sin cambio</p>;
  const list = (
    <ul className="lab-stack lab-stack--tight">
      {questions.map((item) => (
        <li key={item.questionId}>
          <p style={{ margin: 0 }}>{item.text ?? 'Pregunta sin texto'}</p>
          <p className="lab-muted" style={{ margin: 0 }}>
            {aColumn}: {item.a_label ?? 'sin dato'}. {bColumn}: {item.b_label ?? 'sin dato'}.
          </p>
        </li>
      ))}
    </ul>
  );
  if (questions.length === 1) {
    return (
      <section>
        <h3 className="lab-h4">{questionDiffLabel(pair, 1)}</h3>
        {list}
      </section>
    );
  }
  return (
    <details className="lab-details">
      <summary>
        {questionDiffLabel(pair, questions.length)} Ver respuestas comparadas
      </summary>
      {list}
    </details>
  );
}

export function PairCompare({
  pair,
  title = 'Qué cambia entre A y B',
  aColumn = 'A',
  bColumn = 'B',
  showQuestion = true,
}: {
  pair: LabPairCompare;
  title?: string | null;
  aColumn?: string;
  bColumn?: string;
  showQuestion?: boolean;
}) {
  const dimensions = Object.entries(pair.dimensions ?? {});
  const priorityA = pair.priority?.a ?? null;
  const priorityB = pair.priority?.b ?? null;
  const planA = pair.plans?.a_name ?? pair.plans?.a ?? 'No se propone';
  const planB = pair.plans?.b_name ?? pair.plans?.b ?? 'No se propone';
  const alertA = pair.alerts?.a ?? 'ninguna';
  const alertB = pair.alerts?.b ?? 'ninguna';
  const question = pair.implied_rule ?? pairPrompt();
  const diagnosticEqual = Boolean(pair.diagnostic_equal);
  const portraits = pair.portraits;

  return (
    <LabCard title={title || undefined}>
      {showQuestion ? <p className="lab-lead">{question}</p> : null}

      {portraits?.a ? (
        <section>
          <h3 className="lab-h4">Caso A</h3>
          <p>{portraits.a}</p>
        </section>
      ) : null}
      {portraits?.b ? (
        <section>
          <h3 className="lab-h4">Caso B</h3>
          <p>{portraits.b}</p>
        </section>
      ) : null}

      <QuestionDiffs pair={pair} aColumn={aColumn} bColumn={bColumn} />

      <section>
        <h3 className="lab-h4">Diagnóstico</h3>
        <p>{diagnosticEqual ? 'Igual en ambos casos' : 'Hay diferencias'}</p>
        {PLANNED.map((key) => {
          const row = pair.domains?.[key];
          const changed = Boolean(
            row && (row.a_state !== row.b_state || row.a_score !== row.b_score),
          );
          return (
            <p key={key} className="lab-muted" style={{ margin: 0 }}>
              {labUiLabels.domain(key)} · {changed ? 'cambió' : 'igual'}
              {changed && row
                ? `. ${row.a_score ?? 'sin puntaje'} ${formatState(row.a_state)}. ${row.b_score ?? 'sin puntaje'} ${formatState(row.b_state)}`
                : ''}
            </p>
          );
        })}
        <p className="lab-muted" style={{ margin: 0 }}>
          Ámbito prioritario
          {priorityA === priorityB
            ? `: ${labUiLabels.domain(priorityA)} en ambos`
            : `. Cambió. ${labUiLabels.domain(priorityA)}. ${labUiLabels.domain(priorityB)}`}
        </p>
        <p className="lab-muted" style={{ margin: 0 }}>
          Alertas
          {alertA === alertB
            ? `: ${alertA === 'ninguna' ? 'Ninguna' : alertA}`
            : ` · cambió. ${alertA}. ${alertB}`}
        </p>
        <p className="lab-muted" style={{ margin: 0 }}>
          Ruta
          {planA === planB ? `: ${planA}` : ` · cambió. ${planA}. ${planB}`}
        </p>
        {!diagnosticEqual && dimensions.length > 0
          ? dimensions.map(([key, row]) => (
              <p key={key} className="lab-muted" style={{ margin: 0 }}>
                {row.label}: {row.a == null ? 'sin puntaje' : row.a}. {row.b == null ? 'sin puntaje' : row.b}.
              </p>
            ))
          : null}
      </section>

      {pair.direction ? (
        <section>
          <h3 className="lab-h4">Hacia dónde quiere ir</h3>
          <p>{pair.direction.fingerprint_equal ? 'Igual' : 'Distinta'}</p>
          <p className="lab-muted">
            {pair.direction.fingerprint_equal
              ? 'Lo que expresa sobre hacia dónde quiere ir quedó igual.'
              : diagnosticEqual
                ? 'La diferencia se conservó sin modificar el diagnóstico.'
                : 'Lo que expresa sobre hacia dónde quiere ir es distinto.'}
          </p>
        </section>
      ) : null}
    </LabCard>
  );
}

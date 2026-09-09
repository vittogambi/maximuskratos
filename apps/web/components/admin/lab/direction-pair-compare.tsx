import type { ReactNode } from 'react';
import { LabCard } from './primitives';
import type { LabPairCompare } from '@/lib/lab-api';
import { directionPairVisible, isDirectionCompareFamily } from '@/lib/lab-ui/direction-compare';
import { formatState } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';

export { directionPairVisible, isDirectionCompareFamily };

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export function DirectionPairCompare({
  pair,
  question,
  children,
}: {
  pair: LabPairCompare;
  question: string;
  children?: ReactNode;
}) {
  const diagnosticEqual = Boolean(pair.diagnostic_equal);
  const priorityA = pair.priority?.a ?? null;
  const priorityB = pair.priority?.b ?? null;
  const planA = pair.plans?.a_name ?? pair.plans?.a ?? 'No se propone';
  const planB = pair.plans?.b_name ?? pair.plans?.b ?? 'No se propone';
  const alertA = pair.alerts?.a ?? 'ninguna';
  const alertB = pair.alerts?.b ?? 'ninguna';
  const domainChanged = Object.values(pair.domains ?? {}).some(
    (row) => row.a_state !== row.b_state || row.a_score !== row.b_score,
  );
  const priorityChanged = priorityA !== priorityB;
  const alertsChanged = alertA !== alertB;
  const routeChanged = planA !== planB;
  const questions = pair.changed_questions ?? [];
  const first = pair.portraits?.a ?? 'Esta versión expresa una dirección distinta.';
  const second = pair.portraits?.b ?? 'Esta versión expresa una dirección distinta.';

  return (
    <LabCard title="Comparar las dos versiones de Benjamín">
      <p>
        {diagnosticEqual
          ? 'Las dos versiones tienen las mismas respuestas diagnósticas, pero expresan cosas distintas sobre hacia dónde quiere ir.'
          : 'Las dos versiones expresan cosas distintas sobre hacia dónde quiere ir, y el diagnóstico no coincide.'}
      </p>

      <section className="lab-stack lab-stack--tight">
        <h3 className="lab-h3">Lo que cambia</h3>
        <div>
          <p className="lab-h4">En la primera versión</p>
          <p>{first}</p>
        </div>
        <div>
          <p className="lab-h4">En la segunda versión</p>
          <p>{second}</p>
        </div>
        <details className="lab-details">
          <summary>Ver respuestas de Dirección que cambiaron</summary>
          {questions.length === 0 ? (
            <p className="lab-muted">No hay respuestas distintas para mostrar.</p>
          ) : (
            <ul className="lab-stack lab-stack--tight">
              {questions.map((item) => (
                <li key={item.questionId}>
                  <p style={{ margin: 0 }}>{item.text ?? 'Pregunta sin texto'}</p>
                  <p className="lab-muted" style={{ margin: 0 }}>
                    Primera versión: {item.a_label ?? 'sin dato'}. Segunda versión: {item.b_label ?? 'sin dato'}.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>

      <section className="lab-stack lab-stack--tight">
        <h3 className="lab-h3">Diagnóstico de la Matriz</h3>
        <p className="lab-h4">
          {diagnosticEqual
            ? 'Se mantiene igual en las dos versiones.'
            : 'No se mantiene igual en las dos versiones.'}
        </p>
        <p>
          Ámbito prioritario:{' '}
          {priorityChanged
            ? `cambió. ${labUiLabels.domain(priorityA)}. ${labUiLabels.domain(priorityB)}`
            : labUiLabels.domain(priorityA)}
        </p>
        <p>Estado por ámbito: {domainChanged ? 'hay cambios' : 'sin cambios'}</p>
        <p>Alertas: {alertsChanged ? 'hay cambios' : 'sin cambios'}</p>
        <p>Ruta: {routeChanged ? 'hay cambios' : 'sin cambios'}</p>
        <details className="lab-details">
          <summary>Ver detalle del diagnóstico</summary>
          <div className="lab-stack lab-stack--tight">
            {PLANNED.map((key) => {
              const row = pair.domains?.[key];
              const changed = Boolean(
                row && (row.a_state !== row.b_state || row.a_score !== row.b_score),
              );
              return (
                <p key={key} className="lab-muted" style={{ margin: 0 }}>
                  {labUiLabels.domain(key)}
                  {changed && row
                    ? `. Primera versión: ${row.a_score ?? 'sin puntaje'} ${formatState(row.a_state)}. Segunda versión: ${row.b_score ?? 'sin puntaje'} ${formatState(row.b_state)}`
                    : ': sin cambios'}
                </p>
              );
            })}
            <p className="lab-muted" style={{ margin: 0 }}>
              Ámbito prioritario: {labUiLabels.domain(priorityA)}
              {priorityChanged ? `. Segunda versión: ${labUiLabels.domain(priorityB)}` : ''}
            </p>
            <p className="lab-muted" style={{ margin: 0 }}>
              Alertas: {alertA === 'ninguna' ? 'Ninguna' : alertA}
              {alertsChanged ? `. Segunda versión: ${alertB === 'ninguna' ? 'Ninguna' : alertB}` : ''}
            </p>
            <p className="lab-muted" style={{ margin: 0 }}>
              Ruta: {planA}
              {routeChanged ? `. Segunda versión: ${planB}` : ''}
            </p>
          </div>
        </details>
      </section>

      <section className="lab-stack lab-stack--tight">
        <p className="lab-h4">Lo que necesitamos revisar</p>
        <p className="lab-h3">{question}</p>
        {children}
      </section>
    </LabCard>
  );
}

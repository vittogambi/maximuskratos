import Link from 'next/link';
import { formatAlignmentDate, formatAlignmentValue, type HomeBoardView } from '@/lib/journey-api';
import { formatMethodVersionLabel } from '@/lib/method-version-label';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const KINDS: Record<string, string> = {
  INITIAL: 'Inicial',
  REMEASURE: 'Medición posterior',
  RECONSTRUCTED: 'Reconstrucción',
};
const DIRECTIONS: Record<string, string> = {
  EXPLORANDO: 'Exploración',
  PROVISIONAL: 'Provisional',
  CONFIRMADO_POR_USUARIO: 'Confirmada por la persona',
};
const LINKS: Record<string, string> = {
  DIRECT: 'Vinculación directa',
  ENABLING: 'Habilita la dirección',
  PROTECTIVE: 'Protege la capacidad',
  EXPLORATORY: 'Explora',
};

function civil(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  const label = MONTHS[Number(month) - 1];
  if (!year || !label || !day) return iso;
  return `${Number(day)} ${label} ${year}`;
}

function pillars(value: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null): string {
  if (!value) return 'Sin pilares.';
  return `Espíritu ${formatAlignmentValue(value.espiritu)}, mente ${formatAlignmentValue(value.mente)}, cuerpo ${formatAlignmentValue(value.cuerpo)}.`;
}

export function readingValue(general: number | null, diagnosticOpen: boolean): string {
  if (general != null) return formatAlignmentValue(general);
  return diagnosticOpen ? 'Por completar' : 'No disponible';
}

export function HomeReading({ board }: { board: HomeBoardView }) {
  if (board.situation === 'QUESTIONNAIRE') {
    return (
      <div className="mk-home__facts">
        <p className="mk-home__note">La síntesis, la dirección, el plan y la revisión aparecen al cerrar la auditoría.</p>
      </div>
    );
  }
  return (
    <div className="mk-home__facts">
      <section className="mk-home__block" aria-label="Síntesis">
        <h2>Síntesis</h2>
        {board.synthesis.text ? <p>{board.synthesis.text}</p> : <p className="mk-home__note">Todavía no hay una síntesis.</p>}
        <p className="mk-home__note">
          {board.synthesis.source === 'EDITED'
            ? 'Texto editado por la persona. Es la referencia vigente.'
            : board.synthesis.source === 'GENERATED'
              ? 'Texto generado del cruce. La persona todavía no lo editó.'
              : 'La síntesis aparece cuando el cruce tiene texto.'}
        </p>
      </section>

      <section className="mk-home__block" aria-label="Dirección">
        <h2>Dirección</h2>
        <p>{board.direction.status ? DIRECTIONS[board.direction.status] ?? board.direction.status : 'Sin dirección elegida.'}</p>
        {board.direction.goalText ? <p>Meta vigente: {board.direction.goalText}</p> : null}
        {board.direction.experiment ? (
          <p>Experimento IKIGAI vigente: {board.direction.experiment.hypothesis}</p>
        ) : (
          <p className="mk-home__note">No hay un experimento IKIGAI vigente.</p>
        )}
      </section>

      <section className="mk-home__block" aria-label="Plan principal">
        <h2>Plan principal</h2>
        {board.plan ? (
          <>
            <p>{board.plan.title}</p>
            <p>Resultado buscado: {board.plan.outcome}</p>
            <p>{board.plan.priorityNote ? `Prioridad: ${board.plan.priorityNote}` : 'Sin nota de prioridad.'}</p>
            {board.plan.linkKind ? <p className="mk-home__note">{LINKS[board.plan.linkKind] ?? 'Vínculo registrado.'}</p> : null}
            {board.situation === 'PAUSED' ? <p className="mk-home__note">El plan está en pausa.</p> : null}
          </>
        ) : (
          <p className="mk-home__note">No hay un plan principal.</p>
        )}
      </section>

      <section className="mk-home__block" aria-label="Siguiente ocasión">
        <h2>Siguiente ocasión</h2>
        {board.occasion ? (
          <>
            <p>{civil(board.occasion.day)}. {board.occasion.title}</p>
            <p>Criterio: {board.occasion.criterion}</p>
          </>
        ) : (
          <p className="mk-home__note">
            {board.situation === 'PAUSED' ? 'Sin ocasión mientras la pausa sigue.' : 'No hay una ocasión futura con día.'}
          </p>
        )}
      </section>

      <section className="mk-home__block" aria-label="Última revisión">
        <h2>Última revisión</h2>
        {board.review ? (
          <>
            <p>Semana del {civil(board.review.weekStart)}.</p>
            {board.review.note ? <p>{board.review.note}</p> : null}
            {board.review.changes.length ? (
              <ul>{board.review.changes.map((change) => <li key={change}>{change}</li>)}</ul>
            ) : (
              <p className="mk-home__note">Esta revisión no registró cambios futuros.</p>
            )}
          </>
        ) : (
          <p className="mk-home__note">Todavía no hay una revisión cerrada.</p>
        )}
      </section>

      <section className="mk-home__block" aria-label="Profundidad documentada">
        <h2>Profundidad documentada</h2>
        {board.depth ? (
          <>
            <p className="mk-home__note">{board.depth.explanation}</p>
            <p>
              {board.depth.general != null
                ? `General ${formatAlignmentValue(board.depth.general)}.`
                : board.depth.partial != null
                  ? `Sin general. Parcial ${formatAlignmentValue(board.depth.partial)}.`
                  : 'Sin general.'}
              {' '}Cobertura {board.depth.coverage.scored ?? 0} de {board.depth.coverage.required}. {formatMethodVersionLabel(board.depth.methodVersion)}.
            </p>
            <ul>
              {board.depth.components.map((item) => (
                <li key={item.component}>
                  <Link href={item.href}>{item.label}</Link>
                  <span>. {item.stage}. {item.detail === item.stage ? '' : item.detail}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mk-home__note">La profundidad se documenta en la hoja, después del cuestionario.</p>
        )}
      </section>

      <section className="mk-home__block" aria-label="Evolución">
        <h2>Evolución del índice</h2>
        <p className="mk-home__note">{board.evolution.note}</p>
        {board.evolution.points.length ? (
          <ol>
            {board.evolution.points.map((point) => (
              <li key={`${point.kind}-${point.computedAt}`}>
                {formatAlignmentDate(point.computedAt) || civil(point.computedAt)}. General {point.general == null ? 'sin general' : formatAlignmentValue(point.general)}. {pillars(point.pillars)} {KINDS[point.kind] ?? point.kind}.
              </li>
            ))}
          </ol>
        ) : null}
        {board.evolution.status === 'COMPARABLE' && board.evolution.delta != null ? (
          <p>Diferencia del general: {formatAlignmentValue(board.evolution.delta)}.</p>
        ) : null}
      </section>

      <section className="mk-home__block" aria-label="Ámbitos">
        <h2>Ámbitos</h2>
        <p className="mk-home__note">{board.territories.note}</p>
        {board.territories.items.map((item) => (
          <article key={item.territory}>
            <h3>{item.label}</h3>
            {item.readings.length ? (
              <ul>
                {item.readings.map((reading) => (
                  <li key={reading.id}>{reading.id}: {reading.raw}{reading.scale ? `, escala ${reading.scale}` : ''}.</li>
                ))}
              </ul>
            ) : (
              <p className="mk-home__note">Sin lecturas de ese ámbito en el núcleo.</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

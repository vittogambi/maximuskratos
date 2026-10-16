import { formatAlignmentDate, formatAlignmentValue, type IndexCard } from '@/lib/journey-api';
import { formatMethodVersionLabel } from '@/lib/method-version-label';

function line(card: IndexCard | null | undefined, empty: string) {
  if (!card) return empty;
  const general = card.general == null ? 'Sin general' : formatAlignmentValue(card.general);
  const pillars = card.pillars
    ? `Espíritu ${formatAlignmentValue(card.pillars.espiritu)}, mente ${formatAlignmentValue(card.pillars.mente)}, cuerpo ${formatAlignmentValue(card.pillars.cuerpo)}.`
    : '';
  const coverage = card.coverage.eligible != null
    ? `${card.coverage.eligible} de ${card.coverage.required}`
    : `${card.coverage.scored ?? 0} de ${card.coverage.required}`;
  return `${card.name}: ${general}. ${pillars} Cobertura ${coverage}. ${formatAlignmentDate(card.computedAt)}. ${card.methodVersion}.`;
}

/** Same wording on every surface that shows the two indexes. */
export function IndexSummary({ alignment, depth }: { alignment?: IndexCard | null; depth?: IndexCard | null }) {
  if (!alignment && !depth) return null;
  return (
    <section>
      <h2>Índices</h2>
      <p>{line(alignment, '')}</p>
      {alignment?.explanation ? <p>{alignment.explanation}</p> : null}
      {alignment?.delta != null ? <p>Diferencia con la lectura inicial comparable: {formatAlignmentValue(alignment.delta)}.</p> : null}
      <p>{line(depth, '')}</p>
      {depth?.explanation ? <p>{depth.explanation}</p> : null}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { formatAlignmentDate, formatAlignmentValue, type AlignmentReading, type IndexCard } from '@/lib/journey-api';
import { formatMethodVersionLabel } from '@/lib/method-version-label';
import {
  DIFFICULTY_MODULE_INTRO,
  SHADOW_BLOCK_COPY,
  difficultyFigure,
  shadowTotalsCopy,
  type DifficultyKind,
} from '@/lib/difficulty-copy';
import { PERSONALITY_FACTOR_ROWS, formatPersonalityAverage } from '@/lib/personality-copy';
import styles from './ProfileReading.module.css';

type Part = { value?: number | null; descriptor?: string | null; calculable?: boolean };

type Form = {
  auditTotal?: number | null;
  auditMax?: number;
  auditBand?: string | null;
  relationTotal?: number | null;
  relationBand?: string | null;
  relationBandPending?: boolean;
  relationNote?: string | null;
  financeTotal?: number | null;
  financeBand?: string | null;
  identityTotal?: number | null;
  identityMax?: number;
  identityNote?: string | null;
  auditNote?: string | null;
  auditCoverage?: { answered: number; required: number };
  senseTotal?: number | null;
  difficulties?: Record<string, Part>;
  personality?: Record<string, Part>;
  personalityOverall?: number | null;
  shadowInterferenceTotal?: number | null;
  shadowIntegrationTotal?: number | null;
  shadowDiagnostic?: string | null;
};

type Indexes = {
  alignment: IndexCard | null;
  depth: IndexCard | null;
  initial?: IndexCard | null;
} | null;

const INTERFERENCE: Array<[string, string]> = [
  ['PR', 'Patrones repetitivos'],
  ['ER', 'Emociones rechazadas'],
  ['PY', 'Proyección'],
  ['D', 'Excusas y autoengaño'],
];

const RESOURCE: [string, string] = ['IN', SHADOW_BLOCK_COPY.integrationRowLabel];

const PILLARS: Array<[keyof NonNullable<IndexCard['pillars']>, string]> = [
  ['espiritu', 'Espíritu'],
  ['mente', 'Mente'],
  ['cuerpo', 'Cuerpo'],
];

const DECLARED_PILLARS: Array<[keyof AlignmentReading['pillars'], string]> = [
  ['E', 'Espíritu'],
  ['M', 'Mente'],
  ['C', 'Cuerpo'],
];

const KIND_LABEL: Record<string, string> = {
  INITIAL: 'Lectura inicial',
  REMEASURE: 'Medición posterior',
  RECONSTRUCTED: 'Reconstrucción',
  DOCUMENTED: 'Trabajo documentado',
};

const FICHA_DETAIL = 'Espíritu, Mente y Cuerpo usan nueve respuestas, tres por pilar. El total aparece solo con las nueve. Una respuesta sin información no vale cero. Parte de las preguntas mira los últimos 14 días. Una cuenta nueva deja eso pendiente, sin inventar un recorrido. El método está en revisión. Seguir a la hoja de ruta no pide esta ficha, y el plan no queda bloqueado.';

function bandLabel(band: string): string {
  const known: Record<string, string> = {
    SOLIDO: 'Sólido',
    SÓLIDO: 'Sólido',
    DOMINANTE: 'Dominante',
    INESTABLE: 'Inestable',
    CRITICO: 'Crítico',
    CRÍTICO: 'Crítico',
    ALERTA: 'Calibración',
    OPTIMO: 'Óptimo',
    ÓPTIMO: 'Óptimo',
    DETRIMENTO: 'Detrimento',
    PROPULSOR: 'Propulsor',
  };
  return known[band] ?? band.charAt(0) + band.slice(1).toLowerCase();
}

function figureOf(value: number | null | undefined): string {
  if (value == null) return 'No disponible';
  return formatAlignmentValue(value);
}

function coverageText(card: IndexCard): string | null {
  if (card.coverage.eligible != null) return `${card.coverage.eligible} de ${card.coverage.required}`;
  if (card.coverage.scored != null) return `${card.coverage.scored} de ${card.coverage.required}`;
  return null;
}

function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind;
}

function descriptorRest(name: string, descriptor: string): string {
  const colon = `${name}:`;
  if (descriptor.startsWith(colon)) {
    const rest = descriptor.slice(colon.length).trim();
    return rest || descriptor;
  }
  if (descriptor.startsWith(`${name} `)) {
    const rest = descriptor.slice(name.length).trim();
    return rest || descriptor;
  }
  return descriptor;
}

function partFigure(part: Part | undefined, kind?: DifficultyKind): string {
  if (kind) return difficultyFigure(part, kind);
  if (part?.calculable && part.value != null) return `${part.value} de 18`;
  return 'Pendiente';
}

function knownKeys(): Set<string> {
  return new Set([...INTERFERENCE.map(([key]) => key), RESOURCE[0]]);
}

function IndexPanel({ card, error }: { card: IndexCard | null; error: boolean }) {
  if (error) {
    return (
      <section className={styles.card} aria-labelledby="profile-index-title">
        <h2 id="profile-index-title" className={styles.blockTitle}>Índice de alineación MK</h2>
        <p className={styles.alert} role="alert">No se pudo leer el índice.</p>
      </section>
    );
  }
  if (!card) {
    return (
      <section className={styles.card} aria-labelledby="profile-index-title">
        <h2 id="profile-index-title" className={styles.blockTitle}>Índice de alineación MK</h2>
        <p className={styles.note}>No hay una lectura guardada.</p>
      </section>
    );
  }
  const coverage = coverageText(card);
  const date = formatAlignmentDate(card.computedAt);
  const meta = [coverage ? `Cobertura ${coverage}.` : '', date].filter(Boolean).join(' ');
  return (
    <section className={styles.card} aria-labelledby="profile-index-title">
      <h2 id="profile-index-title" className={styles.blockTitle}>Índice de alineación MK</h2>
      {card.general == null ? (
        <p className={styles.generalMissing}>Sin total</p>
      ) : (
        <p className={styles.general}>
          <span className={styles.generalFigure}>{formatAlignmentValue(card.general)}</span>
          <span className={styles.denom}>de 100</span>
        </p>
      )}
      <dl className={styles.pillars}>
        {PILLARS.map(([key, label]) => (
          <div className={styles.pillar} key={key}>
            <dt>{label}</dt>
            <dd>{figureOf(card.pillars?.[key])}</dd>
          </div>
        ))}
      </dl>
      {meta ? <p className={styles.meta}>{meta}</p> : null}
      <p className={styles.notice}>Método en revisión.</p>
      <details className={styles.disclosure}>
        <summary>Cómo se obtiene esta lectura</summary>
        <div className={styles.disclosureBody}>
          {card.explanation ? <p className={styles.explanation}>{card.explanation}</p> : null}
          <p className={styles.explanation}>{formatMethodVersionLabel(card.methodVersion)}. Procedencia: {kindLabel(card.kind)}.</p>
          {card.pending.length > 0 ? (
            <ul>
              {card.pending.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function DepthPanel({ card }: { card: IndexCard }) {
  const coverage = coverageText(card);
  const date = formatAlignmentDate(card.computedAt);
  return (
    <section className={styles.card} aria-labelledby="profile-depth-title">
      <h2 id="profile-depth-title" className={styles.blockTitle}>{card.name}</h2>
      {card.general == null ? (
        <p className={styles.generalMissing}>Sin total</p>
      ) : (
        <p className={styles.general}>
          <span className={styles.generalFigure}>{formatAlignmentValue(card.general)}</span>
          <span className={styles.denom}>de 100</span>
        </p>
      )}
      {card.general == null && card.partial != null ? (
        <p className={styles.note}>Parcial {formatAlignmentValue(card.partial)}. No sustituye al total.</p>
      ) : null}
      {coverage ? <p className={styles.meta}>Cobertura {coverage}.{date ? ` ${date}.` : ''}</p> : null}
      {card.explanation ? <p className={styles.explanation}>{card.explanation}</p> : null}
      <details className={styles.disclosure}>
        <summary>Cómo se obtiene esta lectura</summary>
        <div className={styles.disclosureBody}>
          <p className={styles.explanation}>{formatMethodVersionLabel(card.methodVersion)}. Procedencia: {kindLabel(card.kind)}.</p>
        </div>
      </details>
    </section>
  );
}

function Readings({ form }: { form: Form }) {
  const partnerOut = Boolean(form.relationNote) && form.relationTotal == null;
  const relationsPending = Boolean(form.relationBandPending);
  const auditFigure = form.auditTotal == null
    ? (form.auditCoverage ? `Pendiente. ${form.auditCoverage.answered} de ${form.auditCoverage.required}` : 'No disponible')
    : `${form.auditTotal} de ${form.auditMax ?? 115}`;
  const relationFigure = partnerOut
    ? 'No se calcula'
    : relationsPending || form.relationTotal == null
      ? 'No disponible'
      : `${form.relationTotal} de 60`;
  const relationNote = partnerOut
    ? form.relationNote
    : relationsPending
      ? 'Banda pendiente'
      : form.relationBand
        ? bandLabel(form.relationBand)
        : null;
  const financeFigure = form.financeTotal == null ? 'No disponible' : `${form.financeTotal} de 60`;
  const identityFigure = form.identityTotal == null ? 'No disponible' : `${form.identityTotal} de ${form.identityMax ?? 40}`;
  const senseFigure = form.senseTotal == null ? 'No disponible' : `${form.senseTotal} de 50`;
  const rows = [
    { label: 'Auditoría', figure: auditFigure, note: form.auditNote ?? (form.auditBand ? bandLabel(form.auditBand) : null) },
    { label: 'Relaciones', figure: relationFigure, note: relationNote },
    { label: 'Finanzas', figure: financeFigure, note: form.financeBand ? bandLabel(form.financeBand) : null },
    { label: 'Identidad', figure: identityFigure, note: form.identityNote },
    { label: 'Desarrollo y sentido', figure: senseFigure, note: form.senseTotal == null ? null : 'Lectura aparte de la auditoría' },
  ];
  return (
    <section className={styles.card} aria-labelledby="profile-readings-title">
      <h2 id="profile-readings-title" className={styles.blockTitle}>Lecturas del cuestionario</h2>
      <div className={styles.readings}>
        {rows.map((row) => (
          <div className={styles.reading} key={row.label}>
            <h3 className={styles.readingName}>{row.label}</h3>
            <p className={styles.readingFigure}>{row.figure}</p>
            {row.note ? <p className={styles.note}>{row.note}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreRows({
  names,
  parts,
  kind,
}: {
  names: Array<[string, string]>;
  parts: Record<string, Part>;
  kind?: DifficultyKind;
}) {
  return (
    <div className={styles.rows}>
      {names.map(([key, label]) => {
        const part = parts[key];
        return (
          <div className={styles.row} key={key}>
            <div className={styles.rowHead}>
              <h4 className={styles.rowName}>{label}</h4>
              <p className={styles.rowFigure}>{partFigure(part, kind)}</p>
            </div>
            {part?.descriptor ? <p className={styles.descriptor}>{part.descriptor}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function shadowDiagnosticReading(text: string): { title: string; note: string } {
  const trimmed = text.trim();
  const colon = trimmed.indexOf(':');
  if (colon > 0 && colon < 42) {
    return { title: trimmed.slice(0, colon).trim(), note: trimmed.slice(colon + 1).trim() };
  }
  const period = trimmed.indexOf('. ');
  if (period > 0 && period < 48) {
    return { title: trimmed.slice(0, period).trim(), note: trimmed.slice(period + 2).trim() };
  }
  return { title: trimmed, note: '' };
}

function Difficulties({
  parts,
  shadowDiagnostic,
  shadowInterferenceTotal,
  shadowIntegrationTotal,
}: {
  parts: Record<string, Part>;
  shadowDiagnostic?: string | null;
  shadowInterferenceTotal?: number | null;
  shadowIntegrationTotal?: number | null;
}) {
  const unknown = Object.keys(parts)
    .filter((key) => !knownKeys().has(key))
    .sort((left, right) => left.localeCompare(right))
    .map((key): [string, string] => [key, key]);
  const overall = shadowDiagnostic?.trim() ? shadowDiagnosticReading(shadowDiagnostic) : null;
  const totals =
    shadowInterferenceTotal != null && shadowIntegrationTotal != null
      ? shadowTotalsCopy(shadowInterferenceTotal, shadowIntegrationTotal)
      : null;
  return (
    <section className={styles.card} aria-labelledby="profile-difficulty-title">
      <h2 id="profile-difficulty-title" className={styles.blockTitle}>Sombra y recursos</h2>
      <p className={styles.groupNote}>{DIFFICULTY_MODULE_INTRO}</p>
      {overall ? (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Lectura global</h3>
          {totals ? <p className={styles.groupNote}>{totals}</p> : null}
          <p className={styles.readingFigure}>{overall.title}</p>
          {overall.note ? <p className={styles.explanation}>{overall.note}</p> : null}
        </div>
      ) : null}
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>{SHADOW_BLOCK_COPY.interferenceTitle}</h3>
        <p className={styles.groupNote}>{SHADOW_BLOCK_COPY.interferenceNote}</p>
        <ScoreRows names={INTERFERENCE} parts={parts} kind="interferencia" />
      </div>
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>{SHADOW_BLOCK_COPY.integrationTitle}</h3>
        <p className={styles.groupNote}>{SHADOW_BLOCK_COPY.integrationNote}</p>
        <ScoreRows names={[RESOURCE]} parts={parts} kind="recurso" />
      </div>
      {unknown.length > 0 ? <ScoreRows names={unknown} parts={parts} /> : null}
    </section>
  );
}

function Personality({ parts, overall }: { parts: Record<string, Part>; overall?: number | null }) {
  const known = new Set(PERSONALITY_FACTOR_ROWS.map((row) => row.key));
  const unknown = Object.keys(parts)
    .filter((key) => !known.has(key))
    .sort((left, right) => left.localeCompare(right));
  return (
    <section className={styles.card} aria-labelledby="profile-personality-title">
      <h2 id="profile-personality-title" className={styles.blockTitle}>Factores de la personalidad (OCEAN)</h2>
      <p className={styles.groupNote}>E-PER-007. Cinco factores con tres preguntas cada uno. Escala 1 a 5.</p>
      {overall != null ? (
        <p className={styles.readingFigure}>
          Promedio global {formatPersonalityAverage(overall)} de 5
        </p>
      ) : null}
      <div className={styles.rows}>
        {PERSONALITY_FACTOR_ROWS.map(({ key, title }) => {
          const part = parts[key];
          const figure = part?.calculable && part.value != null
            ? `${formatPersonalityAverage(part.value)} de 5`
            : null;
          const band = part?.descriptor?.trim() ?? null;
          return (
            <div className={styles.row} key={key}>
              <div className={styles.rowHead}>
                <h3 className={styles.rowName}>{title}</h3>
                {figure ? <p className={styles.rowFigure}>{figure}</p> : null}
              </div>
              <p className={styles.descriptor}>{figure ? (band ?? 'Pendiente') : 'Pendiente'}</p>
            </div>
          );
        })}
        {unknown.map((key) => (
          <div className={styles.row} key={key}>
            <h3 className={styles.rowName}>{key}</h3>
            <p className={styles.descriptor}>{parts[key]?.descriptor ?? 'Pendiente'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeclaredCard({ alignment, error }: { alignment?: AlignmentReading | null; error: boolean }) {
  return (
    <section className={styles.card} aria-labelledby="profile-declared-title">
      <h2 id="profile-declared-title" className={styles.blockTitle}>Alineación declarada</h2>
      {error ? <p className={styles.alert} role="alert">No se pudo leer la ficha.</p> : null}
      {!error && (!alignment || alignment.status === 'none') ? (
        <>
          <p className={styles.generalMissing}>Pendiente</p>
          <p className={styles.note}>Esta ficha es independiente del índice del cuestionario. Puedes continuar sin completarla.</p>
        </>
      ) : null}
      {!error && alignment?.status === 'partial' ? (
        <>
          <p className={styles.generalMissing}>Sin total</p>
          <p className={styles.meta}>Cobertura {alignment.coverage.answered} de {alignment.coverage.required}.</p>
          <dl className={styles.pillars}>
            {DECLARED_PILLARS.map(([key, label]) => (
              <div className={styles.pillar} key={key}>
                <dt>{label}</dt>
                <dd>{figureOf(alignment.pillars[key])}</dd>
              </div>
            ))}
          </dl>
          {alignment.revision != null ? <p className={styles.meta}>Revisión {alignment.revision}.</p> : null}
        </>
      ) : null}
      {!error && alignment?.status === 'saved' ? (
        <>
          <p className={styles.fichaFigure}>{figureOf(alignment.total)}</p>
          <dl className={styles.pillars}>
            {DECLARED_PILLARS.map(([key, label]) => (
              <div className={styles.pillar} key={key}>
                <dt>{label}</dt>
                <dd>{figureOf(alignment.pillars[key])}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.meta}>
            {[alignment.savedAt ? formatAlignmentDate(alignment.savedAt) : '', alignment.revision != null ? `Revisión ${alignment.revision}.` : ''].filter(Boolean).join(' ')}
          </p>
        </>
      ) : null}
      <details className={styles.disclosure}>
        <summary>Cómo funciona esta ficha</summary>
        <div className={styles.disclosureBody}>
          <p className={styles.explanation}>{FICHA_DETAIL}</p>
        </div>
      </details>
    </section>
  );
}

export function ExcelProfile({
  form,
  alignment,
  alignmentError = false,
  indexes,
  indexesError = false,
  sheetSigned = false,
}: {
  form: Form;
  alignment?: AlignmentReading | null;
  alignmentError?: boolean;
  indexes?: Indexes;
  indexesError?: boolean;
  sheetSigned?: boolean;
}) {
  const indexCard = indexesError ? null : indexes?.alignment ?? null;
  const depthCard = indexesError ? null : indexes?.depth ?? null;
  const fichaEmpty = !alignment || alignment.status === 'none';
  const showDeclared = alignmentError || !sheetSigned || !fichaEmpty;
  return (
    <div className={styles.page}>
      <header className={styles.mast}>
        <p className={styles.kicker}>Perfil maestro</p>
        <h1 className={styles.title}>Tu lectura</h1>
        <p className={styles.intro}>Una vista de tus respuestas, tus índices y las lecturas de tu cuestionario.</p>
      </header>
      <IndexPanel card={indexCard} error={indexesError} />
      <Readings form={form} />
      {form.difficulties || form.personality ? (
        <div className={styles.sideBySide}>
          {form.difficulties ? (
            <Difficulties
              parts={form.difficulties}
              shadowDiagnostic={form.shadowDiagnostic}
              shadowInterferenceTotal={form.shadowInterferenceTotal}
              shadowIntegrationTotal={form.shadowIntegrationTotal}
            />
          ) : null}
          {form.personality ? (
            <Personality parts={form.personality} overall={form.personalityOverall} />
          ) : null}
        </div>
      ) : null}
      {depthCard ? <DepthPanel card={depthCard} /> : null}
      {showDeclared ? <DeclaredCard alignment={alignment} error={alignmentError} /> : null}
      <div>
        <p className={styles.handoff}>
          {sheetSigned
            ? 'La hoja de ruta está firmada.'
            : 'Reúne estas lecturas con tus valores, tu visión y tu propósito en la hoja de ruta.'}
        </p>
        <Link className={styles.cta} href="/diagnostico/resultado">Ir a mi hoja de ruta</Link>
      </div>
    </div>
  );
}

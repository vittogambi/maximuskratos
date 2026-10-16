'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { confirmPurpose, formatAlignmentDate, formatAlignmentValue, journeyContract, journeyPurpose, journeyState, journeySynthesis, saveAlignment, savePurpose, saveSynthesis, type AlignmentReading, type HdrpContract, type IndexCard, type SynthesisPayload } from '@/lib/journey-api';
import { ContractSections } from './ContractSections';
import { IkigaiCross } from './IkigaiCross';
import { IndexSummary } from './IndexSummary';
import { getAccessToken } from '@/lib/auth-storage';

const IAD = [
  ['E1', 'Qué tan clara y propia es la dirección que eliges ahora'],
  ['E2', 'Qué tan claramente explicas los valores y lo que quieres proteger'],
  ['E3', 'Qué tan concreto es a quién o a qué quieres cuidar'],
  ['M1', 'En 14 días, qué tan coherentes fueron tus prioridades'],
  ['M2', 'Qué tan practicable es tu organización con tus límites reales'],
  ['M3', 'En 14 días, qué tan deliberadamente revisaste la estrategia'],
  ['C1', 'En 14 días, qué tan coherentes fueron tus acciones'],
  ['C2', 'En 14 días, qué tan coherente fue el cuidado de tu cuerpo'],
  ['C3', 'En 14 días, qué tan coherente fue el tiempo de tus compromisos'],
] as const;

const SIGNATURE = [
  'M6 50 C 14 18, 4 8, 28 28 C 48 46, 22 62, 46 40 C 62 24, 58 8, 78 30 C 96 50, 88 66, 112 42 C 128 26, 122 14, 142 36',
  'M148 44 C 160 24, 178 16, 186 38 C 196 64, 176 74, 206 48 C 228 28, 248 22, 262 40 C 274 54, 286 48, 298 46',
  'M168 58 C 190 62, 230 66, 292 60',
];

export function PurposeScreen() {
  const reduced = useReducedMotion();
  const [contract, setContract] = useState<HdrpContract | null>(null);
  const [name, setName] = useState('');
  const [statement, setStatement] = useState('');
  const [direction, setDirection] = useState('EXPLORANDO');
  const [iad, setIad] = useState<Record<string, string>>({});
  const [iadNote, setIadNote] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'signing' | 'signed'>('idle');
  const [synthesis, setSynthesis] = useState<SynthesisPayload | null>(null);
  const [alignment, setAlignment] = useState<AlignmentReading | null>(null);
  const [indexes, setIndexes] = useState<{ alignment: IndexCard | null; depth: IndexCard | null } | null>(null);
  const [alignmentError, setAlignmentError] = useState(false);
  const [savingCross, setSavingCross] = useState(false);
  const [crossKey, setCrossKey] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    journeyContract(token)
      .then((row) => {
        setContract(row);
        setName(row.name ?? '');
        setStatement(row.statement ?? '');
        if (row.directionStatus) setDirection(row.directionStatus);
        if (row.confirmed) setPhase('signed');
      })
      .catch((err: Error) => setError(err.message));
    journeySynthesis(token).then(setSynthesis).catch(() => undefined);
    journeyState(token).then((row) => {
      setAlignment(row.alignment);
      setIndexes(row.indexes ?? null);
      setAlignmentError(false);
    }).catch(() => setAlignmentError(true));
    journeyPurpose(token)
      .then((row) => {
        const saved = row?.content && typeof row.content === 'object'
          ? (row.content as { iad?: { answers?: Record<string, { value?: number | null; unknown?: boolean }>; results?: { total?: number | null } } }).iad
          : undefined;
        if (!saved?.answers) return;
        const next: Record<string, string> = {};
        for (const [id] of IAD) {
          const answer = saved.answers[id];
          next[id] = answer && !answer.unknown && answer.value != null ? String(answer.value) : '';
        }
        setIad(next);
        if (typeof saved.results?.total === 'number') {
          const total = formatAlignmentValue(saved.results.total);
          setIadNote(`Ficha guardada. Total ${total}. Método en revisión y no bloquea el plan.`);
        }
      })
      .catch(() => undefined);
  }, []);

  async function onCross(next: SynthesisPayload) {
    const token = getAccessToken();
    if (!token) return;
    setSavingCross(true);
    setError('');
    try {
      await saveSynthesis(token, {
        activities: next.activities,
        links: next.links,
        combinations: next.combinations,
        purpose: next.purpose,
      });
      const visible = next.purpose.edited?.trim() || next.purpose.generated;
      if (visible) setStatement(visible);
      if (next.purpose.status !== 'UNWORKED') setDirection(next.purpose.status);
      await savePurpose(token, {
        ...(visible ? { statement: visible } : {}),
        ...(next.purpose.status !== 'UNWORKED' ? { directionStatus: next.purpose.status } : {}),
      });
      setSynthesis(await journeySynthesis(token));
      setCrossKey((value) => value + 1);
      setContract(await journeyContract(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cruce.');
    } finally {
      setSavingCross(false);
    }
  }

  async function onAlignment() {
    const token = getAccessToken();
    if (!token) return;
    const answers: Record<string, { value: number | null; unknown: boolean }> = {};
    for (const [id] of IAD) {
      const raw = iad[id];
      answers[id] = raw === 'unknown' || !raw
        ? { value: null, unknown: true }
        : { value: Number(raw), unknown: false };
    }
    setError('');
    try {
      await saveAlignment(token, answers);
      setIadNote('Ficha guardada. Es un método en revisión y no bloquea el plan.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la ficha.');
    }
  }

  async function onConfirm() {
    const token = getAccessToken();
    if (!token || !name.trim()) {
      setError('Escribe tu nombre para firmar.');
      return;
    }
    setError('');
    setPhase('signing');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, reduced ? 0 : 1400));
      await savePurpose(token, {
        name: name.trim(),
        statement: statement.trim(),
        directionStatus: direction,
      });
      await confirmPurpose(token);
      const next = await journeyContract(token);
      setContract(next);
      setPhase('signed');
    } catch (err) {
      setPhase('idle');
      setError(err instanceof Error ? err.message : 'No se pudo firmar.');
    }
  }

  const signed = phase === 'signed' || Boolean(contract?.confirmed);
  const showInk = phase === 'signing' || signed;

  return (
    <div className="mk-dashboard">
      <article className="mk-contract">
        <p className="mk-section-eyebrow">HOJA DE RUTA</p>
        {synthesis ? <IkigaiCross key={crossKey} data={synthesis} saving={savingCross} onSave={onCross} /> : null}
        <h1>Mi compromiso</h1>
        <label>
          Dirección de ahora
          <select value={direction} onChange={(event) => setDirection(event.target.value)}>
            <option value="EXPLORANDO">Explorando, sin un propósito cerrado</option>
            <option value="PROVISIONAL">Provisional, útil para probar</option>
            <option value="CONFIRMADO_POR_USUARIO">La elijo como referencia actual</option>
          </select>
        </label>
        <p>Si la dirección queda en exploración, esta referencia también es exploratoria.</p>
        <label>
          Qué quiero usar como referencia
          <textarea value={statement} rows={3} onChange={(event) => setStatement(event.target.value)} />
        </label>
        <IndexSummary alignment={indexes?.alignment} depth={indexes?.depth} />
        <section>
          <h2>Alineación declarada</h2>
          {alignmentError ? <p>No se pudo leer la ficha.</p> : alignment ? (
            <p>
              Medición guardada: {alignment.status === 'saved' && alignment.total != null ? formatAlignmentValue(alignment.total) : 'sin total'}.
              Cobertura {alignment.coverage.answered} de {alignment.coverage.required}.
              {alignment.savedAt ? ` ${formatAlignmentDate(alignment.savedAt)}.` : ''}
              {alignment.revision != null ? ` Revisión ${alignment.revision}.` : ''}
              {alignment.pillars.E != null ? ` Espíritu ${formatAlignmentValue(alignment.pillars.E)}.` : ''}
              {alignment.pillars.M != null ? ` Mente ${formatAlignmentValue(alignment.pillars.M)}.` : ''}
              {alignment.pillars.C != null ? ` Cuerpo ${formatAlignmentValue(alignment.pillars.C)}.` : ''}
            </p>
          ) : <p>Sin ficha guardada.</p>}
          <p>Método en revisión. Puedes dejar una respuesta en «No tengo información suficiente». No sustituye el siguiente paso.</p>
          {IAD.map(([id, label]) => (
            <label key={id}>
              {label}
              <select value={iad[id] ?? ''} onChange={(event) => setIad({ ...iad, [id]: event.target.value })}>
                <option value="">No tengo información suficiente</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
          ))}
          <button type="button" className="mk-btn-ghost" onClick={onAlignment}>Guardar ficha</button>
          {iadNote ? <p>{iadNote}</p> : null}
        </section>
        {contract ? (
          <div className="mk-contract__opening">
            {signed ? contract.lead : (
              <>
                <p>Yo,</p>
                <textarea
                  className="mk-contract__name"
                  value={name}
                  rows={Math.max(1, Math.ceil(name.length / 42))}
                  aria-label="Tu nombre"
                  onChange={(event) => setName(event.target.value)}
                />
                <p>consciente de mi historia, dueño de mi presente y arquitecto de mi destino, declaro solemnemente los pilares que rigen y regirán mi existencia a partir de este momento.</p>
              </>
            )}
          </div>
        ) : null}
        <ContractSections articles={contract?.articles ?? []} />
        {contract ? <p className="mk-contract__close">{contract.closing}</p> : null}
        <footer className="mk-contract__sign">
          <svg viewBox="0 0 304 84" className="mk-sign" aria-hidden>
            {SIGNATURE.map((stroke) => (
              <path
                key={stroke}
                d={stroke}
                pathLength={100}
                className={showInk ? (reduced || signed ? 'is-drawn' : 'is-drawing') : undefined}
              />
            ))}
          </svg>
          <span className="mk-contract__line" />
          <span className="mk-contract__who">{name.trim() || 'Firma'}</span>
        </footer>
        {error ? <p role="alert">{error}</p> : null}
        {!signed && contract && contract.ready === false ? (
          <p>Faltan partes de la hoja. <Link href="/diagnostico/resultado">Completarlas antes de firmar</Link></p>
        ) : null}
        {signed ? (
          <Link href="/planes" className="mk-btn-primary">Crear un plan desde este contrato</Link>
        ) : (
          <button type="button" className="mk-btn-primary" onClick={onConfirm} disabled={phase === 'signing' || contract?.ready === false}>
            {phase === 'signing' ? 'Firmando' : 'Firmar'}
          </button>
        )}
      </article>
    </div>
  );
}

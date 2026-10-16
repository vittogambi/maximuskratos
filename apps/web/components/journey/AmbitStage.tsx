'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import { formatAlignmentDate, formatAlignmentValue, journeyState, type AlignmentReading, type HomeBoardView, type JourneyState } from '@/lib/journey-api';
import { formatMethodVersionLabel } from '@/lib/method-version-label';
import { HomeReading, readingValue } from './HomeReading';
import { getAccessToken } from '@/lib/auth-storage';

const METRICS = [
  { href: '/mente', label: 'Mente', x: 16, y: 24 },
  { href: '/espiritu', label: 'Espíritu', x: 84, y: 24 },
  { href: '/cuerpo', label: 'Cuerpo', x: 50, y: 94 },
] as const;

const HIDDEN_HREFS = new Set(['/ruta', '/calendario', '/planes', '/proposito', '/asesores']);

type Phase = 'loading' | 'error' | 'progress' | 'start' | 'ready';

let homeIntroSeen = false;

function phaseOf(state: JourneyState | null, failed: boolean): Phase {
  if (failed) return 'error';
  if (!state) return 'loading';
  if (state.nextAction.href !== '/diagnostico') return 'ready';
  return state.nextAction.label.startsWith('Continuar') ? 'progress' : 'start';
}

function heading(phase: Phase, situation?: HomeBoardView['situation']): string {
  if (situation === 'JUST_CLOSED') return 'Cuestionario cerrado';
  if (situation === 'EXPLORING') return 'Exploración';
  if (situation === 'GUIDED') return 'Plan guiado';
  if (situation === 'OWN') return 'Plan propio';
  if (situation === 'PAUSED') return 'Pausa';
  if (situation === 'RETURN') return 'Retorno';
  if (phase === 'progress') return 'Auditoría en curso';
  if (phase === 'start') return 'Auditoría sin empezar';
  if (phase === 'ready') return 'Auditoría cerrada';
  if (phase === 'error') return 'No se pudo leer el estado';
  return 'Inicio';
}

function statusLabel(phase: Phase): string {
  if (phase === 'progress') return 'En curso';
  if (phase === 'start') return 'Sin empezar';
  if (phase === 'ready') return 'Ficha cerrada';
  if (phase === 'error') return 'Error';
  return 'Cargando';
}

function noteFor(phase: Phase): string {
  if (phase === 'error') return 'No se pudo leer el estado. Puedes reintentar.';
  if (phase === 'loading') return 'Leyendo tu estado.';
  if (phase === 'ready') return 'El índice del cuestionario y la ficha declarada son lecturas distintas.';
  return 'Mente, Espíritu y Cuerpo todavía no tienen resultado.';
}

function alignmentPlate(phase: Phase, alignment: AlignmentReading | null | undefined): { value: string; note: string } {
  if (phase === 'loading') return { value: 'Cargando', note: 'Leyendo la ficha.' };
  if (phase === 'error' || !alignment) return { value: 'Error', note: 'No se pudo leer la ficha.' };
  const pillars = [
    alignment.pillars.E != null ? `Espíritu ${formatAlignmentValue(alignment.pillars.E)}` : '',
    alignment.pillars.M != null ? `Mente ${formatAlignmentValue(alignment.pillars.M)}` : '',
    alignment.pillars.C != null ? `Cuerpo ${formatAlignmentValue(alignment.pillars.C)}` : '',
  ].filter(Boolean).join('. ');
  const date = formatAlignmentDate(alignment.savedAt);
  const revision = alignment.revision != null ? `Revisión ${alignment.revision}` : '';
  if (alignment.status === 'saved' && alignment.total != null) {
    return {
      value: formatAlignmentValue(alignment.total),
      note: [pillars, date ? date : '', revision, 'Método en revisión.'].filter(Boolean).join('. '),
    };
  }
  if (alignment.status === 'partial') {
    return {
      value: `${alignment.coverage.answered} de ${alignment.coverage.required}`,
      note: [pillars, 'Sin total.', revision, 'Método en revisión.'].filter(Boolean).join(' '),
    };
  }
  return { value: 'Sin ficha', note: 'Sin ficha guardada.' };
}

function cardTitle(phase: Phase, state: JourneyState | null): string {
  if (phase === 'progress') return 'Retoma donde la dejaste';
  if (phase === 'start') return 'La auditoría está pendiente';
  if (phase === 'error') return 'Vuelve a intentar';
  if (phase === 'loading') return 'Cargando';
  const href = state?.nextAction.href ?? '';
  if (href === '/proposito') return 'Sigue con la hoja de ruta';
  if (href === '/planes') return state?.nextAction.label === 'Crear el plan' ? 'Falta un plan vigente' : 'Sigue con el plan';
  if (href === '/calendario') return 'Sigue en el calendario';
  return 'Siguiente paso';
}

export function AmbitStage() {
  const reduced = useReducedMotion();
  const { user } = useAuthSession();
  const [state, setState] = useState<JourneyState | null>(null);
  const [failed, setFailed] = useState(false);
  const [intro, setIntro] = useState(false);
  const initial = user?.email?.[0]?.toUpperCase() ?? 'M';
  const phase = phaseOf(state, failed);

  useEffect(() => {
    if (reduced === null) return;
    if (!reduced && !homeIntroSeen) setIntro(true);
    homeIntroSeen = true;
  }, [reduced]);

  function load() {
    const token = getAccessToken();
    if (!token) return;
    setFailed(false);
    journeyState(token)
      .then(setState)
      .catch(() => setFailed(true));
  }

  useEffect(() => { load(); }, []);

  const detail = phase === 'progress' || phase === 'loading' || phase === 'error'
    ? ''
    : state?.nextAction.detail ?? '';
  const diagnosticOpen = phase === 'progress' || phase === 'start';
  const index = state?.board?.reading ?? state?.indexes?.alignment ?? null;
  const plate = indexPlate(phase, index, diagnosticOpen);

  return (
    <div className={intro ? 'mk-home is-intro' : 'mk-home'} aria-busy={phase === 'loading'}>
      <header className="mk-home__head">
        <div>
          <p className="mk-home__status">{statusLabel(phase)}</p>
          <h1 className="mk-page-title mk-home__title">{heading(phase, state?.board?.situation)}</h1>
          <p className="mk-home__note">{noteFor(phase)}</p>
          <p className="mk-home__note">Beta web. Los índices son un método en revisión.</p>
          {state?.contextReview?.invited ? (
            <p className="mk-home__note">Pasaron {state.contextReview.days} días sin registros. Puedes revisar qué sigue vigente. El plan no cambió.</p>
          ) : null}
        </div>
        <Link href="/cuenta" className="mk-home__account" aria-label="Cuenta">{initial}</Link>
      </header>
      <div className="mk-home__body">
        <div className="mk-home__stage">
          <div className="mk-scene-wrap">
            <div className="mk-scene">
              <svg className="mk-scene__draw" viewBox="0 0 100 100" aria-hidden>
                <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4">
                  <circle cx="50" cy="47" r="31" />
                  <rect x="19" y="16" width="62" height="62" />
                  <polygon points="50,14 18,80 82,80" />
                </g>
                <g className="mk-scene__leaders" fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round">
                  <line x1="44" y1="38" x2="25" y2="28" />
                  <line x1="56" y1="38" x2="75" y2="28" />
                  <line x1="50" y1="70" x2="50" y2="88" />
                </g>
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mk-scene__statue" src="/images/landing/statue-standing.png" alt="" />
              <div className="mk-metrics">
                {METRICS.map((metric) => {
                  const key = metric.label === 'Espíritu' ? 'espiritu' : metric.label === 'Mente' ? 'mente' : 'cuerpo';
                  const value = index?.pillars?.[key] ?? null;
                  const shown = readingValue(value, diagnosticOpen);
                  const numeric = value != null;
                  return (
                    <Link
                      key={metric.href}
                      href={metric.href}
                      className="mk-metric"
                      style={{ left: `${metric.x}%`, top: `${metric.y}%` }}
                      aria-label={`${metric.label}. ${shown}`}
                    >
                      <span className="mk-metric__name">{metric.label}</span>
                      <span className={numeric ? 'mk-metric__value' : 'mk-metric__value is-word'}>{shown}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mk-plate">
            <div>
              <p className="mk-plate__label">Índice de alineación MK</p>
              <p className="mk-home__note">{plate.note}</p>
            </div>
            <p className="mk-plate__value">{plate.value}</p>
          </div>
          {state ? <DeclaredSheet alignment={state.alignment} /> : null}
        </div>
        <aside className="mk-next">
          <p className="mk-next__eyebrow">Siguiente</p>
          <h2 className="mk-next__title">{cardTitle(phase, state)}</h2>
          {detail ? <p className="mk-next__detail">{detail}</p> : null}
          {state && !HIDDEN_HREFS.has(state.nextAction.href) ? (
            <Link href={state.nextAction.href} className="mk-member-btn">
              {state.nextAction.label}
            </Link>
          ) : null}
          {phase === 'error' ? (
            <button type="button" className="mk-member-btn" onClick={load}>Reintentar</button>
          ) : null}
        </aside>
        {state?.board ? <HomeReading board={state.board} /> : null}
      </div>
    </div>
  );
}

function indexPlate(
  phase: Phase,
  index: NonNullable<JourneyState['indexes']>['alignment'] | NonNullable<HomeBoardView['reading']> | null,
  diagnosticOpen: boolean,
): { value: string; note: string } {
  if (phase === 'loading') return { value: 'Cargando', note: 'Leyendo el índice del cuestionario.' };
  if (phase === 'error') return { value: 'Error', note: 'No se pudo leer el índice del cuestionario.' };
  if (!index || index.general == null && !index.pillars) {
    return {
      value: readingValue(null, diagnosticOpen),
      note: 'Lectura del cuestionario. No es la ficha declarada.',
    };
  }
  const coverage = index.coverage?.eligible == null ? '' : `Cobertura ${index.coverage.eligible} de ${index.coverage.required}.`;
  const date = formatAlignmentDate(index.computedAt);
  return {
    value: readingValue(index.general, diagnosticOpen),
    note: [
      index.general == null ? 'Sin general. No es cero.' : '',
      coverage,
      date,
      formatMethodVersionLabel(index.methodVersion),
      'Lectura del cuestionario. No es la ficha declarada.',
    ].filter(Boolean).join(' '),
  };
}

function DeclaredSheet({ alignment }: { alignment: AlignmentReading }) {
  const plate = alignmentPlate('ready', alignment);
  return (
    <section className="mk-home__block" aria-label="Ficha declarada">
      <h2>Ficha declarada</h2>
      <p className="mk-home__figure">{plate.value}</p>
      <p className="mk-home__note">{plate.note} Esta ficha no es el índice del cuestionario.</p>
    </section>
  );
}

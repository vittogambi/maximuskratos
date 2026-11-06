'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchTerritory } from '@/lib/journey-api';
import { apiDiagnosticStartTerritory } from '@/lib/api';
import { routeDiagnosticFromState } from '@/lib/diagnostic-continue';
import { planStageLabel, territoryCoverageLabel, territoryCoveragePercent } from '@/lib/territory-ui-copy';
import { MemberPage } from './MemberPage';
import { MemberTabs } from './MemberTabs';

type Props = { territory: string };

type TerritoryException = {
  sourceRef: string;
  prompt: string;
  kind: 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED';
};

type TerritoryPayload = {
  label?: string;
  coverage?: { settled?: number; required?: number; state?: string };
  exceptions?: TerritoryException[];
  synthesis?: { text: string; sourceRef: string | null; partial: boolean }[];
  plans?: { id: string; title: string; stage: string; isFocus: boolean }[];
};

const EXCEPTION_LABEL: Record<TerritoryException['kind'], string> = {
  UNKNOWN: 'No sé',
  NOT_APPLICABLE: 'No aplica',
  DECLINED: 'No quiero responder',
};

const PHASE_COPY: Record<'discover' | 'design' | 'act', string> = {
  discover: 'Explora tus respuestas y conoce mejor tu situación actual.',
  design: 'Crea un plan o continúa uno que ya empezaste.',
  act: 'Revisa tus acciones y registra cómo te fue.',
};

function coverageBadgeClass(state: string | undefined): string {
  switch (state) {
    case 'EXPLORED':
      return 'mk-m-badge mk-m-badge--done';
    case 'PARTIAL':
      return 'mk-m-badge mk-m-badge--progress';
    default:
      return 'mk-m-badge';
  }
}

function phaseFromQuery(value: string | null): 'discover' | 'design' | 'act' {
  if (value === 'disena') return 'design';
  if (value === 'actua') return 'act';
  return 'discover';
}

function queryFromPhase(tab: 'discover' | 'design' | 'act'): string {
  if (tab === 'design') return 'disena';
  if (tab === 'act') return 'actua';
  return 'descubre';
}

export function TerritoryScreen({ territory }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cuestionarioHint = searchParams.get('cuestionario');
  const showExceptions = searchParams.get('excepciones') === '1';
  const tab = phaseFromQuery(searchParams.get('fase'));
  const [payload, setPayload] = useState<TerritoryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const left = useRef(false);

  function openQuestionnaire() {
    const token = getAccessToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setStarting(true);
    void apiDiagnosticStartTerritory(token, territory)
      .then((next) => routeDiagnosticFromState(next, { replace: (path) => { window.location.assign(path); } }))
      .catch(() => {
        left.current = false;
        setStarting(false);
        setError('No se pudo abrir el cuestionario de este ámbito.');
      });
  }

  function selectPhase(next: 'discover' | 'design' | 'act') {
    const plans = payload?.plans ?? [];
    const explored = payload?.coverage?.state === 'EXPLORED';
    if (next === 'discover' && !explored && !cuestionarioHint && !showExceptions) {
      if (!left.current) {
        left.current = true;
        openQuestionnaire();
      }
      return;
    }
    if (next === 'design' && plans.length === 0) {
      router.push(`/disenar?territorio=${encodeURIComponent(territory)}`);
      return;
    }
    if (next === 'act') {
      const follow = plans.find((plan) => plan.isFocus) ?? plans[0] ?? null;
      if (!follow || follow.stage === 'PREPARING') return;
      if (follow.stage === 'CLOSED' || follow.stage === 'PAUSED') {
        router.push(`/planes/${follow.id}`);
        return;
      }
      router.push(`/semana?planId=${encodeURIComponent(follow.id)}`);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('fase', queryFromPhase(next));
    router.replace(`/ambito/${encodeURIComponent(territory)}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver este ámbito.');
      return;
    }
    fetchTerritory(token, territory)
      .then((raw) => setPayload(raw as TerritoryPayload))
      .catch(() => setError('No pudimos cargar este ámbito. Inténtalo nuevamente.'));
  }, [territory]);

  const plans = payload?.plans ?? [];
  const explored = payload?.coverage?.state === 'EXPLORED';
  const emptyDiscover = Boolean(payload) && tab === 'discover' && !explored && !cuestionarioHint && !showExceptions;
  const emptyDesign = Boolean(payload) && tab === 'design' && plans.length === 0;
  const openAct = Boolean(payload) && tab === 'act' && !cuestionarioHint && plans.some((plan) => plan.stage !== 'PREPARING');

  useEffect(() => {
    if (!payload || left.current || cuestionarioHint) return;
    if (emptyDiscover) {
      left.current = true;
      openQuestionnaire();
      return;
    }
    if (emptyDesign) {
      left.current = true;
      router.replace(`/disenar?territorio=${encodeURIComponent(territory)}`);
      return;
    }
    if (!openAct) return;
    const follow = plans.find((plan) => plan.stage !== 'PREPARING' && plan.isFocus) ?? plans.find((plan) => plan.stage !== 'PREPARING') ?? null;
    if (!follow) return;
    left.current = true;
    if (follow.stage === 'CLOSED' || follow.stage === 'PAUSED') {
      router.replace(`/planes/${follow.id}`);
      return;
    }
    router.replace(`/semana?planId=${encodeURIComponent(follow.id)}`);
  }, [payload, emptyDiscover, emptyDesign, openAct, cuestionarioHint, territory, router]);

  const label = typeof payload?.label === 'string' ? payload.label : territory;
  const coverage = payload?.coverage;
  const settled = coverage?.settled ?? 0;
  const required = coverage?.required ?? 0;
  const percent = useMemo(() => territoryCoveragePercent(settled, required), [settled, required]);
  const stateLabel = territoryCoverageLabel(coverage?.state);

  if (error) {
    return (
      <MemberPage title="Ámbito" intro={error}>
        <Link href="/panel" className="mk-m-link">
          Volver al inicio
        </Link>
      </MemberPage>
    );
  }

  if (!payload) {
    return (
      <MemberPage title="Ámbito" intro="Cargando tu información…">
        <div className="mk-m-skeleton mk-m-skeleton--tall" aria-hidden />
      </MemberPage>
    );
  }

  const cuestionarioNotice =
    cuestionarioHint === 'completo'
      ? 'Completaste las preguntas de este ámbito en el cuestionario.'
      : cuestionarioHint === 'pausa'
        ? 'Por ahora no hay más preguntas de este ámbito en el módulo actual. Puedes seguir en otro momento.'
        : null;

  if (emptyDiscover || emptyDesign || openAct || starting) {
    return (
      <MemberPage title={label} intro={emptyDiscover || starting ? 'Abriendo el cuestionario…' : openAct ? 'Abriendo tu semana…' : 'Abriendo el plan…'}>
        <div className="mk-m-skeleton mk-m-skeleton--tall" aria-hidden />
      </MemberPage>
    );
  }

  const synthesis = payload.synthesis ?? [];
  const followPlan = plans.find((plan) => plan.isFocus) ?? plans[0] ?? null;

  return (
    <MemberPage eyebrow="MK · ÁMBITO" title={label} intro="Explora este ámbito, prepara un plan y sigue tus avances.">
      {cuestionarioNotice ? (
        <p className="mk-m-callout" role="status">
          {cuestionarioNotice}
        </p>
      ) : null}

      <section className="mk-m-territory-hero" aria-label="Progreso del ámbito">
        <div className="mk-m-territory-hero__row">
          <div className="mk-m-territory-hero__metric">
            <span className="mk-m-territory-hero__value">{settled}</span>
            <span className="mk-m-territory-hero__denom">
              de {required} preguntas completadas
            </span>
          </div>
          <span className={coverageBadgeClass(coverage?.state)}>{stateLabel}</span>
        </div>
        <div
          className="mk-m-progress"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent} por ciento de preguntas completadas en este ámbito`}
        >
          <div className="mk-m-progress__fill" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <div>
        <h2 id="mk-ambito-phases" className="mk-m-section-title">
          Tres fases
        </h2>
        <MemberTabs
          labelledBy="mk-ambito-phases"
          active={tab}
          onChange={(id) => selectPhase(id as 'discover' | 'design' | 'act')}
          tabs={[
            { id: 'discover', label: 'Descubre' },
            { id: 'design', label: 'Diseña' },
            { id: 'act', label: 'Actúa' },
          ]}
        />
        <p className="mk-m-phase-hint">{PHASE_COPY[tab]}</p>
      </div>

      <div className="mk-m-tab-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'discover' ? (
          <>
            {showExceptions ? (
              <section className="mk-m-section" aria-label="Excepciones guardadas">
                <h2 className="mk-m-section-title">Excepciones guardadas</h2>
                <p className="mk-m-muted">
                  Una excepción no se lee como un sí ni como un no. Esta lista no es un informe del diagnóstico.
                </p>
                {(payload?.exceptions ?? []).length > 0 ? (
                  <ul className="mk-m-insight-list">
                    {(payload?.exceptions ?? []).map((row) => (
                      <li key={row.sourceRef} className="mk-m-insight">
                        <p className="mk-m-insight__text">{row.prompt}</p>
                        <span className="mk-m-badge">{EXCEPTION_LABEL[row.kind]}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mk-m-empty">No hay excepciones guardadas en este ámbito.</p>
                )}
              </section>
            ) : null}
            {synthesis.length > 0 ? (
              <ul className="mk-m-insight-list">
                {synthesis.slice(0, 6).map((line, index) => (
                  <li key={`${line.sourceRef ?? 'line'}-${index}`} className="mk-m-insight">
                    <p className="mk-m-insight__text">{line.text}</p>
                    {line.partial ? <span className="mk-m-badge mk-m-badge--partial">Lectura parcial</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mk-m-empty">Por ahora no hay lecturas para mostrar. Puedes seguir respondiendo o empezar un plan.</p>
            )}
            <div className="mk-m-actions">
              {coverage?.state === 'EXPLORED' ? null : (
              <button
                type="button"
                className="mk-m-btn"
                disabled={starting}
                onClick={() => {
                  left.current = true;
                  openQuestionnaire();
                }}
              >
                {starting ? 'Abriendo' : coverage?.state === 'PARTIAL' ? 'Continuar cuestionario del ámbito' : 'Empezar cuestionario del ámbito'}
              </button>
              )}
              <Link href="/panel" className="mk-m-btn mk-m-btn--ghost">
                Volver al mapa
              </Link>
            </div>
          </>
        ) : null}

        {tab === 'design' ? (
          <>
            {plans.length === 0 ? (
              <p className="mk-m-empty">Todavía no tienes planes en este ámbito.</p>
            ) : (
              <ul className="mk-m-plan-list">
                {plans.map((plan) => (
                  <li key={plan.id}>
                    <Link href={`/planes/${plan.id}`} className="mk-m-plan-card">
                      <span className="mk-m-plan-card__title">{plan.title}</span>
                      <span className="mk-m-plan-card__meta">
                        {plan.isFocus ? 'Plan principal · ' : ''}
                        {planStageLabel(plan.stage)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mk-m-actions">
              <Link href={`/disenar?territorio=${encodeURIComponent(territory)}`} className="mk-m-btn">
                Diseñar plan
              </Link>
            </div>
          </>
        ) : null}

        {tab === 'act' ? (
          <>
            {followPlan && followPlan.stage !== 'PREPARING' ? (
              <div className="mk-m-actions">
                <Link href={followPlan.stage === 'CLOSED' || followPlan.stage === 'PAUSED' ? `/planes/${followPlan.id}` : `/semana?planId=${encodeURIComponent(followPlan.id)}`} className="mk-m-btn">
                  {followPlan.stage === 'CLOSED' || followPlan.stage === 'PAUSED' ? 'Ver el plan' : 'Ir a la semana de este ámbito'}
                </Link>
              </div>
            ) : (
              <p className="mk-m-empty mk-m-empty--compact">Cuando actives un plan en este ámbito, podrás seguir sus acciones desde aquí.</p>
            )}
          </>
        ) : null}
      </div>
    </MemberPage>
  );
}

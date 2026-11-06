'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { civilDayLabel } from '@/lib/dashboard-next';
import { getAccessToken } from '@/lib/auth-storage';
import { invalidatePlansListCache } from '@/lib/plans-cache';
import { loadPlanDetail, type PlanDetailBundle } from '@/lib/plan-detail-load';
import { transitionPlanStage } from '@/lib/journey-api';
import { planStageLabel, territoryDisplayLabel } from '@/lib/territory-ui-copy';
import { PlanOutcomeContractEditor } from './PlanOutcomeContractEditor';

const LINK_LABELS: Record<string, string> = {
  DIRECT: 'Contribuye directamente a tu dirección',
  ENABLING: 'Crea condiciones para vivirla',
  PROTECTIVE: 'Cuida algo igualmente importante',
  EXPLORATORY: 'Te ayuda a explorarla',
};

const PENDING_FIELD_COPY: Record<string, string> = {
  CRITERION: 'Falta concretar cómo reconocerás el resultado',
  CRITERION_CONFIRM: 'Falta confirmar el criterio',
  EVIDENCE: 'Falta definir qué evidencia usarás',
  CHECK_AT: 'Falta fijar la fecha de comprobación',
};

function pendingFieldMessages(fields: string[] | undefined): string[] {
  if (!fields?.length) return [];
  return fields.map((field) => PENDING_FIELD_COPY[field] ?? 'Falta completar un dato del resultado');
}

function loadLine(load: { weeklyMinutes: number; occasionsPerWeek?: number | null }): string {
  const n = load.occasionsPerWeek ?? 1;
  const activities = n === 1 ? '1 actividad prevista' : `${n} actividades previstas`;
  return `${load.weeklyMinutes} min por semana · ${activities}`;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? 'mk-plans-chevron is-open' : 'mk-plans-chevron'}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function primaryAction(summary: PlanDetailBundle['summary']) {
  const stage = summary.stage;
  if (stage === 'PREPARING') return { label: 'Continuar diseño', href: `/disenar/${summary.id}` };
  if (stage === 'PAUSED') return { label: 'Retomar el plan', action: 'resume' as const };
  if (stage === 'CLOSED') return { label: 'Ver historial', href: '/memoria' };
  if (stage === 'ACTIVE' || stage === 'MAINTENANCE') return { label: 'Ir a mi semana', href: `/semana?planId=${summary.id}` };
  return null;
}

export function PlanDetailScreen({ planId }: { planId: string }) {
  const [bundle, setBundle] = useState<PlanDetailBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFocus, setEditorFocus] = useState<'evidence' | 'general'>('general');
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsPanelId = useId();
  const [resuming, setResuming] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;
    loadPlanDetail(token, planId)
      .then(setBundle)
      .catch(() => setError('No pudimos cargar este plan. Inténtalo nuevamente.'));
  }, [planId]);

  useEffect(() => {
    setBundle(null);
    setError(null);
    reload();
  }, [reload]);

  if (error) {
    return (
      <div className="mk-plans-wrap">
        <section className="mk-mx-next" role="alert">
          <p className="mk-mx-next__body">{error}</p>
          <button type="button" className="mk-mx__action" onClick={reload}>
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="mk-plans-wrap" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /></div>
      </div>
    );
  }

  const { summary, intervention } = bundle;
  const stage = summary.stage;
  const closed = stage === 'CLOSED';
  const paused = stage === 'PAUSED';
  const open = stage === 'ACTIVE' || stage === 'MAINTENANCE';
  const preparing = stage === 'PREPARING';
  const contractIncomplete = Boolean(intervention?.outcomeContractMeta && !intervention.outcomeContractMeta.complete);
  const primary = primaryAction(summary);
  const exploring = summary.resultMode === 'EXPLORATION';
  const designedActions = summary.actions ?? [];
  const showLogro =
    (stage === 'ACTIVE' || stage === 'MAINTENANCE')
    && !exploring
    && Boolean(summary.outcomeContractComplete && summary.outcomeCriterion?.trim());
  const checkLabel = summary.outcomeContract?.checkAt
    ? civilDayLabel(summary.outcomeContract.checkAt)
    : intervention?.outcomeContract?.checkAt
      ? civilDayLabel(intervention.outcomeContract.checkAt)
      : null;
  const pendingFields = intervention?.outcomeContractMeta?.pendingFields ?? [];
  const onlyEvidencePending =
    contractIncomplete && pendingFields.length === 1 && pendingFields[0] === 'EVIDENCE';
  const pendingNotes =
    contractIncomplete && !onlyEvidencePending ? pendingFieldMessages(pendingFields) : [];
  const canEditOutcome = Boolean(intervention && summary.territory);
  const showMenPrep = summary.territory === 'MENTALIDAD' && !closed && (open || preparing);
  const hasDirectionStatement = Boolean(summary.directionAtCreation?.statement?.trim());
  const hasHistorialContent = Boolean(
    summary.observedEvidence?.trim()
    || summary.learningNote?.trim()
    || closed,
  );
  const manageTitle = hasHistorialContent ? 'Opciones e historial' : 'Opciones del plan';
  const showToolsToggle = Boolean(summary.strategyTitle || intervention?.protectNote);

  function openOutcomeEditor(focus: 'evidence' | 'general') {
    setEditorFocus(focus);
    setEditorOpen(true);
  }

  return (
    <div className="mk-plans-wrap mk-plans-detail">
      <header className="mk-plans-detail__head">
        <p className="mk-plans-card__eyebrow">
          {territoryDisplayLabel(summary.territory)}
          {' · '}
          {planStageLabel(stage)}
        </p>
        <h1 className="mk-plans-detail__title">{summary.title}</h1>
        {summary.whyItMatters ? (
          <div className="mk-plans-motivo">
            <p className="mk-plans-meta-label">Por qué te importa</p>
            <p className="mk-plans-body">{summary.whyItMatters}</p>
          </div>
        ) : null}
        {primary?.href ? (
          <Link className="mk-mx__action mk-mx__action--primary" href={primary.href}>
            {primary.label}
          </Link>
        ) : primary?.action === 'resume' ? (
          <button
            type="button"
            className="mk-mx__action mk-mx__action--primary"
            disabled={resuming}
            onClick={() => {
              const token = getAccessToken();
              if (!token) return;
              setResuming(true);
              void transitionPlanStage(token, planId, { toStage: 'ACTIVE', reason: 'RETURN' })
                .then(() => {
                  invalidatePlansListCache();
                  reload();
                })
                .catch(() => setMessage('No pudimos retomar el plan. Inténtalo nuevamente.'))
                .finally(() => setResuming(false));
            }}
          >
            {resuming ? 'Retomando' : primary.label}
          </button>
        ) : null}
      </header>

      <section className="mk-mx-surface mk-plans-block">
        <h2 className="mk-plans-section-title">{exploring ? 'Lo que exploras' : 'Lo que buscas'}</h2>
        <p className="mk-plans-meta-label">{exploring ? 'Pregunta' : 'Resultado buscado'}</p>
        <p className="mk-plans-body">{summary.outcome}</p>
        {summary.outcomeCriterion ? (
          <>
            <p className="mk-plans-meta-label">{exploring ? 'Lo que quieres saber al final' : 'Cómo lo reconocerás'}</p>
            <p className="mk-plans-body">{summary.outcomeCriterion}</p>
          </>
        ) : null}
        {checkLabel ? (
          <>
            <p className="mk-plans-meta-label">Comprobación prevista</p>
            <p className="mk-plans-body">{checkLabel}</p>
          </>
        ) : null}
        {summary.evidenceHint?.trim() ? (
          <>
            <p className="mk-plans-meta-label">Evidencia</p>
            <p className="mk-plans-body">{summary.evidenceHint}</p>
          </>
        ) : null}
        {onlyEvidencePending ? (
          <p className="mk-plans-note mk-plans-note--pending">Falta definir qué evidencia usarás</p>
        ) : null}
        {pendingNotes.map((note) => (
          <p key={note} className="mk-plans-note mk-plans-note--pending">{note}</p>
        ))}
        {canEditOutcome ? (
          <button
            type="button"
            className="mk-mx__action"
            onClick={() => openOutcomeEditor(onlyEvidencePending ? 'evidence' : 'general')}
          >
            {contractIncomplete
              ? (onlyEvidencePending ? 'Definir evidencia' : 'Completar')
              : 'Editar resultado'}
          </button>
        ) : null}
      </section>

      <section className="mk-mx-surface mk-plans-block">
        <h2 className="mk-plans-section-title">Tu estrategia</h2>
        {designedActions.length > 1 ? (
          <ol className="mk-plans-actions-list">
            {designedActions.map((row) => (
              <li key={row.id}>
                <p className="mk-plans-lead">{row.title}</p>
                {row.cue ? <p className="mk-plans-body">Cuándo: {row.cue}</p> : null}
                <p className="mk-plans-body">Hecha cuando: {row.doneWhen}</p>
                {row.minimum ? <p className="mk-plans-body">Si el día se complica: {row.minimum}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <>
            {summary.actionTitle ? (
              <p className="mk-plans-lead">{summary.actionTitle}</p>
            ) : null}
            {designedActions[0]?.cue ? <p className="mk-plans-body">Cuándo: {designedActions[0].cue}</p> : null}
            {summary.doneWhen ? (
              <>
                <p className="mk-plans-meta-label">Se considera hecha cuando…</p>
                <p className="mk-plans-body">{summary.doneWhen}</p>
              </>
            ) : null}
          </>
        )}
        {summary.obstacles?.length ? (
          <>
            <p className="mk-plans-meta-label">Si algo se interpone</p>
            {summary.obstacles.map((row) => <p key={row.obstacle} className="mk-plans-body">Si {row.obstacle}, entonces {row.response}</p>)}
          </>
        ) : null}
        {intervention?.load ? (
          <p className="mk-plans-body mk-plans-load">{loadLine(intervention.load)}</p>
        ) : null}
        {showMenPrep ? (
          <Link
            href={`/planes/${planId}/preparar?territorio=mentalidad`}
            className="mk-mx__action"
          >
            Preparar mis prioridades
          </Link>
        ) : null}
        {showToolsToggle ? (
          <>
            <button
              type="button"
              className="mk-plans-disclosure"
              aria-expanded={toolsOpen}
              aria-controls={toolsPanelId}
              onClick={() => setToolsOpen((v) => !v)}
            >
              <span className="mk-plans-disclosure__label">Estrategia y precauciones</span>
              <Chevron open={toolsOpen} />
            </button>
            {toolsOpen ? (
              <div id={toolsPanelId} className="mk-plans-disclosure__panel">
                {summary.strategyTitle ? (
                  <p className="mk-plans-body">{summary.strategyTitle}</p>
                ) : null}
                {intervention?.protectNote ? (
                  <p className="mk-plans-body">{intervention.protectNote}</p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      {hasDirectionStatement ? (
        <section className="mk-mx-surface mk-plans-block">
          <h2 className="mk-plans-section-title">Tu dirección</h2>
          <p className="mk-plans-body">{summary.directionAtCreation?.statement}</p>
          {summary.linkKind ? (
            <p className="mk-plans-meta-label">{LINK_LABELS[summary.linkKind] ?? summary.linkKind}</p>
          ) : null}
          <Link href="/proposito" className="mk-plans-action-row mk-plans-action-row--link">
            <span>Revisar dirección</span>
            <Chevron open={false} />
          </Link>
        </section>
      ) : (
        <div className="mk-plans-direction-row">
          <div className="mk-plans-direction-row__text">
            <p className="mk-plans-section-title mk-plans-section-title--inline">Tu dirección</p>
            <p className="mk-plans-meta-label">Opcional</p>
          </div>
          <Link href="/proposito" className="mk-mx__textlink">
            Añadir
          </Link>
        </div>
      )}

      <section className="mk-mx-surface mk-plans-block">
        <h2 className="mk-plans-section-title">{manageTitle}</h2>
        {summary.reviewAt && !closed ? (
          <p className="mk-plans-meta-label">Próxima revisión del plan: {civilDayLabel(summary.reviewAt) ?? summary.reviewAt}</p>
        ) : null}
        {summary.observedEvidence ? (
          <>
            <p className="mk-plans-meta-label">Evidencia registrada</p>
            <p className="mk-plans-body">{summary.observedEvidence}</p>
          </>
        ) : null}
        {summary.learningNote ? (
          <>
            <p className="mk-plans-meta-label">Aprendizaje</p>
            <p className="mk-plans-body">{summary.learningNote}</p>
          </>
        ) : null}
        {closed ? <p className="mk-plans-body">Este plan está cerrado. El historial conserva lo que registraste.</p> : null}
        {paused ? <p className="mk-plans-body">El plan está en pausa. No se reactivó solo.</p> : null}

        <div className="mk-plans-actions">
          {closed ? (
            <>
              <Link href="/memoria" className="mk-plans-action-row mk-plans-action-row--link">
                <span>Ver historial</span>
                <Chevron open={false} />
              </Link>
              <Link
                href={summary.territory ? `/disenar?territorio=${summary.territory}` : '/disenar'}
                className="mk-plans-action-row mk-plans-action-row--link"
              >
                <span>Elegir otro cambio</span>
                <Chevron open={false} />
              </Link>
            </>
          ) : null}
          {open ? (
            <>
              <Link href={`/semana/revision?planId=${planId}`} className="mk-plans-action-row mk-plans-action-row--link">
                <span>Ajustar en la revisión</span>
                <Chevron open={false} />
              </Link>
              {showLogro ? (
                <Link href={`/planes/${planId}/logro`} className="mk-plans-action-row mk-plans-action-row--link">
                  <span>Registrar un logro</span>
                  <Chevron open={false} />
                </Link>
              ) : null}
              <Link href={`/planes/${planId}/mantener`} className="mk-plans-action-row mk-plans-action-row--link">
                <span>Pasar a mantenimiento</span>
                <Chevron open={false} />
              </Link>
              <button
                type="button"
                className="mk-plans-action-row"
                onClick={() => setPauseOpen(true)}
              >
                <span>Pausar el plan</span>
                <Chevron open={false} />
              </button>
            </>
          ) : null}
          {preparing ? (
            <Link href={`/disenar/${planId}`} className="mk-plans-action-row mk-plans-action-row--link">
              <span>Continuar diseño</span>
              <Chevron open={false} />
            </Link>
          ) : null}
        </div>
      </section>

      {intervention && summary.territory ? (
        <PlanOutcomeContractEditor
          territory={summary.territory.toLowerCase()}
          planId={planId}
          contract={intervention.outcomeContract ?? null}
          meta={intervention.outcomeContractMeta ?? { complete: true, pendingFields: [], recoveredFromLegacy: false }}
          fallbackOutcome={summary.outcome}
          open={editorOpen}
          initialFocus={editorFocus === 'evidence' ? 'evidence' : null}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            invalidatePlansListCache();
            reload();
          }}
        />
      ) : null}

      {message ? <p role="status">{message}</p> : null}

      {pauseOpen ? (
        <div className="mk-m-modal" role="dialog" aria-labelledby="pause-plan-title">
          <div className="mk-m-modal__panel">
            <h2 id="pause-plan-title">Pausar el plan</h2>
            <p className="mk-mx-next__body">Mientras el plan esté en pausa, no tendrás acciones programadas. Tus registros anteriores se conservarán y podrás retomarlo más adelante.</p>
            <div className="mk-week-task__actions">
              <button
                type="button"
                className="mk-mx__action mk-mx__action--primary"
                disabled={pausing}
                onClick={() => {
                  const token = getAccessToken();
                  if (!token) return;
                  setPausing(true);
                  void transitionPlanStage(token, planId, { toStage: 'PAUSED' })
                    .then(() => {
                      setPauseOpen(false);
                      invalidatePlansListCache();
                      reload();
                    })
                    .catch(() => setMessage('No pudimos pausar el plan. Inténtalo nuevamente.'))
                    .finally(() => setPausing(false));
                }}
              >
                {pausing ? 'Pausando' : 'Confirmar pausa'}
              </button>
              <button type="button" className="mk-mx__action" disabled={pausing} onClick={() => setPauseOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mk-plans-foot">
        <Link href="/planes" className="mk-mx__textlink">
          Volver a tus planes
        </Link>
      </p>
    </div>
  );
}

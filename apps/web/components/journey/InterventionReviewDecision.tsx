'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { JourneyApiError, transitionPlanStage } from '@/lib/journey-api';
import { civilDayLabel } from '@/lib/dashboard-next';
import { changeLine, nextWeekLoad, weekLabel } from '@/lib/action-review';
import {
  confirmInterventionReview,
  fetchPendingInterventionWeek,
  newCommandKey,
  type ActionAddition,
  type ActionChange,
  type InterventionPlanView,
  type ReviewMeaning,
} from '@/lib/intervention-api';
import { ActionReviewPanel } from './ActionReviewPanel';
import { ContentClarification } from './ContentClarification';

const LABELS: Record<string, string> = {
  KEEP: 'Mantener la estrategia',
  REDUCE: 'Reducir la carga',
  MODIFY: 'Modificar la estrategia',
  SUBSTITUTE: 'Sustituir por otra acción',
  NO_RECORDS: 'Dejar constancia de registros faltantes',
};

type DecisionProps = {
  territory: string;
  planId: string;
  view: InterventionPlanView;
  weekStart?: string;
  onSaved: () => void;
  hideWeekApply?: boolean;
};

export function InterventionReviewDecision(props: DecisionProps) {
  if (props.view.actions && props.view.reviewWeek) return <ActionReviewDecision {...props} />;
  return <PlanReviewDecision {...props} />;
}

const MEANINGS = [
  ['STILL', 'Sí, sigue importándome'],
  ['LESS', 'Importa, pero menos que antes'],
  ['NO_LONGER', 'Ya no es una prioridad'],
] as const;

function ClosePanel({ territory, busy, closeNote, onCloseNote, onClose }: { territory: string; busy: boolean; closeNote: string; onCloseNote: (value: string) => void; onClose: () => void }) {
  return (
    <div className="mk-m-callout">
      <p>Tus prioridades pueden cambiar. Si decides cerrar este plan, puedes guardar lo que aprendiste y elegir otro cambio cuando quieras.</p>
      <label className="mk-ds-field">
        ¿Qué aprendiste de este ciclo? (opcional)
        <textarea rows={2} value={closeNote} onChange={(e) => onCloseNote(e.target.value)} />
      </label>
      <div className="mk-ds-actions">
        <button type="button" className="mk-mx__action" disabled={busy} onClick={onClose}>Guardar aprendizaje y cerrar el plan</button>
        <Link href={`/disenar?territorio=${territory}`} className="mk-mx__action">Elegir otro cambio</Link>
        <Link href="/proposito" className="mk-m-link">Revisar mi dirección</Link>
      </div>
    </div>
  );
}

/**
 * Review action by action. Before the review date only the actions can be adjusted; the question about the result
 * and closing the plan appear from that date on. Nothing changes until the week is applied.
 */
function ActionReviewDecision({ territory, planId, view, weekStart, onSaved }: DecisionProps) {
  const actions = view.actions ?? [];
  const nextWeek = view.reviewWeek!.nextWeek;
  const fromWeek = view.reviewWeek!.appliesFrom ?? nextWeek;
  const needs = actions.some((row) => row.needsDecision);
  const [meaning, setMeaning] = useState<ReviewMeaning | ''>('');
  const [changes, setChanges] = useState<Record<string, ActionChange>>({});
  const [additions, setAdditions] = useState<ActionAddition[]>([]);
  const [expanded, setExpanded] = useState(view.horizonReached || needs);
  const [note, setNote] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indicatorAsk, setIndicatorAsk] = useState<string | null>(null);
  const [clarify, setClarify] = useState<'HEALTH' | 'CONVERSATION' | null>(null);
  const carryRef = useRef<{
    healthLimit?: 'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT';
    conversation?: 'VIABLE' | 'UNSAFE';
    indicatorChoice?: 'KEEP' | 'REVIEW';
  }>({});
  const [saved, setSaved] = useState<string | null>(view.review.pendingThisWeek?.previewSummary ?? null);
  const [followsProposal, setFollowsProposal] = useState<boolean | null>(null);
  const keyRef = useRef<{ content: string; key: string } | null>(null);
  const outcomeContext = view.observableOutcome ?? view.changeTitle ?? null;
  const showActions = view.horizonReached ? Boolean(meaning) && meaning !== 'NO_LONGER' : expanded;
  const touched = Object.values(changes).filter((row) => row.op !== 'KEEP');
  const load = nextWeekLoad(actions, changes, additions, fromWeek);

  async function save(extra?: { healthLimit?: 'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT'; conversation?: 'VIABLE' | 'UNSAFE'; indicatorChoice?: 'KEEP' | 'REVIEW' }) {
    const token = getAccessToken();
    if (!token) return;
    if (view.horizonReached && !meaning) {
      setError('Indica si este resultado sigue importándote.');
      return;
    }
    if (extra) carryRef.current = { ...carryRef.current, ...extra };
    const body = {
      weekStart,
      note: note.trim() || null,
      meaning: meaning || null,
      choice: (view.review.code === 'NO_RECORDS' && !touched.length && !additions.length ? 'NO_RECORDS' : 'KEEP') as 'KEEP' | 'NO_RECORDS',
      actions: Object.values(changes),
      additions,
      ...carryRef.current,
    };
    const content = JSON.stringify(body);
    if (!keyRef.current || keyRef.current.content !== content) keyRef.current = { content, key: newCommandKey(`review-${planId}`) };
    setBusy(true);
    setError(null);
    try {
      const result = await confirmInterventionReview(token, territory, planId, { ...body, commandKey: keyRef.current.key });
      setSaved(result.weekReview?.previewSummary ?? 'Decisión guardada.');
      setFollowsProposal(result.weekReview?.followsProposal ?? null);
      setClarify(null);
      setIndicatorAsk(null);
      onSaved();
    } catch (err) {
      if (err instanceof JourneyApiError && err.code === 'INDICATOR_COHERENCE') {
        setIndicatorAsk(err.message);
        setError(null);
      } else if (err instanceof JourneyApiError && err.code === 'CLARIFICATION_REQUIRED' && err.scope) {
        setClarify(err.scope as 'HEALTH' | 'CONVERSATION');
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'No pudimos guardar tu decisión. Tus ajustes siguen aquí. Puedes intentarlo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function closeWithLearning() {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await transitionPlanStage(token, planId, { toStage: 'CLOSED', reason: 'MEMBER_CHOICE', learningNote: closeNote.trim() || note.trim() || null });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cerrar el plan. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mk-week-review-block">
      <p className="mk-mx-next__body">{view.review.text}</p>
      {view.horizonReached ? (
        <>
          <p className="mk-week-review-block__question">¿Este resultado sigue siendo importante para ti?</p>
          {outcomeContext ? <p className="mk-m-muted">{outcomeContext}</p> : null}
          <div className="mk-indicator__choices" role="group" aria-label="Sentido del resultado">
            {MEANINGS.map(([id, label]) => (
              <button key={id} type="button" className="mk-mx__action" aria-pressed={meaning === id} onClick={() => setMeaning(id)}>{label}</button>
            ))}
          </div>
          {meaning === 'NO_LONGER' ? <ClosePanel territory={territory} busy={busy} closeNote={closeNote} onCloseNote={setCloseNote} onClose={() => void closeWithLearning()} /> : null}
        </>
      ) : (
        <>
          <p className="mk-mx-next__body">
            La revisión de la estrategia está prevista para el {view.reviewAt ? civilDayLabel(view.reviewAt) ?? view.reviewAt : 'horizonte pactado'}. Mientras, puedes ajustar acciones sueltas.
          </p>
          {!expanded ? (
            <button type="button" className="mk-mx__action" onClick={() => setExpanded(true)}>Ajustar acciones</button>
          ) : null}
        </>
      )}
      {showActions ? (
        <>
          {fromWeek !== nextWeek ? (
            <p className="mk-m-muted">Esta revisión se confirma tarde. Los cambios empiezan la {weekLabel(fromWeek)}. Las semanas de en medio conservan las acciones y los registros que ya tenían.</p>
          ) : null}
          <ActionReviewPanel
            actions={actions}
            nextWeek={fromWeek}
            marks={view.marks ?? []}
            alternate={view.review.alternateTemplate ? { action: view.review.alternateTemplate.action, doneWhen: view.review.alternateTemplate.doneWhen } : null}
            changes={changes}
            onChanges={setChanges}
            additions={additions}
            onAdditions={setAdditions}
          />
          <section className="mk-ar-summary" aria-label="Lo que cambiará">
            <h4 className="mk-ar__title">Lo que cambiará desde la {weekLabel(fromWeek)}</h4>
            {touched.length || additions.length ? (
              <ul className="mk-dp-list">
                {actions.filter((row) => changes[row.id]).map((row) => <li key={row.id}>{changeLine(row, changes[row.id])}</li>)}
                {additions.map((row, index) => <li key={`a-${index}`}>Se agrega «{row.title}».</li>)}
              </ul>
            ) : (
              <p className="mk-m-muted">No habrá cambios. Todas tus acciones se mantienen.</p>
            )}
            <p className="mk-m-muted">Esa semana quedaría con {load} minutos. Ajustar acciones no cambia el resultado que buscas.</p>
          </section>
          <label className="mk-ds-field">
            Nota opcional
            <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          {clarify ? <ContentClarification scope={clarify} onChoose={(value) => void save(clarify === 'HEALTH' ? { healthLimit: value as 'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT' } : { conversation: value as 'VIABLE' | 'UNSAFE' })} /> : null}
          {indicatorAsk ? (
            <div className="mk-ar-summary" role="group" aria-label="Pregunta semanal">
              <p className="mk-ds-error" role="alert">{indicatorAsk}</p>
              <p className="mk-m-muted">Si la mantienes, el plan sigue con esa pregunta. Si dices que la revisarás, queda anotado. La pregunta no se modifica.</p>
              <div className="mk-ds-actions">
                <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void save({ indicatorChoice: 'KEEP' })}>La pregunta sigue sirviendo</button>
                <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void save({ indicatorChoice: 'REVIEW' })}>La revisaré después</button>
              </div>
            </div>
          ) : null}
          {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
          {saved ? (
            <p className="mk-m-muted" role="status">
              Decisión guardada. Los cambios todavía no se aplicaron. Revísalos y confírmalos al cerrar la semana.
              {followsProposal === false ? ' Elegiste una opción distinta de la sugerida. Puedes continuar con ella.' : ''}
            </p>
          ) : null}
          <div className="mk-ds-actions">
            <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void save()}>
              {busy ? 'Guardando' : view.horizonReached ? 'Guardar decisión' : 'Guardar ajustes'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PlanReviewDecision({
  territory,
  planId,
  view,
  weekStart,
  onSaved,
}: DecisionProps) {
  const [choice, setChoice] = useState<string>(view.review.lastChoice ?? '');
  const [meaning, setMeaning] = useState<ReviewMeaning | ''>('');
  const [title, setTitle] = useState(view.template.action);
  const [doneWhen, setDoneWhen] = useState(view.template.doneWhen);
  const [note, setNote] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(view.review.pendingThisWeek?.previewSummary ?? null);
  const [pendingCount, setPendingCount] = useState(0);
  const keyRef = useRef<string | null>(null);
  const outcomeContext = view.observableOutcome ?? view.changeTitle ?? null;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const week = weekStart ?? '';
    void fetchPendingInterventionWeek(token, week).then((row) => setPendingCount(row.pending.length)).catch(() => undefined);
  }, [weekStart, view.review.pendingThisWeek, saved]);

  const modifyChanged = choice !== 'MODIFY'
    || title.trim() !== view.template.action.trim()
    || doneWhen.trim() !== view.template.doneWhen.trim();

  async function confirmPlan() {
    const token = getAccessToken();
    if (!token || !choice) {
      setError('Elige una decisión antes de confirmar.');
      return;
    }
    if (!meaning) {
      setError('Indica si este resultado sigue importándote.');
      return;
    }
    if (meaning === 'NO_LONGER') {
      setError('Si ya no te importa, cierra el plan o elige otro cambio abajo.');
      return;
    }
    if (choice === 'MODIFY' && !modifyChanged) {
      setError('Describe qué cambia en la acción o en el criterio de hecho.');
      return;
    }
    keyRef.current = keyRef.current ?? newCommandKey(`review-${planId}`);
    setBusy(true);
    setError(null);
    try {
      const result = await confirmInterventionReview(token, territory, planId, {
        choice: choice as 'KEEP' | 'REDUCE' | 'MODIFY' | 'SUBSTITUTE' | 'NO_RECORDS',
        weekStart,
        commandKey: keyRef.current,
        note: note.trim() || null,
        meaning,
        ...(choice === 'SUBSTITUTE' && view.review.alternateTemplate
          ? { alternateTemplateId: view.review.alternateTemplate.id }
          : {}),
        ...(choice === 'MODIFY' ? { revision: { title: title.trim(), doneWhen: doneWhen.trim() } } : {}),
      });
      setPreview(result.weekReview?.previewSummary ?? preview);
      setPendingCount(result.weekReview?.pendingCount ?? pendingCount);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu decisión. Tu elección sigue aquí. Puedes intentarlo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function closeWithLearning() {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await transitionPlanStage(token, planId, {
        toStage: 'CLOSED',
        reason: 'MEMBER_CHOICE',
        learningNote: closeNote.trim() || note.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cerrar el plan. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="mk-week-review-block">
      <p className="mk-mx-next__body">{view.review.text}</p>
      {view.horizonReached ? (
        <>
          <p className="mk-week-review-block__question">¿Este resultado sigue siendo importante para ti?</p>
          {outcomeContext ? <p className="mk-m-muted">{outcomeContext}</p> : null}
          <div className="mk-indicator__choices" role="group" aria-label="Sentido del resultado">
            {([
              ['STILL', 'Sí, sigue importándome'],
              ['LESS', 'Importa, pero menos que antes'],
              ['NO_LONGER', 'Ya no es una prioridad'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" className="mk-mx__action" aria-pressed={meaning === id} onClick={() => setMeaning(id)}>
                {label}
              </button>
            ))}
          </div>
          {meaning === 'NO_LONGER' ? (
            <ClosePanel territory={territory} busy={busy} closeNote={closeNote} onCloseNote={setCloseNote} onClose={() => void closeWithLearning()} />
          ) : null}
          {meaning && meaning !== 'NO_LONGER' ? (
            <>
              <p className="mk-mx-next__meta">Opciones para la próxima semana</p>
              <div className="mk-indicator__choices" role="group" aria-label="Decisión de revisión">
                {view.review.choices.map((item) => (
                  <button key={item} type="button" className="mk-mx__action" aria-pressed={choice === item} onClick={() => setChoice(item)}>
                    {LABELS[item] ?? item}
                  </button>
                ))}
              </div>
              {choice === 'MODIFY' ? (
                <>
                  <p className="mk-m-muted">Antes: {view.template.action}. Criterio: {view.template.doneWhen}.</p>
                  <label className="mk-ds-field">
                    Acción desde la próxima semana
                    <input value={title} onChange={(event) => setTitle(event.target.value)} />
                  </label>
                  <label className="mk-ds-field">
                    Criterio de hecho
                    <textarea rows={2} value={doneWhen} onChange={(event) => setDoneWhen(event.target.value)} />
                  </label>
                </>
              ) : null}
              {choice === 'SUBSTITUTE' && view.review.alternateTemplate ? (
                <>
                  <p className="mk-m-muted">Antes: {view.template.action}</p>
                  <p>Después: {view.review.alternateTemplate.action}</p>
                </>
              ) : null}
              {preview ? <p className="mk-m-muted">{preview}</p> : null}
              <label className="mk-ds-field">
                Nota opcional
                <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              {error ? <p role="alert">{error}</p> : null}
              {saved ? (
                <p className="mk-m-muted">
                  Decisión guardada. Los cambios todavía no se aplicaron. Revísalos y confírmalos al cerrar la semana.
                  {pendingCount > 0 ? ` Hay ${pendingCount} ${pendingCount === 1 ? 'plan' : 'planes'} pendientes en el cierre de abajo.` : ''}
                </p>
              ) : null}
              <div className="mk-ds-actions">
                <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void confirmPlan()}>
                  {busy ? 'Guardando' : 'Guardar decisión'}
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <p className="mk-mx-next__body">
          La revisión de estrategia está prevista para el {view.reviewAt ?? 'horizonte pactado'}. Hasta entonces puedes registrar ejecución y resultado.
        </p>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatWeekRange, addDays } from '@/lib/week-screen';
import { getAccessToken } from '@/lib/auth-storage';
import {
  confirmMenA1WeekPrep,
  fetchMenA1WeekPrep,
  newCommandKey,
  saveMenA1WeekPrep,
  type MenA1WeekPrepView,
} from '@/lib/intervention-api';

type PriorityRow = { id: string; advance: string; recognize: string; nextStep: string };

function emptyPriority(): PriorityRow {
  return { id: `p-${Math.random().toString(36).slice(2, 9)}`, advance: '', recognize: '', nextStep: '' };
}

export function MenA1PrioritiesWorkspace({ territory, planId, weekStart }: { territory: string; planId: string; weekStart?: string }) {
  const [view, setView] = useState<MenA1WeekPrepView | null>(null);
  const [priorities, setPriorities] = useState<PriorityRow[]>([emptyPriority()]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'edit' | 'check' | 'summary'>('edit');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const saveKeyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const row = await fetchMenA1WeekPrep(token, territory, planId, weekStart);
    setView(row);
    const list = row.prep.priorities.length ? row.prep.priorities : [emptyPriority()];
    setPriorities(list.slice(0, row.maxPriorities));
    setPrimaryId(row.prep.primaryId ?? (list.length === 1 ? list[0]?.id ?? null : null));
    if (row.status === 'CONFIRMED' || row.status === 'FROZEN') setPhase('summary');
    const exp: Record<string, boolean> = {};
    list.slice(0, row.maxPriorities).forEach((p, i) => { exp[p.id] = i === 0; });
    setExpanded(exp);
  }, [territory, planId, weekStart]);

  useEffect(() => { void load().catch((err: Error) => { setMessage(err.message); setStatus('error'); }); }, [load]);

  function updateRow(id: string, field: keyof PriorityRow, value: string) {
    setPriorities((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setStatus('idle');
  }

  async function persistDraft() {
    const token = getAccessToken();
    if (!token || !view?.editable) return;
    if (!saveKeyRef.current) saveKeyRef.current = newCommandKey(`prep-${planId}`);
    setStatus('saving');
    setMessage('');
    try {
      const row = await saveMenA1WeekPrep(token, territory, planId, {
        weekStart: view.weekStart,
        commandKey: saveKeyRef.current,
        payload: { priorities, primaryId: primaryId ?? priorities[0]?.id ?? null, prepConfirmedAt: null },
      });
      setView(row);
      setStatus('saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar. Tu texto sigue aquí.');
      setStatus('error');
    }
  }

  async function confirmPrep() {
    const token = getAccessToken();
    if (!token || !view?.editable) return;
    setStatus('saving');
    setMessage('');
    try {
      await saveMenA1WeekPrep(token, territory, planId, {
        weekStart: view.weekStart,
        commandKey: saveKeyRef.current ?? newCommandKey(`prep-${planId}`),
        payload: { priorities, primaryId: primaryId ?? priorities[0]?.id ?? null, prepConfirmedAt: null },
      });
      const row = await confirmMenA1WeekPrep(token, territory, planId, {
        weekStart: view.weekStart,
        commandKey: newCommandKey(`prep-confirm-${planId}`),
      });
      setView(row);
      setPhase('summary');
      setStatus('saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo confirmar.');
      setStatus('error');
    }
  }

  if (!view) {
    return (
      <div className="mk-plans-wrap" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /></div>
      </div>
    );
  }

  const max = view.maxPriorities;
  const weekEnd = addDays(view.weekStart, 6);
  const loadSummary = view.load
    ? `${view.load.weeklyMinutes} min esta semana · ${view.load.occasionsPerWeek ?? 1} ${(view.load.occasionsPerWeek ?? 1) === 1 ? 'ocasión' : 'ocasiones'}`
    : null;

  return (
    <div className="mk-plans-wrap mk-prep-wrap">
      <header className="mk-plans-head">
        <h1 className="mk-plans-head__title">Prepara tus prioridades</h1>
        <p className="mk-mx-next__body">Elige qué quieres dejar avanzado esta semana.</p>
        <p className="mk-mx-next__meta">{formatWeekRange(view.weekStart, weekEnd)}</p>
        {loadSummary ? <p className="mk-mx-next__meta">{loadSummary}</p> : null}
        {view.weekClosed ? <p role="status" className="mk-mx-next__body">Semana cerrada. Lo acordado queda como referencia.</p> : null}
        {status === 'saving' ? <p aria-live="polite">Guardando.</p> : null}
        {status === 'saved' ? <p aria-live="polite">Borrador guardado.</p> : null}
        {status === 'error' && message ? <p role="alert">{message}</p> : null}
      </header>

      <details className="mk-prep-context">
        <summary className="mk-mx__textlink">Resultado buscado y cuidados</summary>
        <div className="mk-prep-context__body">
          <p className="mk-mx-next__body">{view.seeks}</p>
          {view.focusText ? <p className="mk-mx-next__meta">Meta: {view.focusText}</p> : null}
          {view.protectNote ? <p className="mk-mx-next__meta">Cuidar: {view.protectNote}</p> : null}
        </div>
      </details>

      {phase === 'edit' && view.editable ? (
        <>
          <section aria-label="Prioridades" className="mk-prep-priorities">
            {priorities.slice(0, max).map((row, index) => {
              const open = expanded[row.id] ?? index === 0;
              return (
                <div key={row.id} className="mk-mx-surface mk-prep-priority">
                  <button
                    type="button"
                    className="mk-prep-priority__toggle"
                    aria-expanded={open}
                    onClick={() => setExpanded({ ...expanded, [row.id]: !open })}
                  >
                    {max === 1 ? 'Tu prioridad' : `Prioridad ${index + 1}`}
                    {primaryId === row.id && max > 1 ? ' (principal)' : ''}
                  </button>
                  {open ? (
                    <div className="mk-prep-priority__fields">
                      <label className="mk-week-field">
                        ¿Qué quieres dejar avanzado?
                        <textarea value={row.advance} onChange={(e) => updateRow(row.id, 'advance', e.target.value)} rows={2} />
                      </label>
                      <label className="mk-week-field">
                        ¿Cómo reconocerás ese avance?
                        <textarea value={row.recognize} onChange={(e) => updateRow(row.id, 'recognize', e.target.value)} rows={2} />
                      </label>
                      <label className="mk-week-field">
                        ¿Cuál es el siguiente paso?
                        <textarea value={row.nextStep} onChange={(e) => updateRow(row.id, 'nextStep', e.target.value)} rows={2} />
                      </label>
                      {max > 1 ? (
                        <label className="mk-week-field mk-week-field--row">
                          <input
                            type="radio"
                            name="primary"
                            checked={primaryId === row.id}
                            onChange={() => setPrimaryId(row.id)}
                          />
                          Prioridad principal
                        </label>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mk-mx-next__meta">{row.advance.trim() || 'Sin texto todavía'}</p>
                  )}
                </div>
              );
            })}
            {max > 1 && priorities.length < max ? (
              <button type="button" className="mk-mx__action" onClick={() => {
                const row = emptyPriority();
                setPriorities([...priorities, row]);
                setExpanded({ ...expanded, [row.id]: true });
              }}>
                Añadir prioridad
              </button>
            ) : null}
          </section>
          <div className="mk-week-task__actions">
            <button type="button" className="mk-mx__action" disabled={status === 'saving'} onClick={() => void persistDraft()}>
              Guardar borrador
            </button>
            <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={status === 'saving'} onClick={() => setPhase('check')}>
              Revisar viabilidad
            </button>
          </div>
        </>
      ) : null}

      {phase === 'check' && view.editable ? (
        <section className="mk-mx-surface mk-plans-block" aria-label="Comprobación de viabilidad">
          <p className="mk-mx-next__body">Revisa que encaje con la carga acordada. No cambiamos la programación del plan desde aquí.</p>
          <ul className="mk-week-prep-list">
            {priorities.filter((row) => row.advance.trim()).map((row) => (
              <li key={row.id} className="mk-week-prep-list__item">
                <p className="mk-week-review-block__body">{row.advance}</p>
                <p className="mk-mx-next__meta">Paso: {row.nextStep.trim() || 'sin paso escrito'}</p>
              </li>
            ))}
          </ul>
          <div className="mk-week-task__actions">
            <button type="button" className="mk-mx__action" onClick={() => setPhase('edit')}>Ajustar prioridades</button>
            <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={status === 'saving'} onClick={() => void confirmPrep()}>
              Confirmar preparación
            </button>
          </div>
          <p className="mk-mx-next__meta">Confirmar no marca la acción como hecha ni el resultado como conseguido.</p>
        </section>
      ) : null}

      {(phase === 'summary' || !view.editable) ? (
        <section className="mk-mx-surface mk-plans-block" aria-label="Resumen">
          <h2 className="mk-mx-section-title">Preparación confirmada</h2>
          <ul className="mk-week-prep-list">
            {view.prep.priorities.filter((row) => row.advance.trim()).map((row) => (
              <li key={row.id} className="mk-week-prep-list__item">
                <p className="mk-week-review-block__body">
                  {row.advance}
                  {view.prep.primaryId === row.id ? ' (principal)' : ''}
                </p>
                <p className="mk-mx-next__meta">Reconocerás: {row.recognize}. Paso: {row.nextStep}.</p>
              </li>
            ))}
          </ul>
          <Link className="mk-mx__action mk-mx__action--primary" href={`/semana?planId=${planId}`}>
            Volver a mi semana
          </Link>
        </section>
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { closeWeek, previewWeek, type CalendarPayload } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';
import { reviewGuidance } from '@/lib/review-guidance';
import { addDays } from '@/lib/week-screen';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function futureOccasions(from: string, weekday: number, intervalDays: number): string[] {
  if (!from) return [];
  const dates: string[] = [];
  for (let offset = 0; offset < 21; offset += 1) {
    const date = addDays(from, offset);
    const [y, m, d] = date.split('-').map(Number);
    if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === weekday) dates.push(date);
  }
  const every = Math.max(1, Math.round(Math.max(7, intervalDays) / 7));
  return dates.filter((_, index) => index % every === 0);
}

type Plan = CalendarPayload['plans'][number];

export function LegacyCalendarWeekReview({
  plans,
  viewedWeek,
  weekClosed,
  liveActions,
  pausedActions,
  onClosed,
}: {
  plans: Plan[];
  viewedWeek: string;
  weekClosed: boolean;
  liveActions: Plan['actions'];
  pausedActions: Plan['actions'];
  onClosed: () => void;
}) {
  const [note, setNote] = useState('');
  const [decisions, setDecisions] = useState<Record<string, 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE'>>({});
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});
  const [strategies, setStrategies] = useState<Record<string, string>>({});
  const [weekdays, setWeekdays] = useState<Record<string, string>>({});
  const [intervals, setIntervals] = useState<Record<string, string>>({});
  const [result, setResult] = useState<'MOVED' | 'STUCK' | 'UNKNOWN'>('UNKNOWN');
  const [preview, setPreview] = useState<string[]>([]);
  const [bodyCareLow, setBodyCareLow] = useState(false);
  const [directionChanged, setDirectionChanged] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const doneCount = liveActions.filter((action) => action.active !== false).length;

  function reviewBody() {
    const next: Record<string, { title?: string; weekday?: number; intervalDays?: number }> = {};
    for (const [id, decision] of Object.entries(decisions)) {
      if (decision === 'KEEP' || decision === 'PAUSE' || decision === 'CLOSE' || decision === 'RESUME') continue;
      const weekday = weekdays[id] === '' || weekdays[id] == null ? undefined : Number(weekdays[id]);
      const intervalDays = intervals[id] ? Number(intervals[id]) : undefined;
      next[id] = {
        ...(decision === 'SUBSTITUTE' ? { title: strategies[id] ?? '' } : {}),
        ...(weekday == null || Number.isNaN(weekday) ? {} : { weekday }),
        ...(intervalDays == null || Number.isNaN(intervalDays) ? {} : { intervalDays }),
      };
    }
    return next;
  }

  function planOutcomes() {
    const next: Record<string, string> = {};
    for (const [id, value] of Object.entries(outcomes)) {
      if (value.trim()) next[id] = value.trim();
    }
    return next;
  }

  const guidance = reviewGuidance({
    done: doneCount,
    applicable: liveActions.length,
    result,
    alignmentLow: false,
    bodyCareLow,
    directionChanged,
  });

  async function showEffect() {
    const token = getAccessToken();
    if (!token || !viewedWeek) return;
    setError('');
    try {
      const row = await previewWeek(token, viewedWeek, note, decisions, reviewBody(), planOutcomes());
      setPreview([...row.effects.map((effect) => effect.summary), ...(row.plans ?? []).map((plan) => plan.summary)]);
    } catch (err) {
      setPreview([]);
      setError(err instanceof Error ? err.message : 'No se pudo ver el efecto.');
    }
  }

  async function close() {
    const token = getAccessToken();
    if (!token || !viewedWeek || saving || preview.length === 0) return;
    setError('');
    setSaving(true);
    try {
      await closeWeek(token, viewedWeek, note, decisions, reviewBody(), planOutcomes());
      setPreview([]);
      onClosed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la semana.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mk-mx-surface mk-week-review-plan" aria-label="Revisión del plan">
      <header className="mk-week-review-plan__head">
        <h2 className="mk-mx-section-title">{plans.map((p) => p.title).join(', ')}</h2>
      </header>
      <div className="mk-week-review-section">
        <h3 className="mk-week-review-section__title">Qué conviene hacer</h3>
        {plans.map((plan) => (
          <label key={plan.id} className="mk-week-field">
            Resultado observable a partir de ahora
            <textarea
              aria-label={`Resultado futuro de ${plan.title}`}
              value={outcomes[plan.id] ?? ''}
              rows={2}
              disabled={weekClosed}
              onChange={(event) => { setPreview([]); setOutcomes({ ...outcomes, [plan.id]: event.target.value }); }}
            />
          </label>
        ))}
        {[...liveActions, ...pausedActions].map((action) => (
          <label key={action.id} className="mk-week-field">
            {action.title}
            <select
              aria-label={`Decisión para ${action.title}`}
              value={decisions[action.id] ?? 'KEEP'}
              disabled={weekClosed}
              onChange={(event) => {
                setPreview([]);
                setDecisions({ ...decisions, [action.id]: event.target.value as 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE' });
              }}
            >
              <option value="KEEP">{action.pausedAt ? 'Seguir en pausa' : 'Mantener'}</option>
              <option value="REDUCE">Reducir frecuencia o día</option>
              <option value="SUBSTITUTE">Sustituir</option>
              <option value="PAUSE">Pausar</option>
              {action.pausedAt ? <option value="RESUME">Reanudar</option> : null}
              <option value="CLOSE">Cerrar</option>
            </select>
            {decisions[action.id] === 'REDUCE' ? (
              <>
                <select
                  aria-label={`Frecuencia futura de ${action.title}`}
                  value={intervals[action.id] ?? ''}
                  onChange={(event) => { setPreview([]); setIntervals({ ...intervals, [action.id]: event.target.value }); }}
                >
                  <option value="">Misma frecuencia</option>
                  <option value="14">Cada 14 días</option>
                  <option value="21">Cada 21 días</option>
                </select>
                <select
                  aria-label={`Día futuro de ${action.title}`}
                  value={weekdays[action.id] ?? ''}
                  onChange={(event) => { setPreview([]); setWeekdays({ ...weekdays, [action.id]: event.target.value }); }}
                >
                  <option value="">Mismo día</option>
                  {WEEKDAYS.map((label, index) => <option key={label} value={String(index)}>{label}</option>)}
                </select>
              </>
            ) : null}
            {decisions[action.id] === 'SUBSTITUTE' ? (
              <input
                aria-label={`Estrategia nueva de ${action.title}`}
                value={strategies[action.id] ?? ''}
                placeholder="Estrategia nueva"
                onChange={(event) => { setPreview([]); setStrategies({ ...strategies, [action.id]: event.target.value }); }}
              />
            ) : null}
          </label>
        ))}
        <label className="mk-week-field">
          Qué pasó con el resultado
          <select value={result} disabled={weekClosed} onChange={(event) => setResult(event.target.value as 'MOVED' | 'STUCK' | 'UNKNOWN')}>
            <option value="UNKNOWN">No lo sé</option>
            <option value="MOVED">Se movió</option>
            <option value="STUCK">Se estancó</option>
          </select>
        </label>
        <label className="mk-week-field">
          <input type="checkbox" checked={bodyCareLow} disabled={weekClosed} onChange={(event) => setBodyCareLow(event.target.checked)} />
          El cuidado del cuerpo no alcanzó
        </label>
        <label className="mk-week-field">
          <input type="checkbox" checked={directionChanged} disabled={weekClosed} onChange={(event) => setDirectionChanged(event.target.checked)} />
          Cambió la dirección o se cayó una hipótesis
        </label>
        {guidance ? (
          <div>
            <p className="mk-mx-next__body">{guidance.prompt}</p>
            <p className="mk-mx-next__meta">Puedes elegir: {guidance.options.join(', ')}.</p>
          </div>
        ) : null}
        <label className="mk-week-field">
          Nota
          <textarea value={note} rows={3} onChange={(event) => setNote(event.target.value)} disabled={weekClosed} />
        </label>
        {preview.length ? (
          <ul className="mk-week-apply__list">
            {preview.map((line) => <li key={line}>{line}</li>)}
          </ul>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
        <div className="mk-week-task__actions">
          <button type="button" className="mk-mx__action" onClick={showEffect} disabled={weekClosed || saving}>
            Ver efecto
          </button>
          <button type="button" className="mk-mx__action mk-mx__action--primary" onClick={close} disabled={weekClosed || saving || preview.length === 0}>
            {weekClosed ? 'Semana cerrada' : saving ? 'Guardando' : 'Aplicar'}
          </button>
        </div>
      </div>
    </section>
  );
}

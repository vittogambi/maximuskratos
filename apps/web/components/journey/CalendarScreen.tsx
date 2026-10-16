'use client';

import { useEffect, useState } from 'react';
import { closeWeek, formatAlignmentDate, formatAlignmentValue, journeyCalendar, journeyState, journeyWeeks, previewWeek, saveRecord, type AlignmentReading, type CalendarPayload, type IndexCard } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';
import { reviewGuidance } from '@/lib/review-guidance';
import { TaskRow } from './TaskRow';
import { IndexSummary } from './IndexSummary';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function frozenActions(snapshot: unknown): { id: string; title: string; doneWhen: string; weekday: number | null; intervalDays: number; records: { day: string; status: string; resultNote: string | null }[] }[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const plans = (snapshot as { plans?: unknown }).plans;
  if (!Array.isArray(plans)) return [];
  return plans.flatMap((plan) => {
    const actions = (plan as { actions?: unknown }).actions;
    if (!Array.isArray(actions)) return [];
    return actions.flatMap((action) => {
      const row = action as { id?: unknown; title?: unknown; doneWhen?: unknown; weekday?: unknown; intervalDays?: unknown; records?: unknown };
      if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.doneWhen !== 'string') return [];
      const records = Array.isArray(row.records) ? row.records.flatMap((item) => {
        const record = item as { day?: unknown; status?: unknown; resultNote?: unknown };
        if (typeof record.day !== 'string' || typeof record.status !== 'string') return [];
        return [{ day: record.day, status: record.status, resultNote: typeof record.resultNote === 'string' ? record.resultNote : null }];
      }) : [];
      return [{
        id: row.id,
        title: row.title,
        doneWhen: row.doneWhen,
        weekday: typeof row.weekday === 'number' ? row.weekday : null,
        intervalDays: typeof row.intervalDays === 'number' ? row.intervalDays : 7,
        records,
      }];
    });
  });
}

function snapshotOutcomes(snapshot: unknown): { id: string; outcome: string }[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const plans = (snapshot as { plans?: unknown }).plans;
  if (!Array.isArray(plans)) return [];
  return plans.flatMap((plan) => {
    const row = plan as { id?: unknown; outcome?: unknown };
    if (typeof row.id !== 'string' || typeof row.outcome !== 'string' || !row.outcome.trim()) return [];
    return [{ id: row.id, outcome: row.outcome }];
  });
}

function futureOccasions(from: string, weekday: number, intervalDays: number): string[] {
  if (!from) return [];
  const dates: string[] = [];
  for (let offset = 0; offset < 21; offset += 1) {
    const date = addDays(from, offset);
    if (civil(date).getUTCDay() === weekday) dates.push(date);
  }
  const every = Math.max(1, Math.round(Math.max(7, intervalDays) / 7));
  return dates.filter((_, index) => index % every === 0);
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function civil(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDay(iso: string): string {
  // Date-only civil values. UTC keeps the browser zone from shifting the day.
  return String(civil(iso).getUTCDate());
}

function formatRange(start: string, end: string): string {
  const a = civil(start);
  const b = civil(end);
  return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} a ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]}`;
}

function weekdayLabel(iso: string): string {
  return WEEKDAYS[civil(iso).getUTCDay()];
}

function pillar(domain: string | null): string | null {
  if (domain === 'MENTE') return 'Mente';
  if (domain === 'ESPIRITU') return 'Espíritu';
  if (domain === 'CUERPO') return 'Cuerpo';
  return null;
}

export function CalendarScreen() {
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [weeks, setWeeks] = useState<{ id: string; weekStart: string; note: string | null; snapshot: unknown }[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE'>>({});
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});
  const [strategies, setStrategies] = useState<Record<string, string>>({});
  const [weekdays, setWeekdays] = useState<Record<string, string>>({});
  const [intervals, setIntervals] = useState<Record<string, string>>({});
  const [result, setResult] = useState<'MOVED' | 'STUCK' | 'UNKNOWN'>('UNKNOWN');
  const [resultNotes, setResultNotes] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string[]>([]);
  const [alignment, setAlignment] = useState<AlignmentReading | null>(null);
  const [indexes, setIndexes] = useState<{ alignment: IndexCard | null; depth: IndexCard | null } | null>(null);
  const [alignmentFailed, setAlignmentFailed] = useState(false);
  const [alignmentLow, setAlignmentLow] = useState(false);
  const [bodyCareLow, setBodyCareLow] = useState(false);
  const [directionChanged, setDirectionChanged] = useState(false);

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

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const [calendar, history, state] = await Promise.all([
      journeyCalendar(token),
      journeyWeeks(token),
      journeyState(token).then((row) => ({ failed: false, alignment: row.alignment, indexes: row.indexes ?? null })).catch(() => ({ failed: true, alignment: null, indexes: null })),
    ]);
    setData(calendar);
    setWeeks(history);
    setAlignment(state.alignment);
    setIndexes(state.indexes);
    setAlignmentFailed(state.failed);
  }

  useEffect(() => { void load().catch((err: Error) => setError(err.message)); }, []);

  const currentWeek = data?.weekStart ?? '';
  const viewedWeek = currentWeek ? addDays(currentWeek, offset * 7) : '';
  const days = viewedWeek ? Array.from({ length: 7 }, (_, index) => addDays(viewedWeek, index)) : [];
  const selected = day && days.includes(day) ? day : viewedWeek;
  const closedWeek = weeks.find((week) => week.weekStart === viewedWeek);
  const weekClosed = Boolean(closedWeek);
  const activePlans = data?.plans.filter((plan) => plan.status === 'ACTIVE') ?? [];
  const liveActions = activePlans.flatMap((plan) => plan.actions).filter((action) => action.active !== false && !action.pausedAt);
  const pausedActions = activePlans.flatMap((plan) => plan.actions).filter((action) => action.active !== false && action.pausedAt);
  const frozen = weekClosed ? frozenActions(closedWeek?.snapshot) : [];
  const doneCount = liveActions.filter((action) => data?.records.some((record) => (
    record.actionId === action.id && record.status === 'DONE' && days.includes(record.day)
  ))).length;
  const guidance = reviewGuidance({
    done: doneCount,
    applicable: liveActions.length,
    result,
    alignmentLow,
    bodyCareLow,
    directionChanged,
  });
  const actions = frozen.length
    ? frozen.map((action) => ({
        ...action,
        domain: null as string | null,
        pausedAt: null,
        intervalDays: action.intervalDays,
      }))
    : liveActions;

  async function mark(actionId: string, status: 'DONE' | 'SKIPPED' | 'NOT_APPLICABLE' | 'PENDING') {
    const token = getAccessToken();
    if (!token || !selected || saving) return;
    setError('');
    setSaving(true);
    try {
      await saveRecord(token, { actionId, day: selected, status, resultNote: resultNotes[actionId] });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar.');
    } finally {
      setSaving(false);
    }
  }

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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la semana.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mk-dashboard mk-cal">
      <header className="mk-cal__head">
        <div>
          <p className="mk-section-eyebrow">Calendario</p>
          <h1 className="mk-page-title">{viewedWeek ? formatRange(viewedWeek, addDays(viewedWeek, 6)) : 'Cargando'}</h1>
        </div>
        <div className="mk-cal__nav">
          <button type="button" onClick={() => { setOffset((value) => value - 1); setDay(null); }}>Anterior</button>
          <button type="button" onClick={() => { setOffset(0); setDay(null); }}>Hoy</button>
          <button type="button" onClick={() => { setOffset((value) => value + 1); setDay(null); }}>Siguiente</button>
        </div>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      <div className="mk-week" role="group" aria-label="Días de la semana">
        {days.map((date) => (
          <button
            key={date}
            type="button"
            className={date === selected ? 'mk-week__day is-selected' : 'mk-week__day'}
            aria-pressed={date === selected}
            onClick={() => setDay(date)}
          >
            <span>{weekdayLabel(date)}</span>
            <strong>{formatDay(date)}</strong>
          </button>
        ))}
      </div>
      <div className="mk-cal__work">
        <section>
          {weekClosed ? <p>Esta semana conserva el criterio con el que se cerró.</p> : null}
          {weekClosed
            ? snapshotOutcomes(closedWeek?.snapshot).map((item) => <p key={item.id}>Resultado de esa semana: {item.outcome}</p>)
            : activePlans.map((plan) => <p key={plan.id}>Resultado vigente: {plan.outcome}</p>)}
          {actions.length === 0 ? <p>No hay tareas vigentes en esta cuenta.</p> : null}
          {actions.map((action) => {
            const live = data?.records.find((item) => item.actionId === action.id && item.day === selected);
            const frozenRecord = 'records' in action ? action.records.find((item) => item.day === selected) : undefined;
            const record = weekClosed ? frozenRecord : live;
            return (
              <TaskRow
                key={action.id}
                title={action.title}
                detail={action.doneWhen}
                pillar={pillar(action.domain)}
                status={record?.status ?? null}
                resultNote={record && 'resultNote' in record ? record.resultNote : null}
                disabled={weekClosed || saving}
                disabledReason={weekClosed ? 'Esta semana ya está cerrada. El registro no se reescribe.' : 'Guardando.'}
                onStatus={(status) => mark(action.id, status)}
                onResult={(text) => setResultNotes({ ...resultNotes, [action.id]: text })}
              />
            );
          })}
        </section>
        {offset <= 0 ? (
          <aside className="mk-review">
            <h2>Revisión de la semana</h2>
            <p>Primero se muestra el efecto. Aplicar escribe el futuro. El registro ya hecho y la ficha de alineación no se reescriben.</p>
            {activePlans.map((plan) => (
              <label key={plan.id}>
                Resultado observable a partir de ahora, para {plan.title}
                <textarea
                  aria-label={`Resultado futuro de ${plan.title}`}
                  value={outcomes[plan.id] ?? ''}
                  rows={2}
                  disabled={weekClosed}
                  onChange={(event) => { setPreview([]); setOutcomes({ ...outcomes, [plan.id]: event.target.value }); }}
                />
              </label>
            ))}
            <p>Si lo dejas vacío, el resultado del plan sigue. Si escribes otro, el futuro usa ese y esta semana conserva el anterior.</p>
            <IndexSummary alignment={indexes?.alignment} depth={indexes?.depth} />
            {alignmentFailed ? <p>No se pudo leer la ficha.</p> : alignment ? (
              <p>
                Alineación declarada: {alignment.status === 'saved' && alignment.total != null ? formatAlignmentValue(alignment.total) : 'sin total'}.
                Cobertura {alignment.coverage.answered} de {alignment.coverage.required}.
                {alignment.savedAt ? ` ${formatAlignmentDate(alignment.savedAt)}.` : ''}
                {alignment.revision != null ? ` Revisión ${alignment.revision}.` : ''}
              </p>
            ) : <p>Sin ficha guardada.</p>}
            {(weekClosed ? actions : [...liveActions, ...pausedActions]).map((action) => (
              <label key={action.id}>
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
                {!weekClosed && action.weekday != null ? (
                  <p>
                    Ocasiones en 21 días: {futureOccasions(viewedWeek, action.weekday, action.intervalDays ?? 7).join(', ') || 'ninguna en esta ventana'}.
                    Un día sin registro no cuenta como incumplimiento.
                  </p>
                ) : null}
                {!weekClosed && action.weekday == null ? <p>Sin día fijo. No se fabrican ocasiones atrasadas.</p> : null}
              </label>
            ))}
            <label>
              Qué pasó con el resultado
              <select value={result} disabled={weekClosed} onChange={(event) => setResult(event.target.value as 'MOVED' | 'STUCK' | 'UNKNOWN')}>
                <option value="UNKNOWN">No lo sé</option>
                <option value="MOVED">Se movió</option>
                <option value="STUCK">Se estancó</option>
              </select>
            </label>
            <label><input type="checkbox" checked={alignmentLow} disabled={weekClosed} onChange={(event) => setAlignmentLow(event.target.checked)} /> La alineación que declaro quedó baja</label>
            <label><input type="checkbox" checked={bodyCareLow} disabled={weekClosed} onChange={(event) => setBodyCareLow(event.target.checked)} /> El cuidado del cuerpo no alcanzó</label>
            <label><input type="checkbox" checked={directionChanged} disabled={weekClosed} onChange={(event) => setDirectionChanged(event.target.checked)} /> Cambió la dirección o se cayó una hipótesis</label>
            {guidance ? (
              <div>
                <p>{guidance.prompt}</p>
                <p>Puedes elegir: {guidance.options.join(', ')}. Nada de esto se aplica solo.</p>
              </div>
            ) : null}
            <label>
              Nota
              <textarea value={note} rows={3} onChange={(event) => setNote(event.target.value)} disabled={weekClosed} />
            </label>
            {preview.length ? <ul>{preview.map((line) => <li key={line}>{line}</li>)}</ul> : null}
            <button type="button" className="mk-member-btn" onClick={showEffect} disabled={weekClosed || saving}>Ver efecto</button>
            <button type="button" className="mk-member-btn" onClick={close} disabled={weekClosed || saving || preview.length === 0}>
              {weekClosed ? 'Esta semana ya está cerrada' : saving ? 'Guardando' : 'Aplicar'}
            </button>
            {data?.timezone ? <p className="mk-cal__zone">Zona {data.timezone}</p> : null}
          </aside>
        ) : null}
      </div>
      {weeks.length > 0 ? (
        <section>
          <h2 className="mk-page-title mk-page-title--sm">Semanas cerradas</h2>
          <ul>
            {weeks.map((week) => (
              <li key={week.id}>{formatRange(week.weekStart, addDays(week.weekStart, 6))}. {week.note || 'Sin nota.'}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { ActionAddition, ActionChange, ActionOp, ContentMark, ReviewActionRow } from '@/lib/intervention-api';
import { actionScheduleLabel, changeLine, opsFor, weekLabel, weekLine, weekOptions } from '@/lib/action-review';
import { MARK_LABELS } from '@/lib/plan-design';

type Props = {
  actions: ReviewActionRow[];
  nextWeek: string;
  marks: ContentMark[];
  alternate: { action: string; doneWhen: string } | null;
  changes: Record<string, ActionChange>;
  onChanges: (next: Record<string, ActionChange>) => void;
  additions: ActionAddition[];
  onAdditions: (next: ActionAddition[]) => void;
};

function numberOf(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Marks({ marks, value, onChange }: { marks: ContentMark[]; value: string[]; onChange: (next: string[]) => void }) {
  if (!marks.length) return null;
  return (
    <fieldset className="mk-ar-marks">
      <legend>¿Incluye algo de esto?</legend>
      {marks.map((mark) => (
        <label key={mark} className="mk-ds-check">
          <input type="checkbox" checked={value.includes(mark)} onChange={(event) => onChange(event.target.checked ? [...value, mark] : value.filter((tag) => tag !== mark))} />
          {MARK_LABELS[mark]}
        </label>
      ))}
    </fieldset>
  );
}

function ScheduleFields({
  value,
  row,
  nextWeek,
  allowTrigger,
  onChange,
}: {
  value: { kind: 'WEEKLY' | 'ONCE'; occasionsPerWeek: number; weekStart: string; minutes: number };
  row?: ReviewActionRow;
  nextWeek: string;
  allowTrigger?: boolean;
  onChange: (next: { kind: 'WEEKLY' | 'ONCE'; occasionsPerWeek: number; weekStart: string; minutes: number }) => void;
}) {
  return (
    <>
      {allowTrigger ? null : (
        <div className="mk-ar-kind" role="radiogroup" aria-label="Cómo se repite">
          <label className="mk-ds-check">
            <input type="radio" checked={value.kind === 'WEEKLY'} onChange={() => onChange({ ...value, kind: 'WEEKLY' })} />
            Cada semana
          </label>
          <label className="mk-ds-check">
            <input type="radio" checked={value.kind === 'ONCE'} onChange={() => onChange({ ...value, kind: 'ONCE' })} />
            Una vez
          </label>
        </div>
      )}
      <div className="mk-dp-row">
        {!allowTrigger && value.kind === 'WEEKLY' ? (
          <label className="mk-ds-field">
            Veces por semana
            <select value={value.occasionsPerWeek} onChange={(event) => onChange({ ...value, occasionsPerWeek: Number(event.target.value) })}>
              {Array.from({ length: 7 }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        ) : null}
        {!allowTrigger && value.kind === 'ONCE' ? (
          <label className="mk-ds-field">
            ¿En qué semana?
            <select value={value.weekStart} onChange={(event) => onChange({ ...value, weekStart: event.target.value })}>
              {weekOptions(nextWeek).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ) : null}
        <label className="mk-ds-field">
          Minutos cada vez
          <input inputMode="numeric" value={String(value.minutes)} onChange={(event) => onChange({ ...value, minutes: numberOf(event.target.value, 0) })} />
        </label>
      </div>
      {row?.kind === 'ONCE' && row.onceWeekStart && value.kind === 'ONCE' && value.weekStart !== row.onceWeekStart ? (
        <p className="mk-m-muted">Estaba prevista para la {weekLabel(row.onceWeekStart)}. Los registros de esa semana no cambiarán.</p>
      ) : null}
    </>
  );
}

function defaultsFor(row: ReviewActionRow, nextWeek: string) {
  return {
    kind: (row.kind === 'ONCE' ? 'ONCE' : 'WEEKLY') as 'WEEKLY' | 'ONCE',
    occasionsPerWeek: row.occasionsPerWeek ?? 1,
    weekStart: row.onceWeekStart && row.onceWeekStart >= nextWeek ? row.onceWeekStart : nextWeek,
    minutes: row.minutesPerOccasion ?? 15,
  };
}

function ActionCard({
  row,
  nextWeek,
  marks,
  alternate,
  change,
  onChange,
}: {
  row: ReviewActionRow;
  nextWeek: string;
  marks: ContentMark[];
  alternate: Props['alternate'];
  change: ActionChange | undefined;
  onChange: (next: ActionChange | undefined) => void;
}) {
  const [open, setOpen] = useState(row.needsDecision);
  const op: ActionOp = change?.op ?? 'KEEP';
  const base = defaultsFor(row, nextWeek);
  const [schedule, setSchedule] = useState(base);
  const id = `mk-ar-${row.id}`;
  const trigger = row.kind === 'TRIGGER';

  function pick(next: ActionOp) {
    if (next === 'KEEP') return onChange(undefined);
    if (next === 'REDUCE') {
      return onChange({
        actionId: row.id,
        op: next,
        ...(row.kind === 'WEEKLY' && (row.occasionsPerWeek ?? 1) > 1 ? { occasionsPerWeek: (row.occasionsPerWeek ?? 1) - 1 } : { minutesPerOccasion: Math.max(1, Math.floor((row.minutesPerOccasion ?? 10) / 2)) }),
      });
    }
    if (next === 'RESCHEDULE') return onChange({ actionId: row.id, op: next, schedule: { kind: 'ONCE', weekStart: base.weekStart } });
    if (next === 'RETIRE') return onChange({ actionId: row.id, op: next, reason: '' });
    if (next === 'SUBSTITUTE') {
      setSchedule(base);
      return onChange({ actionId: row.id, op: next, title: '', doneWhen: '', minutesPerOccasion: base.minutes, ...(trigger ? {} : { schedule: base.kind === 'ONCE' ? { kind: 'ONCE', weekStart: base.weekStart } : { kind: 'WEEKLY', occasionsPerWeek: base.occasionsPerWeek } }) });
    }
    setSchedule(base);
    return onChange({
      actionId: row.id,
      op: next,
      title: row.title,
      doneWhen: row.doneWhen,
      cue: row.cue,
      minimum: row.minimumVersion,
      ...(row.kind === 'ONCE' ? { schedule: { kind: 'ONCE', weekStart: base.weekStart } } : {}),
    });
  }

  function withSchedule(next: typeof schedule) {
    setSchedule(next);
    if (!change) return;
    onChange({
      ...change,
      minutesPerOccasion: next.minutes,
      ...(trigger ? {} : { schedule: next.kind === 'ONCE' ? { kind: 'ONCE', weekStart: next.weekStart } : { kind: 'WEEKLY', occasionsPerWeek: next.occasionsPerWeek } }),
    });
  }

  return (
    <li className={row.needsDecision && op === 'KEEP' ? 'mk-ar-action is-pending' : 'mk-ar-action'}>
      <p className="mk-ar-action__title">{row.title}</p>
      <p className="mk-m-muted">{actionScheduleLabel(row)}{row.cue ? `. ${row.cue}` : ''}</p>
      {row.needsDecision ? <p className="mk-ar-action__week">{weekLine(row)}</p> : null}
      {row.needsDecision ? <p className="mk-ds-need">Esta tarea no tiene una semana futura. Decide si la reprogramas, la cambias o la descartas.</p> : null}
      <p className="mk-ar-action__decision"><strong>Ajuste elegido:</strong> {changeLine(row, change)}</p>
      <button type="button" className="mk-mx__action" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        {open ? 'Ver resumen' : op === 'KEEP' ? 'Ajustar esta acción' : 'Revisar el ajuste'}
      </button>
      {open ? (
        <div id={id} className="mk-ar-editor">
          <fieldset className="mk-ds-choices">
            <legend className="mk-dp-legend">¿Qué quieres hacer con esta acción?</legend>
            {opsFor(row).map((item) => (
              <label key={item.op} className={op === item.op ? 'is-selected' : undefined}>
                <input type="radio" name={`${id}-op`} checked={op === item.op} onChange={() => pick(item.op)} />
                <span><strong>{item.label}</strong><small>{item.help}</small></span>
              </label>
            ))}
          </fieldset>

          {change?.op === 'REDUCE' ? (
            <div className="mk-dp-row">
              {row.kind === 'WEEKLY' ? (
                <label className="mk-ds-field">
                  Veces por semana
                  <select value={change.occasionsPerWeek ?? row.occasionsPerWeek ?? 1} onChange={(event) => onChange({ ...change, occasionsPerWeek: Number(event.target.value) })}>
                    {Array.from({ length: row.occasionsPerWeek ?? 1 }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              ) : null}
              <label className="mk-ds-field">
                Minutos cada vez
                <input inputMode="numeric" value={String(change.minutesPerOccasion ?? row.minutesPerOccasion ?? '')} onChange={(event) => onChange({ ...change, minutesPerOccasion: numberOf(event.target.value, 0) })} />
              </label>
            </div>
          ) : null}

          {change?.op === 'RESCHEDULE' && change.schedule?.kind === 'ONCE' ? (
            <label className="mk-ds-field">
              ¿A qué semana pasa?
              <select value={change.schedule.weekStart} onChange={(event) => onChange({ ...change, schedule: { kind: 'ONCE', weekStart: event.target.value } })}>
                {weekOptions(nextWeek).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <small>La semana original queda como estaba, con o sin registro.</small>
            </label>
          ) : null}

          {change?.op === 'MODIFY' || change?.op === 'SUBSTITUTE' ? (
            <>
              {change.op === 'SUBSTITUTE' && alternate && row.fromTemplate ? (
                <button type="button" className="mk-mx__textlink" onClick={() => onChange({ ...change, title: alternate.action, doneWhen: alternate.doneWhen })}>
                  Usar la acción que sugiere la revisión
                </button>
              ) : null}
              <label className="mk-ds-field">
                {change.op === 'SUBSTITUTE' ? 'La acción nueva' : 'Qué harás'}
                <textarea className="mk-dp-short" rows={2} maxLength={180} value={change.title ?? ''} onChange={(event) => onChange({ ...change, title: event.target.value })} />
              </label>
              <label className="mk-ds-field">
                Cuenta como hecha cuando…
                <textarea className="mk-dp-short" rows={2} maxLength={500} value={change.doneWhen ?? ''} onChange={(event) => onChange({ ...change, doneWhen: event.target.value })} />
              </label>
              <ScheduleFields value={schedule} row={row} nextWeek={nextWeek} allowTrigger={trigger} onChange={withSchedule} />
              <label className="mk-ds-field">
                ¿Cuándo y dónde? (opcional)
                <input maxLength={200} value={change.cue ?? ''} onChange={(event) => onChange({ ...change, cue: event.target.value })} />
              </label>
              <label className="mk-ds-field">
                Versión mínima para un día difícil (opcional)
                <input maxLength={500} value={change.minimum ?? ''} onChange={(event) => onChange({ ...change, minimum: event.target.value })} />
              </label>
              {change.op === 'SUBSTITUTE' ? <Marks marks={marks} value={change.contentTags ?? []} onChange={(next) => onChange({ ...change, contentTags: next })} /> : null}
              <p className="mk-m-muted">Lo registrado hasta ahora queda en la acción anterior, con su criterio.</p>
            </>
          ) : null}

          {change?.op === 'RETIRE' ? (
            <label className="mk-ds-field">
              ¿Por qué ya no corresponde?
              <textarea className="mk-dp-short" rows={2} maxLength={300} value={change.reason ?? ''} onChange={(event) => onChange({ ...change, reason: event.target.value })} />
              <small>Queda en el historial del plan. Lo que registraste se conserva.</small>
            </label>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function AdditionEditor({ nextWeek, marks, onAdd, onCancel }: { nextWeek: string; marks: ContentMark[]; onAdd: (row: ActionAddition) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [doneWhen, setDoneWhen] = useState('');
  const [cue, setCue] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [schedule, setSchedule] = useState({ kind: 'WEEKLY' as 'WEEKLY' | 'ONCE', occasionsPerWeek: 1, weekStart: nextWeek, minutes: 15 });
  const ready = title.trim().length >= 3 && doneWhen.trim().length > 0 && schedule.minutes > 0;
  return (
    <div className="mk-ar-editor mk-ar-add">
      <label className="mk-ds-field">
        Qué harás
        <textarea className="mk-dp-short" rows={2} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="mk-ds-field">
        Cuenta como hecha cuando…
        <textarea className="mk-dp-short" rows={2} maxLength={500} value={doneWhen} onChange={(event) => setDoneWhen(event.target.value)} />
      </label>
      <ScheduleFields value={schedule} nextWeek={nextWeek} onChange={setSchedule} />
      <label className="mk-ds-field">
        ¿Cuándo y dónde? (opcional)
        <input maxLength={200} value={cue} onChange={(event) => setCue(event.target.value)} />
      </label>
      <Marks marks={marks} value={tags} onChange={setTags} />
      <div className="mk-ds-actions">
        <button
          type="button"
          className="mk-mx__action"
          disabled={!ready}
          onClick={() => onAdd({
            title: title.trim(),
            doneWhen: doneWhen.trim(),
            cue: cue.trim() || null,
            minutesPerOccasion: schedule.minutes,
            schedule: schedule.kind === 'ONCE' ? { kind: 'ONCE', weekStart: schedule.weekStart } : { kind: 'WEEKLY', occasionsPerWeek: schedule.occasionsPerWeek },
            contentTags: tags,
          })}
        >
          Sumar esta acción
        </button>
        <button type="button" className="mk-mx__textlink" onClick={onCancel}>Cancelar</button>
      </div>
      {!ready ? <p className="mk-ds-need">Describe la acción y cuándo cuenta como hecha.</p> : null}
    </div>
  );
}

export function ActionReviewPanel({ actions, nextWeek, marks, alternate, changes, onChanges, additions, onAdditions }: Props) {
  const [adding, setAdding] = useState(false);
  const decidable = actions.filter((row) => !(row.kind === 'ONCE' && row.once?.status === 'DONE'));
  const pending = decidable.filter((row) => row.needsDecision && !changes[row.id]);
  const room = actions.length - Object.values(changes).filter((row) => row.op === 'RETIRE').length + additions.length < 6;
  return (
    <section className="mk-ar" aria-label="Tus acciones">
      <h4 className="mk-ar__title">Tus acciones desde la {weekLabel(nextWeek)}</h4>
      <p className="mk-m-muted">Lo que no ajustes se mantiene. Ningún cambio toca lo que ya registraste.</p>
      {pending.length ? (
        <p className="mk-ds-need" role="status">
          {pending.length === 1
            ? pending[0]!.once?.status === 'NOT_DONE'
              ? 'Una tarea quedó marcada como no realizada.'
              : pending[0]!.once?.status === 'NO_INFORMATION'
                ? 'Una tarea quedó sin registro en su semana.'
                : 'Una tarea necesita tu decisión.'
            : `Tienes ${pending.length} tareas pendientes de revisar.`}
        </p>
      ) : null}
      <ol className="mk-ar__list">
        {decidable.map((row) => (
          <ActionCard
            key={row.id}
            row={row}
            nextWeek={nextWeek}
            marks={marks}
            alternate={alternate}
            change={changes[row.id]}
            onChange={(next) => {
              const copy = { ...changes };
              if (next) copy[row.id] = next;
              else delete copy[row.id];
              onChanges(copy);
            }}
          />
        ))}
        {additions.map((row, index) => (
          <li key={`add-${index}`} className="mk-ar-action is-new">
            <p className="mk-ar-action__title">{row.title}</p>
            <p className="mk-m-muted">
              {row.schedule.kind === 'ONCE' ? `Una vez, en la ${weekLabel(row.schedule.weekStart)}` : `${row.schedule.occasionsPerWeek ?? 1} ${row.schedule.occasionsPerWeek === 1 ? 'vez' : 'veces'} por semana`}, {row.minutesPerOccasion} minutos
            </p>
            <p className="mk-ar-action__decision"><strong>Ajuste elegido:</strong> se agrega.</p>
            <button type="button" className="mk-mx__textlink" onClick={() => onAdditions(additions.filter((_, i) => i !== index))}>Quitar</button>
          </li>
        ))}
      </ol>
      {adding ? (
        <AdditionEditor
          nextWeek={nextWeek}
          marks={marks}
          onAdd={(row) => { onAdditions([...additions, row]); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="mk-mx__action" disabled={!room} onClick={() => setAdding(true)}>Agregar una acción</button>
      )}
      {!room ? <p className="mk-ds-need">Un plan admite hasta seis acciones a la vez.</p> : null}
    </section>
  );
}

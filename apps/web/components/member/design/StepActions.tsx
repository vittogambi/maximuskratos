'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { patchDesign, type ContentMark, type DesignAction, type DesignView, type Template } from '@/lib/intervention-api';
import {
  MARK_LABELS,
  NOTHING_TO_PROTECT,
  actionsForSave,
  emptyAction,
  loadLine,
  moveItem,
  scheduleLabel,
  weeklyLoad,
  withTemplateMinimum,
} from '@/lib/plan-design';

type Props = { design: DesignView; onSaved: (view: DesignView, next?: number) => void; onBack: () => void };

const MAX_ACTIONS = 6;
const MAX_OBSTACLES = 3;

function minutes(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ActionEditor({
  action,
  index,
  count,
  horizon,
  template,
  marks,
  restricted,
  flagged,
  open,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: {
  action: DesignAction;
  index: number;
  count: number;
  horizon: number;
  template: Template | null;
  marks: ContentMark[];
  restricted: string | null;
  flagged: boolean;
  open: boolean;
  onToggle: () => void;
  onChange: (next: DesignAction) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const id = `mk-dp-action-${index}`;
  const schedule = action.schedule;
  const fromTemplate = action.source.kind === 'TEMPLATE' && template ? template : null;
  const tools = (extra?: ReactNode) => (
    <div className="mk-dp-action__tools">
      <button type="button" className="mk-mx__action" aria-expanded={open} aria-controls={`${id}-form`} onClick={onToggle}>{open ? 'Ver resumen' : 'Editar acción'}</button>
      <button type="button" className="mk-mx__action" disabled={index === 0} aria-label={`Subir la acción ${index + 1}`} onClick={() => onMove(index - 1)}>Subir</button>
      <button type="button" className="mk-mx__action" disabled={index === count - 1} aria-label={`Bajar la acción ${index + 1}`} onClick={() => onMove(index + 1)}>Bajar</button>
      {extra}
    </div>
  );
  if (!open) {
    return (
      <article className={flagged || restricted ? 'mk-dp-action is-flagged' : 'mk-dp-action'} aria-label={`Acción ${index + 1}`}>
        <p className="mk-dp-action__head">Acción {index + 1}{fromTemplate ? ', propuesta por la estrategia' : ''}</p>
        <p className="mk-dp-action__title">{action.title.trim() || 'Acción sin describir'}</p>
        <p className="mk-m-muted">{scheduleLabel(schedule)}{action.cue?.trim() ? `. ${action.cue}` : ''}</p>
        {flagged ? <p className="mk-ds-error">Falta completar esta acción.</p> : null}
        {restricted ? <p className="mk-ds-error">{restricted}</p> : null}
        {tools()}
      </article>
    );
  }
  return (
    <fieldset id={`${id}-form`} className={flagged ? 'mk-dp-action is-flagged' : 'mk-dp-action'} aria-labelledby={`${id}-legend`}>
      <legend id={`${id}-legend`} className="mk-dp-action__head">
        <span>Acción {index + 1}{fromTemplate ? ', propuesta por la estrategia' : ''}</span>
      </legend>
      <label className="mk-ds-field">
        Qué harás
        <textarea className="mk-dp-short" rows={2} value={action.title} maxLength={180} aria-invalid={flagged && action.title.trim().length < 3} onChange={(event) => onChange({ ...action, title: event.target.value })} />
      </label>

      <div className="mk-dp-schedule" role="radiogroup" aria-label={`Frecuencia de la acción ${index + 1}`}>
        <label className="mk-ds-check">
          <input
            type="radio"
            name={`${id}-kind`}
            checked={schedule.kind === 'WEEKLY'}
            onChange={() => onChange({ ...action, schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: schedule.minutesPerOccasion } })}
          />
          Cada semana
        </label>
        <label className="mk-ds-check">
          <input
            type="radio"
            name={`${id}-kind`}
            checked={schedule.kind === 'ONCE'}
            onChange={() => onChange({ ...action, schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: schedule.minutesPerOccasion } })}
          />
          Una vez
        </label>
        {action.source.kind === 'TEMPLATE' && template?.schedule.kind === 'TRIGGER' ? (
          <label className="mk-ds-check">
            <input
              type="radio"
              name={`${id}-kind`}
              checked={schedule.kind === 'TRIGGER'}
              onChange={() => onChange({ ...action, schedule: { kind: 'TRIGGER', trigger: template.schedule.kind === 'TRIGGER' ? template.schedule.trigger : '', minutesPerOccasion: schedule.minutesPerOccasion } })}
            />
            Cuando ocurra
          </label>
        ) : null}
      </div>
      <div className="mk-dp-row">
        {schedule.kind === 'WEEKLY' ? (
          <label className="mk-ds-field">
            Veces por semana
            <select value={schedule.occasionsPerWeek} onChange={(event) => onChange({ ...action, schedule: { ...schedule, occasionsPerWeek: Number(event.target.value) } })}>
              {Array.from({ length: 7 }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        ) : null}
        {schedule.kind === 'ONCE' ? (
          <label className="mk-ds-field">
            ¿En qué semana?
            <select value={schedule.week} onChange={(event) => onChange({ ...action, schedule: { ...schedule, week: Number(event.target.value) } })}>
              {Array.from({ length: horizon }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n === 1 ? 'Semana 1, la de activación' : `Semana ${n}`}</option>)}
            </select>
          </label>
        ) : null}
        {schedule.kind === 'TRIGGER' ? <p className="mk-m-muted mk-dp-trigger">{schedule.trigger}. No tiene días fijos.</p> : null}
        <label className="mk-ds-field">
          Duración estimada por vez
          <input inputMode="numeric" value={String(schedule.minutesPerOccasion)} onChange={(event) => onChange({ ...action, schedule: { ...schedule, minutesPerOccasion: minutes(event.target.value) } })} />
        </label>
      </div>

      <label className="mk-ds-field">
        ¿En qué momento lo harás? (opcional)
        <input value={action.cue ?? ''} maxLength={200} placeholder="Ej.: lunes y jueves, después de cenar" onChange={(event) => onChange({ ...action, cue: event.target.value })} />
        <small>Decidirlo ahora hace más fácil empezar. El día exacto lo eliges en tu semana.</small>
      </label>
      <label className="mk-ds-field">
        Esta acción estará hecha cuando…
        <textarea className="mk-dp-short" rows={2} value={action.doneWhen} maxLength={500} aria-invalid={flagged && !action.doneWhen.trim()} onChange={(event) => onChange({ ...action, doneWhen: event.target.value })} />
      </label>
      <label className="mk-ds-field">
        Versión mínima para un día difícil (opcional)
        <input value={action.minimum ?? ''} maxLength={500} onChange={(event) => onChange({ ...action, minimum: event.target.value })} />
      </label>
      {fromTemplate && action.source.kind === 'TEMPLATE' ? (
        <label className="mk-ds-check">
          <input type="checkbox" checked={action.source.usesMinimum} onChange={(event) => onChange(withTemplateMinimum(action, fromTemplate, event.target.checked))} />
          Empezar con la carga mínima de la estrategia: {fromTemplate.minimum.text}
        </label>
      ) : null}
      {marks.length ? (
        <fieldset className="mk-dp-marks">
          <legend className="mk-dp-legend">¿Esta acción implica alguna de estas situaciones?</legend>
          {marks.map((mark) => (
            <label key={mark} className="mk-ds-check">
              <input
                type="checkbox"
                checked={action.contentTags.includes(mark)}
                onChange={(event) => onChange({ ...action, contentTags: event.target.checked ? [...action.contentTags, mark] : action.contentTags.filter((tag) => tag !== mark) })}
              />
              {MARK_LABELS[mark]}
            </label>
          ))}
          <small className="mk-m-muted">Esto nos ayuda a mostrarte las precauciones necesarias antes de activar tu plan.</small>
        </fieldset>
      ) : null}
      {restricted ? <p className="mk-ds-error" role="alert">{restricted}</p> : null}
      {tools(<button type="button" className="mk-mx__action" aria-label={`Eliminar la acción ${index + 1}`} onClick={onRemove}>Eliminar</button>)}
    </fieldset>
  );
}

export function StepActions({ design, onSaved, onBack }: Props) {
  const horizon = design.result.horizonWeeks;
  const template = design.template;
  const [actions, setActions] = useState<DesignAction[]>(design.actions);
  const [obstacles, setObstacles] = useState(design.obstacles.length ? design.obstacles : [{ obstacle: '', response: '' }]);
  const [resources, setResources] = useState(design.resources ?? '');
  const [protect, setProtect] = useState(design.protectNote ?? '');
  const [environment, setEnvironment] = useState(design.environmentAccepted);
  const [loadConfirmed, setLoadConfirmed] = useState(design.loadConfirmed);
  const [acknowledge, setAcknowledge] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(design.readiness.missing.filter((row) => row.step === 4 && row.code !== 'LOAD' && row.code !== 'PROTECT'));
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(design.actions.filter((row) => !row.title.trim() || !row.doneWhen.trim()).map((row) => row.key)));

  function toggleOpen(key: string) {
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  function update(next: DesignAction[]) {
    setActions(next);
    setLoadConfirmed(false);
    setDirty(true);
  }

  const byWeek = weeklyLoad(actions, horizon);
  const maxWeekly = Math.max(0, ...byWeek);
  const demanding = maxWeekly > 300 || actions.length > 3;
  const combined = maxWeekly + design.context.otherActiveMinutes;
  const usesTemplateMinimum = actions.some((row) => row.source.kind === 'TEMPLATE');
  const flaggedKeys = new Set(missing.flatMap((row) => (row.actionKey ? [row.actionKey] : [])));

  async function save(advance: boolean) {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const view = await patchDesign(token, design.territory, design.planId, {
        section: 'actions',
        actions: actionsForSave(actions),
        obstacles: obstacles.filter((row) => row.obstacle.trim() || row.response.trim()),
        resources: resources.trim() || null,
        protectNote: protect.trim() || null,
        loadConfirmed,
        environmentAccepted: environment,
        acknowledgeObjective: acknowledge,
      });
      setDirty(false);
      setActions(view.actions);
      const blocking = view.readiness.missing.filter((row) => row.step <= 4);
      setMissing(blocking.filter((row) => row.step === 4));
      setOpenKeys(new Set(blocking.flatMap((row) => (row.actionKey ? [row.actionKey] : []))));
      if (!advance) {
        onSaved(view);
        return;
      }
      if (blocking.length) {
        setError(`Antes de seguir: ${blocking.map((row) => row.message).join(' ')}`);
        onSaved(view);
        return;
      }
      onSaved(view, 5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Lo que escribiste sigue aquí.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mk-ds-proposal">
      <div>
        <h2 className="mk-ds-question">¿Qué vas a hacer y cuándo?</h2>
        <p className="mk-ds-help">
          {design.strategy?.kind === 'CATALOG' ? 'La estrategia propone estas acciones como punto de partida.' : 'Estas acciones siguen la forma de trabajo que elegiste.'}{' '}
          Puedes cambiarlas, reordenarlas, quitarlas o sumar otras.
        </p>
      </div>

      {design.stale ? (
        <section className="mk-m-callout" aria-live="polite">
          <p><strong>Cambiaste el cambio o el resultado después de armar estas acciones.</strong></p>
          <p className="mk-m-muted">Revisa si siguen sirviendo para lo que buscas ahora. No borramos nada.</p>
          <label className="mk-ds-check">
            <input type="checkbox" checked={acknowledge} onChange={(event) => { setAcknowledge(event.target.checked); setDirty(true); }} />
            Mis acciones siguen sirviendo para el resultado actual
          </label>
        </section>
      ) : null}

      {usesTemplateMinimum && design.context.modifiers.suggestMinimum ? <p className="mk-ds-need">{design.context.modifiers.suggestMinimum.because}</p> : null}

      {actions.map((action, index) => (
        <ActionEditor
          key={action.key}
          action={action}
          index={index}
          count={actions.length}
          horizon={horizon}
          template={template}
          marks={design.context.marks}
          restricted={design.safety.restricted.find((row) => row.actionKey === action.key)?.reason ?? null}
          flagged={flaggedKeys.has(action.key)}
          open={openKeys.has(action.key)}
          onToggle={() => toggleOpen(action.key)}
          onChange={(next) => update(actions.map((row, i) => (i === index ? next : row)))}
          onMove={(to) => update(moveItem(actions, index, to))}
          onRemove={() => update(actions.filter((_, i) => i !== index))}
        />
      ))}
      <button
        type="button"
        className="mk-mx__action"
        disabled={actions.length >= MAX_ACTIONS}
        onClick={() => {
          const fresh = { ...emptyAction(horizon), key: `tmp-${Date.now()}` };
          update([...actions, fresh]);
          setOpenKeys((current) => new Set(current).add(fresh.key));
        }}
      >
        Agregar una acción
      </button>
      {actions.length >= MAX_ACTIONS ? <p className="mk-ds-need">Un plan admite hasta seis acciones. Empezar con menos suele funcionar mejor.</p> : null}

      <section className="mk-dp-context" aria-labelledby="mk-dp-load">
        <h3 id="mk-dp-load" className="mk-dp-context__title">Tiempo estimado</h3>
        <p>{loadLine(byWeek)}</p>
        {design.context.otherActiveMinutes > 0 ? <p className="mk-m-muted">Con tus otros planes activos serían hasta {combined} minutos por semana.</p> : null}
        {demanding ? <p className="mk-ds-need">Es un plan exigente. Puedes empezar con menos y sumar después de la primera revisión.</p> : null}
        <label className="mk-ds-check">
          <input type="checkbox" checked={loadConfirmed} onChange={(event) => { setLoadConfirmed(event.target.checked); setDirty(true); }} />
          Puedo dedicar este tiempo a mi plan
        </label>
      </section>

      <section className="mk-dp-context" aria-labelledby="mk-dp-obstacles">
        <h3 id="mk-dp-obstacles" className="mk-dp-context__title">Si algo se interpone (opcional)</h3>
        <p className="mk-m-muted">Piensa en lo que más probablemente te frene y qué harás si pasa.</p>
        {obstacles.map((row, index) => (
          <div key={index} className="mk-dp-row">
            <label className="mk-ds-field">
              Si…
              <input value={row.obstacle} maxLength={300} placeholder="Ej.: llego cansado del trabajo" onChange={(event) => { setObstacles(obstacles.map((item, i) => (i === index ? { ...item, obstacle: event.target.value } : item))); setDirty(true); }} />
            </label>
            <label className="mk-ds-field">
              entonces…
              <input value={row.response} maxLength={300} placeholder="Ej.: hago la versión mínima" onChange={(event) => { setObstacles(obstacles.map((item, i) => (i === index ? { ...item, response: event.target.value } : item))); setDirty(true); }} />
            </label>
          </div>
        ))}
        {obstacles.length < MAX_OBSTACLES ? (
          <button type="button" className="mk-mx__textlink" onClick={() => setObstacles([...obstacles, { obstacle: '', response: '' }])}>Agregar otro</button>
        ) : null}
      </section>

      <label className="mk-ds-field">
        ¿Qué necesitas tener a mano? (opcional)
        <input value={resources} maxLength={500} placeholder="Ej.: las zapatillas listas, la planilla abierta" onChange={(event) => { setResources(event.target.value); setDirty(true); }} />
      </label>
      <label className="mk-ds-field">
        ¿Qué necesitas cuidar para que este plan encaje?
        <textarea rows={2} maxLength={500} value={protect} onChange={(event) => { setProtect(event.target.value); setDirty(true); }} />
        <small>Por ejemplo: el sueño, el tiempo con tu familia o un límite de salud.</small>
      </label>
      <label className="mk-ds-check">
        <input type="checkbox" checked={protect === NOTHING_TO_PROTECT} onChange={(event) => { setProtect(event.target.checked ? NOTHING_TO_PROTECT : ''); setDirty(true); }} />
        Por ahora no hay nada que cuidar.
      </label>
      {design.context.modifiers.environmentAlternative ? (
        <label className="mk-ds-check">
          <input type="checkbox" checked={environment} onChange={(event) => { setEnvironment(event.target.checked); setDirty(true); }} />
          {design.context.modifiers.environmentAlternative.text}
        </label>
      ) : null}

      {missing.length ? (
        <ul className="mk-dp-missing" aria-label="Falta completar">
          {missing.map((row) => <li key={`${row.code}-${row.actionKey ?? ''}`}>{row.message}</li>)}
        </ul>
      ) : null}
      {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
      <div className="mk-ds-foot">
        <button type="button" className="mk-mx__action" onClick={onBack}>Anterior</button>
        <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void save(false)}>{dirty ? 'Guardar borrador' : 'Guardado'}</button>
        <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy || !actions.length} onClick={() => void save(true)}>
          {busy ? 'Guardando' : 'Revisar el plan'}
        </button>
      </div>
    </div>
  );
}

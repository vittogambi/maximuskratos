import type { ContentTag } from '../../instrumentos/restrictions';
import type { WeekDecision, WeekRevision } from '../apply-week';
import { addIsoDays } from '../civil-date';
import { DECLARED_TAGS } from '../plan-gate';
import type { MemberReviewChoice } from './review-decision';
import { MAX_WEEKLY_MINUTES, weeklyLoadCapMessage } from './plan-design';

/** What the member decides for one action in a review. Every change applies from the week after the reviewed one. */
export type ActionOp = 'KEEP' | 'REDUCE' | 'MODIFY' | 'RESCHEDULE' | 'SUBSTITUTE' | 'RETIRE';

export type ReviewActionKind = 'WEEKLY' | 'ONCE' | 'TRIGGER' | 'FIXED';

export type ReviewAction = {
  id: string;
  title: string;
  doneWhen: string;
  cue: string | null;
  minimumVersion: string | null;
  occasionsPerWeek: number | null;
  minutesPerOccasion: number | null;
  kind: ReviewActionKind;
  /** Monday of the week of a one-time action. */
  onceWeekStart: string | null;
  position: number;
};

export type ScheduleInput = { kind: 'WEEKLY'; occasionsPerWeek?: number } | { kind: 'ONCE'; weekStart: string };

export type ActionChangeInput = {
  actionId?: string;
  op?: string;
  title?: string;
  doneWhen?: string;
  cue?: string | null;
  minimum?: string | null;
  occasionsPerWeek?: number;
  minutesPerOccasion?: number;
  schedule?: ScheduleInput;
  reason?: string;
  contentTags?: string[];
};

export type AdditionInput = {
  title?: string;
  doneWhen?: string;
  cue?: string | null;
  minimum?: string | null;
  minutesPerOccasion?: number;
  schedule?: ScheduleInput;
  contentTags?: string[];
};

export type PendingActionChange = {
  actionId: string;
  op: ActionOp;
  decision: WeekDecision;
  revision: WeekRevision;
  reason: string | null;
  summary: string;
};

export type PendingAddition = {
  title: string;
  doneWhen: string;
  cue: string | null;
  minimumVersion: string | null;
  occasionsPerWeek: number | null;
  minutesPerOccasion: number;
  onceWeekStart: string | null;
  contentTags: ContentTag[];
  position: number;
  summary: string;
};

export class ReviewInputError extends Error {}

export const MAX_PLAN_ACTIONS = 6;
const MAX_WEEKS_AHEAD = 12;
const OPS: ActionOp[] = ['KEEP', 'REDUCE', 'MODIFY', 'RESCHEDULE', 'SUBSTITUTE', 'RETIRE'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function weekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split('-').map(Number);
  return `la semana del ${d} de ${MONTHS[(m ?? 1) - 1]}`;
}

function text(value: unknown, label: string, max: number, min = 0): string {
  if (typeof value !== 'string') throw new ReviewInputError(`${label} tiene que ser texto.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ReviewInputError(min > 1 ? `Escribe ${label.toLowerCase()}.` : `Falta ${label.toLowerCase()}.`);
  if (trimmed.length > max) throw new ReviewInputError(`${label} admite hasta ${max} caracteres.`);
  return trimmed;
}

function optionalText(value: unknown, label: string, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return text(value, label, max) || null;
}

function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new ReviewInputError(`${label} tiene que ser un entero entre ${min} y ${max}.`);
  }
  return value;
}

function isMondayIso(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() === 1;
}

function targetWeek(value: unknown, earliest: string, horizonFrom: string): string {
  if (typeof value !== 'string' || !isMondayIso(value)) throw new ReviewInputError('Elige en qué semana queda la tarea.');
  if (value < earliest) throw new ReviewInputError('Una tarea solo se puede mover a una semana que todavía no empezó.');
  if (value > addIsoDays(horizonFrom, 7 * (MAX_WEEKS_AHEAD - 1))) throw new ReviewInputError(`Una tarea se puede mover hasta ${MAX_WEEKS_AHEAD} semanas adelante.`);
  return value;
}

/** A template action whose name or identity changes can leave the weekly question describing something else. */
export function actionChangesResultMeaning(
  changes: { op: string; actionId: string; revision: { title?: string } }[],
  templateActionIds: ReadonlySet<string>,
): boolean {
  return changes.some((change) => {
    if (!templateActionIds.has(change.actionId)) return false;
    if (change.op === 'SUBSTITUTE') return true;
    return change.op === 'MODIFY' && Boolean(change.revision.title);
  });
}

function tags(value: unknown): ContentTag[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string' || !DECLARED_TAGS.includes(tag as ContentTag))) {
    throw new ReviewInputError('Marca de contenido desconocida.');
  }
  return [...new Set(value as ContentTag[])];
}

function scheduleText(input: { occasionsPerWeek: number | null; minutesPerOccasion: number | null; onceWeekStart: string | null; kind?: ReviewActionKind }): string {
  const minutes = input.minutesPerOccasion ? `${input.minutesPerOccasion} minutos` : '';
  if (input.onceWeekStart) return `una vez, en ${weekLabel(input.onceWeekStart)}${minutes ? `, ${minutes}` : ''}`;
  if (input.kind === 'TRIGGER') return minutes ? `cuando ocurra, ${minutes}` : 'cuando ocurra';
  const times = input.occasionsPerWeek === 1 ? '1 vez por semana' : `${input.occasionsPerWeek ?? 0} veces por semana`;
  return minutes ? `${times}, ${minutes} cada vez` : times;
}

/** Load of one week once the changes apply: weekly actions every week, one-time actions only in their week. */
export function loadForWeek(
  rows: { kind: ReviewActionKind; occasionsPerWeek: number | null; minutesPerOccasion: number | null; onceWeekStart: string | null }[],
  weekStart: string,
): number {
  return rows.reduce((sum, row) => {
    const minutes = row.minutesPerOccasion ?? 0;
    if (row.onceWeekStart) return row.onceWeekStart === weekStart ? sum + minutes : sum;
    if (row.kind === 'TRIGGER') return sum + minutes;
    if (row.kind === 'FIXED') return sum + minutes;
    return sum + (row.occasionsPerWeek ?? 0) * minutes;
  }, 0);
}

export type ActionReviewPlan = {
  changes: PendingActionChange[];
  additions: PendingAddition[];
  decisions: Record<string, WeekDecision>;
  revisions: Record<string, WeekRevision>;
  endReasons: Record<string, string>;
  choice: MemberReviewChoice;
  nextWeekMinutes: number;
};

/**
 * Turns the member's per-action decisions into the week decisions the close already applies.
 * KEEP writes nothing. A changed commitment always becomes a successor, so past records keep their criterion.
 */
export function planActionReview(input: {
  actions: ReviewAction[];
  changes: ActionChangeInput[];
  additions: AdditionInput[];
  reviewedWeek: string;
  /** First Monday the changes may use. Later than the Monday after the reviewed week when the review is applied late. */
  earliestWeek?: string;
  noRecordsNote?: boolean;
}): ActionReviewPlan {
  const nextWeek = addIsoDays(input.reviewedWeek, 7);
  const earliest = input.earliestWeek && input.earliestWeek > nextWeek ? input.earliestWeek : nextWeek;
  const byId = new Map(input.actions.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const changes: PendingActionChange[] = [];
  const decisions: Record<string, WeekDecision> = {};
  const revisions: Record<string, WeekRevision> = {};
  const endReasons: Record<string, string> = {};
  const after = new Map(input.actions.map((row) => [row.id, { kind: row.kind, occasionsPerWeek: row.occasionsPerWeek, minutesPerOccasion: row.minutesPerOccasion, onceWeekStart: row.onceWeekStart }]));

  for (const change of input.changes) {
    const action = typeof change.actionId === 'string' ? byId.get(change.actionId) : undefined;
    if (!action) throw new ReviewInputError('Esa acción no pertenece a este plan.');
    if (seen.has(action.id)) throw new ReviewInputError('Cada acción lleva una sola decisión.');
    seen.add(action.id);
    const op = OPS.find((row) => row === change.op);
    if (!op) throw new ReviewInputError('Decisión de acción desconocida.');
    const name = `«${action.title}»`;
    if (op === 'KEEP') {
      changes.push({ actionId: action.id, op, decision: 'KEEP', revision: {}, reason: null, summary: `${name} se mantiene.` });
      continue;
    }
    if (op === 'RETIRE') {
      const reason = text(change.reason ?? '', 'El motivo', 300, 3);
      decisions[action.id] = 'RETIRE';
      endReasons[action.id] = reason;
      after.delete(action.id);
      changes.push({ actionId: action.id, op, decision: 'RETIRE', revision: {}, reason, summary: `${name} se retira: ${reason}. Lo que registraste se conserva.` });
      continue;
    }
    if (op === 'REDUCE') {
      const revision: WeekRevision = {};
      if (change.occasionsPerWeek !== undefined) {
        if (action.kind !== 'WEEKLY') throw new ReviewInputError(`${name} no tiene veces por semana.`);
        revision.occasionsPerWeek = integer(change.occasionsPerWeek, 'Las veces por semana', 1, 21);
      }
      if (change.minutesPerOccasion !== undefined) revision.minutesPerOccasion = integer(change.minutesPerOccasion, 'Los minutos', 1, 600);
      const fewer = revision.occasionsPerWeek != null && revision.occasionsPerWeek < (action.occasionsPerWeek ?? 0);
      const shorter = revision.minutesPerOccasion != null && revision.minutesPerOccasion < (action.minutesPerOccasion ?? 0);
      const more = (revision.occasionsPerWeek ?? 0) > (action.occasionsPerWeek ?? 0) || (revision.minutesPerOccasion ?? 0) > (action.minutesPerOccasion ?? Infinity);
      if (!fewer && !shorter) throw new ReviewInputError(`Para aligerar ${name}, baja las veces o los minutos.`);
      if (more) throw new ReviewInputError(`Aligerar ${name} no puede subir la otra cifra. Usa «Cambiar».`);
      if (action.kind === 'ONCE') revision.onceWeekStart = action.onceWeekStart && action.onceWeekStart >= earliest ? action.onceWeekStart : earliest;
      decisions[action.id] = 'ADJUST';
      revisions[action.id] = revision;
      const next = { ...after.get(action.id)!, occasionsPerWeek: revision.occasionsPerWeek ?? action.occasionsPerWeek, minutesPerOccasion: revision.minutesPerOccasion ?? action.minutesPerOccasion, onceWeekStart: revision.onceWeekStart ?? action.onceWeekStart };
      after.set(action.id, next);
      changes.push({ actionId: action.id, op, decision: 'ADJUST', revision, reason: null, summary: `${name} se aligera: ${scheduleText({ ...next, kind: action.kind })}.` });
      continue;
    }
    if (op === 'RESCHEDULE') {
      if (action.kind !== 'ONCE') throw new ReviewInputError(`${name} se repite cada semana. Para cambiar su frecuencia usa «Cambiar».`);
      if (change.schedule?.kind !== 'ONCE') throw new ReviewInputError('Elige en qué semana queda la tarea.');
      const week = targetWeek(change.schedule.weekStart, earliest, nextWeek);
      if (week === action.onceWeekStart) throw new ReviewInputError(`${name} ya está en esa semana.`);
      decisions[action.id] = 'ADJUST';
      revisions[action.id] = { onceWeekStart: week };
      after.set(action.id, { ...after.get(action.id)!, onceWeekStart: week });
      changes.push({ actionId: action.id, op, decision: 'ADJUST', revision: { onceWeekStart: week }, reason: null, summary: `${name} pasa a ${weekLabel(week)}. Su semana original conserva lo que se registró.` });
      continue;
    }
    const substitute = op === 'SUBSTITUTE';
    const revision: WeekRevision = {};
    const parts: string[] = [];
    const title = change.title !== undefined ? text(change.title, 'La acción', 180, 3) : undefined;
    const doneWhen = change.doneWhen !== undefined ? text(change.doneWhen, 'Cuándo cuenta como hecha', 500, 1) : undefined;
    if (substitute && (!title || !doneWhen)) throw new ReviewInputError('Para sustituir una acción, escribe la nueva y cuándo cuenta como hecha.');
    if (substitute && title === action.title) throw new ReviewInputError('La acción nueva tiene que ser distinta. Para ajustarla usa «Cambiar».');
    if (title && title !== action.title) { revision.title = title; if (!substitute) parts.push(`ahora: «${title}»`); }
    if (doneWhen && doneWhen !== action.doneWhen) { revision.doneWhen = doneWhen; parts.push('otro criterio de hecho'); }
    const cue = optionalText(change.cue, 'Cuándo y dónde', 200);
    if (cue !== undefined && cue !== action.cue) { revision.cue = cue; parts.push(cue ? `cuándo: ${cue}` : 'sin cuándo fijo'); }
    const minimum = optionalText(change.minimum, 'La versión mínima', 500);
    if (minimum !== undefined && minimum !== action.minimumVersion) { revision.minimumVersion = minimum; parts.push('otra versión mínima'); }
    if (change.minutesPerOccasion !== undefined) {
      const minutes = integer(change.minutesPerOccasion, 'Los minutos', 1, 600);
      if (minutes !== action.minutesPerOccasion) revision.minutesPerOccasion = minutes;
    }
    let onceWeekStart = action.onceWeekStart;
    let occasions = action.occasionsPerWeek;
    if (change.schedule?.kind === 'ONCE') {
      onceWeekStart = targetWeek(change.schedule.weekStart, earliest, nextWeek);
      if (onceWeekStart !== action.onceWeekStart) revision.onceWeekStart = onceWeekStart;
      occasions = null;
    } else if (change.schedule?.kind === 'WEEKLY') {
      if (action.kind === 'TRIGGER') throw new ReviewInputError(`${name} se usa cuando ocurre algo. No lleva veces por semana.`);
      occasions = integer(change.schedule.occasionsPerWeek ?? action.occasionsPerWeek ?? 1, 'Las veces por semana', 1, 21);
      if (action.kind === 'ONCE') { revision.onceWeekStart = null; onceWeekStart = null; }
      if (occasions !== action.occasionsPerWeek) revision.occasionsPerWeek = occasions;
    }
    const contentTags = tags(change.contentTags);
    if (contentTags.length) revision.contentTags = contentTags;
    const commitment = revision.title !== undefined || revision.doneWhen !== undefined || revision.minutesPerOccasion !== undefined
      || revision.occasionsPerWeek !== undefined || revision.onceWeekStart !== undefined;
    if (!commitment && revision.cue === undefined && revision.minimumVersion === undefined && !contentTags.length) {
      throw new ReviewInputError(`No hay un cambio concreto en ${name}.`);
    }
    if (commitment && action.kind === 'ONCE' && revision.onceWeekStart === undefined) {
      if (!action.onceWeekStart || action.onceWeekStart < earliest) throw new ReviewInputError(`Su semana ya pasó. Elige en qué semana queda ${name}.`);
      revision.onceWeekStart = action.onceWeekStart;
    }
    if (revision.minutesPerOccasion !== undefined) parts.push(`${revision.minutesPerOccasion} minutos`);
    if (revision.occasionsPerWeek !== undefined) parts.push(`${revision.occasionsPerWeek} ${revision.occasionsPerWeek === 1 ? 'vez' : 'veces'} por semana`);
    if (revision.onceWeekStart) parts.push(`una vez, en ${weekLabel(revision.onceWeekStart)}`);
    if (revision.onceWeekStart === null) parts.push('pasa a repetirse cada semana');
    decisions[action.id] = 'ADJUST';
    revisions[action.id] = revision;
    after.set(action.id, {
      kind: onceWeekStart ? 'ONCE' : action.kind === 'ONCE' ? 'WEEKLY' : action.kind,
      occasionsPerWeek: occasions,
      minutesPerOccasion: revision.minutesPerOccasion ?? action.minutesPerOccasion,
      onceWeekStart,
    });
    changes.push({
      actionId: action.id,
      op,
      decision: 'ADJUST',
      revision,
      reason: null,
      summary: substitute
        ? `${name} se reemplaza por «${title}»: ${scheduleText({ ...after.get(action.id)!, kind: action.kind })}. Lo registrado queda en la acción anterior.`
        : `${name} cambia: ${parts.join(', ') || 'ajustes menores'}.`,
    });
  }

  const remaining = [...after.values()].filter((row) => !row.onceWeekStart || row.onceWeekStart >= nextWeek).length;
  if (remaining + input.additions.length > MAX_PLAN_ACTIONS) {
    throw new ReviewInputError(`Un plan admite hasta ${MAX_PLAN_ACTIONS} acciones a la vez. Retira o reemplaza una antes de sumar otra.`);
  }
  const lastPosition = Math.max(-1, ...input.actions.map((row) => row.position));
  const additions = input.additions.map((raw, index): PendingAddition => {
    const title = text(raw.title ?? '', 'La acción', 180, 3);
    const doneWhen = text(raw.doneWhen ?? '', 'Cuándo cuenta como hecha', 500, 1);
    const minutesPerOccasion = integer(raw.minutesPerOccasion, 'Los minutos', 1, 600);
    let occasionsPerWeek: number | null = null;
    let onceWeekStart: string | null = null;
    if (raw.schedule?.kind === 'ONCE') onceWeekStart = targetWeek(raw.schedule.weekStart, earliest, nextWeek);
    else if (raw.schedule?.kind === 'WEEKLY') occasionsPerWeek = integer(raw.schedule.occasionsPerWeek, 'Las veces por semana', 1, 21);
    else throw new ReviewInputError('Elige si la acción nueva se repite cada semana o se hace una vez.');
    const row = {
      title,
      doneWhen,
      cue: optionalText(raw.cue, 'Cuándo y dónde', 200) ?? null,
      minimumVersion: optionalText(raw.minimum, 'La versión mínima', 500) ?? null,
      occasionsPerWeek,
      minutesPerOccasion,
      onceWeekStart,
      contentTags: tags(raw.contentTags),
      position: lastPosition + 1 + index,
    };
    return { ...row, summary: `Se agrega «${title}»: ${scheduleText(row)}.` };
  });

  const nextWeekMinutes = loadForWeek([...after.values(), ...additions.map((row) => ({ ...row, kind: (row.onceWeekStart ? 'ONCE' : 'WEEKLY') as ReviewActionKind }))], earliest);
  if (nextWeekMinutes > MAX_WEEKLY_MINUTES) throw new ReviewInputError(weeklyLoadCapMessage());

  const ops = new Set([...changes.map((row) => row.op), ...(additions.length ? ['ADD'] : [])]);
  const choice: MemberReviewChoice = ops.has('SUBSTITUTE')
    ? 'SUBSTITUTE'
    : ops.has('MODIFY') || ops.has('RESCHEDULE') || ops.has('ADD')
      ? 'MODIFY'
      : ops.has('REDUCE') || ops.has('RETIRE')
        ? 'REDUCE'
        : input.noRecordsNote ? 'NO_RECORDS' : 'KEEP';

  return { changes, additions, decisions, revisions, endReasons, choice, nextWeekMinutes };
}

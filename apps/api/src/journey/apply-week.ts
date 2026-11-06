import { addIsoDays } from './civil-date';
import { dayMatchesIsoWeekday } from './civil-week';

/** ADJUST is the per-action change of the design contract. It always leaves a successor when the commitment changes. */
export type WeekDecision = 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE' | 'MODIFY' | 'RETIRE' | 'ADJUST';

export type WeekAction = {
  id: string;
  title: string;
  doneWhen: string;
  active: boolean;
  weekday?: number | null;
  intervalDays?: number;
  occasionsPerWeek?: number | null;
  minutesPerOccasion?: number | null;
  paused?: boolean;
  preparation?: string | null;
  cue?: string | null;
  minimumVersion?: string | null;
};

export type WeekRevision = {
  title?: string;
  doneWhen?: string;
  weekday?: number | null;
  intervalDays?: number | null;
  occasionsPerWeek?: number | null;
  minutesPerOccasion?: number | null;
  preparation?: string | null;
  cue?: string | null;
  minimumVersion?: string | null;
  /** Monday of the one-time week. Null turns a one-time action into a weekly one. Undefined keeps the kind. */
  onceWeekStart?: string | null;
  /** Marks added to the successor. The predecessor's marks always stay. */
  contentTags?: string[];
};

export type WeekSuccessor = {
  title: string;
  doneWhen: string;
  weekday: number | null;
  intervalDays: number;
  replacesActionId: string;
  preparation?: string | null;
  occasionsPerWeek?: number | null;
  minutesPerOccasion?: number | null;
  cue?: string | null;
  minimumVersion?: string | null;
  onceWeekStart?: string | null;
  contentTags?: string[];
};

export type WeekEffect = {
  actionId: string;
  decision: WeekDecision;
  summary: string;
  next: WeekAction;
  successor: WeekSuccessor | null;
};

function intervalOf(action: WeekAction): number {
  return action.intervalDays && action.intervalDays >= 7 ? action.intervalDays : 7;
}

/** Concrete effect of a review. An empty change is rejected. Past records are not in this result. */
export function previewWeek(
  actions: WeekAction[],
  decisions: Record<string, WeekDecision>,
  revisions: Record<string, WeekRevision>,
): WeekEffect[] {
  return actions.map((action) => {
    const decision = decisions[action.id] ?? 'KEEP';
    const next = revisions[action.id] ?? {};
    const currentInterval = intervalOf(action);
    if (decision === 'KEEP' && action.paused) {
      return {
        actionId: action.id,
        decision,
        summary: `${action.title} sigue en pausa. El criterio sigue: ${action.doneWhen}. No se programan ocasiones.`,
        next: { ...action, intervalDays: currentInterval, paused: true, active: true },
        successor: null,
      };
    }
    if (decision === 'KEEP') {
      return {
        actionId: action.id,
        decision,
        summary: `${action.title} se mantiene. El criterio sigue: ${action.doneWhen}.`,
        next: { ...action, intervalDays: currentInterval, paused: Boolean(action.paused) },
        successor: null,
      };
    }
    if (decision === 'ADJUST') return adjustEffect(action, next, currentInterval);
    if (decision === 'CLOSE' || decision === 'RETIRE') {
      return {
        actionId: action.id,
        decision,
        summary: `${action.title} se cierra. No quedan ocasiones futuras. El registro ya hecho sigue en esa acción.`,
        next: { ...action, active: false, paused: false, intervalDays: currentInterval },
        successor: null,
      };
    }
    if (decision === 'RESUME') {
      if (!action.paused) throw new Error('RESUME_REQUIRES_PAUSE');
      return {
        actionId: action.id,
        decision,
        summary: `${action.title} vuelve. El criterio sigue: ${action.doneWhen}. Las ocasiones futuras se calculan desde hoy.`,
        next: { ...action, active: true, paused: false, intervalDays: currentInterval },
        successor: null,
      };
    }
    if (decision === 'PAUSE') {
      if (action.paused) throw new Error('PAUSE_REQUIRES_CHANGE');
      return {
        actionId: action.id,
        decision,
        summary: `${action.title} se pausa. El criterio sigue: ${action.doneWhen}. Las ocasiones futuras no se programan.`,
        next: { ...action, active: true, paused: true, intervalDays: currentInterval },
        successor: null,
      };
    }
    if (decision === 'SUBSTITUTE') {
      const title = next.title?.trim();
      const doneWhen = next.doneWhen?.trim();
      const preparation = next.preparation?.trim();
      const weekday = typeof next.weekday === 'number' ? next.weekday : action.weekday ?? null;
      const changed = Boolean(
        (title && title !== action.title)
        || (doneWhen && doneWhen !== action.doneWhen)
        || (preparation && preparation !== (action.preparation ?? ''))
        || (typeof next.weekday === 'number' && next.weekday !== action.weekday),
      );
      if (!changed) throw new Error('SUBSTITUTE_REQUIRES_CHANGE');
      const nextTitle = title && title !== action.title ? title : action.title;
      return {
        actionId: action.id,
        decision,
        summary: `${action.title} queda sustituida. El registro anterior no pasa a la acción nueva y no hay dos obligaciones para la misma ocasión.`,
        next: { ...action, active: false, paused: false, intervalDays: currentInterval },
        successor: {
          title: nextTitle,
          doneWhen: doneWhen || action.doneWhen,
          weekday,
          intervalDays: currentInterval,
          replacesActionId: action.id,
          preparation: preparation || action.preparation || null,
        },
      };
    }
    const weekday = typeof next.weekday === 'number' ? next.weekday : null;
    const interval = typeof next.intervalDays === 'number' ? next.intervalDays : null;
    const doneWhen = next.doneWhen?.trim();
    const title = next.title?.trim();
    const intervalChanges = interval != null && interval >= 7 && interval !== currentInterval;
    const weekdayChanges = weekday != null && weekday !== action.weekday;
    const occasionsNext = typeof next.occasionsPerWeek === 'number' ? next.occasionsPerWeek : null;
    const minutesNext = typeof next.minutesPerOccasion === 'number' ? next.minutesPerOccasion : null;
    const occasionsChanges = occasionsNext != null && occasionsNext !== (action.occasionsPerWeek ?? null);
    const minutesChanges = minutesNext != null && minutesNext !== (action.minutesPerOccasion ?? null);
    const textChanges = Boolean((doneWhen && doneWhen !== action.doneWhen) || (title && title !== action.title));
    if (decision === 'MODIFY' && textChanges) {
      return {
        actionId: action.id,
        decision: 'MODIFY',
        summary: `${action.title} cambia hacia adelante. El registro ya hecho conserva el criterio con el que se guardó.`,
        next: { ...action, active: false, paused: false, intervalDays: currentInterval },
        successor: {
          title: title || action.title,
          doneWhen: doneWhen || action.doneWhen,
          weekday: weekdayChanges ? weekday : action.weekday ?? null,
          intervalDays: intervalChanges ? interval : currentInterval,
          replacesActionId: action.id,
          preparation: action.preparation ?? null,
        },
      };
    }
    if (decision === 'REDUCE') {
      if (!intervalChanges && !weekdayChanges && !occasionsChanges && !minutesChanges) throw new Error('REDUCE_REQUIRES_CHANGE');
      if (occasionsChanges || minutesChanges) {
        return {
          actionId: action.id,
          decision,
          summary: `${action.title}. La carga cambia hacia adelante. El criterio sigue: ${action.doneWhen}. Los registros ya hechos no se mueven.`,
          next: { ...action, active: false, paused: false, intervalDays: currentInterval },
          successor: {
            title: action.title,
            doneWhen: action.doneWhen,
            weekday: weekdayChanges ? weekday : action.weekday ?? null,
            intervalDays: intervalChanges ? interval : currentInterval,
            replacesActionId: action.id,
            preparation: action.preparation ?? null,
            occasionsPerWeek: occasionsChanges ? occasionsNext : action.occasionsPerWeek ?? null,
            minutesPerOccasion: minutesChanges ? minutesNext : action.minutesPerOccasion ?? null,
          },
        };
      }
      const kept = action.doneWhen;
      const parts = [`El criterio sigue: ${kept}.`];
      if (intervalChanges) parts.push(`La frecuencia pasa de cada ${currentInterval} días a cada ${interval} días.`);
      if (weekdayChanges) parts.push('El día futuro cambia.');
      if (occasionsChanges) parts.push(`Las ocasiones semanales pasan a ${occasionsNext}.`);
      if (minutesChanges) parts.push(`Los minutos por ocasión pasan a ${minutesNext}.`);
      return {
        actionId: action.id,
        decision,
        summary: `${action.title}. ${parts.join(' ')} Los registros ya hechos no se mueven.`,
        next: {
          ...action,
          doneWhen: kept,
          weekday: weekdayChanges ? weekday : action.weekday ?? null,
          intervalDays: intervalChanges ? interval : currentInterval,
          occasionsPerWeek: occasionsChanges ? occasionsNext : action.occasionsPerWeek ?? null,
          minutesPerOccasion: minutesChanges ? minutesNext : action.minutesPerOccasion ?? null,
          paused: false,
          active: true,
        },
        successor: null,
      };
    }
    if (!textChanges && !weekdayChanges && !intervalChanges && !occasionsChanges && !minutesChanges) throw new Error('MODIFY_REQUIRES_CHANGE');
    return {
      actionId: action.id,
      decision: 'MODIFY',
      summary: `${action.title} cambia hacia adelante. El registro ya hecho conserva el criterio con el que se guardó.`,
      next: {
        ...action,
        title: title || action.title,
        doneWhen: doneWhen || action.doneWhen,
        weekday: weekdayChanges ? weekday : action.weekday ?? null,
        intervalDays: intervalChanges ? interval : currentInterval,
        occasionsPerWeek: occasionsChanges ? occasionsNext : action.occasionsPerWeek ?? null,
        minutesPerOccasion: minutesChanges ? minutesNext : action.minutesPerOccasion ?? null,
        paused: Boolean(action.paused),
      },
      successor: null,
    };
  });
}

function adjustEffect(action: WeekAction, next: WeekRevision, interval: number): WeekEffect {
  const title = next.title?.trim() || action.title;
  const doneWhen = next.doneWhen?.trim() || action.doneWhen;
  const occasions = typeof next.occasionsPerWeek === 'number' ? next.occasionsPerWeek : action.occasionsPerWeek ?? null;
  const minutes = typeof next.minutesPerOccasion === 'number' ? next.minutesPerOccasion : action.minutesPerOccasion ?? null;
  const cue = next.cue !== undefined ? next.cue?.trim() || null : action.cue ?? null;
  const minimumVersion = next.minimumVersion !== undefined ? next.minimumVersion?.trim() || null : action.minimumVersion ?? null;
  const scheduleChanges = next.onceWeekStart !== undefined;
  const commitment = title !== action.title
    || doneWhen !== action.doneWhen
    || scheduleChanges
    || Boolean(next.contentTags?.length)
    || occasions !== (action.occasionsPerWeek ?? null)
    || minutes !== (action.minutesPerOccasion ?? null);
  const contextChanges = cue !== (action.cue ?? null) || minimumVersion !== (action.minimumVersion ?? null);
  if (!commitment && !contextChanges) throw new Error('ADJUST_REQUIRES_CHANGE');
  const once = next.onceWeekStart ?? null;
  return {
    actionId: action.id,
    decision: 'ADJUST',
    summary: contextChanges && !commitment
      ? `${action.title} cambia desde la semana siguiente. El cuándo y la versión mínima anteriores quedan en la acción que ya tiene registros.`
      : `${action.title} cambia desde la semana siguiente. Los registros ya hechos quedan en la acción anterior.`,
    next: { ...action, active: false, paused: false, intervalDays: interval },
    successor: {
      title,
      doneWhen,
      weekday: once ? null : action.weekday ?? null,
      intervalDays: interval,
      replacesActionId: action.id,
      preparation: action.preparation ?? null,
      occasionsPerWeek: scheduleChanges ? (once ? null : occasions) : occasions,
      minutesPerOccasion: minutes,
      cue,
      minimumVersion,
      onceWeekStart: scheduleChanges ? once : undefined,
      contentTags: next.contentTags,
    },
  };
}

/** @deprecated Use previewWeek. Kept so older callers still receive the next action row. */
export function applyWeekDecisions(
  actions: WeekAction[],
  decisions: Record<string, WeekDecision>,
  revisions: Record<string, WeekRevision>,
): WeekAction[] {
  return previewWeek(actions, decisions, revisions).map((effect) => effect.next);
}

/** A different observable result for the plan. Empty or identical text leaves the current one. */
export function nextPlanOutcome(current: string, proposed: string | null | undefined): string | null {
  const next = proposed?.trim() ?? '';
  if (!next || next === current.trim()) return null;
  return next;
}

export function futureOccasions(from: string, weekday: number, intervalDays: number, horizon = 21): string[] {
  const dates: string[] = [];
  for (let offset = 0; offset < horizon; offset += 1) {
    const day = addIsoDays(from, offset);
    if (dayMatchesIsoWeekday(day, weekday)) dates.push(day);
  }
  const every = Math.max(1, Math.round(Math.max(7, intervalDays) / 7));
  return dates.filter((_, index) => index % every === 0);
}

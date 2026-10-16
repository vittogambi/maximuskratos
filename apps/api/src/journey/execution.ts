export const ACTION_DOMAINS = ['MENTE', 'ESPIRITU', 'CUERPO'] as const;
export type ActionDomainName = (typeof ACTION_DOMAINS)[number];

type Action = { id: string; domain: ActionDomainName | null; active: boolean };
type RecordRow = { actionId: string; day: string; status: string };

export type DomainReading = { planned: number; done: number; percent: number | null };

export type OccasionTally = {
  originalPlanned: number;
  valid: number;
  done: number;
  omitted: number;
  cancelled: number;
  noInformation: number;
  legacyNotApplicable: number;
  percent: number | null;
};

export type OccasionAction = {
  id: string;
  weekday: number | null;
  occasionsPerWeek: number | null;
  active: boolean;
};

export type OccasionRecord = { actionId: string; day: string; status: string };

/** Days without a record are not omissions. NOT_APPLICABLE stays out of the cancelled count. */
export function occasionTally(
  actions: OccasionAction[],
  records: OccasionRecord[],
  cancellations: { actionId: string; day: string }[],
  weekStart: string,
  weekEnd: string,
  datesFor: (weekday: number) => string[],
): OccasionTally {
  let originalPlanned = 0;
  let cancelled = 0;
  let done = 0;
  let omitted = 0;
  let noInformation = 0;
  let legacyNotApplicable = 0;
  const inWeek = (day: string) => day >= weekStart && day <= weekEnd;
  for (const action of actions) {
    if (!action.active) continue;
    const dated = action.weekday == null ? [] : datesFor(action.weekday).filter(inWeek);
    const flexible = action.weekday == null ? Math.max(0, action.occasionsPerWeek ?? 0) : 0;
    const plannedDays = dated.length > 0 ? dated : [];
    originalPlanned += plannedDays.length + flexible;
    const actionCancels = new Set(cancellations.filter((row) => row.actionId === action.id && (plannedDays.includes(row.day) || flexible > 0)).map((row) => row.day));
    const cancelledCount = plannedDays.length ? plannedDays.filter((day) => actionCancels.has(day)).length : Math.min(flexible, actionCancels.size);
    cancelled += cancelledCount;
    if (plannedDays.length === 0 && flexible === 0) continue;
    if (plannedDays.length === 0) {
      const rows = records.filter((row) => row.actionId === action.id && inWeek(row.day));
      const doneN = rows.filter((row) => row.status === 'DONE').length;
      const omittedN = rows.filter((row) => row.status === 'SKIPPED').length;
      const legacyN = rows.filter((row) => row.status === 'NOT_APPLICABLE').length;
      done += doneN;
      omitted += omittedN;
      legacyNotApplicable += legacyN;
      noInformation += Math.max(0, flexible - cancelledCount - doneN - omittedN - legacyN);
      continue;
    }
    for (const day of plannedDays) {
      if (actionCancels.has(day)) continue;
      const row = records.find((item) => item.actionId === action.id && item.day === day);
      if (!row) noInformation += 1;
      else if (row.status === 'DONE') done += 1;
      else if (row.status === 'SKIPPED') omitted += 1;
      else if (row.status === 'NOT_APPLICABLE') legacyNotApplicable += 1;
      else noInformation += 1;
    }
  }
  const valid = originalPlanned - cancelled;
  const known = done + omitted;
  return {
    originalPlanned,
    valid,
    done,
    omitted,
    cancelled,
    noInformation,
    legacyNotApplicable,
    percent: valid > 0 && known > 0 ? Math.round((100 * done) / valid) : null,
  };
}

export function executionReading(
  actions: Action[],
  records: RecordRow[],
  weekStart: string,
  weekEnd: string,
): { plate: number | null; domains: Record<ActionDomainName, DomainReading> } {
  const inWeek = (day: string) => day >= weekStart && day <= weekEnd;
  const doneIds = new Set(
    records.filter((row) => inWeek(row.day) && row.status === 'DONE').map((row) => row.actionId),
  );
  const scoped = actions.filter((action) => action.active && action.domain);
  const read = (list: Action[]): DomainReading => {
    if (list.length === 0) return { planned: 0, done: 0, percent: null };
    const done = list.filter((action) => doneIds.has(action.id)).length;
    return { planned: list.length, done, percent: Math.round((100 * done) / list.length) };
  };
  return {
    plate: read(scoped).percent,
    domains: {
      MENTE: read(scoped.filter((action) => action.domain === 'MENTE')),
      ESPIRITU: read(scoped.filter((action) => action.domain === 'ESPIRITU')),
      CUERPO: read(scoped.filter((action) => action.domain === 'CUERPO')),
    },
  };
}

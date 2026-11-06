import type { ActionAddition, ActionChange, ActionOp, ReviewActionRow } from '@/lib/intervention-api';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function addWeeks(iso: string, weeks: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + weeks * 7));
  return date.toISOString().slice(0, 10);
}

export function weekLabel(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `semana del ${d} de ${MONTHS[(m ?? 1) - 1]}`;
}

/** Weeks a one-time task can move to: from the week after the review, up to eight weeks ahead. */
export function weekOptions(nextWeek: string, count = 8): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const value = addWeeks(nextWeek, index);
    const label = weekLabel(value);
    return { value, label: index === 0 ? `La próxima, ${label}` : label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

export function actionScheduleLabel(row: Pick<ReviewActionRow, 'kind' | 'occasionsPerWeek' | 'minutesPerOccasion' | 'onceWeekStart'>): string {
  const minutes = row.minutesPerOccasion ? `${row.minutesPerOccasion} minutos` : '';
  if (row.kind === 'ONCE' && row.onceWeekStart) return `Una vez, en la ${weekLabel(row.onceWeekStart)}${minutes ? `, ${minutes}` : ''}`;
  if (row.kind === 'TRIGGER') return minutes ? `Cuando ocurra, ${minutes}` : 'Cuando ocurra';
  if (row.kind === 'FIXED') return minutes ? `Un día fijo por semana, ${minutes}` : 'Un día fijo por semana';
  const times = row.occasionsPerWeek === 1 ? '1 vez por semana' : `${row.occasionsPerWeek ?? 0} veces por semana`;
  return minutes ? `${times}, ${minutes} cada vez` : times;
}

/** What the reviewed week shows for this action. Missing records are said as missing, never as done or not done. */
export function weekLine(row: ReviewActionRow): string {
  if (row.once) {
    const where = weekLabel(row.once.weekStart);
    if (row.once.status === 'DONE') return `Hecha en la ${where}.`;
    if (row.once.status === 'NOT_DONE') return `Marcaste que no se hizo en la ${where}.`;
    if (row.once.status === 'NO_INFORMATION') return `Sin registro en su semana, la ${where}. No sabemos si se hizo.`;
    if (row.once.status === 'PENDING') return `Prevista para esta semana. Todavía puedes registrarla.`;
    return `Prevista para la ${where}.`;
  }
  if (row.kind === 'TRIGGER') return 'Se usa cuando ocurre. No tiene ocasiones fijas.';
  const { done, notDone, noInformation, dueUnmarked, upcoming } = row.week;
  const planned = done + notDone + noInformation + dueUnmarked + upcoming;
  if (!planned) return 'Esta semana no tenía ocasiones.';
  const parts = [`${done} de ${planned} hechas`];
  if (notDone) parts.push(`${notDone} no hechas`);
  if (noInformation) parts.push(`${noInformation} sin registro`);
  if (dueUnmarked + upcoming) parts.push(`${dueUnmarked + upcoming} por registrar`);
  return `Esta semana: ${parts.join(', ')}.`;
}

export function opsFor(row: ReviewActionRow): { op: ActionOp; label: string; help: string }[] {
  if (row.kind === 'ONCE') {
    return [
      row.needsDecision
        ? { op: 'KEEP', label: 'Dejarla pendiente', help: 'La tarea sigue pendiente hasta que reprogramarla, la modifiques o la descartes.' }
        : { op: 'KEEP', label: 'Mantener esta acción', help: 'Queda como está.' },
      { op: 'RESCHEDULE', label: 'Mover a otra semana', help: 'Pasa a otra semana. Su semana original no cambia.' },
      { op: 'MODIFY', label: 'Modificar esta acción', help: 'Ajustas qué es, cuándo cuenta o su duración.' },
      { op: 'SUBSTITUTE', label: 'Sustituir por otra acción', help: 'Otra acción ocupa su lugar.' },
      { op: 'RETIRE', label: 'Descartar esta tarea', help: 'Esta tarea puntual ya no aplica. Dices por qué.' },
    ];
  }
  return [
    { op: 'KEEP', label: 'Mantener esta acción', help: 'Queda como está.' },
    { op: 'REDUCE', label: 'Reducir su carga', help: 'Menos veces o menos minutos.' },
    { op: 'MODIFY', label: 'Modificar esta acción', help: 'Ajustas qué es, cuándo, cuánto o cómo se repite.' },
    { op: 'SUBSTITUTE', label: 'Sustituir por otra acción', help: 'Otra acción ocupa su lugar.' },
    { op: 'RETIRE', label: 'Retirar esta acción', help: 'Dejará de aparecer en semanas futuras. Dices por qué.' },
  ];
}

/** Same arithmetic as the server, for live feedback. The server recalculates when saving. */
export function nextWeekLoad(rows: ReviewActionRow[], changes: Record<string, ActionChange>, additions: ActionAddition[], nextWeek: string): number {
  const one = (input: { kind: string; occasionsPerWeek: number | null; minutesPerOccasion: number | null; onceWeekStart: string | null }) => {
    const minutes = input.minutesPerOccasion ?? 0;
    if (input.onceWeekStart) return input.onceWeekStart === nextWeek ? minutes : 0;
    if (input.kind === 'TRIGGER' || input.kind === 'FIXED') return minutes;
    return (input.occasionsPerWeek ?? 0) * minutes;
  };
  let total = 0;
  for (const row of rows) {
    const change = changes[row.id];
    if (!change || change.op === 'KEEP') { total += one(row); continue; }
    if (change.op === 'RETIRE') continue;
    const schedule = change.schedule;
    const onceWeekStart = schedule?.kind === 'ONCE' ? schedule.weekStart : schedule?.kind === 'WEEKLY' ? null : row.onceWeekStart;
    const occasions = schedule?.kind === 'WEEKLY' ? schedule.occasionsPerWeek ?? row.occasionsPerWeek : change.occasionsPerWeek ?? row.occasionsPerWeek;
    total += one({ kind: schedule?.kind ?? row.kind, occasionsPerWeek: onceWeekStart ? null : occasions, minutesPerOccasion: change.minutesPerOccasion ?? row.minutesPerOccasion, onceWeekStart });
  }
  for (const row of additions) {
    total += one({ kind: row.schedule.kind, occasionsPerWeek: row.schedule.kind === 'WEEKLY' ? row.schedule.occasionsPerWeek ?? 1 : null, minutesPerOccasion: row.minutesPerOccasion, onceWeekStart: row.schedule.kind === 'ONCE' ? row.schedule.weekStart : null });
  }
  return total;
}

/** Short line for the summary before saving. The saved summary comes from the server. */
export function changeLine(row: ReviewActionRow, change: ActionChange | undefined): string {
  const name = `«${row.title}»`;
  if (!change || change.op === 'KEEP') return row.needsDecision ? `${name} queda pendiente de decidir.` : `${name} se mantiene.`;
  if (change.op === 'RETIRE') return `${name} se ${row.kind === 'ONCE' ? 'descarta' : 'retira'}${change.reason?.trim() ? `: ${change.reason.trim()}` : ''}.`;
  if (change.op === 'RESCHEDULE' && change.schedule?.kind === 'ONCE') return `${name} pasa a la ${weekLabel(change.schedule.weekStart)}.`;
  if (change.op === 'REDUCE') return `${name} reduce su carga.`;
  if (change.op === 'SUBSTITUTE') return `${name} se reemplaza por «${change.title?.trim() || 'otra acción'}».`;
  return `${name} cambia.`;
}

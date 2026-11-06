const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function civil(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Rango legible para encabezado de semana, p. ej. 26 oct a 1 nov */
export function formatWeekRange(start: string, end: string): string {
  const a = civil(start);
  const b = civil(end);
  if (a.getUTCFullYear() !== b.getUTCFullYear()) {
    return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} ${a.getUTCFullYear()} a ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()} a ${b.getUTCDate()} ${MONTHS[a.getUTCMonth()]}`;
  }
  return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} a ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]}`;
}

export function weekOffsetFromStart(currentWeekStart: string, targetWeekStart: string): number {
  const a = civil(currentWeekStart).getTime();
  const b = civil(targetWeekStart).getTime();
  const diffDays = Math.round((b - a) / (86400000));
  return Math.round(diffDays / 7);
}

export function buildWeekQuery(input: { planId?: string | null; semana?: string | null; territorio?: string | null }): string {
  const params = new URLSearchParams();
  if (input.planId) params.set('planId', input.planId);
  if (input.semana) params.set('semana', input.semana);
  if (input.territorio) params.set('territorio', input.territorio);
  const q = params.toString();
  return q ? `?${q}` : '';
}

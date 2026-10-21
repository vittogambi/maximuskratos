import { addIsoDays, weekStartMonday } from './civil-date';

export function weekEndSunday(weekStart: string): string {
  return addIsoDays(weekStart, 6);
}

export function datesForWeekday(weekStart: string, weekday: number): string[] {
  const days: string[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addIsoDays(weekStart, offset);
    const [y, m, d] = day.split('-').map(Number);
    const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const iso = w === 0 ? 7 : w;
    if (iso === weekday) days.push(day);
  }
  return days;
}

export function weekStartForDay(day: string): string {
  return weekStartMonday(day);
}

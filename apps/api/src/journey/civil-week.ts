import { addIsoDays, weekStartMonday } from './civil-date';

export function weekEndSunday(weekStart: string): string {
  return addIsoDays(weekStart, 6);
}

export function isoWeekdayFromDay(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function dayMatchesIsoWeekday(day: string, weekday: number): boolean {
  return isoWeekdayFromDay(day) === weekday;
}

export function datesForWeekday(weekStart: string, weekday: number): string[] {
  const days: string[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addIsoDays(weekStart, offset);
    if (dayMatchesIsoWeekday(day, weekday)) days.push(day);
  }
  return days;
}

export function weekStartForDay(day: string): string {
  return weekStartMonday(day);
}

/**
 * Monday when a review's changes start.
 * Never during the reviewed week, and never on a Monday that is already past.
 * If today is Monday, that Monday counts. Otherwise the following one.
 */
export function reviewAppliesFrom(today: string, reviewedWeekStart: string): string {
  const afterReviewed = addIsoDays(reviewedWeekStart, 7);
  const monday = weekStartForDay(today);
  const fromToday = monday === today ? today : addIsoDays(monday, 7);
  return fromToday > afterReviewed ? fromToday : afterReviewed;
}

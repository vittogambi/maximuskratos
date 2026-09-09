import type { SubscriptionContext } from './types';

function parseIsoDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`invalid cycle start ${value}`);
  }
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Monthly subscription window. 25 Aug → 24 Sep. Not 28 fixed days. */
export function projectMonthlyCycle(context: SubscriptionContext): { start: string; end: string } {
  const start = parseIsoDate(context.period_start);
  if (context.period_end && context.billing_cadence === 'MONTHLY') {
    return { start: isoDate(start), end: context.period_end.slice(0, 10) };
  }
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(end.getUTCDate() - 1);
  return { start: isoDate(start), end: isoDate(end) };
}

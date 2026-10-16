const INTERNAL_ALERT_KEYS = new Set(['alertCount', 'auditAlerts']);

/** Drops internal questionnaire alert fields. Index signals are a different object and stay. */
export function withoutInternalAlerts<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => withoutInternalAlerts(item)) as T;
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (INTERNAL_ALERT_KEYS.has(key)) continue;
    out[key] = withoutInternalAlerts(item);
  }
  return out as T;
}

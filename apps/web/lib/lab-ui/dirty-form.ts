/**
 * Dirty state is a real form diff against the last persisted snapshot.
 * Mount, hydration, defaults and normalization must not mark the form dirty.
 */

export function snapshotForm(value: unknown): string {
  return JSON.stringify(normalizeForm(value));
}

export function isDirtyAgainst(current: unknown, baseline: string): boolean {
  return snapshotForm(current) !== baseline;
}

export function formDiffKeys(draft: unknown, persisted: unknown): string[] {
  const left = normalizeForm(draft) as Record<string, unknown> | unknown[];
  const right = normalizeForm(persisted) as Record<string, unknown> | unknown[];
  if (left == null || right == null || typeof left !== 'object' || typeof right !== 'object') {
    return snapshotForm(draft) === snapshotForm(persisted) ? [] : ['$'];
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return snapshotForm(left) === snapshotForm(right) ? [] : ['$'];
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].filter((key) => snapshotForm(left[key]) !== snapshotForm(right[key]));
}

export function normalizeForm(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(normalizeForm);
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, normalizeForm(item)]);
  return Object.fromEntries(entries);
}

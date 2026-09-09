import { createHash } from 'node:crypto';

export function canonicalize(value: unknown): string {
  return JSON.stringify(toCanonical(value));
}

function toCanonical(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => toCanonical(item));
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const out: Record<string, unknown> = {};
    for (const [key, nested] of entries) {
      out[key] = toCanonical(nested);
    }
    return out;
  }
  return String(value);
}

export function sha256Utf8(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function hashDefinition(definition: unknown): string {
  return sha256Utf8(canonicalize(definition));
}

export function hashResult(result: unknown): string {
  const obj = { ...((result ?? {}) as Record<string, unknown>) };
  delete obj.generatedAt;
  return sha256Utf8(canonicalize(obj));
}

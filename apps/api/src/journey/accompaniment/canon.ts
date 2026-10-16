import { createHash } from 'node:crypto';

function stable(value: unknown): string {
  if (value == null) return 'null';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function canonicalHash(value: unknown): string {
  return createHash('sha256').update(stable(value)).digest('hex');
}

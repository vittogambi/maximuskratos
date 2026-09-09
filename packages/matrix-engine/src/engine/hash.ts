import { createHash } from 'node:crypto';
import {
  HASH_INCLUDED_KEYS,
  type JsonValue,
  type MatrixDefinition,
  type ResponseInput,
} from '../types';

export function canonicalize(value: unknown): string {
  return JSON.stringify(toCanonical(value));
}

function toCanonical(value: unknown): JsonValue {
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
    const out: { [key: string]: JsonValue } = {};
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

export function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function methodologicalPayload(
  definition: Omit<MatrixDefinition, 'definition_sha256'> | MatrixDefinition,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of HASH_INCLUDED_KEYS) {
    payload[key] = (definition as Record<string, unknown>)[key];
  }
  return payload;
}

export function definitionSha256(
  definition: Omit<MatrixDefinition, 'definition_sha256'> | MatrixDefinition,
): string {
  return sha256Utf8(canonicalize(methodologicalPayload(definition)));
}

export function hashResponses(responses: ResponseInput[]): string {
  const ordered = [...responses].sort((a, b) =>
    a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0,
  );
  const payload = ordered.map((response) => ({
    qualitativeConfirmed:
      response.qualitativeConfirmed === undefined
        ? null
        : response.qualitativeConfirmed,
    questionId: response.questionId,
    rawValue: response.rawValue,
    status: response.status,
  }));
  return `sha256:${sha256Utf8(canonicalize(payload))}`;
}

export function verifyDefinitionHash(definition: MatrixDefinition): void {
  const computed = definitionSha256(definition);
  if (computed !== definition.definition_sha256) {
    throw new Error(
      `definition_sha256 mismatch: pinned ${definition.definition_sha256} computed ${computed}`,
    );
  }
}

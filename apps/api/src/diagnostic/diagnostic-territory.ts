import { territoryForSourceRef } from '../instrumentos/territory-catalog';
import { TERRITORIES, type Territory } from '../instrumentos/glossary';

export function parseTerritoryParam(raw: string): Territory {
  const upper = raw.trim().toUpperCase();
  if (!(TERRITORIES as readonly string[]).includes(upper)) {
    throw new Error('UNKNOWN_TERRITORY');
  }
  return upper as Territory;
}

export function moduleMatchesTerritory(
  questions: { sourceRef: string | null }[],
  territory: Territory,
): boolean {
  return questions.some((question) => question.sourceRef != null && territoryForSourceRef(question.sourceRef) === territory);
}

export function questionMatchesTerritory(sourceRef: string | null, territory: Territory | null): boolean {
  if (!territory || !sourceRef) return true;
  const mapped = territoryForSourceRef(sourceRef);
  return mapped === territory;
}

export function readFocusTerritory(metadata: unknown): Territory | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = (metadata as Record<string, unknown>).focusTerritory;
  if (typeof raw !== 'string') return null;
  try {
    return parseTerritoryParam(raw);
  } catch {
    return null;
  }
}

export function withFocusTerritory(metadata: unknown, territory: Territory): Record<string, unknown> {
  const base = metadata && typeof metadata === 'object' ? { ...(metadata as Record<string, unknown>) } : {};
  return { ...base, focusTerritory: territory };
}

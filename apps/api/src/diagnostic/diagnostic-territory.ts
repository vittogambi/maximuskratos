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

export function withoutFocusTerritory(metadata: unknown): Record<string, unknown> {
  const base = metadata && typeof metadata === 'object' ? { ...(metadata as Record<string, unknown>) } : {};
  delete base.focusTerritory;
  return base;
}

export function withFocusTerritory(metadata: unknown, territory: Territory): Record<string, unknown> {
  const base = metadata && typeof metadata === 'object' ? { ...(metadata as Record<string, unknown>) } : {};
  return { ...base, focusTerritory: territory };
}

export type ScopedQuestion = { id: string; sourceRef: string | null };

export type PlayableProgress<T extends ScopedQuestion = ScopedQuestion> = {
  status: string;
  outroSeen: boolean;
  module: { questions: T[] };
};

/** Questions of one territory. A missing sourceRef belongs to no territory. */
export function questionsInScope<T extends ScopedQuestion>(questions: T[], territory: Territory | null): T[] {
  if (!territory) return questions;
  return questions.filter((question) => question.sourceRef != null && territoryForSourceRef(question.sourceRef) === territory);
}

/** A module is finished only when every question is settled, not a territory subset. */
export function moduleFullySettled(questions: { id: string }[], settledIds: ReadonlySet<string>): boolean {
  return questions.length > 0 && questions.every((question) => settledIds.has(question.id));
}

/**
 * Next module the player may open.
 * Skips LOCKED modules and modules whose in-scope questions are already settled.
 * A fully settled module still opens when its outro has not been seen.
 * A territory subset being settled does not count as the module outro.
 */
export function selectPlayable<T extends PlayableProgress>(
  progress: T[],
  settledIds: ReadonlySet<string>,
  territory: Territory | null,
): T | null {
  for (const row of progress) {
    if (row.status === 'LOCKED') continue;
    const scope = questionsInScope(row.module.questions, territory);
    if (scope.some((question) => !settledIds.has(question.id))) return row;
  }
  for (const row of progress) {
    if (row.status === 'LOCKED' || row.outroSeen) continue;
    if (moduleFullySettled(row.module.questions, settledIds)) return row;
  }
  return null;
}

/** True when every question mapped to the territory is settled. Other questions in a shared module do not count. */
export function territoryQuestionsSettled<T extends PlayableProgress>(
  progress: T[],
  settledIds: ReadonlySet<string>,
  territory: Territory,
): boolean {
  const questions = progress
    .filter((row) => moduleMatchesTerritory(row.module.questions, territory))
    .flatMap((row) => questionsInScope(row.module.questions, territory));
  return questions.length > 0 && questions.every((question) => settledIds.has(question.id));
}

import { readSynthesis, visiblePurpose } from './purpose-synthesis';
import type { HdrpFacts } from './hdrp-contract';

export type DirectionMode = 'CLEAR' | 'EXPLORE' | 'UNKNOWN';

export type DirectionSources = {
  vision: string | null;
  values: string[];
  ikigaiPurpose: string | null;
};

/** An answer the person chose to start from, copied as it was when the direction was saved. */
export type DirectionSourceSnapshot = { id: string; label: string; text: string };

export type MemberDirectionView = {
  mode: DirectionMode | null;
  statement: string | null;
  desiredChange: string | null;
  directionStatus: string | null;
  revision: number | null;
  purposeRevisionId: string | null;
  updatedAt: string | null;
  sources: DirectionSources;
  /** What this revision was written from. Empty when the person wrote it without earlier answers. */
  sourcesUsed: DirectionSourceSnapshot[];
  plansOnOlderRevision: number;
};

export const DIRECTION_SOURCE_LABELS: Record<keyof DirectionSources, string> = {
  vision: 'Tu respuesta sobre visión',
  values: 'Valores que elegiste',
  ikigaiPurpose: 'Frase de tu cruce IKIGAI',
};

/** Snapshot of the sources the person used, read on the server so the client cannot invent their text. */
export function snapshotSources(sources: DirectionSources, ids: unknown): DirectionSourceSnapshot[] {
  if (!Array.isArray(ids)) return [];
  const wanted = new Set(ids.filter((id): id is string => typeof id === 'string'));
  const rows: DirectionSourceSnapshot[] = [];
  if (wanted.has('vision') && sources.vision) rows.push({ id: 'vision', label: DIRECTION_SOURCE_LABELS.vision, text: sources.vision });
  if (wanted.has('values') && sources.values.length) rows.push({ id: 'values', label: DIRECTION_SOURCE_LABELS.values, text: sources.values.join(', ') });
  if (wanted.has('ikigaiPurpose') && sources.ikigaiPurpose) {
    rows.push({ id: 'ikigaiPurpose', label: DIRECTION_SOURCE_LABELS.ikigaiPurpose, text: sources.ikigaiPurpose });
  }
  return rows;
}

export function readSourcesUsed(content: unknown): DirectionSourceSnapshot[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return [];
  const raw = (content as Record<string, unknown>).directionSources;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    if (typeof item.id !== 'string' || typeof item.label !== 'string' || typeof item.text !== 'string') return [];
    return [{ id: item.id, label: item.label, text: item.text }];
  });
}

export function directionStatusForMode(mode: DirectionMode): string {
  if (mode === 'CLEAR') return 'CONFIRMADO_POR_USUARIO';
  if (mode === 'EXPLORE') return 'PROVISIONAL';
  return 'EXPLORANDO';
}

export function modeFromContent(content: Record<string, unknown>): DirectionMode | null {
  const raw = content.directionMode;
  if (raw === 'CLEAR' || raw === 'EXPLORE' || raw === 'UNKNOWN') return raw;
  const status = content.directionStatus;
  if (status === 'CONFIRMADO_POR_USUARIO') return 'CLEAR';
  if (status === 'PROVISIONAL') return 'EXPLORE';
  if (status === 'EXPLORANDO') return 'UNKNOWN';
  return null;
}

export function readDirectionFields(content: unknown): {
  mode: DirectionMode | null;
  statement: string | null;
  desiredChange: string | null;
  directionStatus: string | null;
} {
  const record = content && typeof content === 'object' && !Array.isArray(content)
    ? (content as Record<string, unknown>)
    : {};
  const statement = typeof record.statement === 'string' ? record.statement.trim() || null : null;
  const desiredChange = typeof record.desiredChange === 'string' ? record.desiredChange.trim() || null : null;
  const directionStatus = typeof record.directionStatus === 'string' ? record.directionStatus : null;
  return {
    mode: modeFromContent(record),
    statement,
    desiredChange,
    directionStatus,
  };
}

export function buildDirectionSources(facts: HdrpFacts | null, purposeContent: unknown): DirectionSources {
  const synthesis = readSynthesis(purposeContent);
  const ikigaiPurpose = visiblePurpose(synthesis.purpose);
  return {
    vision: facts?.vision?.trim() || null,
    values: (facts?.values ?? []).slice(0, 3),
    ikigaiPurpose,
  };
}

export function buildMemberDirectionView(input: {
  purpose: { id: string; revision: number; content: unknown; createdAt: Date } | null;
  facts: HdrpFacts | null;
  plansOnOlderRevision: number;
}): MemberDirectionView {
  const fields = readDirectionFields(input.purpose?.content ?? null);
  return {
    ...fields,
    revision: input.purpose?.revision ?? null,
    purposeRevisionId: input.purpose?.id ?? null,
    updatedAt: input.purpose?.createdAt.toISOString() ?? null,
    sources: buildDirectionSources(input.facts, input.purpose?.content ?? null),
    sourcesUsed: readSourcesUsed(input.purpose?.content ?? null),
    plansOnOlderRevision: input.plansOnOlderRevision,
  };
}

export type SaveMemberDirectionInput = {
  mode: DirectionMode;
  statement?: string | null;
  desiredChange?: string | null;
  commandKey?: string | null;
  sources?: DirectionSourceSnapshot[];
};

export function mergeDirectionContent(
  previous: Record<string, unknown>,
  input: SaveMemberDirectionInput,
): Record<string, unknown> {
  const statement = input.statement?.trim() ?? (typeof previous.statement === 'string' ? previous.statement : '');
  const desiredChange = input.desiredChange?.trim() ?? '';
  return {
    ...previous,
    directionMode: input.mode,
    directionStatus: directionStatusForMode(input.mode),
    statement,
    desiredChange,
    directionSources: input.sources ?? [],
    directionSavedAt: new Date().toISOString(),
    ...(input.commandKey?.trim() ? { directionCommandKey: input.commandKey.trim() } : {}),
  };
}

import { TERRITORIES, type Territory } from './glossary';

export type TerritoryCoverageState = 'NOT_STARTED' | 'PARTIAL' | 'EXPLORED';

export type TerritoryCoverage = {
  territory: Territory;
  required: number;
  settled: number;
  pending: number;
  exceptions: { UNKNOWN: number; NOT_APPLICABLE: number; DECLINED: number };
  state: TerritoryCoverageState;
};

export type CatalogQuestion = {
  sourceRef: string;
  exceptionOrigin?: string | null;
};

export type CoverageResponse = {
  exceptionKind?: string | null;
  exceptionOrigin?: string | null;
  skipped?: boolean;
  freeText?: string | null;
  selectedOptionIds?: string[];
};

const AUDIT_ROW = /^formulario-v1:E-AUD-001!R(\d+)$/i;
const RAD_SHEET = /^formulario-v1:(F-RAD-\d{3})!/i;

const MENTALIDAD_ROWS = new Set([6, 7, 8, 9, 10, 19, 20, 26, 27, 29, 30]);
const SALUD_AUDIT_ROWS = new Set([16, 17, 18]);
const RELACIONES_AUDIT_ROWS = new Set([28, 46, 47, 48, 49]);
const FINANZAS_AUDIT_ROWS = new Set([37, 38, 39, 40]);

/** Explicit sourceRef sets per territory (section 8 of PLAN_MAESTRO_RECORRIDO). */
export const TERRITORY_SOURCES: Record<Territory, readonly string[]> = {
  MENTALIDAD: [],
  FINANZAS: [],
  RELACIONES: [],
  SALUD_FISICA: [],
};

export function territoryForSourceRef(sourceRef: string): Territory | null {
  const audit = AUDIT_ROW.exec(sourceRef);
  if (audit) {
    const row = Number(audit[1]);
    if (MENTALIDAD_ROWS.has(row)) return 'MENTALIDAD';
    if (SALUD_AUDIT_ROWS.has(row)) return 'SALUD_FISICA';
    if (RELACIONES_AUDIT_ROWS.has(row)) return 'RELACIONES';
    if (FINANZAS_AUDIT_ROWS.has(row)) return 'FINANZAS';
    return null;
  }
  const rad = RAD_SHEET.exec(sourceRef);
  if (!rad) return null;
  const sheet = rad[1].toUpperCase();
  if (sheet === 'F-RAD-001') return 'SALUD_FISICA';
  if (sheet === 'F-RAD-002') return 'RELACIONES';
  if (sheet === 'F-RAD-003') return 'FINANZAS';
  return null;
}

export function buildTerritorySourcesFromCatalog(questions: { sourceRef: string }[]): Record<Territory, string[]> {
  const out: Record<Territory, string[]> = {
    MENTALIDAD: [],
    FINANZAS: [],
    RELACIONES: [],
    SALUD_FISICA: [],
  };
  for (const question of questions) {
    const territory = territoryForSourceRef(question.sourceRef);
    if (!territory) continue;
    if (!out[territory].includes(question.sourceRef)) out[territory].push(question.sourceRef);
  }
  for (const territory of TERRITORIES) {
    out[territory].sort();
  }
  return out;
}

function isSettled(response: CoverageResponse | undefined): boolean {
  if (!response) return false;
  if (response.exceptionKind === 'PENDING' && response.exceptionOrigin !== 'CONDITION') return false;
  if (response.skipped) return true;
  if (response.exceptionKind === 'PENDING') return true;
  if (response.exceptionKind === 'UNKNOWN' || response.exceptionKind === 'NOT_APPLICABLE' || response.exceptionKind === 'DECLINED') {
    return true;
  }
  if ((response.freeText ?? '').trim().length > 0) return true;
  return (response.selectedOptionIds?.length ?? 0) > 0;
}

function countsAsRequired(question: CatalogQuestion): boolean {
  return question.exceptionOrigin !== 'CONDITION';
}

export function territoryCoverage(
  questions: CatalogQuestion[],
  responses: Record<string, CoverageResponse>,
): TerritoryCoverage[] {
  const byTerritory = buildTerritorySourcesFromCatalog(questions);
  return TERRITORIES.map((territory) => {
    const refs = byTerritory[territory];
    const requiredQuestions = questions.filter(
      (q) => refs.includes(q.sourceRef) && countsAsRequired(q),
    );
    const required = requiredQuestions.length;
    let settled = 0;
    let pending = 0;
    const exceptions = { UNKNOWN: 0, NOT_APPLICABLE: 0, DECLINED: 0 };
    for (const question of requiredQuestions) {
      const response = responses[question.sourceRef];
      if (!isSettled(response)) {
        pending += 1;
        continue;
      }
      const kind = response?.exceptionKind;
      if (kind === 'UNKNOWN' || kind === 'NOT_APPLICABLE' || kind === 'DECLINED') {
        exceptions[kind] += 1;
      }
      settled += 1;
    }
    let state: TerritoryCoverageState = 'NOT_STARTED';
    if (required === 0) state = 'NOT_STARTED';
    else if (settled === 0) state = 'NOT_STARTED';
    else if (settled < required) state = 'PARTIAL';
    else state = 'EXPLORED';
    return { territory, required, settled, pending, exceptions, state };
  });
}

export type TerritoryExceptionKind = 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED';

export type TerritoryExceptionRow = {
  sourceRef: string;
  prompt: string;
  kind: TerritoryExceptionKind;
};

/** Saved user exceptions for one territory. Same kinds the coverage count uses. No answer text. */
export function territoryExceptionRows(
  territory: Territory,
  questions: { sourceRef: string; textEs?: string | null }[],
  responses: Record<string, CoverageResponse>,
): TerritoryExceptionRow[] {
  const refs = new Set(buildTerritorySourcesFromCatalog(questions)[territory]);
  const rows: TerritoryExceptionRow[] = [];
  for (const question of questions) {
    if (!refs.has(question.sourceRef)) continue;
    const kind = responses[question.sourceRef]?.exceptionKind;
    if (kind !== 'UNKNOWN' && kind !== 'NOT_APPLICABLE' && kind !== 'DECLINED') continue;
    const prompt = question.textEs?.trim() || question.sourceRef;
    rows.push({ sourceRef: question.sourceRef, prompt, kind });
  }
  return rows;
}

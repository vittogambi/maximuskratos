const PLACEHOLDERS = new Set(['dada', 'n/a', 'na', 'todo', 'test', 'asd', 'xxx', '.']);

function clean(value: string | null | undefined) {
  return (value ?? '').trim();
}

export function findingOpenReady(input: {
  title?: string | null;
  current_behavior?: string | null;
  currentBehavior?: string | null;
  rafa_expected_behavior?: string | null;
  rafaExpectedBehavior?: string | null;
  layer?: string | null;
  severity?: string | null;
  caseCount?: number;
  evidenceCount?: number;
  global?: boolean;
}): { ok: boolean; missing: string[] } {
  const title = clean(input.title);
  const current = clean(input.current_behavior ?? input.currentBehavior);
  const expected = clean(input.rafa_expected_behavior ?? input.rafaExpectedBehavior);
  const missing: string[] = [];
  if (title.length < 8) missing.push('Qué está mal');
  if (current.length < 8) missing.push('Qué ocurre hoy');
  if (expected.length < 12 || PLACEHOLDERS.has(expected.toLowerCase())) {
    missing.push('Qué esperaba el revisor');
  }
  if (!clean(input.layer)) missing.push('Capa afectada');
  if (!clean(input.severity)) missing.push('Severidad');
  if (!input.global && (input.caseCount ?? 0) < 1) missing.push('Al menos un caso');
  if (!input.global && (input.evidenceCount ?? 0) < 1 && (input.caseCount ?? 0) < 1) {
    missing.push('Evidencia');
  }
  return { ok: missing.length === 0, missing };
}

export function findingEffectiveStatus(
  status: string,
  ready: boolean,
): string {
  if (status === 'OPEN' && !ready) return 'DRAFT';
  return status;
}

export function isBlockingFindingStatus(status: string) {
  return ['OPEN', 'NEEDS_MORE_CASES', 'WORTH_TESTING', 'CHANGE_IN_TEST'].includes(status);
}

export type FindingScope = 'MATRIX' | 'DIRECCION' | 'INTERFAZ';

export function findingScope(layer: string | null | undefined): FindingScope {
  if (layer === 'PURPOSE_OUTSIDE') return 'DIRECCION';
  if (layer === 'INTERPRETATION' || layer === 'QUESTION_CONTENT' || layer === 'OTHER') return 'INTERFAZ';
  return 'MATRIX';
}

export function findingBlocksMatrix(input: {
  layer: string | null | undefined;
  severity: string | null | undefined;
  status: string | null | undefined;
}): boolean {
  if (findingScope(input.layer) === 'DIRECCION') return false;
  if (!isBlockingFindingStatus(input.status ?? '')) return false;
  return input.severity === 'CRITICAL' || input.severity === 'IMPORTANT';
}

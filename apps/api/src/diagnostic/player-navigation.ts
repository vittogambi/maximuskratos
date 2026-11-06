import { AUDIT_IDS } from '../instrumentos/score';
import { auditSignals } from '../instrumentos/signals';
import { auditSheetDiagnostic } from '../instrumentos/formulario-diagnostic';
import { scoreAudit } from '../instrumentos/score';
import type { ExceptionKind, FormularioAnswer, InstrumentResult } from '../instrumentos/types';
import { isSettled } from './answer-rules';

type QuestionRow = {
  id: string;
  order: number;
  sourceRef: string | null;
  moduleSlug?: string;
};

type ResponseRow = {
  questionId: string;
  skipped: boolean;
  exceptionOrigin: string | null;
  selectedOptionIds: string[];
  freeText: string | null;
  exceptionKind: string | null;
  rankingOrder: string[];
  revision: number;
};

export type SavedAnswerDto = {
  selectedOptionIds: string[];
  freeText: string | null;
  exceptionKind: string | null;
  rankingOrder: string[];
};

export type AreaSectionDto = {
  slug: string;
  titleEs: string;
  answered: number;
  total: number;
  current: boolean;
};

export type AuditCloseSectionDto = {
  slug: string;
  titleEs: string;
  sum: number;
  max: number;
  status: 'review' | 'ok';
  markLabel: string;
};

export type AuditCloseDto = {
  diagnostic: string | null;
  total: number | null;
  totalMax: number;
  sections: AuditCloseSectionDto[];
  revisitQuestionId: string | null;
  senseNote: string;
  incompleteNote: string | null;
};

const AUDIT_CLOSE_SLUGS = ['e-aud-s1', 'e-aud-s2', 'e-aud-s3', 'e-aud-s4', 'e-aud-s5'] as const;
const AUDIT_PART_KEYS = ['s1', 's2', 's3', 's4', 's5'] as const;
const AUDIT_PART_MAX: Record<(typeof AUDIT_PART_KEYS)[number], number> = {
  s1: 25,
  s2: 25,
  s3: 25,
  s4: 20,
  s5: 20,
};

/** Groups modules that share the same form sheet prefix for section progress UI. */
export function areaGroupPrefix(moduleSlug: string | null | undefined): string | null {
  if (!moduleSlug) return null;
  if (moduleSlug.startsWith('e-aud')) return 'e-aud';
  if (moduleSlug.startsWith('f-rad-001')) return 'f-rad-001';
  if (moduleSlug.startsWith('f-rad-002')) return 'f-rad-002';
  if (moduleSlug.startsWith('f-rad-003')) return 'f-rad-003';
  if (moduleSlug.startsWith('e-per')) return 'e-per';
  return moduleSlug.split('-').slice(0, 2).join('-');
}

export function modulesInArea<T extends { module: { slug: string; order: number } }>(
  progress: T[],
  prefix: string | null,
): T[] {
  if (!prefix) return [];
  return progress
    .filter((p) => areaGroupPrefix(p.module.slug) === prefix)
    .sort((a, b) => a.module.order - b.module.order);
}

export function isConditionHidden(response: ResponseRow | undefined): boolean {
  return Boolean(response?.skipped && response.exceptionOrigin === 'CONDITION');
}

/** Visible questions in play order for one module. */
export function visibleModuleQuestions(
  questions: QuestionRow[],
  responseByQuestion: Map<string, ResponseRow>,
): QuestionRow[] {
  return questions.filter((q) => !isConditionHidden(responseByQuestion.get(q.id)));
}

/** Global visible question order across all unlocked modules in the session. */
export function visibleQuestionTrail(
  moduleProgress: { module: { slug: string; order: number; questions: QuestionRow[] } }[],
  responseByQuestion: Map<string, ResponseRow>,
): QuestionRow[] {
  const sorted = [...moduleProgress].sort((a, b) => a.module.order - b.module.order);
  const trail: QuestionRow[] = [];
  for (const entry of sorted) {
    for (const question of visibleModuleQuestions(entry.module.questions, responseByQuestion)) {
      trail.push({ ...question, moduleSlug: entry.module.slug });
    }
  }
  return trail;
}

export function questionNavMeta(
  trail: { id: string; moduleSlug?: string }[],
  questionId: string,
): { previousQuestionId: string | null; isFirstInModule: boolean } {
  const index = trail.findIndex((item) => item.id === questionId);
  if (index < 0) return { previousQuestionId: null, isFirstInModule: false };
  const previous = index > 0 ? trail[index - 1] : null;
  const current = trail[index]!;
  return {
    previousQuestionId: previous?.id ?? null,
    isFirstInModule: !previous || previous.moduleSlug !== current.moduleSlug,
  };
}

export function savedAnswerFromResponse(response: ResponseRow | undefined): SavedAnswerDto | null {
  if (!response || !isSettled(response)) return null;
  return {
    selectedOptionIds: response.selectedOptionIds ?? [],
    freeText: response.freeText,
    exceptionKind: response.exceptionKind,
    rankingOrder: response.rankingOrder ?? [],
  };
}

export function areaSectionsFor(
  areaModules: { module: { slug: string; titleEs: string; questions: QuestionRow[] } }[],
  responseByQuestion: Map<string, ResponseRow>,
  currentModuleSlug: string | null,
): AreaSectionDto[] {
  return areaModules.map(({ module }) => {
    const visible = visibleModuleQuestions(module.questions, responseByQuestion);
    const answered = visible.filter((q) => isSettled(responseByQuestion.get(q.id) ?? null)).length;
    return {
      slug: module.slug,
      titleEs: module.titleEs,
      answered,
      total: visible.length,
      current: module.slug === currentModuleSlug,
    };
  });
}

/** Módulo inmediatamente anterior en el orden del cuestionario. */
export function previousModuleSlug(
  moduleProgress: { module: { slug: string; order: number } }[],
  currentModuleSlug: string,
): string | null {
  const sorted = [...moduleProgress].sort((a, b) => a.module.order - b.module.order);
  const index = sorted.findIndex((entry) => entry.module.slug === currentModuleSlug);
  if (index <= 0) return null;
  return sorted[index - 1]!.module.slug;
}

function numericFromResponse(
  response: ResponseRow | undefined,
  optionValues: Map<string, string>,
): number | null {
  if (!response || response.exceptionKind) return null;
  const id = response.selectedOptionIds[0];
  if (!id) return null;
  const raw = optionValues.get(id);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function buildAuditClose(
  moduleProgress: { module: { slug: string; titleEs: string; questions: { id: string; sourceRef: string | null; options: { id: string; value: string }[] }[] } }[],
  responses: ResponseRow[],
): AuditCloseDto {
  const allQuestions = moduleProgress.flatMap((p) => p.module.questions);
  const optionValue = new Map<string, string>();
  for (const q of allQuestions) {
    for (const opt of q.options) optionValue.set(opt.id, opt.value);
  }
  const byRef = new Map(allQuestions.map((q) => [q.sourceRef, q]));
  const answers: FormularioAnswer[] = AUDIT_IDS.map((ref) => {
    const q = byRef.get(ref);
    const response = q ? responses.find((r) => r.questionId === q.id) : undefined;
    return {
      id: ref,
      value: q ? numericFromResponse(response, optionValue) : null,
      exception: (response?.exceptionKind as ExceptionKind | null) ?? null,
    };
  });
  const audit = scoreAudit(answers);
  const fired = new Set(
    auditSignals(answers).filter((s) => s.status === 'FIRED').map((s) => s.questionId),
  );
  const rowSection = (ref: string): (typeof AUDIT_PART_KEYS)[number] | null => {
    const row = Number(/!R(\d+)$/.exec(ref)?.[1]);
    if (!Number.isFinite(row)) return null;
    if (row >= 6 && row <= 10) return 's1';
    if (row >= 16 && row <= 20) return 's2';
    if (row >= 26 && row <= 30) return 's3';
    if (row >= 37 && row <= 40) return 's4';
    if (row >= 46 && row <= 49) return 's5';
    return null;
  };
  const sectionHasAlert = (key: (typeof AUDIT_PART_KEYS)[number]): boolean => {
    for (const ref of AUDIT_IDS) {
      if (rowSection(ref) !== key) continue;
      if (fired.has(ref)) return true;
    }
    return false;
  };
  const modulesBySlug = new Map(moduleProgress.map((p) => [p.module.slug, p.module]));
  const sections: AuditCloseSectionDto[] = AUDIT_CLOSE_SLUGS.map((slug, index) => {
    const key = AUDIT_PART_KEYS[index]!;
    const part = audit.parts?.[key] as InstrumentResult | undefined;
    const sum = part?.value ?? part?.partial ?? 0;
    const mod = modulesBySlug.get(slug);
    const status = sectionHasAlert(key) ? 'review' as const : 'ok' as const;
    return {
      slug,
      titleEs: mod?.titleEs ?? slug,
      sum,
      max: AUDIT_PART_MAX[key],
      status,
      markLabel: status === 'review' ? 'Conviene revisar' : 'En orden',
    };
  });
  const totalScored = audit.calculable && audit.value != null ? audit.value : null;
  const s6 = modulesBySlug.get('e-aud-s6');
  const lastSense = s6?.questions[s6.questions.length - 1]?.id ?? null;
  return {
    diagnostic: totalScored != null ? auditSheetDiagnostic(totalScored) : null,
    total: totalScored,
    totalMax: 115,
    sections,
    revisitQuestionId: lastSense,
    senseNote: 'Estas diez respuestas quedan aparte.',
    incompleteNote: audit.calculable
      ? null
      : 'Falta al menos una respuesta de las cinco primeras secciones de la auditoría.',
  };
}

export function resolveNavigationQuestion(
  trail: QuestionRow[],
  mode: { atQuestionId?: string; afterQuestionId?: string },
): QuestionRow | null {
  if (mode.atQuestionId) {
    return trail.find((q) => q.id === mode.atQuestionId) ?? null;
  }
  if (mode.afterQuestionId) {
    const index = trail.findIndex((q) => q.id === mode.afterQuestionId);
    if (index < 0) return null;
    return trail[index + 1] ?? null;
  }
  return null;
}

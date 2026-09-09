import { CASEBOOK_FAMILIES } from './lab-casebook';
import {
  hydrateCatalog,
  isDocumentedV2,
  isLaterProposal,
  isQueuedFidelity,
  isQueuedRefinement,
  isVisibleCorrection,
} from './lab-review-catalog';
import type { MethodologyProvenance } from './lab-provenance';

export const DIRECTION_FAMILY_ID = 'purpose_silent';

export const METHODOLOGY_RULE =
  'Cada decisión metodológica mantiene registrado de dónde viene y qué cambió.';

const RESOLVED = new Set(['Validada', 'Con hallazgo', 'Necesita evidencia']);

export type FamilyLite = {
  id: string;
  label: string;
  question?: string | null;
  intro?: string | null;
  status: string;
  needs_fixture?: boolean;
  review_surface?: 'matrix' | 'frontier' | 'qa';
};

export type ReviewNext = {
  track: 'matrix' | 'fidelity' | 'direction' | 'refinement' | 'ready';
  title: string;
  lead: string;
  href: string;
  cta: string;
  done_prompt: string | null;
};

export type ReviewTrack = {
  id: 'matrix' | 'fidelity' | 'direction';
  title: string;
  question: string;
  done: number;
  total: number;
  href: string;
  cta: string;
  note?: string | null;
};

export type ReviewAgenda = {
  rule: string;
  tracks: ReviewTrack[];
  next: ReviewNext;
  fidelity_queue: MethodologyProvenance[];
  refinements_queue: MethodologyProvenance[];
  documented: MethodologyProvenance[];
  corrections: MethodologyProvenance[];
  later: MethodologyProvenance[];
  summary: {
    matrix_resolved: number;
    matrix_total: number;
    fidelity_resolved: number;
    fidelity_total: number;
    fidelity_recovered_direction: number;
    fidelity_later: number;
    fidelity_pending_matrix: number;
    fidelity_recovered_matrix: number;
    direction_resolved: number;
    direction_total: number;
    refinements_approved: number;
    refinements_later: number;
    refinements_pending: number;
    refinements_that_modify_matrix: number;
  };
};

function matrixFamilies(families: FamilyLite[]) {
  return families.filter(
    (item) => item.id !== DIRECTION_FAMILY_ID && item.review_surface !== 'frontier' && item.review_surface !== 'qa',
  );
}

function isResolved(status: string) {
  return RESOLVED.has(status);
}

function pendingFidelity(items: MethodologyProvenance[]) {
  return items.filter((item) => isQueuedFidelity(item) && !item.rafa_verdict);
}

function pendingRefinement(items: MethodologyProvenance[]) {
  return items.filter((item) => isQueuedRefinement(item) && !item.rafa_verdict);
}

export function buildReviewAgenda(input: {
  families: FamilyLite[];
  stored: Array<{ id: string; rafaVerdict: string | null; rafaNote: string | null }>;
}): ReviewAgenda {
  const catalog = hydrateCatalog(input.stored);
  const matrix = matrixFamilies(input.families);
  const direction = input.families.find((item) => item.id === DIRECTION_FAMILY_ID);
  const matrixResolved = matrix.filter((item) => isResolved(item.status));
  const nextMatrix = matrix.find((item) => item.status === 'Pendiente' || item.status === 'En revisión');
  const fidelityQueue = catalog.filter(isQueuedFidelity);
  const fidelityPending = pendingFidelity(catalog);
  const directionResolved = direction && isResolved(direction.status) ? 1 : 0;
  const refinementsQueue = catalog.filter(isQueuedRefinement);
  const refinementPending = pendingRefinement(catalog);

  const matrixHref = nextMatrix ? `/admin/lab/families/${nextMatrix.id}` : '/admin/lab';
  const fidelityHref = fidelityPending[0]
    ? `/admin/lab/findings/migrations#${fidelityPending[0].id}`
    : '/admin/lab/findings/migrations';
  const directionHref = `/admin/lab/families/${DIRECTION_FAMILY_ID}`;

  const tracks: ReviewTrack[] = [
    {
      id: 'matrix',
      title: 'Pruebas de Matriz',
      question: 'Revisa casos y decide si la lectura de la Matriz te parece correcta y defendible.',
      done: matrixResolved.length,
      total: matrix.length,
      href: matrixHref,
      cta: nextMatrix ? 'Seguir revisando' : 'Ver pruebas',
    },
    {
      id: 'fidelity',
      title: 'Cambios desde los Excel',
      question: 'Revisa si al pasar de los Excel originales a Matriz v2 se perdió o cambió algo importante.',
      done: fidelityQueue.length - fidelityPending.length,
      total: fidelityQueue.length,
      href: fidelityHref,
      cta: fidelityPending.length ? 'Revisar cambios' : 'Ver decisiones',
    },
    {
      id: 'direction',
      title: 'Matriz y Dirección',
      question: 'Comprueba que lo que la persona expresa sobre hacia dónde quiere ir no cambie el diagnóstico.',
      done: directionResolved,
      total: 1,
      href: directionHref,
      cta: directionResolved ? 'Ver prueba' : 'Revisar',
      note: 'Dirección v0.1 · En definición',
    },
  ];

  const next = nextAction({
    nextMatrix,
    matrixDone: matrixResolved.length === matrix.length,
    fidelityPending,
    direction,
    directionResolved: Boolean(directionResolved),
    refinementPending,
  });

  return {
    rule: METHODOLOGY_RULE,
    tracks,
    next,
    fidelity_queue: fidelityQueue,
    refinements_queue: refinementsQueue,
    documented: catalog.filter(isDocumentedV2),
    corrections: catalog.filter(isVisibleCorrection),
    later: catalog.filter(isLaterProposal),
    summary: {
      matrix_resolved: matrixResolved.length,
      matrix_total: matrix.length,
      fidelity_resolved: fidelityQueue.length - fidelityPending.length,
      fidelity_total: fidelityQueue.length,
      fidelity_recovered_direction: fidelityQueue.filter((item) => item.rafa_verdict === 'RECOVER_DIRECTION').length,
      fidelity_later: fidelityQueue.filter((item) => item.rafa_verdict === 'ARCHIVE_LEGACY').length,
      fidelity_pending_matrix: fidelityPending.length,
      fidelity_recovered_matrix: fidelityQueue.filter((item) => item.rafa_verdict === 'RECOVER_MATRIX').length,
      direction_resolved: directionResolved,
      direction_total: 1,
      refinements_approved: refinementsQueue.filter((item) => item.rafa_verdict === 'CONFIRM').length,
      refinements_later: catalog.filter(isLaterProposal).length,
      refinements_pending: refinementPending.length,
      refinements_that_modify_matrix: catalog.filter(
        (item) => item.blocks_matrix && item.decision_status === 'PENDING_RAFA',
      ).length,
    },
  };
}

function nextAction(input: {
  nextMatrix?: FamilyLite;
  matrixDone: boolean;
  fidelityPending: MethodologyProvenance[];
  direction?: FamilyLite;
  directionResolved: boolean;
  refinementPending: MethodologyProvenance[];
}): ReviewNext {
  if (input.nextMatrix) {
    return {
      track: 'matrix',
      title: input.nextMatrix.label,
      lead: input.nextMatrix.question ?? 'Esta prueba revisa si la lectura de la Matriz se defiende.',
      href: `/admin/lab/families/${input.nextMatrix.id}`,
      cta: 'Continuar',
      done_prompt: null,
    };
  }
  if (input.fidelityPending[0]) {
    const item = input.fidelityPending[0];
    return {
      track: 'fidelity',
      title: item.title,
      lead: item.why_pending ?? item.change_summary,
      href: `/admin/lab/findings/migrations#${item.id}`,
      cta: 'Continuar',
      done_prompt: input.matrixDone
        ? `Ya terminaste las pruebas de Matriz. Quedan ${input.fidelityPending.length} decisiones de fidelidad.`
        : null,
    };
  }
  if (!input.directionResolved) {
    return {
      track: 'direction',
      title: input.direction?.label ?? 'Dirección distinta, mismo diagnóstico',
      lead:
        input.direction?.intro?.split('\n\n')[0] ??
        input.direction?.question ??
        'Comprueba que lo que la persona expresa sobre hacia dónde quiere ir no cambie el diagnóstico.',
      href: `/admin/lab/families/${DIRECTION_FAMILY_ID}`,
      cta: 'Continuar',
      done_prompt: 'Ya terminaste las pruebas de Matriz. Queda revisar la frontera Matriz / Dirección.',
    };
  }
  if (input.refinementPending[0]) {
    const item = input.refinementPending[0];
    return {
      track: 'refinement',
      title: item.title,
      lead: item.why_pending ?? item.change_summary,
      href: `/admin/lab/findings/migrations#${item.id}`,
      cta: 'Revisar refinamiento',
      done_prompt: 'Los tres bloques de revisión pueden cerrarse. Queda un refinamiento posterior que no modifica la Matriz.',
    };
  }
  return {
    track: 'ready',
    title: 'Revisión final',
    lead: 'Cuando los tres gates de Matriz estén verdes y no queden hallazgos que la bloqueen, puedes marcarla lista para la siguiente etapa.',
    href: '/admin/lab/readiness',
    cta: 'Abrir revisión final',
    done_prompt: 'No queda un siguiente pendiente de metodología para Matriz.',
  };
}

export function matrixTrackFamilies() {
  return CASEBOOK_FAMILIES.filter((item) => item.review_surface === 'matrix');
}

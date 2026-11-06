import type { MatrixPlan, MatrixRow } from '@/lib/journey-api';

export type DashboardNext = {
  kind:
    | 'choose'
    | 'empty'
    | 'draft'
    | 'active'
    | 'maintenance'
    | 'review'
    | 'paused'
    | 'return'
    | 'closed'
    | 'records';
  eyebrow: string | null;
  title: string;
  description: string;
  primaryAction: string;
  primaryHref: string | null;
  secondaryAction: string | null;
  secondaryHref: string | null;
  meta: string | null;
  focusMatrix: boolean;
  planId: string | null;
  resumePaused: boolean;
  /** @deprecated use primaryAction */
  action: string;
  /** @deprecated use primaryHref */
  href: string | null;
};

type ReturnCue = {
  headline: string | null;
  protectedNote: string | null;
  daysAway: number | null;
  stage?: string | null;
  planId?: string | null;
} | null;

type NextInput = {
  reviewAt: string | null;
};

function firstPlan(rows: MatrixRow[], stage: MatrixPlan['stage']): MatrixPlan | null {
  return rows.find((row) => row.plan?.stage === stage)?.plan ?? null;
}

function rowForPlan(rows: MatrixRow[], planId: string | null | undefined): MatrixRow | null {
  if (!planId) return null;
  return rows.find((row) => row.plan?.id === planId) ?? null;
}

function needsReview(plan: MatrixPlan): boolean {
  return plan.week?.percentReason === 'NO_INFORMATION';
}

function nextLine(plan: MatrixPlan): string {
  if (plan.nextOccasion) return `Tu próxima acción es: ${plan.nextOccasion.title}.`;
  const open = plan.week ? plan.week.upcoming + plan.week.dueUnmarked : 0;
  if (open === 1) return 'Te queda 1 registro por completar esta semana.';
  if (open > 1) return `Te quedan ${open} registros por completar esta semana.`;
  return 'No tienes otra acción programada por ahora.';
}

const EMPTY_HOME_DESCRIPTION =
  'Elige algo importante para ti. Puedes crear un plan directamente o explorar tus respuestas para encontrar por dónde empezar.';

function reviewMeta(reviewAt: string | null): string | null {
  if (!reviewAt) return null;
  const label = civilDayLabel(reviewAt);
  return label ? `Revisión · ${label}` : null;
}

function withLegacy(next: Omit<DashboardNext, 'action' | 'href'>): DashboardNext {
  return {
    ...next,
    action: next.primaryAction,
    href: next.primaryHref,
  };
}

function activePresentation(
  plan: MatrixPlan,
  row: MatrixRow | null,
  reviewAt: string | null,
  maintenance: boolean,
): DashboardNext {
  const territory = row?.label ?? 'Plan';
  return withLegacy({
    kind: maintenance ? 'maintenance' : 'active',
    eyebrow: maintenance ? `${territory} · Mantenimiento` : `${territory} · Plan activo`,
    title: 'Tu siguiente paso',
    description: nextLine(plan),
    primaryAction: 'Ir a mi semana',
    primaryHref: `/semana?planId=${encodeURIComponent(plan.id)}`,
    secondaryAction: 'Ver plan',
    secondaryHref: `/planes/${plan.id}`,
    meta: reviewMeta(reviewAt),
    focusMatrix: false,
    planId: plan.id,
    resumePaused: false,
  });
}

/** Una sola orientación. El resto de decisiones sigue visible en la matriz. */
export function dashboardNextStep(rows: MatrixRow[], retorno: ReturnCue, input: NextInput = { reviewAt: null }): DashboardNext {
  const reviewAt = input.reviewAt;

  if (retorno?.stage === 'PAUSED' && retorno.planId) {
    const row = rowForPlan(rows, retorno.planId);
    return withLegacy({
      kind: 'paused',
      eyebrow: row?.label ? `${row.label} · Pausa` : 'Plan en pausa',
      title: retorno.headline || row?.plan?.title || 'Tu plan está en pausa',
      description: retorno.protectedNote || 'Puedes retomarlo cuando tenga sentido para ti.',
      primaryAction: 'Retomar el plan',
      primaryHref: null,
      secondaryAction: 'Ver plan',
      secondaryHref: `/planes/${retorno.planId}`,
      meta: null,
      focusMatrix: false,
      planId: retorno.planId,
      resumePaused: true,
    });
  }

  if ((retorno?.daysAway ?? 0) >= 7 && retorno?.headline) {
    return withLegacy({
      kind: 'return',
      eyebrow: 'Retorno',
      title: retorno.headline,
      description: retorno.protectedNote || 'Puedes continuar desde donde lo dejaste.',
      primaryAction: 'Ver la semana',
      primaryHref: '/semana',
      secondaryAction: null,
      secondaryHref: null,
      meta: null,
      focusMatrix: false,
      planId: retorno.planId ?? null,
      resumePaused: false,
    });
  }

  const focus = rows.find((row) => row.plan?.isFocus)?.plan ?? null;

  if (focus && (focus.stage === 'ACTIVE' || focus.stage === 'MAINTENANCE') && needsReview(focus)) {
    const row = rowForPlan(rows, focus.id);
    return withLegacy({
      kind: 'records',
      eyebrow: row?.label ? `${row.label} · Seguimiento` : 'Seguimiento',
      title: 'Hay acciones por revisar',
      description: `${focus.title} todavía no tiene el seguimiento completo.`,
      primaryAction: 'Revisar mi semana',
      primaryHref: `/semana?planId=${encodeURIComponent(focus.id)}`,
      secondaryAction: 'Ver plan',
      secondaryHref: `/planes/${focus.id}`,
      meta: reviewMeta(reviewAt),
      focusMatrix: false,
      planId: focus.id,
      resumePaused: false,
    });
  }

  if (focus?.stage === 'PAUSED') {
    const row = rowForPlan(rows, focus.id);
    return withLegacy({
      kind: 'paused',
      eyebrow: row?.label ? `${row.label} · Pausa` : null,
      title: 'Tu plan está en pausa',
      description: `${focus.title}. Puedes retomarlo cuando tenga sentido para ti.`,
      primaryAction: 'Retomar el plan',
      primaryHref: null,
      secondaryAction: 'Ver plan',
      secondaryHref: `/planes/${focus.id}`,
      meta: null,
      focusMatrix: false,
      planId: focus.id,
      resumePaused: true,
    });
  }

  if (focus && (focus.stage === 'ACTIVE' || focus.stage === 'MAINTENANCE')) {
    return activePresentation(focus, rowForPlan(rows, focus.id), reviewAt, focus.stage === 'MAINTENANCE');
  }

  const review = rows.find((row) => row.plan && (row.plan.stage === 'ACTIVE' || row.plan.stage === 'MAINTENANCE') && needsReview(row.plan));
  if (review?.plan) {
    return withLegacy({
      kind: 'records',
      eyebrow: `${review.label} · Seguimiento`,
      title: 'Hay acciones por revisar',
      description: `${review.plan.title} todavía no tiene el seguimiento completo.`,
      primaryAction: 'Revisar mi semana',
      primaryHref: `/semana?planId=${encodeURIComponent(review.plan.id)}`,
      secondaryAction: 'Ver plan',
      secondaryHref: `/planes/${review.plan.id}`,
      meta: reviewMeta(reviewAt),
      focusMatrix: false,
      planId: review.plan.id,
      resumePaused: false,
    });
  }

  const active = firstPlan(rows, 'ACTIVE') ?? firstPlan(rows, 'MAINTENANCE');
  if (active) {
    return activePresentation(active, rowForPlan(rows, active.id), reviewAt, active.stage === 'MAINTENANCE');
  }

  const paused = firstPlan(rows, 'PAUSED');
  if (paused) {
    const row = rowForPlan(rows, paused.id);
    return withLegacy({
      kind: 'paused',
      eyebrow: row?.label ? `${row.label} · Pausa` : null,
      title: 'Tu plan está en pausa',
      description: `${paused.title}. Puedes retomarlo cuando tenga sentido para ti.`,
      primaryAction: 'Ver plan',
      primaryHref: `/planes/${paused.id}`,
      secondaryAction: null,
      secondaryHref: null,
      meta: null,
      focusMatrix: false,
      planId: paused.id,
      resumePaused: false,
    });
  }

  const draft = firstPlan(rows, 'PREPARING');
  if (draft) {
    const row = rowForPlan(rows, draft.id);
    return withLegacy({
      kind: 'draft',
      eyebrow: row?.label ? `${row.label} · Preparación` : 'Preparación',
      title: 'Tienes un plan por terminar',
      description: draft.title
        ? `Puedes continuar «${draft.title}» donde lo dejaste.`
        : 'Puedes continuar tu plan donde lo dejaste.',
      primaryAction: 'Continuar plan',
      primaryHref: `/disenar/${draft.id}`,
      secondaryAction: null,
      secondaryHref: null,
      meta: null,
      focusMatrix: false,
      planId: draft.id,
      resumePaused: false,
    });
  }

  const closed = firstPlan(rows, 'CLOSED');
  if (closed && rows.every((row) => !row.plan || row.plan.stage === 'CLOSED')) {
    return withLegacy({
      kind: 'closed',
      eyebrow: rowForPlan(rows, closed.id)?.label ?? null,
      title: 'Terminaste este ciclo',
      description: closed.title,
      primaryAction: 'Ver cierre',
      primaryHref: `/planes/${closed.id}`,
      secondaryAction: 'Diseñar otro plan',
      secondaryHref: '/disenar',
      meta: null,
      focusMatrix: false,
      planId: closed.id,
      resumePaused: false,
    });
  }

  const explored = rows.filter((row) => row.discover.state === 'EXPLORED').length;
  if (rows.length === 4 && explored === 4 && rows.every((row) => !row.plan)) {
    return withLegacy({
      kind: 'choose',
      eyebrow: null,
      title: '¿Qué te gustaría mejorar?',
      description: EMPTY_HOME_DESCRIPTION,
      primaryAction: 'Crear un plan',
      primaryHref: '/disenar',
      secondaryAction: 'Explorar con preguntas',
      secondaryHref: '/diagnostico?alcance=general',
      meta: null,
      focusMatrix: false,
      planId: null,
      resumePaused: false,
    });
  }

  return withLegacy({
    kind: 'empty',
    eyebrow: null,
    title: '¿Qué te gustaría mejorar?',
    description: EMPTY_HOME_DESCRIPTION,
    primaryAction: 'Crear un plan',
    primaryHref: '/disenar',
    secondaryAction: 'Explorar con preguntas',
    secondaryHref: '/diagnostico?alcance=general',
    meta: null,
    focusMatrix: false,
    planId: null,
    resumePaused: false,
  });
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function civilDayLabel(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

export function weekPeriodLabel(weekStart: string | null | undefined): string | null {
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return null;
  const [year, month, day] = weekStart.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} a ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`;
}

export function directionPreview(text: string | null | undefined, max = 72): string | null {
  if (!text?.trim()) return null;
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

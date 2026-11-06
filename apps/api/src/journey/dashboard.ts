import { territoryCoverage, type TerritoryCoverage, type TerritoryCoverageState } from '../instrumentos/territory-catalog';
import { TERRITORY_LABEL, type Territory } from '../instrumentos/glossary';
import { futureOccasions } from './apply-week';
import type { WeekCounts } from './week-count';
import type { PlanStage } from './plan-lifecycle';
import { fromLegacy } from './plan-lifecycle';

/** Filas del tablero, en el orden de producto (no el del catálogo interno). */
export const DASHBOARD_TERRITORY_ORDER: Territory[] = ['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA'];

export type DashboardPlan = {
  id: string;
  title: string;
  stage: PlanStage;
  isFocus: boolean;
  territory: string | null;
  week: WeekCounts | null;
};

export type DashboardTerritory = TerritoryCoverage & { label: string };

export type DashboardOccasion = { day: string; title: string };

export type MatrixPlan = {
  id: string;
  title: string;
  stage: PlanStage;
  isFocus: boolean;
  nextOccasion: DashboardOccasion | null;
  week: WeekCounts | null;
};

export type MatrixRow = {
  territory: Territory;
  label: string;
  discover: {
    state: TerritoryCoverageState;
    settled: number;
    required: number;
    exceptionCount: number;
  };
  planCount: number;
  plan: MatrixPlan | null;
};

export type MemberDashboard = {
  territories: DashboardTerritory[];
  focusPlan: DashboardPlan | null;
  otherActivePlans: number;
  chooseStart: boolean;
  matrix: MatrixRow[];
  /** Inicio civil de la semana del conteo. No es un porcentaje. */
  weekStart: string | null;
};

export type DashboardPlanInput = {
  id: string;
  title: string;
  stage: string | null;
  status: string;
  isFocus: boolean;
  territory: string | null;
  updatedAt?: string | Date | null;
};

export type PlanFact = {
  id: string;
  nextOccasion: DashboardOccasion | null;
  week: WeekCounts | null;
};

const STAGE_RANK: Record<PlanStage, number> = {
  ACTIVE: 1,
  MAINTENANCE: 2,
  PREPARING: 3,
  PAUSED: 4,
  CLOSED: 5,
};

function stamp(value: string | Date | null | undefined): string {
  if (!value) return '';
  return value instanceof Date ? value.toISOString() : value;
}

/** Presentación: no cambia foco ni etapa. El foco gana. Si no hay foco, manda la etapa y después la actualización. */
export function selectContextualPlan<T extends DashboardPlanInput>(plans: T[]): T | null {
  if (!plans.length) return null;
  const ranked = [...plans].sort((a, b) => {
    const stageA = (a.stage as PlanStage | null) ?? fromLegacy(a.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED');
    const stageB = (b.stage as PlanStage | null) ?? fromLegacy(b.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED');
    const rankA = a.isFocus ? 0 : STAGE_RANK[stageA];
    const rankB = b.isFocus ? 0 : STAGE_RANK[stageB];
    if (rankA !== rankB) return rankA - rankB;
    const time = stamp(b.updatedAt).localeCompare(stamp(a.updatedAt));
    if (time !== 0) return time;
    return a.id.localeCompare(b.id);
  });
  return ranked[0] ?? null;
}

export function pickRepresentativePlan<T extends DashboardPlanInput>(plans: T[], territory: string): T | null {
  const rows = plans.filter((plan) => (plan.territory ?? '').toUpperCase() === territory);
  return selectContextualPlan(rows);
}

export function nextPlanOccasion(
  actions: { id: string; active: boolean; pausedAt: Date | null; weekday: number | null; intervalDays: number | null; title: string; doneWhen: string }[],
  today: string,
  cancelled: Set<string>,
): DashboardOccasion | null {
  let chosen: DashboardOccasion | null = null;
  for (const action of actions) {
    if (!action.active || action.pausedAt || action.weekday == null) continue;
    const day = futureOccasions(today, action.weekday, action.intervalDays ?? 7).find((item) => !cancelled.has(`${action.id}:${item}`));
    if (!day) continue;
    if (!chosen || day < chosen.day) chosen = { day, title: action.title };
  }
  return chosen;
}

type CoverageResponse = {
  exceptionKind?: string | null;
  skipped?: boolean;
  freeText?: string | null;
  selectedOptionIds?: string[];
};

function ledgerAsResponses(ledger: { sourceRef: string; exceptionKind: string | null; value: string | null }[]): Record<string, CoverageResponse> {
  const out: Record<string, CoverageResponse> = {};
  for (const row of ledger) {
    out[row.sourceRef] = {
      exceptionKind: row.exceptionKind,
      freeText: row.value,
      skipped: false,
    };
  }
  return out;
}

export function buildDashboard(input: {
  ledger: { sourceRef: string; exceptionKind: string | null; value: string | null }[];
  catalogQuestions: { sourceRef: string; exceptionOrigin?: string | null }[];
  plans: DashboardPlanInput[];
  focusWeekCounts: WeekCounts | null;
  focusPlanId: string | null;
  planFacts?: PlanFact[];
  weekStart?: string | null;
}): MemberDashboard {
  const responses = ledgerAsResponses(input.ledger);
  const coverages = territoryCoverage(input.catalogQuestions, responses);
  const byTerritory = new Map(coverages.map((row) => [row.territory, row]));
  const territories: DashboardTerritory[] = DASHBOARD_TERRITORY_ORDER.map((territory) => {
    const row = byTerritory.get(territory);
    return {
      ...(row ?? {
        territory,
        required: 0,
        settled: 0,
        pending: 0,
        exceptions: { UNKNOWN: 0, NOT_APPLICABLE: 0, DECLINED: 0 },
        state: 'NOT_STARTED' as const,
      }),
      label: TERRITORY_LABEL[territory],
    };
  });
  const stages = input.plans.map((plan) => ({
    ...plan,
    stage: (plan.stage as PlanStage | null) ?? fromLegacy(plan.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'),
  }));
  const focusRow = stages.find((plan) => plan.id === input.focusPlanId) ?? stages.find((plan) => plan.isFocus) ?? null;
  const focusPlan: DashboardPlan | null = focusRow
    ? {
        id: focusRow.id,
        title: focusRow.title,
        stage: focusRow.stage,
        isFocus: focusRow.isFocus,
        territory: focusRow.territory,
        week: input.focusWeekCounts,
      }
    : null;
  const activeLike = stages.filter((plan) => plan.stage === 'ACTIVE' || plan.stage === 'MAINTENANCE');
  const otherActivePlans = focusPlan ? activeLike.filter((plan) => plan.id !== focusPlan.id).length : activeLike.length;
  const facts = new Map((input.planFacts ?? []).map((fact) => [fact.id, fact]));
  const matrix: MatrixRow[] = territories.map((row) => {
    const chosen = pickRepresentativePlan(input.plans, row.territory);
    const stage = chosen
      ? ((chosen.stage as PlanStage | null) ?? fromLegacy(chosen.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'))
      : null;
    const fact = chosen ? facts.get(chosen.id) : undefined;
    const tracking = stage === 'ACTIVE' || stage === 'MAINTENANCE';
    return {
      territory: row.territory,
      label: row.label,
      discover: {
        state: row.state,
        settled: row.settled,
        required: row.required,
        exceptionCount: row.exceptions.UNKNOWN + row.exceptions.NOT_APPLICABLE + row.exceptions.DECLINED,
      },
      planCount: input.plans.filter((plan) => (plan.territory ?? '').toUpperCase() === row.territory).length,
      plan: chosen && stage
        ? {
            id: chosen.id,
            title: chosen.title,
            stage,
            isFocus: chosen.isFocus,
            nextOccasion: tracking ? fact?.nextOccasion ?? null : null,
            week: tracking ? fact?.week ?? null : null,
          }
        : null,
    };
  });
  return {
    territories,
    focusPlan,
    otherActivePlans,
    chooseStart: stages.length === 0,
    matrix,
    weekStart: input.weekStart ?? null,
  };
}

export function territoryDetail(
  territory: Territory,
  ledger: { sourceRef: string; exceptionKind: string | null; value: string | null }[],
  catalogQuestions: { sourceRef: string; exceptionOrigin?: string | null }[],
) {
  const responses = ledgerAsResponses(ledger);
  const row = territoryCoverage(catalogQuestions, responses).find((item) => item.territory === territory);
  return {
    territory,
    label: TERRITORY_LABEL[territory],
    coverage: row ?? { territory, required: 0, settled: 0, pending: 0, exceptions: { UNKNOWN: 0, NOT_APPLICABLE: 0, DECLINED: 0 }, state: 'NOT_STARTED' as const },
  };
}

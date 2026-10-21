import { territoryCoverage, type TerritoryCoverage } from '../instrumentos/territory-catalog';
import { TERRITORY_LABEL, type Territory } from '../instrumentos/glossary';
import type { WeekCounts } from './week-count';
import type { PlanStage } from './plan-lifecycle';
import { fromLegacy } from './plan-lifecycle';

export type DashboardPlan = {
  id: string;
  title: string;
  stage: PlanStage;
  isFocus: boolean;
  territory: string | null;
  week: WeekCounts | null;
};

export type DashboardTerritory = TerritoryCoverage & { label: string };

export type MemberDashboard = {
  territories: DashboardTerritory[];
  focusPlan: DashboardPlan | null;
  otherActivePlans: number;
  chooseStart: boolean;
};

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
  plans: {
    id: string;
    title: string;
    stage: string | null;
    status: string;
    isFocus: boolean;
    territory: string | null;
  }[];
  focusWeekCounts: WeekCounts | null;
  focusPlanId: string | null;
}): MemberDashboard {
  const responses = ledgerAsResponses(input.ledger);
  const coverages = territoryCoverage(input.catalogQuestions, responses);
  const territories: DashboardTerritory[] = coverages.map((row) => ({
    ...row,
    label: TERRITORY_LABEL[row.territory],
  }));
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
  return { territories, focusPlan, otherActivePlans, chooseStart: stages.length === 0 };
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

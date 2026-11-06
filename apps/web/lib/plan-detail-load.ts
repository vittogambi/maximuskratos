import { fetchPlanSummary, type PlanSummary } from '@/lib/journey-api';
import { fetchInterventionPlan, type InterventionPlanView } from '@/lib/intervention-api';

export type PlanDetailBundle = {
  summary: PlanSummary;
  intervention: InterventionPlanView | null;
};

/** Una sola cadena: resumen primero; intervención solo si hace falta contrato o estrategia MEN-A1. */
export async function loadPlanDetail(token: string, planId: string): Promise<PlanDetailBundle> {
  const summary = await fetchPlanSummary(token, planId);
  const territory = summary.territory?.toLowerCase();
  const needsIntervention =
    Boolean(territory)
    && (
      !summary.outcomeContractComplete
      || summary.outcomeContractMeta?.recoveredFromLegacy
      || summary.territory === 'MENTALIDAD'
    );
  if (!needsIntervention || !territory) {
    return { summary, intervention: null };
  }
  try {
    const intervention = await fetchInterventionPlan(token, territory, planId);
    return { summary, intervention };
  } catch {
    return { summary, intervention: null };
  }
}

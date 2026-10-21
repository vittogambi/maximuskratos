import { familyById } from './families';

/** Cycle result text from an accompaniment family template (no new copy until D-SYN). */
export function criterionFromFamily(familyId: string, doneWhen: string | null): string {
  const family = familyById(familyId);
  if (!family) return doneWhen?.trim() || 'Quedó contrastado con lo acordado.';
  const sample = family.expectedEvidence?.trim();
  if (sample && !sample.includes('[')) return sample;
  return doneWhen?.trim() || 'Quedó contrastado con lo acordado.';
}

/** Action doneWhen stays separate from plan outcome criterion. */
export function splitCriterion(outcome: string, doneWhen: string): { planCriterion: string; actionDoneWhen: string } {
  return { planCriterion: outcome.trim(), actionDoneWhen: doneWhen.trim() };
}

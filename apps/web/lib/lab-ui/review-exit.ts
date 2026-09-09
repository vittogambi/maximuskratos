import type { LabCaseRow, LabFamilyRow, LabReviewAgenda } from '../lab-api';
import { isDirectionCompareFamily } from './direction-compare';

export type ReviewExit = {
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

const RESOLVED = new Set(['Validada', 'Con hallazgo', 'Necesita evidencia']);

export function buildReviewExit(input: {
  familyId?: string | null;
  runId: string;
  families: LabFamilyRow[];
  cases: LabCaseRow[];
  agenda: LabReviewAgenda;
}): ReviewExit {
  const family = input.families.find((item) => item.id === input.familyId) ?? null;
  const resolved = family ? RESOLVED.has(family.status) : false;
  const members = (input.cases ?? []).filter(
    (item) => item.casebook_key && family?.keys.includes(item.casebook_key),
  );
  const pending = family
    ? members.find((item) => {
        const review = item.family_reviews?.[family.id];
        return item.latest_run && !review?.case_done && item.latest_run.id !== input.runId;
      })
    : undefined;

  if (family && family.compare && !resolved && family.reviewed >= family.total) {
    return {
      primary: {
        href: `/admin/lab/families/${family.id}`,
        label: isDirectionCompareFamily(family) ? 'Comparar las dos versiones' : 'Comparar los dos casos',
      },
      secondary: { href: '/admin/lab', label: 'Volver a Revisión' },
    };
  }

  if (family && !resolved && pending?.latest_run) {
    return {
      primary: {
        href: `/admin/lab/runs/${pending.latest_run.id}?family=${encodeURIComponent(family.id)}`,
        label: 'Continuar con el siguiente caso',
      },
      secondary: { href: '/admin/lab', label: 'Volver a Revisión' },
    };
  }

  return {
    primary: { href: input.agenda.next.href, label: 'Continuar con la siguiente revisión' },
    secondary: { href: '/admin/lab', label: 'Volver al Lab' },
  };
}

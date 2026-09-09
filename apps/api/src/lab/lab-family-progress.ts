import { AB_PAIRS, CASEBOOK_FAMILIES, CASEBOOK_META } from './lab-casebook';

export type FamilyReviewState = {
  verdict?: string | null;
  case_done?: boolean;
  criterion_id?: string | null;
};

export type FamilyCaseLite = {
  casebook_key: string | null;
  matrix_review_complete: boolean;
  case_verdict?: string | null;
  family_reviews?: Record<string, FamilyReviewState>;
  has_open_finding?: boolean;
  test_intent?: string | null;
  latest_run?: { id: string } | null;
};

export function parseFamilyReviews(raw: unknown): Record<string, FamilyReviewState> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, FamilyReviewState> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') {
      out[key] = { verdict: value, case_done: true };
      continue;
    }
    if (!value || typeof value !== 'object') continue;
    const row = value as FamilyReviewState;
    out[key] = {
      verdict: row.verdict ?? null,
      case_done: Boolean(row.case_done || row.verdict),
      criterion_id: row.criterion_id ?? null,
    };
  }
  return out;
}

export function mergeFamilyReview(
  current: Record<string, FamilyReviewState>,
  familyId: string | null | undefined,
  patch: FamilyReviewState,
): Record<string, FamilyReviewState> {
  if (!familyId) return current;
  return { ...current, [familyId]: { ...current[familyId], ...patch } };
}

export function applyFamilyClose(input: {
  current: Record<string, FamilyReviewState>;
  familyId: string | null | undefined;
  verdictAt?: 'case' | 'pair';
  pairConclusion?: boolean;
  verdict: string;
  criterion_id?: string | null;
}): Record<string, FamilyReviewState> {
  if (!input.familyId) return input.current;
  const previous = input.current[input.familyId];
  const criterion_id = input.criterion_id ?? previous?.criterion_id ?? null;
  if (input.pairConclusion || input.verdictAt !== 'pair') {
    return mergeFamilyReview(input.current, input.familyId, {
      case_done: true,
      verdict: input.verdict,
      criterion_id,
    });
  }
  return mergeFamilyReview(input.current, input.familyId, {
    case_done: true,
    verdict: previous?.verdict ?? null,
    criterion_id,
  });
}

function reviewFor(member: FamilyCaseLite, familyId: string): FamilyReviewState | undefined {
  return member.family_reviews?.[familyId];
}

export const FAMILY_RESOLVED = new Set(['Validada', 'Con hallazgo', 'Necesita evidencia']);

export function familyIsResolved(status: string) {
  return FAMILY_RESOLVED.has(status);
}

export function familyStatus(input: {
  memberCount: number;
  reviewed: number;
  verdicts: Array<string | null | undefined>;
  hasOpenFinding: boolean;
  needsFixture?: boolean;
  verdictAt?: 'case' | 'pair';
}): string {
  if (input.needsFixture && input.memberCount === 0) return 'Pendiente';
  if (input.memberCount === 0 || input.reviewed === 0) return 'Pendiente';
  if (input.reviewed < input.memberCount) return 'En revisión';
  if (input.verdictAt === 'pair' && !input.verdicts.some(Boolean)) return 'En revisión';
  if (input.verdicts.some((item) => item === 'NEED_MORE_INFO')) return 'Necesita evidencia';
  if (input.hasOpenFinding || input.verdicts.some((item) => item === 'IMPORTANT_DIFF')) {
    return 'Con hallazgo';
  }
  return 'Validada';
}

export function buildFamilyProgress(cases: FamilyCaseLite[]) {
  const byKey = new Map(
    cases.filter((item) => item.casebook_key).map((item) => [item.casebook_key!, item]),
  );
  const families = CASEBOOK_FAMILIES.map((family) => {
    const members = family.keys.map((key) => byKey.get(key)).filter(Boolean) as FamilyCaseLite[];
    const caseDone = members.filter((item) => reviewFor(item, family.id)?.case_done).length;
    const verdicts = members.map((item) => reviewFor(item, family.id)?.verdict ?? null);
    const compare =
      family.verdict_at === 'pair' ||
      AB_PAIRS.some(([left, right]) => family.keys.includes(left) && family.keys.includes(right));
    const status = familyStatus({
      memberCount: family.keys.length ? family.keys.length : members.length,
      reviewed: caseDone,
      verdicts,
      hasOpenFinding: members.some((item) => item.has_open_finding),
      verdictAt: family.verdict_at,
    });
    const next = members.find((item) => item.latest_run && !reviewFor(item, family.id)?.case_done);
    return {
      id: family.id,
      label: family.label,
      keys: family.keys,
      core: family.core,
      status,
      reviewed: caseDone,
      total: family.keys.length,
      compare,
      verdict_at: family.verdict_at,
      needs_fixture: false,
      review_surface: family.review_surface,
      review_prompt: family.review_prompt ?? null,
      question: family.question,
      intro: family.intro ?? null,
      intent: family.intro ?? family.question,
      next_run_id: next?.latest_run?.id ?? members[0]?.latest_run?.id ?? null,
    };
  });
  const canonicalKeys = CASEBOOK_META.map((item) => item.key);
  const canonical = canonicalKeys.map((key) => byKey.get(key)).filter(Boolean) as FamilyCaseLite[];
  const resolved = families.filter((item) =>
    ['Validada', 'Con hallazgo', 'Necesita evidencia'].includes(item.status),
  );
  return {
    families,
    families_total: families.length,
    families_reviewed: resolved.length,
    families_validated: families.filter((item) => item.status === 'Validada').length,
    families_with_finding: families.filter((item) => item.status === 'Con hallazgo').length,
    families_need_evidence: families.filter((item) => item.status === 'Necesita evidencia').length,
    canonical_total: canonicalKeys.length,
    canonical_reviewed: canonical.filter((item) => item.matrix_review_complete).length,
    next_family_id: families.find((item) => item.status === 'Pendiente' || item.status === 'En revisión')?.id ?? null,
  };
}

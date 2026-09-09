export function isDirectionCompareFamily(
  family: { id?: string | null; review_surface?: string | null } | null | undefined,
) {
  return family?.id === 'purpose_silent' || family?.review_surface === 'frontier';
}

export function bothFamilyCasesReviewed(
  rows: Array<{
    casebook_key?: string | null;
    family_reviews?: Record<string, { case_done?: boolean }>;
  }>,
  family: { id: string; keys: string[] },
) {
  const members = rows.filter((item) => item.casebook_key && family.keys.includes(item.casebook_key));
  return members.length > 0 && members.every((item) => Boolean(item.family_reviews?.[family.id]?.case_done));
}

export function directionPairVisible(bothReviewed: boolean, pairAvailable: boolean) {
  return bothReviewed && pairAvailable;
}


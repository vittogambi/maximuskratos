export const IMPACT_LABEL = {
  IMPROVES: 'Se acerca a tu criterio',
  WORSENS: 'Se aleja de tu criterio',
  UNCHANGED: 'Sin cambio relevante',
  NEEDS_REVIEW: 'Necesita revisión',
} as const;

export function replayImpactSummary(
  rows: Array<{ impact?: string | null; verdict?: string | null }>,
) {
  return {
    improves: rows.filter((row) => row.impact === 'IMPROVES').length,
    worsens: rows.filter((row) => row.impact === 'WORSENS').length,
    unchanged: rows.filter((row) => row.impact === 'UNCHANGED').length,
    needs_review: rows.filter((row) => row.impact === 'NEEDS_REVIEW').length,
    worsens_without_verdict: rows.filter((row) => row.impact === 'WORSENS' && !row.verdict).length,
  };
}

export function keepCandidateBlocked(summary: { worsens_without_verdict: number }) {
  return summary.worsens_without_verdict > 0;
}

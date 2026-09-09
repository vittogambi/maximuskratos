import { describe, expect, it } from 'vitest';
import { toUserView } from '../src/user-view';
import { PRODUCT_HYPOTHESIS, type ExperienceProjection } from '../src/types';

function projection(reason: string | null): ExperienceProjection {
  return {
    provenance: {
      matrix_definition_ref: 'matrix-v2.0@1',
      matrix_definition_sha256: 'abc',
      engine_semver: '2.0.0',
      experience_ref: 'experience-v0.1@1',
      experience_sha256: 'def',
      hypothesis: PRODUCT_HYPOTHESIS,
    },
    direction: {
      statement: 'Seguir presente en casa.',
      display: 'Seguir presente en casa.',
      missing: false,
      source: 'RAFA_JUDGMENT',
      blocks_product: false,
    },
    profile: { domains: [], scores_are_hero: false },
    purpose: {
      matrix_stage: null,
      matrix_note: 'silent',
      rafa_stage: null,
      dimension_scores_lab_only: [],
      never_user_purpose_score: true,
    },
    focus: {
      matrix_candidate: 'MENTALIDAD',
      matrix_candidate_reason: 'tie',
      tie_break_provisional: false,
      selected_focus: 'CUERPO',
      selection_source: 'RAFA_JUDGMENT',
      selection_reason: reason,
      awaiting_selection: false,
    },
    route: {
      kind: null,
      matrix_plan_id: 'MEN-EST',
      product_route_id: null,
      title: null,
      duration_text: null,
      source: 'CATALOG',
      needs_curation: true,
    },
    cycle: {
      number: 1,
      start: '2026-08-01',
      end: '2026-08-31',
      status: 'PROJECTED',
      source: PRODUCT_HYPOTHESIS,
      billing_cadence: 'MONTHLY',
      monthly_even_if_prepaid: true,
    },
    objective: {
      available: [],
      selected_id: null,
      source: null,
      needs_human_curation: false,
    },
    action: { text: null, source: null, executable: true },
    restrictions: [],
    safety: { blocked: false, reasons: [], source: 'SAFETY' },
  };
}

describe('product rationale cannot be fabricated', () => {
  it('uses Rafa reason when present', () => {
    expect(toUserView(projection('El descanso condiciona todo lo demás.')).why_now).toBe(
      'El descanso condiciona todo lo demás.',
    );
  });

  it('does not invent a confirmation sentence when Rafa left no reason', () => {
    const view = toUserView(projection(null));
    expect(view.why_now).toBe('No se registró una justificación para esta elección.');
    expect(view.why_now).not.toMatch(/ya está confirmado/);
  });
});

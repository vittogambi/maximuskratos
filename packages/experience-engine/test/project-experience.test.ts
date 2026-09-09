import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ENGINE_SEMVER,
  namedPolicy,
  runAssessment,
  type MatrixDefinition,
  type ResponseInput,
  type ResultSnapshot,
} from '@mk/matrix-engine';
import {
  buildExperienceV01,
  coverageInsufficient,
  isTieBreakProvisional,
  projectExperience,
  projectMonthlyCycle,
  safetyBlocksExecution,
  toUserView,
  userViewHasForbiddenMetadata,
} from '../src/index';

function loadFrozen(): MatrixDefinition {
  return JSON.parse(
    readFileSync(
      resolve(__dirname, '../../matrix-engine/definitions/matrix-v2.0.json'),
      'utf8',
    ),
  ) as MatrixDefinition;
}

function parseCasebook(file: string): ResponseInput[] {
  const raw = JSON.parse(
    readFileSync(
      resolve(__dirname, `../../matrix-engine/test/cases/rafa-casebook/${file}`),
      'utf8',
    ),
  ) as { responses: Record<string, unknown> };
  return Object.entries(raw.responses).map(([questionId, value]) => {
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      return {
        questionId,
        status: 'ANSWERED' as const,
        rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
        qualitativeConfirmed: (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
      };
    }
    return {
      questionId,
      status: 'ANSWERED' as const,
      rawValue: value as number | string | null,
    };
  });
}

function assess(file: string): ResultSnapshot {
  return runAssessment({
    definition: loadFrozen(),
    responses: parseCasebook(file),
    policy: namedPolicy('FULL-v1'),
    engineSemver: ENGINE_SEMVER,
    now: '2026-08-25T12:00:00.000Z',
  });
}

const subscription = {
  period_start: '2026-08-25T00:00:00.000Z',
  billing_cadence: 'MONTHLY' as const,
};

describe('experience projection', () => {
  it('EXP-01 matrix candidate is not selected focus', () => {
    const snapshot = assess('R01.json');
    expect(isTieBreakProvisional(snapshot)).toBe(true);
    expect(snapshot.priority.domain).toBe('MENTALIDAD');
    const projection = projectExperience({
      resultSnapshot: snapshot,
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.focus.matrix_candidate).toBe('MENTALIDAD');
    expect(projection.focus.selected_focus).toBeNull();
    expect(projection.focus.awaiting_selection).toBe(true);
    expect(projection.focus.tie_break_provisional).toBe(true);
    const view = toUserView(projection);
    expect(view.focus).toContain('desempate es provisional');
    expect(view.focus).not.toBe('El foco de este ciclo es Mentalidad.');
  });

  it('EXP-02 selected focus change does not mutate snapshot', () => {
    const snapshot = assess('R01.json');
    const before = JSON.stringify(snapshot);
    projectExperience({
      resultSnapshot: snapshot,
      focusSelection: {
        selected_focus: 'FINANZAS',
        selection_source: 'RAFA_JUDGMENT',
        selection_reason: 'prueba',
      },
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it('EXP-03 purpose assessment does not mutate snapshot', () => {
    const snapshot = assess('R15.json');
    const before = JSON.stringify(snapshot);
    const projection = projectExperience({
      resultSnapshot: snapshot,
      purposeAssessment: { stage: 'EN_CONTRASTE', confidence: 'MEDIA' },
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(projection.purpose.matrix_stage).toBeNull();
    expect(projection.purpose.rafa_stage).toBe('EN_CONTRASTE');
  });

  it('EXP-04 Purpose route is not tagged Matrix', () => {
    const snapshot = assess('R15.json');
    const projection = projectExperience({
      resultSnapshot: snapshot,
      focusSelection: {
        selected_focus: 'PURPOSE',
        selection_source: 'RAFA_JUDGMENT',
        selection_reason: 'explorar norte',
      },
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.route.kind).toBe('PRODUCT_ROUTE');
    expect(projection.route.product_route_id).toBe('PURPOSE_EXPLORATION');
    expect(projection.route.matrix_plan_id).toBeNull();
    expect(projection.route.source).toBe('PRODUCT_HYPOTHESIS');
  });

  it('EXP-05 critical safety blocks executable action', () => {
    const snapshot = assess('R11.json');
    expect(safetyBlocksExecution(snapshot)).toBe(true);
    const projection = projectExperience({
      resultSnapshot: snapshot,
      direction: { statement: 'Seguir entrenando con criterio médico.' },
      focusSelection: {
        selected_focus: 'CUERPO',
        selection_source: 'USER_CHOICE',
        selection_reason: 'confirmar candidato',
      },
      action: { text: 'Correr 10 km', source: 'USER_CHOICE' },
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.safety.blocked).toBe(true);
    expect(projection.action.executable).toBe(false);
    expect(projection.restrictions).toContain('SAFETY_BLOCKED');
    expect(toUserView(projection).this_week).toContain('No hay acción ejecutable');
  });

  it('EXP-06 insufficient coverage does not create automatic focus', () => {
    const snapshot = assess('R10.json');
    expect(coverageInsufficient(snapshot)).toBe(true);
    const projection = projectExperience({
      resultSnapshot: snapshot,
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.focus.matrix_candidate).toBeNull();
    expect(projection.focus.selected_focus).toBeNull();
    expect(projection.route.matrix_plan_id).toBeNull();
    expect(toUserView(projection).focus).toContain('información suficiente');
  });

  it('EXP-07 missing direction does not block preview', () => {
    const snapshot = assess('R01.json');
    const projection = projectExperience({
      resultSnapshot: snapshot,
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.direction.missing).toBe(true);
    expect(projection.direction.blocks_product).toBe(false);
    expect(projection.restrictions).toContain('MISSING_DIRECTION');
    expect(projection.direction.display).toBe('Todavía está en construcción.');
  });

  it('EXP-08 direction context does not affect Matrix snapshot', () => {
    const snapshot = assess('R01.json');
    const before = snapshot.priority.domain;
    projectExperience({
      resultSnapshot: snapshot,
      direction: { statement: 'Quiero ser más presente en casa.', source: 'RAFA_JUDGMENT' },
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(snapshot.priority.domain).toBe(before);
    expect(snapshot.domains.map((item) => item.score)).toEqual(
      assess('R01.json').domains.map((item) => item.score),
    );
  });

  it('EXP-09 billing cadence does not alter Matrix result', () => {
    const monthly = assess('R01.json');
    const projection = projectExperience({
      resultSnapshot: monthly,
      subscriptionContext: { ...subscription, billing_cadence: 'QUARTERLY' },
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.provenance.matrix_definition_sha256).toBe(monthly.definition_sha256);
    expect(monthly.priority.domain).toBe('MENTALIDAD');
  });

  it('EXP-10 quarterly billing still projects a monthly cycle', () => {
    const cycle = projectMonthlyCycle({
      period_start: '2026-08-25T00:00:00.000Z',
      billing_cadence: 'QUARTERLY',
    });
    expect(cycle).toEqual({ start: '2026-08-25', end: '2026-09-24' });
    const snapshot = assess('R01.json');
    const projection = projectExperience({
      resultSnapshot: snapshot,
      subscriptionContext: {
        period_start: '2026-08-25T00:00:00.000Z',
        billing_cadence: 'QUARTERLY',
      },
      experienceDefinition: buildExperienceV01(),
    });
    expect(projection.cycle.start).toBe('2026-08-25');
    expect(projection.cycle.end).toBe('2026-09-24');
    expect(projection.cycle.monthly_even_if_prepaid).toBe(true);
  });

  it('EXP-11 user view never renders purpose.dimension_scores as Purpose Score', () => {
    const snapshot = assess('R15.json');
    expect(snapshot.purpose.dimension_scores.length).toBeGreaterThan(0);
    const projection = projectExperience({
      resultSnapshot: snapshot,
      purposeAssessment: { stage: 'HIPOTETICO' },
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    const view = toUserView(projection);
    expect(userViewHasForbiddenMetadata(view, projection)).toBe(false);
    expect(JSON.stringify(view).toLowerCase()).not.toContain('purpose score');
    expect(projection.purpose.never_user_purpose_score).toBe(true);
  });

  it('EXP-12 R13A and R13B stay identical without a later human choice', () => {
    const a = assess('R13A.json');
    const b = assess('R13B.json');
    const left = projectExperience({
      resultSnapshot: a,
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    const right = projectExperience({
      resultSnapshot: b,
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    expect(left.focus.matrix_candidate).toBe(right.focus.matrix_candidate);
    expect(left.route.matrix_plan_id).toBe(right.route.matrix_plan_id);
    expect(left.profile.domains.map((item) => item.state)).toEqual(
      right.profile.domains.map((item) => item.state),
    );
    expect(toUserView(left)).toEqual(toUserView(right));
  });

  it('EXP-13 product review payload does not mutate snapshot', () => {
    const snapshot = assess('R01.json');
    const before = JSON.stringify(snapshot);
    const review = {
      verdicts: { focus: 'INCORRECT' as const },
      purpose_feels: 'PRESENT_BUT_WEAK' as const,
      still_mk: 'PARTLY' as const,
      first_product_divergence: 'FOCUS_RESOLUTION',
    };
    expect(review.first_product_divergence).toBe('FOCUS_RESOLUTION');
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it('EXP-14 user view excludes experimental metadata', () => {
    const snapshot = assess('R15.json');
    const projection = projectExperience({
      resultSnapshot: snapshot,
      subscriptionContext: subscription,
      experienceDefinition: buildExperienceV01(),
    });
    const view = toUserView(projection);
    expect(userViewHasForbiddenMetadata(view, projection)).toBe(false);
    expect(JSON.stringify(view)).not.toContain('experimental');
    expect(JSON.stringify(view)).not.toContain('LAB-PURPOSE-01');
  });
});

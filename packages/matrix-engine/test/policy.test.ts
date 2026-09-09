import { describe, expect, it } from 'vitest';
import { computeCoverage } from '../src/engine/coverage';
import { runAssessment } from '../src/engine/run-assessment';
import {
  AUD_ONLY_POLICY,
  AUD_PLUS_BRANCHES_POLICY,
  AUD_PLUS_CORE_POLICY,
  buildPolicyPlan,
  namedPolicy,
} from '../src/policy/build-policy-plan';
import { FULL_POLICY } from '../src/policy/resolve-served';
import { ENGINE_SEMVER } from '../src/types';
import { loadFrozen, makeResponses } from './helpers/assessment';

const definition = loadFrozen();

describe('P0-07 policies', () => {
  it('FULL serves every active question', () => {
    const plan = buildPolicyPlan({ definition, policy: FULL_POLICY });
    expect(plan.questions_available).toBe(187);
    expect(plan.questions_served).toBe(187);
    expect(plan.questions_skipped_by_policy).toBe(0);
  });

  it('AUD_ONLY serves the 16 audit items', () => {
    const plan = buildPolicyPlan({ definition, policy: AUD_ONLY_POLICY });
    expect(plan.questions_served).toBe(16);
    expect(plan.served_ids.every((id) => id.startsWith('AUD-'))).toBe(true);
  });

  it('AUD_PLUS_CORE serves audit, D-MEN-001 and purpose ESTADO', () => {
    const plan = buildPolicyPlan({ definition, policy: AUD_PLUS_CORE_POLICY });
    expect(plan.served_ids).toContain('AUD-MEN-01');
    expect(plan.served_ids).toContain('D-MEN-01');
    expect(plan.served_ids).toContain('P-PRO-021');
    expect(plan.served_ids).not.toContain('D-REL-01');
    expect(plan.questions_served).toBe(51);
  });

  it('AUD_PLUS_BRANCHES without a 1 or 2 stays at audit', () => {
    const plan = buildPolicyPlan({
      definition,
      policy: AUD_PLUS_BRANCHES_POLICY,
      responses: [
        { questionId: 'AUD-MEN-01', rawValue: 3 },
        { questionId: 'AUD-CUE-01', rawValue: 4 },
      ],
    });
    expect(plan.questions_served).toBe(16);
    expect(plan.branches_fired).toHaveLength(0);
  });

  it('AUD_PLUS_BRANCHES opens the full deep instrument once', () => {
    const plan = buildPolicyPlan({
      definition,
      policy: AUD_PLUS_BRANCHES_POLICY,
      responses: [
        { questionId: 'AUD-MEN-01', rawValue: 1 },
        { questionId: 'AUD-MEN-03', rawValue: 2 },
      ],
    });
    expect(plan.served_ids).toContain('D-MEN-01');
    expect(plan.served_ids).toContain('D-MEN-20');
    expect(plan.served_ids).not.toContain('D-REL-01');
    expect(plan.questions_served).toBe(36);
    expect(plan.branches_fired.map((item) => item.trigger_question_id)).toEqual([
      'AUD-MEN-01',
      'AUD-MEN-03',
    ]);
  });

  it('CUSTOM accepts an explicit id list', () => {
    const plan = buildPolicyPlan({
      definition,
      policy: namedPolicy('CUSTOM', ['AUD-MEN-01', 'D-CUE-05']),
    });
    expect(plan.served_ids).toEqual(['AUD-MEN-01', 'D-CUE-05']);
  });

  it('INV-15: policy does not change the definition denominator', () => {
    const answers = makeResponses(definition, { scoreableValue: 3, riskValue: 0 });
    const full = runAssessment({
      definition,
      responses: answers,
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: '2026-08-25T12:00:00.000Z',
    });
    const short = runAssessment({
      definition,
      responses: answers,
      policy: AUD_ONLY_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: '2026-08-25T12:00:00.000Z',
    });
    for (let index = 0; index < full.domains.length; index += 1) {
      expect(short.domains[index].items_scoreable).toBe(full.domains[index].items_scoreable);
    }
    expect(short.domains.every((domain) => domain.classification === 'NO_CLASIFICADO')).toBe(
      true,
    );
    expect(short.priority.reason).toBe('INSUFFICIENT_COVERAGE');
    expect(short.safety.safety_incomplete).toBe(true);
  });

  it('AUD_ONLY coverage_definition still uses the definition denominator', () => {
    const men = computeCoverage(definition, [], 'MENTALIDAD');
    expect(men.scoreable_active).toBe(24);
    expect(men.coverage_definition).toBe(0);
  });
});

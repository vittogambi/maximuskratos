import { describe, expect, it } from 'vitest';
import { draftFromReview, draftWithFirstProblem, emptyReviewDraft, reviewPayload } from '@/components/admin/lab/step-review';
import { FIRST_DIVERGENCE_OPTIONS } from '@/lib/lab-ui/labels';
import { isDirtyAgainst, snapshotForm } from '@/lib/lab-ui/dirty-form';

describe('LAB-011 review layer roundtrip', () => {
  it('persists each first-divergence option including CONTEXT_MISSING', () => {
    for (const option of FIRST_DIVERGENCE_OPTIONS) {
      const draft = { ...emptyReviewDraft, firstDivergence: option.value, rootCauses: ['WEIGHT'] };
      const payload = reviewPayload(draft);
      expect(payload.first_wrong_layer).toBe(option.value);
      expect(payload.root_cause_codes).toEqual(['WEIGHT']);
      const back = draftFromReview({
        verdicts: payload.verdicts,
        firstWrongLayer: payload.first_wrong_layer,
        rootCauseCodes: payload.root_cause_codes,
        evidenceRefs: payload.evidence_refs,
        notes: payload.notes,
        postRevealStates: payload.post_reveal_states,
        postRevealPriorityDomain: payload.post_reveal_priority_domain,
        wouldRecommendPlanId: payload.recommended_plan_id,
        noMethodologicalProblem: payload.no_methodological_problem,
      });
      expect(back.firstDivergence).toBe(option.value);
      expect(back.rootCauses).toEqual(['WEIGHT']);
    }
  });

  it('does not remap CONTEXT_MISSING to UNKNOWN', () => {
    const payload = reviewPayload({ ...emptyReviewDraft, firstDivergence: 'CONTEXT_MISSING' });
    expect(payload.first_wrong_layer).toBe('CONTEXT_MISSING');
    expect(payload.root_cause_codes).not.toContain('CONTEXT_MISSING');
  });

  it('keeps a stored UNKNOWN + leftover CONTEXT_MISSING code clean after hydrate', () => {
    const draft = draftFromReview({
      verdicts: emptyReviewDraft.verdicts,
      firstWrongLayer: 'UNKNOWN',
      rootCauseCodes: ['CONTEXT_MISSING'],
      evidenceRefs: [],
      notes: null,
      postRevealStates: null,
      postRevealPriorityDomain: null,
      wouldRecommendPlanId: null,
      noMethodologicalProblem: false,
    });
    expect(draft.firstDivergence).toBe('UNKNOWN');
    expect(isDirtyAgainst(draft, snapshotForm(draft))).toBe(false);
  });

  it('keeps the chosen first problem when clearing causes', () => {
    const draft = { ...emptyReviewDraft, overallSense: 'NO', firstDivergence: '', rootCauses: ['WEIGHT'] };
    const next = draftWithFirstProblem(draft, 'PRIORITY');
    expect(next.firstDivergence).toBe('PRIORITY');
    expect(next.rootCauses).toEqual([]);
    expect(next.overallSense).toBe('NO');
  });

  it('LAB-032 persists doubted_rules', () => {
    const payload = reviewPayload({ ...emptyReviewDraft, doubtedRules: ['LAB-SCORE-01'] });
    expect(payload.doubted_rules).toEqual(['LAB-SCORE-01']);
    const back = draftFromReview({
      verdicts: payload.verdicts,
      doubtedRules: payload.doubted_rules,
    });
    expect(back.doubtedRules).toEqual(['LAB-SCORE-01']);
  });
});

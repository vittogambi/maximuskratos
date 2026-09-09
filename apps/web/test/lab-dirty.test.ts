import { describe, expect, it } from 'vitest';
import { isDirtyAgainst, snapshotForm } from '@/lib/lab-ui/dirty-form';
import { applyQuestionAnswer, answersSnapshot, changedResponses } from '@/lib/lab-ui/response-draft';
import { emptyExpectationDraft } from '@/components/admin/lab/step-prediction';
import { questionsFixture } from './fixtures';

function warnOnNavigate(dirty: boolean) {
  return dirty;
}

function allowInAppLeave(dirty: boolean) {
  return !dirty;
}

describe('DIRTY-01 fresh form clean', () => {
  it('does not mark an empty form dirty', () => {
    const baseline = snapshotForm(emptyExpectationDraft);
    expect(isDirtyAgainst(emptyExpectationDraft, baseline)).toBe(false);
  });
});

describe('DIRTY-02 hydrate form clean', () => {
  it('does not mark dirty when the same values are assigned after fetch', () => {
    const fetched = { ...emptyExpectationDraft, notes: 'Ya guardado' };
    const baseline = snapshotForm(fetched);
    const hydrated = { ...fetched };
    expect(isDirtyAgainst(hydrated, baseline)).toBe(false);
  });
});

describe('DIRTY-03 change becomes dirty', () => {
  it('marks dirty after a real field change', () => {
    const baseline = snapshotForm(emptyExpectationDraft);
    expect(isDirtyAgainst({ ...emptyExpectationDraft, notes: 'Nuevo' }, baseline)).toBe(true);
  });
});

describe('DIRTY-04 revert becomes clean', () => {
  it('returns clean when the user reverts to the persisted values', () => {
    const baseline = snapshotForm(emptyExpectationDraft);
    const changed = { ...emptyExpectationDraft, notes: 'Nuevo' };
    expect(isDirtyAgainst(changed, baseline)).toBe(true);
    expect(isDirtyAgainst({ ...emptyExpectationDraft }, baseline)).toBe(false);
  });
});

describe('DIRTY-05 successful autosave clean', () => {
  it('resets the baseline after a successful save', () => {
    const draft = { ...emptyExpectationDraft, notes: 'Guardado' };
    const baseline = snapshotForm(draft);
    expect(isDirtyAgainst(draft, baseline)).toBe(false);
  });
});

describe('DIRTY-06 navigation clean no warning', () => {
  it('does not warn when the form matches the last persisted snapshot', () => {
    const baseline = snapshotForm(emptyExpectationDraft);
    expect(warnOnNavigate(isDirtyAgainst(emptyExpectationDraft, baseline))).toBe(false);
  });
});

describe('DIRTY-07 dirty navigation warns', () => {
  it('warns only when the current form differs from the last persisted snapshot', () => {
    const baseline = snapshotForm(emptyExpectationDraft);
    expect(warnOnNavigate(isDirtyAgainst({ ...emptyExpectationDraft, notes: 'x' }, baseline))).toBe(true);
    expect(allowInAppLeave(true)).toBe(false);
    expect(allowInAppLeave(false)).toBe(true);
  });
});

describe('normalization does not mark dirty', () => {
  it('ignores key order and undefined fields', () => {
    const a = snapshotForm({ notes: '', extra: undefined, expected_plan_id: '' });
    expect(isDirtyAgainst({ expected_plan_id: '', notes: '' }, a)).toBe(false);
  });
});

describe('response draft is local until save', () => {
  it('marks dirty after an answer changes and clean after reverting', () => {
    const baseline = questionsFixture();
    const snap = answersSnapshot(baseline);
    expect(answersSnapshot(baseline)).toBe(snap);
    const next = applyQuestionAnswer(baseline[0], 5);
    const draft = [next, ...baseline.slice(1)];
    expect(answersSnapshot(draft)).not.toBe(snap);
    expect(changedResponses(draft, baseline).map((item) => item.id)).toEqual(['AUD-MEN-01']);
    expect(answersSnapshot(baseline)).toBe(snap);
  });

  it('does not treat an unchanged list as dirty', () => {
    const rows = questionsFixture();
    expect(changedResponses(rows, rows)).toEqual([]);
  });

  it('does not mark dirty when only observation flags change', () => {
    const rows = questionsFixture();
    const flagged = rows.map((item, index) =>
      index === 0 ? { ...item, flagged_here: true, other_observations: 1, other_notes: [] } : item,
    );
    expect(answersSnapshot(flagged)).toBe(answersSnapshot(rows));
    expect(changedResponses(flagged, rows)).toEqual([]);
  });
});

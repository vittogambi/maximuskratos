'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LabCard, RadioCards } from './primitives';
import { labApi, type LabRunSummary } from '@/lib/lab-api';
import { CASE_VERDICT_OPTIONS } from '@/lib/lab-ui/labels';
import type { ReviewExit } from '@/lib/lab-ui/review-exit';
import { emptyReviewDraft, reviewPayload } from './step-review';

const CLOSE_OPTIONS = CASE_VERDICT_OPTIONS.filter((item) =>
  ['REPRESENTS', 'IMPORTANT_DIFF', 'NEED_MORE_INFO'].includes(item.value),
);

export function StepClose({
  run,
  familyId,
  pending,
  onSaved,
}: {
  run: LabRunSummary;
  familyId?: string | null;
  pending: boolean;
  onSaved: () => Promise<void>;
}) {
  const familyReview = familyId ? run.family_reviews?.[familyId] : undefined;
  const familyMeta = familyId ? run.method_families?.find((item) => item.id === familyId) : undefined;
  const closeQuestion =
    familyMeta?.review_prompt ||
    familyMeta?.question ||
    '¿Esta lectura de la Matriz te parece defendible?';
  const [verdict, setVerdict] = useState(familyReview?.verdict ?? '');
  const [title, setTitle] = useState('');
  const [expected, setExpected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problem = verdict === 'IMPORTANT_DIFF';

  async function save() {
    setBusy(true);
    setError(null);
    try {
      let linked: string | null = null;
      if (problem) {
        if (title.trim().length < 8 || expected.trim().length < 12) {
          setError('Hace falta decir qué observaste y qué debería ocurrir.');
          return;
        }
        const created = await labApi.createFinding({
          title: title.trim(),
          summary: expected.trim(),
          layer: 'OTHER',
          severity: 'IMPORTANT',
          current_behavior: title.trim(),
          rafa_expected_behavior: expected.trim(),
          case_ids: [run.case_id],
        });
        linked = created.id;
      }
      await labApi.review(
        run.id,
        reviewPayload({
          ...emptyReviewDraft,
          firstDivergence: problem ? 'UNKNOWN' : verdict === 'NEED_MORE_INFO' ? 'UNSURE' : 'NONE',
          notes: expected.trim() || title.trim(),
          linkedFindingId: linked ?? '',
        }),
      );
      await labApi.patchReviewVerdict(run.id, {
        case_verdict: verdict,
        family_id: familyId ?? null,
        criterion_id: familyMeta?.criterion_id ?? null,
        disposition: problem ? 'CREATE_FINDING' : verdict === 'NEED_MORE_INFO' ? 'REVIEW_MORE' : 'NO_CHANGE',
        linked_finding_id: linked,
      });
      await onSaved();
    } catch {
      setError('No pudimos guardar esta lectura.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <LabCard title={closeQuestion}>
      <RadioCards name="case-close" value={verdict} options={CLOSE_OPTIONS} onChange={setVerdict} />
      {problem ? (
        <div className="lab-stack lab-stack--tight">
          <label className="lab-field">
            <span className="lab-label">Qué observaste</span>
            <input className="lab-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="lab-field">
            <span className="lab-label">Qué debería ocurrir</span>
            <textarea
              className="lab-textarea"
              value={expected}
              onChange={(event) => setExpected(event.target.value)}
            />
          </label>
        </div>
      ) : null}
      {error ? <p className="lab-error">{error}</p> : null}
      <div className="lab-actions">
        <button type="button" className="lab-btn" disabled={busy || pending || !verdict} onClick={() => void save()}>
          Guardar
        </button>
      </div>
    </LabCard>
  );
}

export function ReviewSaved({ exit }: { exit: ReviewExit }) {
  return (
    <LabCard title="Revisión guardada">
      <p className="lab-lead">Quedó registrada esta lectura.</p>
      <div className="lab-actions">
        <Link className="lab-btn" href={exit.primary.href}>
          {exit.primary.label}
        </Link>
        <Link className="lab-btn lab-btn--ghost" href={exit.secondary.href}>
          {exit.secondary.label}
        </Link>
      </div>
    </LabCard>
  );
}

import { criterionFromFamily } from './accompaniment/criteria';
import { proposalStatus, storedPayload, type ProposalRowInput } from './plan-proposal-domain';

export type ProposalApplyPatch = {
  outcome?: string;
  whyItMatters?: string | null;
  whyStatus?: string | null;
  criterionText?: string | null;
  criterionStatus?: string | null;
  criterionRevision?: number;
  title?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function proposalsForActivation(rows: ProposalRowInput[]): ProposalRowInput[] {
  return rows.filter((row) => proposalStatus(row) !== 'REJECTED');
}

export function planPatchFromProposals(
  rows: ProposalRowInput[],
  current: { outcome: string; criterionRevision: number | null },
): ProposalApplyPatch {
  const patch: ProposalApplyPatch = {};
  let criterionBump = false;
  for (const row of proposalsForActivation(rows)) {
    const payload = storedPayload(row);
    const kind = row.kind;
    if (kind === 'WHY' || kind === 'PURPOSE') {
      const text = typeof payload.text === 'string' ? payload.text : typeof payload.whyItMatters === 'string' ? payload.whyItMatters : null;
      if (text?.trim()) {
        patch.whyItMatters = text.trim();
        patch.whyStatus = typeof payload.status === 'string' ? payload.status : 'PROVISIONAL';
      }
    }
    if (kind === 'OUTCOME' || kind === 'GOAL') {
      const text = typeof payload.outcome === 'string' ? payload.outcome : typeof payload.text === 'string' ? payload.text : null;
      if (text?.trim()) patch.outcome = text.trim();
    }
    if (kind === 'CRITERION') {
      const text = typeof payload.criterionText === 'string' ? payload.criterionText : typeof payload.text === 'string' ? payload.text : null;
      if (text?.trim()) {
        patch.criterionText = text.trim();
        patch.criterionStatus = typeof payload.status === 'string' ? payload.status : 'PROVISIONAL';
        criterionBump = true;
      }
    }
    if (kind === 'ACTION') {
      const familyId = typeof payload.familyId === 'string' ? payload.familyId : null;
      const doneWhen = typeof payload.doneWhen === 'string' ? payload.doneWhen : null;
      const title = typeof payload.title === 'string' ? payload.title : null;
      if (title?.trim() && !patch.title) patch.title = title.trim();
      if (!patch.criterionText?.trim()) {
        const criterion = criterionFromFamily(familyId ?? '', doneWhen);
        if (criterion.trim()) {
          patch.criterionText = criterion.trim();
          patch.criterionStatus = 'PROVISIONAL';
          criterionBump = true;
        }
      }
      const cycle = asRecord(payload).cycleResult;
      if (!patch.outcome?.trim() && typeof cycle === 'object' && cycle && typeof (cycle as { text?: string }).text === 'string') {
        patch.outcome = (cycle as { text: string }).text.trim().slice(0, 500);
      }
    }
  }
  if (criterionBump) {
    patch.criterionRevision = (current.criterionRevision ?? 0) + 1;
  }
  if (!patch.outcome?.trim() && current.outcome.trim()) {
    patch.outcome = current.outcome;
  }
  return patch;
}

export type ActionFieldPatch = {
  title?: string;
  doneWhen?: string;
  weekday?: number | null;
  occasionsPerWeek?: number | null;
  minimumVersion?: string | null;
};

/** Applies accepted ACTION proposals onto active plan actions (single action or explicit actionId). */
export function actionPatchesFromProposals(
  rows: ProposalRowInput[],
  activeActions: { id: string }[],
): Map<string, ActionFieldPatch> {
  const patches = new Map<string, ActionFieldPatch>();
  if (activeActions.length === 0) return patches;

  for (const row of proposalsForActivation(rows)) {
    if (row.kind !== 'ACTION') continue;
    const payload = storedPayload(row);
    const explicitId = typeof payload.actionId === 'string' ? payload.actionId : null;
    const targetId =
      explicitId && activeActions.some((action) => action.id === explicitId)
        ? explicitId
        : activeActions.length === 1
          ? activeActions[0].id
          : null;
    if (!targetId) continue;

    const patch: ActionFieldPatch = { ...(patches.get(targetId) ?? {}) };
    if (typeof payload.title === 'string' && payload.title.trim()) patch.title = payload.title.trim().slice(0, 180);
    if (typeof payload.doneWhen === 'string' && payload.doneWhen.trim()) patch.doneWhen = payload.doneWhen.trim();
    if (payload.weekday === null) patch.weekday = null;
    else if (typeof payload.weekday === 'number') patch.weekday = payload.weekday;
    if (payload.occasionsPerWeek === null) patch.occasionsPerWeek = null;
    else if (typeof payload.occasionsPerWeek === 'number') patch.occasionsPerWeek = payload.occasionsPerWeek;
    if (typeof payload.minimumVersion === 'string' && payload.minimumVersion.trim()) {
      patch.minimumVersion = payload.minimumVersion.trim();
    }
    if (Object.keys(patch).length > 0) patches.set(targetId, patch);
  }
  return patches;
}

export type PersonalizationEffect =
  | 'NONE'
  | 'GOAL'
  | 'STRATEGY'
  | 'CRITERION'
  | 'LOAD'
  | 'ORDER'
  | 'RESTRICTION'
  | 'PURPOSE';

export type ProposalReason = {
  text: string;
  refs: string[];
  interpretation?: string;
  effect: PersonalizationEffect;
};

export type PersonalizationProposal = {
  reasons: ProposalReason[];
};

export type RejectedInterpretation = {
  sourceRef: string;
  responseRevision: number;
};

const CONFIRMED_PURPOSE_REFS = new Set(['direction', 'value', 'vision', 'huella', 'ikigai']);

function reasonCounts(reason: ProposalReason): boolean {
  if (!reason.refs.length) return false;
  if (reason.effect === 'NONE') return false;
  if (reason.effect === 'PURPOSE') {
    return reason.refs.some((ref) => CONFIRMED_PURPOSE_REFS.has(ref) || ref.startsWith('formulario-v1:'));
  }
  return true;
}

export function isPersonalized(proposal: PersonalizationProposal): boolean {
  return proposal.reasons.some(reasonCounts);
}

export function withoutRejected(
  proposal: PersonalizationProposal,
  rejected: RejectedInterpretation[],
  currentRevision: (sourceRef: string) => number,
): PersonalizationProposal {
  const activeRejections = rejected.filter((item) => currentRevision(item.sourceRef) === item.responseRevision);
  const blocked = new Set(activeRejections.map((item) => item.sourceRef));
  return {
    reasons: proposal.reasons.filter((reason) => !reason.refs.some((ref) => blocked.has(ref))),
  };
}

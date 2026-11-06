export type ProposalDecision = 'ACCEPTED' | 'EDITED' | 'REJECTED';

export type ProposalRowInput = {
  kind: string;
  payload: Record<string, unknown>;
  editedPayload?: Record<string, unknown> | null;
  decision: ProposalDecision;
};

export function proposalStatus(row: ProposalRowInput): ProposalDecision {
  if (row.decision === 'REJECTED') return 'REJECTED';
  if (row.decision === 'EDITED') return 'EDITED';
  if (
    row.decision === 'ACCEPTED'
    && row.editedPayload
    && Object.keys(row.editedPayload).length > 0
  ) {
    return 'EDITED';
  }
  return 'ACCEPTED';
}

export function storedPayload(row: ProposalRowInput): Record<string, unknown> {
  if (proposalStatus(row) === 'EDITED' && row.editedPayload) return row.editedPayload;
  return row.payload;
}

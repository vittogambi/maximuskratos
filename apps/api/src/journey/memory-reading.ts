export type MemoryPlan = {
  id: string;
  title: string;
  outcome: string;
  whyItMatters: string | null;
  stage: string | null;
  closedReason: string | null;
  achievedAt: string | null;
};

export type MemoryPurposeRevision = {
  id: string;
  revision: number;
  directionStatus: string | null;
  statement: string | null;
  confirmedAt: string | null;
  contractFrozen: boolean;
};

export type MemberMemory = {
  signedContract: Record<string, unknown> | null;
  draftPurpose: MemoryPurposeRevision | null;
  plans: MemoryPlan[];
};

export function buildMemory(input: {
  signed: MemoryPurposeRevision | null;
  draft: MemoryPurposeRevision | null;
  plans: MemoryPlan[];
}): MemberMemory {
  return {
    signedContract: input.signed?.contractFrozen ? { revisionId: input.signed.id, statement: input.signed.statement } : null,
    draftPurpose: input.draft,
    plans: input.plans,
  };
}

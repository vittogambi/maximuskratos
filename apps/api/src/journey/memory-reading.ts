export type MemoryPlan = {
  id: string;
  title: string;
  outcome: string;
  whyItMatters: string | null;
  stage: string | null;
  closedReason: string | null;
  achievedAt: string | null;
  learningNote: string | null;
  directionStatement: string | null;
};

export type DirectionHistoryRow = {
  id: string;
  revision: number;
  statement: string | null;
  desiredChange: string | null;
  /** Propuesta guardada en el cruce. No es una frase escrita como dirección. */
  crossPossibility: string | null;
  createdAt: string;
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
  directionHistory: DirectionHistoryRow[];
  plans: MemoryPlan[];
};

export function buildMemory(input: {
  signed: MemoryPurposeRevision | null;
  draft: MemoryPurposeRevision | null;
  directionHistory: DirectionHistoryRow[];
  plans: MemoryPlan[];
}): MemberMemory {
  return {
    signedContract: input.signed?.contractFrozen ? { revisionId: input.signed.id, statement: input.signed.statement } : null,
    draftPurpose: input.draft,
    directionHistory: input.directionHistory,
    plans: input.plans,
  };
}

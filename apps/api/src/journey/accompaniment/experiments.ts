import type { DepthDecision } from '../../instrumentos/depth';

export const EXPERIMENT_ASPECTS = ['INTEREST', 'CAPACITY_LEARNING', 'USEFULNESS', 'SUSTAINABILITY'] as const;
export type ExperimentAspect = (typeof EXPERIMENT_ASPECTS)[number];
export type ObservationStatus = 'FAVORABLE' | 'CONTRARY' | 'NOT_OBSERVED' | 'NO_INFORMATION';
export type RecipientState = 'RESPONDED' | 'NO_RESPONSE' | 'NO_RECIPIENT';
export type ExperimentDecision = 'KEEP' | 'MODIFY' | 'DISCARD' | 'INCONCLUSIVE';

export type ObservationDraft = {
  aspect: ExperimentAspect;
  status: ObservationStatus;
  recipient?: RecipientState | null;
  observed?: string | null;
};

export type ObservationResult = {
  allowed: boolean;
  reason: string | null;
  status: ObservationStatus;
  recipient: RecipientState | null;
  provesDemand: false;
  provesUsefulness: boolean;
};

/** No reply is missing evidence, not a demonstrated rejection. A reply without content is not usefulness. */
export function assessObservation(input: ObservationDraft): ObservationResult {
  const recipient = input.recipient ?? null;
  const observed = input.observed?.trim() ?? '';
  if (input.aspect === 'USEFULNESS') {
    if (recipient === 'NO_RESPONSE' || recipient === 'NO_RECIPIENT' || recipient == null) {
      return {
        allowed: input.status === 'NO_INFORMATION' || input.status === 'NOT_OBSERVED',
        reason: input.status === 'FAVORABLE' || input.status === 'CONTRARY'
          ? 'Sin respuesta no hay utilidad ni rechazo ni demanda. Registra falta de evidencia.'
          : null,
        status: 'NO_INFORMATION',
        recipient,
        provesDemand: false,
        provesUsefulness: false,
      };
    }
    if (!observed || input.status !== 'FAVORABLE') {
      return {
        allowed: input.status !== 'FAVORABLE' || observed.length > 0,
        reason: input.status === 'FAVORABLE' && !observed ? 'Una respuesta sin una observación no prueba utilidad.' : null,
        status: input.status === 'FAVORABLE' && !observed ? 'NO_INFORMATION' : input.status,
        recipient,
        provesDemand: false,
        provesUsefulness: false,
      };
    }
    return { allowed: true, reason: null, status: 'FAVORABLE', recipient, provesDemand: false, provesUsefulness: true };
  }
  return {
    allowed: true,
    reason: null,
    status: input.status,
    recipient,
    provesDemand: false,
    provesUsefulness: false,
  };
}

export type ExperimentRevision = {
  id: string;
  hypothesis: string;
  observations: { revisionId: string; aspect: ExperimentAspect }[];
};

/** A new hypothesis keeps prior observations on the revision they tested. */
export function nextHypothesis(current: ExperimentRevision, hypothesis: string): { revisionId: string; observations: ExperimentRevision['observations'] } {
  return {
    revisionId: `${current.id}:next`,
    observations: current.observations,
  };
}

export function depthContrast(input: {
  meaning?: string | null;
  matters?: string | null;
  change?: string | null;
  link?: string | null;
  evidence?: string | null;
  decision?: DepthDecision | null;
}): { recognized: { meaning: string; matters: string }; integrated: { change: string; link: string }; contrasted: { evidence: string; decision: DepthDecision } } | null {
  const meaning = input.meaning?.trim() ?? '';
  const matters = input.matters?.trim() ?? '';
  const change = input.change?.trim() ?? '';
  const link = input.link?.trim() ?? '';
  const evidence = input.evidence?.trim() ?? '';
  if (!meaning || !matters || !change || !link || !evidence || !input.decision) return null;
  const fields = [meaning, matters, change, link, evidence];
  if (fields.some((field) => field.includes('['))) return null;
  if (fields.some((field) => field === 'Valor: ejemplo. Esta semana escribo la conducta. Excepción: ninguna.')) return null;
  return {
    recognized: { meaning, matters },
    integrated: { change, link },
    contrasted: { evidence, decision: input.decision },
  };
}

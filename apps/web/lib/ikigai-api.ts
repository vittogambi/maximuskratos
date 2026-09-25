import { getApiBaseUrl } from './api';

export class IkigaiApiError extends Error {
  status: number;
  reason?: string;
  step?: string;
  current?: unknown;
  draftVersion?: number;
  constructor(message: string, status: number, extra?: { reason?: string; step?: string; current?: unknown; draftVersion?: number }) {
    super(message);
    this.status = status;
    this.reason = extra?.reason;
    this.step = extra?.step;
    this.current = extra?.current;
    this.draftVersion = extra?.draftVersion;
  }
}

export type IkigaiFieldKey = 'PASION' | 'CAPACIDAD' | 'NECESIDAD' | 'VALOR';
export type IkigaiCriterionKey =
  | 'DISFRUTE_SOSTENIBLE'
  | 'CAPACIDAD_DEMOSTRABLE'
  | 'UTILIDAD_REAL'
  | 'VALOR_ECONOMICO'
  | 'COHERENCIA_MORAL'
  | 'FACTIBILIDAD';

export type IkigaiItem = { id: string; text: string; evidence: string | null; order: number };
export type IkigaiHypothesis = {
  id: string;
  text: string;
  itemIds: string[];
  criteria: Partial<Record<IkigaiCriterionKey, 1 | 2 | 3 | 4 | 5 | null>>;
  order: number;
};
export type ExperimentReviewStatus = 'CURRENT' | 'NEEDS_REVIEW';

export type IkigaiNextExperiment = {
  hypothesisId: string | null;
  focus: string;
  horizonDays: 30 | 60 | 90;
  action: string;
  signal: string;
  savedAt: string;
  reviewStatus?: ExperimentReviewStatus;
};

export type ExperimentContext =
  | { state: 'NONE' }
  | { state: 'CURRENT'; experiment: IkigaiNextExperiment }
  | { state: 'NEEDS_REVIEW'; experiment: IkigaiNextExperiment };
export type FieldClarity = 'ANSWERED' | 'UNCLEAR' | null;
export type FieldClarityMap = Record<IkigaiFieldKey, FieldClarity>;

export type IkigaiDraft = {
  items: Record<IkigaiFieldKey, IkigaiItem[]>;
  patternNote: string | null;
  hypotheses: IkigaiHypothesis[];
  noHypothesisYet: boolean;
  nextExperiment: IkigaiNextExperiment | null;
  fieldClarity: FieldClarityMap;
  selectedHypothesisId: string | null;
};

export type IkigaiDefinition = {
  definitionId: string;
  revision: number;
  ref: string;
  status: string;
  publicName: string;
  examplesDisclaimer: string;
  hypothesis: { label: string; help: string; examples: string[]; noHypothesisLabel: string };
  likertAnchors: Array<{ value: 1 | 2 | 3 | 4 | 5; label: string }>;
  skipCriterionLabel: string;
  fields: Array<{
    key: IkigaiFieldKey;
    title: string;
    prompt: string;
    help: string;
    examples: string[];
    placeholder: string;
    evidencePrompt: string;
    evidenceOptions: Array<{ key: string; label: string }>;
  }>;
  criteria: Array<{ key: IkigaiCriterionKey; label: string; text: string; matrixId: string }>;
  nextExperiment: {
    focusLabel: string;
    horizonLabel: string;
    horizons: number[];
    actionLabel: string;
    signalLabel: string;
  };
};

export type IkigaiResult = {
  definitionRef: string;
  engineVersion: string;
  generatedAt: string;
  selectedHypothesisId?: string | null;
  fieldClarity?: FieldClarityMap;
  material: {
    fields: Array<{
      key: IkigaiFieldKey;
      title: string;
      items: Array<{
        id: string;
        text: string;
        evidence: string | null;
        evidenceLabel: string | null;
        classification: 'backed' | 'intuition' | 'unmarked';
      }>;
      thin: boolean;
      untagged: boolean;
    }>;
  };
  convergences: {
    byHypothesis: Array<{ hypothesisId: string; text: string; counts: Record<IkigaiFieldKey, number> }>;
    recurring: Array<{ text: string; count: number }>;
    unused: Array<{ fieldKey: IkigaiFieldKey; title: string; text: string }>;
    patternNote: string | null;
  };
  tensions: Array<{ ruleId: string; text: string; hypothesisId?: string; fieldKey?: IkigaiFieldKey }>;
  hypotheses: Array<{
    id: string;
    index: number;
    text: string;
    coverage: Record<IkigaiFieldKey, boolean>;
    linkedItems?: Array<{ id: string; text: string }>;
    criteria: Array<{
      key: IkigaiCriterionKey;
      label: string;
      text: string;
      value: 1 | 2 | 3 | 4 | 5 | null | undefined;
      answerLabel: string;
    }>;
  }>;
  evidence: {
    byHypothesis: Array<{
      hypothesisId: string;
      backed: Array<{ id: string; text: string; evidenceLabel: string | null }>;
      intuition: Array<{ id: string; text: string; evidenceLabel: string | null }>;
    }>;
  };
  openQuestions: string[];
  nextExperiment: IkigaiNextExperiment | null;
};

export type IkigaiSessionView = {
  id: string;
  status: string;
  currentStep: string;
  draftVersion: number;
  definitionRef: string;
  definitionStatus: string;
  completedAt: string | null;
};

async function parseError(res: Response): Promise<IkigaiApiError> {
  let message = res.statusText;
  let reason: string | undefined;
  let step: string | undefined;
  let current: unknown;
  let draftVersion: number | undefined;
  try {
    const body = (await res.json()) as Record<string, unknown>;
    if (typeof body.message === 'string') message = body.message;
    if (typeof body.reason === 'string') reason = body.reason;
    if (typeof body.step === 'string') step = body.step;
    if (body.current) current = body.current;
    if (typeof body.draftVersion === 'number') draftVersion = body.draftVersion;
  } catch {
    /* ignore */
  }
  return new IkigaiApiError(message || 'Error', res.status, { reason, step, current, draftVersion });
}

export async function ikigaiRequest<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const res = await fetch(`${getApiBaseUrl()}/api/v1/ikigai${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'X-Ikigai-Token': token } : {}),
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const ikigaiApi = {
  definition: () =>
    ikigaiRequest<{ ref: string; status: string; payload: IkigaiDefinition }>('/definition'),
  createSession: (source?: Record<string, string>) =>
    ikigaiRequest<{
      session: IkigaiSessionView;
      draft: IkigaiDraft;
      definition: IkigaiDefinition;
      definitionSha256: string;
      token: string;
    }>('/sessions', { method: 'POST', body: JSON.stringify({ source }) }),
  getSession: (id: string, token: string) =>
    ikigaiRequest<{
      session: IkigaiSessionView;
      draft: IkigaiDraft;
      definition: IkigaiDefinition;
      definitionSha256: string;
      latestSnapshot: { revision: number; createdAt: string } | null;
    }>(`/sessions/${id}`, { token }),
  patchDraft: (
    id: string,
    token: string,
    body: { draftVersion: number; definitionSha256: string; step?: string; patch: IkigaiDraft },
  ) =>
    ikigaiRequest<{
      draftVersion: number;
      draft: IkigaiDraft;
      definitionSha256: string;
      affectedHypothesisIds: string[];
      session: IkigaiSessionView;
    }>(`/sessions/${id}/draft`, { method: 'PATCH', token, body: JSON.stringify(body) }),
  complete: (id: string, token: string, body: { draftVersion: number; definitionSha256: string }) =>
    ikigaiRequest<{ result: IkigaiResult; revision: number; sha256: string; draftVersion: number }>(
      `/sessions/${id}/complete`,
      { method: 'POST', token, body: JSON.stringify(body) },
    ),
  result: (id: string, token: string) =>
    ikigaiRequest<{
      result: IkigaiResult;
      experiment: ExperimentContext;
      revision: number;
      sha256: string;
      createdAt: string;
      definitionSha256: string;
    }>(`/sessions/${id}/result`, { token }),
  reopen: (id: string, token: string, body: { draftVersion: number; definitionSha256: string }) =>
    ikigaiRequest<{ ok: boolean; draftVersion: number; definitionSha256: string }>(`/sessions/${id}/reopen`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  nextExperiment: (
    id: string,
    token: string,
    body: Omit<IkigaiNextExperiment, 'savedAt' | 'reviewStatus'> & {
      draftVersion: number;
      definitionSha256: string;
    },
  ) =>
    ikigaiRequest<{ nextExperiment: IkigaiNextExperiment; draftVersion: number; definitionSha256: string }>(
      `/sessions/${id}/next-experiment`,
      { method: 'PUT', token, body: JSON.stringify(body) },
    ),
};

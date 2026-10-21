import { getApiBaseUrl, type MemberAccess } from '@/lib/api';

/** A rejected write keeps the server message plus the step that unblocks it. */
export class JourneyApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly nextHref: string | null;
  readonly alternatives: string[];
  readonly scope: string | null;

  constructor(
    message: string,
    status: number,
    code: string | null,
    nextHref: string | null,
    alternatives: string[] = [],
    scope: string | null = null,
  ) {
    super(message);
    this.name = 'JourneyApiError';
    this.status = status;
    this.code = code;
    this.nextHref = nextHref;
    this.alternatives = alternatives;
    this.scope = scope;
  }
}

async function send<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message : 'No se pudo guardar.';
    const code = typeof body.code === 'string' ? body.code : null;
    const nextHref = typeof body.nextHref === 'string' && body.nextHref.startsWith('/') ? body.nextHref : null;
    const alternatives = Array.isArray(body.alternatives)
      ? body.alternatives.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const scope = body.scope === 'HEALTH' || body.scope === 'CONVERSATION' ? body.scope : null;
    throw new JourneyApiError(message, res.status, code, nextHref, alternatives, scope);
  }
  return res.json() as Promise<T>;
}

export type AlignmentReading = {
  status: 'none' | 'partial' | 'saved';
  total: number | null;
  pillars: { E: number | null; M: number | null; C: number | null };
  savedAt: string | null;
  methodVersion: string | null;
  coverage: { answered: number; required: number };
  revision: number | null;
  directionStatus: string | null;
};

export type IndexCard = {
  name: string;
  methodVersion: string;
  kind: string;
  general: number | null;
  partial: number | null;
  pillars: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null;
  coverage: { eligible?: number; scored?: number; required: number };
  pending: string[];
  answeredAt: string | null;
  computedAt: string;
  explanation: string;
  delta: number | null;
};

export type HomeBoardView = {
  situation: 'QUESTIONNAIRE' | 'JUST_CLOSED' | 'EXPLORING' | 'GUIDED' | 'OWN' | 'PAUSED' | 'RETURN';
  reading: {
    name: string;
    methodVersion: string | null;
    general: number | null;
    pillars: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null;
    coverage: { eligible: number; required: number } | null;
    computedAt: string | null;
    explanation: string | null;
  } | null;
  synthesis: { text: string | null; source: 'EDITED' | 'GENERATED' | 'NONE' };
  direction: { status: string | null; goalText: string | null; experiment: { hypothesis: string; status: string } | null };
  plan: { id: string; title: string; outcome: string; priorityNote: string | null; linkKind: string | null; status: string; guided: boolean } | null;
  occasion: { day: string; title: string; criterion: string } | null;
  review: { weekStart: string; note: string | null; changes: string[] } | null;
  depth: {
    name: string;
    methodVersion: string;
    general: number | null;
    partial: number | null;
    coverage: { scored?: number; required: number };
    explanation: string;
    components: { component: string; label: string; stage: string; detail: string; href: string }[];
  } | null;
  evolution: {
    status: 'NONE' | 'INITIAL' | 'NOT_COMPARABLE' | 'COMPARABLE';
    delta: number | null;
    points: { computedAt: string; kind: string; general: number | null; pillars: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null; methodVersion: string }[];
    note: string;
  };
  territories: {
    figure: null;
    method: null;
    note: string;
    items: { territory: string; label: string; state: string; readings: { id: string; raw: number; scale: string | null }[] }[];
  };
};

export type JourneyState = {
  timezone: string;
  weekStart: string;
  weekClosed: boolean;
  purposeConfirmed: boolean;
  activePlanId: string | null;
  form: { auditTotal?: number; auditBand?: string | null; pillarsPending?: boolean } | null;
  alignment: AlignmentReading;
  indexes?: { alignment: IndexCard | null; initial?: IndexCard | null; depth: IndexCard | null };
  nextAction: { href: string; label: string; detail: string };
  contextReview?: { invited: boolean; days: number | null; effect: 'NONE' };
  board?: HomeBoardView;
};

const ALIGNMENT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatAlignmentValue(total: number | null): string {
  if (total == null) return '—';
  return String(Math.round(total));
}

export function formatAlignmentDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [year, month, day] = parts.split('-');
  return `${Number(day)} ${ALIGNMENT_MONTHS[Number(month) - 1]} ${year}`;
}

export type PurposeRow = {
  id: string;
  revision: number;
  content: Record<string, string>;
  confirmedAt: string | null;
} | null;

export type PlanRow = {
  id: string;
  title: string;
  outcome: string;
  priorityNote: string | null;
  linkKind: string | null;
  valueRef: string | null;
  purposeRevisionId: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  actions: { id: string; title: string; doneWhen: string; weekday: number | null; intervalDays?: number; pausedAt?: string | null; domain: ActionDomainName | null; active?: boolean; planId?: string }[];
};

export type SynthesisActivity = {
  sourceRef: string;
  field: 'pasion' | 'vocacion' | 'mision' | 'profesion';
  ambit: string;
  option: string;
  answer: string;
  fieldReview?: string | null;
};

export type SynthesisPayload = {
  version: string;
  activities: SynthesisActivity[];
  links: { id: string; fromRef: string; toRef: string; combinationId: string; reason: string; status: 'ACTIVE' | 'NEEDS_REVIEW' | 'RETIRED' }[];
  combinations: {
    id: string;
    reason: string;
    valuation: 'RECOGNIZED' | 'PARTIAL' | 'NOT_RECOGNIZED' | 'INSUFFICIENT' | null;
    valuationReason: string;
    experiment: string;
    fieldStance?: Partial<Record<'pasion' | 'vocacion' | 'mision' | 'profesion', 'RECOGNIZE' | 'DOUBT' | 'UNKNOWN'>>;
    unknownNote?: string;
    learningQuestion?: string;
    observed?: string;
  }[];
  purpose: {
    status: 'UNWORKED' | 'EXPLORANDO' | 'PROVISIONAL' | 'CONFIRMADO_POR_USUARIO';
    parts: Partial<Record<SynthesisActivity['field'], string>>;
    generated: string;
    edited: string | null;
    open: string[];
  };
  catalog: Record<string, { sourceName: string; question: string; ambits: { label: string; options: string[] }[] }>;
  values: string[];
  standards: { label: string; text: string }[];
  purposeRevisionId: string | null;
  revision: number | null;
};

export type CalendarPayload = {
  timezone: string;
  weekStart: string;
  plans: PlanRow[];
  records: { id: string; actionId: string; day: string; status: string; note: string | null; resultNote?: string | null }[];
};

export type ActionDomainName = 'MENTE' | 'ESPIRITU' | 'CUERPO';

export type ExecutionReading = {
  timezone: string;
  weekStart: string;
  today: string;
  plate: number | null;
  domains: Record<ActionDomainName, { planned: number; done: number; percent: number | null }>;
};

export type DomainView = {
  domain: ActionDomainName;
  today: string;
  timezone: string;
  weekClosed: boolean;
  percent: number | null;
  actions: { id: string; title: string; doneWhen: string; weekday: number | null; todayStatus: string | null }[];
};

export const journeyState = (token: string) => send<JourneyState>('/api/v1/journey/state', token);
export const journeyExecution = (token: string) => send<ExecutionReading>('/api/v1/journey/execution', token);
export const journeyDomain = (token: string, domain: ActionDomainName) =>
  send<DomainView>(`/api/v1/journey/domains/${domain}`, token);
export const addDomainAction = (
  token: string,
  domain: ActionDomainName,
  body: { title: string; doneWhen: string; weekday?: number; contentTags?: string[]; healthLimit?: string; conversation?: string },
) => send(`/api/v1/journey/domains/${domain}/actions`, token, { method: 'POST', body: JSON.stringify(body) });
export type HdrpGap = { id: string; label: string; moduleSlug: string };

export type HdrpContract = {
  name: string | null;
  introTitle?: string;
  intro?: string;
  lead: string;
  closing: string;
  articles: {
    title: string;
    items: { label: string; text: string; category?: string; descriptor?: string; commitment?: string; kind?: 'plan' }[];
  }[];
  gaps?: HdrpGap[];
  ready?: boolean;
  confirmed: boolean;
  confirmedAt?: string | null;
  revision: number | null;
  text: string | null;
  directionStatus: string | null;
  statement: string | null;
};

export const journeyContract = (token: string) => send<HdrpContract>('/api/v1/journey/purpose/contract', token);
export const journeyPurpose = (token: string) => send<PurposeRow>('/api/v1/journey/purpose', token);
export const journeySynthesis = (token: string) => send<SynthesisPayload>('/api/v1/journey/synthesis', token);
export const saveSynthesis = (token: string, body: unknown) =>
  send<SynthesisPayload>('/api/v1/journey/synthesis', token, { method: 'POST', body: JSON.stringify(body) });
export const savePurpose = (token: string, content: Record<string, string>) =>
  send<PurposeRow>('/api/v1/journey/purpose', token, { method: 'POST', body: JSON.stringify({ content }) });
export const saveAlignment = (
  token: string,
  answers: Record<string, { value: number | null; unknown: boolean }>,
) => send('/api/v1/journey/alignment', token, { method: 'POST', body: JSON.stringify({ answers }) });
export const confirmPurpose = (token: string) =>
  send<PurposeRow>('/api/v1/journey/purpose/confirm', token, { method: 'POST', body: '{}' });
export const reopenHdrpGap = (token: string, moduleSlug: string) =>
  send<{ ok: boolean }>('/api/v1/journey/purpose/reopen', token, { method: 'POST', body: JSON.stringify({ moduleSlug }) });
export const journeyPlans = (token: string) => send<PlanRow[]>('/api/v1/journey/plans', token);
export const createPlan = (token: string, body: { title: string; outcome: string; priorityNote?: string; linkKind?: string; valueRef?: string; purposeRevisionId?: string | null; sourceCombinationId?: string | null }) =>
  send<PlanRow>('/api/v1/journey/plans', token, { method: 'POST', body: JSON.stringify(body) });
export const addAction = (
  token: string,
  planId: string,
  body: { title: string; doneWhen: string; weekday?: number; guideId?: string; contentTags?: string[]; healthLimit?: string; conversation?: string },
) =>
  send(`/api/v1/journey/plans/${planId}/actions`, token, { method: 'POST', body: JSON.stringify(body) });
export const journeyCalendar = (token: string) => send<CalendarPayload>('/api/v1/journey/calendar', token);
export const saveRecord = (
  token: string,
  body: { actionId: string; day: string; status: string; note?: string; resultNote?: string },
) => send('/api/v1/journey/records', token, { method: 'POST', body: JSON.stringify(body) });
export const previewWeek = (
  token: string,
  weekStart: string,
  note?: string,
  decisions?: Record<string, 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE'>,
  revisions?: Record<string, { title?: string; doneWhen?: string; weekday?: number; intervalDays?: number }>,
  outcomes?: Record<string, string>,
) => send<{ effects: { actionId: string; decision: string; summary: string }[]; plans?: { planId: string; summary: string }[] }>('/api/v1/journey/weeks/preview', token, {
  method: 'POST',
  body: JSON.stringify({ weekStart, note, decisions, revisions, outcomes }),
});
export const closeWeek = (
  token: string,
  weekStart: string,
  note?: string,
  decisions?: Record<string, 'KEEP' | 'REDUCE' | 'SUBSTITUTE' | 'PAUSE' | 'RESUME' | 'CLOSE' | 'MODIFY' | 'RETIRE'>,
  revisions?: Record<string, { title?: string; doneWhen?: string; weekday?: number | null; intervalDays?: number | null }>,
  outcomes?: Record<string, string>,
) =>
  send('/api/v1/journey/weeks/close', token, {
    method: 'POST',
    body: JSON.stringify({ weekStart, note, decisions, revisions, outcomes }),
  });
export const purposeHistory = (token: string) =>
  send<PurposeRow[]>('/api/v1/journey/purpose/history', token);
export const journeyWeeks = (token: string) =>
  send<{ id: string; weekStart: string; note: string | null; snapshot: unknown }[]>('/api/v1/journey/weeks', token);
export const requestGuidance = (token: string, source: string, note?: string) =>
  send('/api/v1/journey/guidance', token, { method: 'POST', body: JSON.stringify({ source, note }) });

export type AccompanimentPreview = {
  proposal: {
    familyId: string | null;
    mode: string | null;
    modeStatus: string;
    situation: string;
    requiresAction: boolean;
    reasons: { text: string; refs: string[] }[];
    missing: { key: string; question: string }[];
    alternative: { familyId: string; text: string; requiresApproval: true } | null;
    urgency: { text: string; resources: { contact: string }[] } | null;
  };
  help: {
    cycleResult: { text: string; from: string };
    reasons: { text: string; refs: string[] }[];
    missing: { key: string; question: string }[];
    mode: { value: string | null; status: string; territory: string | null; pillar: string | null };
    action: string | null;
    artifact: { kind: string; fields: { key: string; label: string; value: string | null; pending: boolean }[] } | null;
    occasion: { text: string } | null;
    doneWhen: string | null;
    minimumVersion: string | null;
    alternative: { text: string; requiresApproval: boolean } | null;
    learning: { question: string; expectedEvidence: string } | null;
    futureEffect: string;
    forbids: string[];
    urgency: { text: string } | null;
  };
  digest: string;
  headVersion: number;
  plan: { id: string; updatedAt: string; choices: string[] } | null;
};

export const previewAccompaniment = (token: string, body: unknown) =>
  send<AccompanimentPreview>('/api/v1/journey/accompaniment/preview', token, { method: 'POST', body: JSON.stringify(body) });

export const confirmAccompaniment = (token: string, body: unknown) =>
  send<{ id: string; repeated: boolean; help?: AccompanimentPreview['help']; effect?: { planId: string | null; actionId: string | null } }>('/api/v1/journey/accompaniment', token, { method: 'POST', body: JSON.stringify(body) });

export const saveExperimentObservation = (token: string, experimentId: string, body: unknown) =>
  send(`/api/v1/journey/experiments/${experimentId}/observations`, token, { method: 'POST', body: JSON.stringify(body) });

export const reviewExperiment = (token: string, experimentId: string, body: unknown) =>
  send(`/api/v1/journey/experiments/${experimentId}/review`, token, { method: 'POST', body: JSON.stringify(body) });

export type MemberDashboard = {
  territories: { territory: string; label: string; state: string; required: number; settled: number }[];
  focusPlan: {
    id: string;
    title: string;
    stage: string;
    week: { done: number; upcoming: number; percent: number | null } | null;
  } | null;
  chooseStart: boolean;
  otherActivePlans: number;
};

export type MemoryView = {
  plans: unknown[];
  signedContract: unknown;
  draftPurpose: unknown;
};

export const fetchDashboard = (token: string) =>
  send<MemberDashboard>('/api/v1/journey/dashboard', token);

export const fetchMemory = (token: string) =>
  send<MemoryView>('/api/v1/journey/memory', token);

export const fetchTerritory = (token: string, territory: string) =>
  send<unknown>(`/api/v1/journey/territories/${encodeURIComponent(territory)}`, token);

export type ReturnReading = {
  headline: string | null;
  lastAdjustment: string | null;
  protectedNote: string | null;
  daysAway: number | null;
  hasPendingOccasions: boolean;
};

export const fetchReturnReading = (token: string) =>
  send<ReturnReading>('/api/v1/journey/return', token);

export const postReturnPanel = (token: string, body?: { weeksAway?: number }) =>
  send<ReturnReading>('/api/v1/journey/return', token, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });

export const createPlanDraft = (token: string, body?: { entry?: string; territory?: string | null }) =>
  send<{ id: string; stage: string }>('/api/v1/journey/plans/draft', token, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });

export const decidePlanProposal = (
  token: string,
  planId: string,
  proposalId: string,
  body: { decision: 'ACCEPT' | 'EDIT' | 'REJECT'; editedPayload?: Record<string, unknown>; commandKey?: string; expectedVersion?: number },
) =>
  send(`/api/v1/journey/plans/${planId}/proposals/${proposalId}/decision`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export type { MemberAccess };

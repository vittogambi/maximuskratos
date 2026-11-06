import { fetchAuthed, type MemberAccess } from '@/lib/api';

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

export async function send<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetchAuthed(token, path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
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
  stage?: string | null;
  territory?: string | null;
  criterionText?: string | null;
  criterionStatus?: string | null;
  actions: {
    id: string;
    title: string;
    doneWhen: string;
    weekday: number | null;
    intervalDays?: number;
    pausedAt?: string | null;
    domain: ActionDomainName | null;
    active?: boolean;
    planId?: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    replacesActionId?: string | null;
    occasionsPerWeek?: number | null;
    cue?: string | null;
    minimumVersion?: string | null;
  }[];
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
  today: string;
  plans: PlanRow[];
  records: { id: string; actionId: string; day: string; status: string; note: string | null; resultNote?: string | null }[];
  schedules?: { actionId: string; effectiveFrom: string; effectiveTo: string | null; kind: string }[];
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
export const createPlan = (token: string, body: { title: string; outcome: string; priorityNote?: string; linkKind?: string; valueRef?: string; purposeRevisionId?: string | null; sourceCombinationId?: string | null; territory?: string | null }) =>
  send<PlanRow>('/api/v1/journey/plans', token, { method: 'POST', body: JSON.stringify(body) });
export const addAction = (
  token: string,
  planId: string,
  body: { title: string; doneWhen: string; weekday?: number; guideId?: string; contentTags?: string[]; healthLimit?: string; conversation?: string; occasionsPerWeek?: number; minutesPerOccasion?: number; templateRef?: string; minimumVersion?: string },
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

export type DirectionMode = 'CLEAR' | 'EXPLORE' | 'UNKNOWN';

export type MemberDirection = {
  mode: DirectionMode | null;
  statement: string | null;
  desiredChange: string | null;
  directionStatus: string | null;
  revision: number | null;
  purposeRevisionId: string | null;
  updatedAt: string | null;
  sources: {
    vision: string | null;
    values: string[];
    ikigaiPurpose: string | null;
  };
  sourcesUsed: { id: string; label: string; text: string }[];
  plansOnOlderRevision: number;
};

export type DirectionSourceId = keyof MemberDirection['sources'];

export type EvidenceItem = {
  status: 'ANSWERED' | 'UNKNOWN' | 'DECLINED' | 'NOT_APPLICABLE' | 'PENDING' | 'SKIPPED' | 'EMPTY';
  texts: string[];
};

export type EvidenceSection = {
  id: 'vision' | 'values' | 'ikigai';
  title: string;
  moduleSlug: string;
  answered: number;
  total: number;
  groups: { id: string; title: string; question: string | null; items: EvidenceItem[] }[];
  access: 'ANSWERED' | 'CURRENT' | 'LATER' | 'NOT_STARTED' | 'CLOSED';
  href: string | null;
};

export type DirectionOverview = {
  history: {
    purposeRevisionId: string;
    revision: number;
    statement: string;
    mode: DirectionMode | null;
    savedAt: string;
    current: boolean;
  }[];
  linkedPlans: {
    id: string;
    title: string;
    territory: string | null;
    stage: string | null;
    linkKind: string | null;
    revision: number | null;
    directionStatement: string | null;
    current: boolean;
  }[];
  evidence: EvidenceSection[];
};

export const fetchDirection = (token: string) =>
  send<MemberDirection>('/api/v1/journey/direction', token);

export const fetchDirectionOverview = (token: string) =>
  send<DirectionOverview>('/api/v1/journey/direction/overview', token);

export const saveDirection = (
  token: string,
  body: {
    mode: DirectionMode;
    statement?: string | null;
    desiredChange?: string | null;
    commandKey?: string | null;
    sourceIds?: DirectionSourceId[];
  },
) =>
  send<{ purposeRevisionId: string; revision: number; repeated: boolean }>(
    '/api/v1/journey/direction',
    token,
    { method: 'POST', body: JSON.stringify(body) },
  );

export type ExplorationStep =
  | 'intro'
  | 'sources'
  | 'experience'
  | 'important'
  | 'contribution'
  | 'connection'
  | 'synthesis'
  | 'trial'
  | 'done';

export type ConfirmableSourceId = 'vision' | 'values' | 'ikigai' | 'heritage' | 'seal';

export type DirectionExplorationDraft = {
  version: 1;
  updatedAt: string;
  step: ExplorationStep;
  altEntry?: 'keep' | 'miss' | 'improve' | null;
  experience?: string;
  whyImportant?: string;
  contribution?: string;
  connection?: string;
  connectionSuggested?: string;
  connectionRejected?: boolean;
  recognition?: 'represents' | 'partial' | 'reword' | 'unseen' | null;
  partialNote?: string;
  directionPublished?: boolean;
  mattersOnItsOwn?: boolean;
  openDoubt?: string;
  questionSuggested?: string | null;
  questionAccepted?: string | null;
  trialSuggested?: string | null;
  trialAccepted?: string | null;
  observeSuggested?: string | null;
  observeAccepted?: string | null;
  returnWhen?: string;
  trialChoice?: 'accepted' | 'skipped' | null;
  trialFollowup?: 'tried' | 'not_tried' | 'adapted' | null;
  trialHappened?: string;
  trialKeep?: string;
  provisionalDirection?: string;
  synthesisEdit?: string;
  synthesisChoice?: 'accept' | 'edit' | 'continue' | null;
  trialWhat?: string;
  trialDiscover?: string;
  trialObserve?: string;
  sourceConfirmations?: Partial<Record<ConfirmableSourceId, 'yes' | 'edit' | 'skip'>>;
  sourceEdits?: Partial<Record<ConfirmableSourceId, string>>;
};

export type ConfirmableSource = {
  id: ConfirmableSourceId;
  label: string;
  origin: string;
  text: string;
};

export type ExplorationSharedItem = { id: string; label: string; text: string; origin: 'exploration' | 'source' };

export type ExplorationView = {
  draft: DirectionExplorationDraft;
  sources: ConfirmableSource[];
  synthesis: {
    shared: ExplorationSharedItem[];
    pair: { from: ExplorationSharedItem; to: ExplorationSharedItem; rule: string } | null;
    ownConnection: string | null;
    insufficient: boolean;
    reason: 'NO_ANSWERS' | 'TOO_LITTLE' | 'REJECTED' | null;
  };
  learning: {
    recognized: string | null;
    lines: string[];
    question: string | null;
    contextual: string | null;
    trial: string | null;
    observe: string | null;
  };
};

export const fetchDirectionExploration = (token: string) =>
  send<ExplorationView>('/api/v1/journey/direction/exploration', token);

export const saveDirectionExploration = (token: string, draft: Partial<DirectionExplorationDraft>) =>
  send<ExplorationView>('/api/v1/journey/direction/exploration', token, {
    method: 'PUT',
    body: JSON.stringify({ draft }),
  });

export const confirmDirectionExploration = (
  token: string,
  body: {
    statement?: string;
    desiredChange?: string | null;
    commandKey?: string | null;
    keepExploring?: boolean;
    draft?: Partial<DirectionExplorationDraft>;
  },
) =>
  send<{ purposeRevisionId: string; revision: number; repeated: boolean }>(
    '/api/v1/journey/direction/exploration/confirm',
    token,
    { method: 'POST', body: JSON.stringify(body) },
  );

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

export type MatrixWeek = {
  done: number;
  notDone: number;
  noInformation: number;
  excepted: number;
  dueUnmarked: number;
  upcoming: number;
  percent: number | null;
  percentReason: 'OPEN_WEEK' | 'NO_INFORMATION' | 'EXCEPTIONS' | 'NONE_RESOLVED' | 'LEGACY_WEEK' | null;
};

export type MatrixPlan = {
  id: string;
  title: string;
  stage: 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE' | 'CLOSED';
  isFocus: boolean;
  nextOccasion: { day: string; title: string } | null;
  week: MatrixWeek | null;
};

export type MatrixRow = {
  territory: string;
  label: string;
  discover: { state: 'NOT_STARTED' | 'PARTIAL' | 'EXPLORED'; settled: number; required: number; exceptionCount: number };
  planCount: number;
  plan: MatrixPlan | null;
};

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
  matrix?: MatrixRow[];
  weekStart?: string | null;
  cycle?: {
    directionStatement: string | null;
    directionDesiredChange: string | null;
    focusChange: string | null;
    focusOutcome: string | null;
    reviewAt: string | null;
  };
};

export type PlanSummary = {
  id: string;
  title: string;
  outcome: string;
  whyItMatters: string | null;
  linkKind: string | null;
  stage: string | null;
  territory: string | null;
  reviewAt: string | null;
  directionAtCreation: { statement: string | null; desiredChange: string | null; revision: number | null } | null;
  strategyTitle: string | null;
  actionTitle: string | null;
  doneWhen: string | null;
  outcomeCriterion?: string | null;
  outcomeContract?: import('@/lib/intervention-api').PlanOutcomeContractView | null;
  outcomeContractMeta?: import('@/lib/intervention-api').OutcomeContractMeta;
  outcomeContractComplete?: boolean;
  evidenceHint?: string | null;
  learningNote?: string | null;
  observedEvidence?: string | null;
  resultMode?: 'RESULT' | 'EXPLORATION';
  actions?: { id: string; title: string; doneWhen: string; cue: string | null; minimum: string | null; occasionsPerWeek: number | null; minutesPerOccasion: number | null }[];
  obstacles?: { obstacle: string; response: string }[];
  resources?: string | null;
};

export const fetchPlanSummary = (token: string, planId: string) =>
  send<PlanSummary>(`/api/v1/journey/plans/${planId}/summary`, token);

export type MemoryView = {
  plans: unknown[];
  signedContract: unknown;
  draftPurpose: unknown;
  directionHistory?: { id: string; revision: number; statement: string | null; desiredChange: string | null; crossPossibility?: string | null; createdAt: string }[];
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
  planId?: string | null;
  stage?: string | null;
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

export type PlanProposalRow = {
  id: string;
  kind: string;
  status: string;
  payload: unknown;
  editedPayload: unknown;
  reasons: unknown;
  decidedAt: string | null;
};

export const fetchPlanProposals = (token: string, planId: string) =>
  send<PlanProposalRow[]>(`/api/v1/journey/plans/${planId}/proposals`, token);

export const patchPlanDraft = (
  token: string,
  planId: string,
  body: {
    title?: string;
    outcome?: string;
    whyItMatters?: string | null;
    whyStatus?: string | null;
    territory?: string | null;
    capacityMinutes?: number;
    protectNote?: string | null;
    criterionText?: string | null;
    criterionStatus?: string | null;
    expectedVersion?: number;
  },
) =>
  send<PlanRow>(`/api/v1/journey/plans/${planId}/draft`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const activatePlanDraft = (
  token: string,
  planId: string,
  body: {
    confirmed?: boolean;
    capacityMinutes?: number;
    protectNote?: string | null;
    explicitNoSchedule?: boolean;
    expectedVersion?: number;
    commandKey?: string;
  },
) =>
  send<{ plan: PlanRow; repeated: boolean }>(`/api/v1/journey/plans/${planId}/activate`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const addPlanEvidence = (
  token: string,
  planId: string,
  body: {
    kind: string;
    status: string;
    text?: string | null;
    observedOn?: string;
    commandKey?: string;
  },
) =>
  send(`/api/v1/journey/plans/${planId}/evidence`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const transitionPlanStage = (
  token: string,
  planId: string,
  body: {
    toStage: 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE' | 'CLOSED';
    reason?: string | null;
    learningNote?: string | null;
    expectedVersion?: number;
  },
) =>
  send<PlanRow>(`/api/v1/journey/plans/${planId}/transition`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export type MaintenancePreview = {
  minimumAction: { title: string; doneWhen: string; weekday: number | null; intervalDays: number } | null;
  reviewSignal: string;
};

export const fetchMaintenancePreview = (token: string, planId: string) =>
  send<MaintenancePreview>(`/api/v1/journey/plans/${planId}/maintenance/preview`, token);

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

export function planAllowsAchievement(plan: Pick<PlanRow, 'criterionText' | 'criterionStatus' | 'stage' | 'status'>): boolean {
  const stage = plan.stage ?? (plan.status === 'ACTIVE' ? 'ACTIVE' : plan.status === 'ARCHIVED' ? 'CLOSED' : 'PREPARING');
  if (stage !== 'ACTIVE' && stage !== 'MAINTENANCE') return false;
  return plan.criterionStatus === 'CONFIRMED' && Boolean(plan.criterionText?.trim());
}

export const declarePlanAchievement = (
  token: string,
  planId: string,
  body: { confirm: boolean; expectedVersion?: number; commandKey?: string; learningNote?: string | null },
) =>
  send<{ plan: PlanRow; repeated: boolean }>(`/api/v1/journey/plans/${planId}/achievement`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export type { MemberAccess };

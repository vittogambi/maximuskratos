import { send } from '@/lib/journey-api';

export type Recognition = 'REPRESENTS' | 'PARTIAL' | 'NOT';

export type SourceId = { instrument: string; row: number; sourceRef: string; catalogVersion: string | null; revision: number };

export type Reading = {
  id: string;
  group: string;
  goal: string;
  status: 'CANDIDATE' | 'TO_CONFIRM';
  declared: string[];
  interpretation: string;
  question: string;
  asksFocus: string | null;
  vision: string | null;
  sources: SourceId[];
  signature: string;
  recognition: Recognition | null;
  plans: string[];
};

export type Indicator = {
  ref: string;
  role: 'RESULT' | 'PERCEPTION';
  question: string;
  kind: 'COUNT' | 'SCALE_1_5' | 'YES_NO' | 'CHOICE' | 'TEXT';
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  better: 'UP' | 'DOWN' | 'NONE';
  notApplicable?: string;
};

export type Template = {
  id: string;
  version: string;
  group: string;
  goal: string;
  title: string;
  seeks: string;
  action: string;
  schedule: { kind: 'WEEKLY'; occasionsPerWeek: number; minutesPerOccasion: number } | { kind: 'TRIGGER'; trigger: string; minutesPerOccasion: number };
  minimum: { text: string; occasionsPerWeek: number | null; minutesPerOccasion: number; indicators?: Indicator[] };
  doneWhen: string;
  indicators: Indicator[];
  horizonWeeks: number;
  focusPrompt?: string;
  stagePrompt?: string;
  notes: string[];
  contentTags?: string[];
};

export type InterventionView = {
  version: string;
  goal: string | null;
  goals: { id: string; label: string }[];
  prioritized: boolean;
  readings: Reading[];
  setAside: string[];
  hasAnswers: boolean;
  ineligible: { key: string; reason: string }[];
  vision: { text: string } | null;
  modifiers: {
    suggestMinimum: { because: string } | null;
    environmentAlternative: { text: string } | null;
  };
  templates: Template[];
  memoryNotes?: string[];
};

export type MeasurePoint = { periodStart: string; value: number | null; text: string | null; notApplicable: boolean };

export type ReviewMeaning = 'STILL' | 'LESS' | 'NO_LONGER';

export type OutcomeAssessmentStatus = 'ACHIEVED' | 'NOT_YET' | 'INSUFFICIENT' | 'LEARNED';

export type OutcomeContractMeta = {
  recoveredFromLegacy: boolean;
  complete: boolean;
  pendingFields: ('CRITERION' | 'CRITERION_CONFIRM' | 'EVIDENCE' | 'CHECK_AT')[];
};

export type PlanDirectionSnapshot = {
  purposeRevisionId: string;
  revision: number;
  statement: string | null;
  desiredChange: string | null;
};

export type PlanOutcomeContractView = {
  revision: number;
  mode?: 'RESULT' | 'EXPLORATION';
  change: string;
  why: string | null;
  soughtOutcome: string;
  criterion: string;
  criterionStatus: 'PROVISIONAL' | 'CONFIRMED';
  checkAt: string | null;
  evidenceHint: string | null;
  linkedIndicatorRef: string | null;
  purposeRevisionId: string | null;
  linkKind: string | null;
  effectiveFrom: string | null;
};

export type ReviewActionRow = {
  id: string;
  title: string;
  doneWhen: string;
  cue: string | null;
  minimumVersion: string | null;
  occasionsPerWeek: number | null;
  minutesPerOccasion: number | null;
  position: number;
  kind: 'WEEKLY' | 'ONCE' | 'TRIGGER' | 'FIXED';
  onceWeekStart: string | null;
  active: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  endedReason: string | null;
  replacesActionId: string | null;
  replacedBy: { id: string; title: string } | null;
  contentTags: string[];
  fromTemplate: boolean;
  week: { done: number; notDone: number; noInformation: number; dueUnmarked: number; upcoming: number; excepted: number };
  once: { status: 'DONE' | 'NOT_DONE' | 'NO_INFORMATION' | 'PENDING' | 'UPCOMING'; weekStart: string } | null;
  needsDecision: boolean;
};

export type ActionOp = 'KEEP' | 'REDUCE' | 'MODIFY' | 'RESCHEDULE' | 'SUBSTITUTE' | 'RETIRE';
export type ReviewSchedule = { kind: 'WEEKLY'; occasionsPerWeek?: number } | { kind: 'ONCE'; weekStart: string };

export type ActionChange = {
  actionId: string;
  op: ActionOp;
  title?: string;
  doneWhen?: string;
  cue?: string | null;
  minimum?: string | null;
  occasionsPerWeek?: number;
  minutesPerOccasion?: number;
  schedule?: ReviewSchedule;
  reason?: string;
  contentTags?: string[];
};

export type ActionAddition = {
  title: string;
  doneWhen: string;
  cue?: string | null;
  minimum?: string | null;
  minutesPerOccasion: number;
  schedule: ReviewSchedule;
  contentTags?: string[];
};

export type InterventionPlanView = {
  actions?: ReviewActionRow[];
  endedActions?: ReviewActionRow[];
  reviewWeek?: { weekStart: string; nextWeek: string; nextWeekMinutes: number; appliesFrom?: string; weekMinutes?: number };
  marks?: ContentMark[];
  version: string;
  planId: string;
  stage: string | null;
  protectNote: string | null;
  changeTitle?: string;
  observableOutcome?: string;
  whyItMatters?: string | null;
  linkKind?: string | null;
  outcomeContract?: PlanOutcomeContractView | null;
  outcomeContractMeta?: OutcomeContractMeta;
  outcomeContractComplete?: boolean;
  directionAtDraft?: PlanDirectionSnapshot | null;
  directionCurrent?: PlanDirectionSnapshot | null;
  directionChoiceRequired?: boolean;
  outcomeAssessment?: {
    status: OutcomeAssessmentStatus;
    text: string | null;
    contractRevision: number;
    observedOn: string;
    periodStart: string | null;
  } | null;
  outcomeCheckDue?: 'NOT_YET' | 'DUE' | 'UNKNOWN';
  outcomeReviewHint?: string | null;
  toolIndicatorLinked?: boolean;
  template: Template;
  general: boolean;
  minimum: boolean;
  horizonWeeks: number;
  focusText: string | null;
  stageDefinition: string | null;
  readings: { id: string; outcome: Recognition; declared: string[] }[];
  consulted?: { id: string; declared: string[] }[];
  load: { weeklyMinutes: number; occasionsPerWeek: number | null; minutesPerOccasion: number; confirmed: boolean } | null;
  environmentAccepted: boolean;
  reviewAt: string | null;
  horizonReached: boolean;
  indicators: {
    indicator: Indicator;
    baseline: MeasurePoint | null;
    latest: MeasurePoint | null;
    answeredThisWeek: boolean;
    history: MeasurePoint[];
    progress: 'ADVANCE' | 'MAINTAINED' | 'NO_ADVANCE' | 'UNKNOWN';
  }[];
  execution: {
    done: number;
    notDone: number;
    noInformation: number;
    level: string;
    levelForReview: string;
    coverage: 'COMPLETE' | 'INCOMPLETE' | 'NONE';
    ratioOfResolved: number | null;
    scheduled: number;
    resolved: number;
  };
  review: {
    code: string;
    text: string;
    outcomeText?: string;
    choices: ('KEEP' | 'REDUCE' | 'MODIFY' | 'SUBSTITUTE' | 'NO_RECORDS')[];
    lastChoice: string | null;
    pendingThisWeek: { previewSummary: string | null; choice: string } | null;
    alternateTemplate: { id: string; action: string; doneWhen: string } | null;
  };
};

const base = (territory: string) => `/api/v1/journey/intervention/${encodeURIComponent(territory)}`;

export const fetchIntervention = (token: string, territory: string, goal?: string | null) =>
  send<InterventionView>(`${base(territory)}${goal ? `?meta=${encodeURIComponent(goal)}` : ''}`, token);

export const recognizeReading = (token: string, territory: string, body: { readingId: string; outcome: Recognition; signature: string }) =>
  send<InterventionView>(`${base(territory)}/recognition`, token, { method: 'POST', body: JSON.stringify(body) });

export const patchOutcomeContract = (
  token: string,
  territory: string,
  planId: string,
  body: {
    soughtOutcome?: string;
    criterion?: string;
    criterionStatus?: 'PROVISIONAL' | 'CONFIRMED';
    evidenceHint?: string | null;
    checkAt?: string | null;
    linkedIndicatorRef?: string | null;
    confirmed?: boolean;
    commandKey?: string;
  },
) => send<{ plan: { id: string }; repeated?: boolean }>(`${base(territory)}/plans/${planId}/outcome-contract`, token, {
  method: 'PATCH',
  body: JSON.stringify(body),
});

export const recordOutcomeAssessment = (
  token: string,
  territory: string,
  planId: string,
  body: { status: OutcomeAssessmentStatus; text?: string | null; weekStart?: string; commandKey: string },
) => send<{ evidence: { id: string }; repeated?: boolean }>(`${base(territory)}/plans/${planId}/outcome-assessment`, token, {
  method: 'POST',
  body: JSON.stringify(body),
});

export const fetchInterventionPlan = (token: string, territory: string, planId: string, weekStart?: string) =>
  send<InterventionPlanView>(`${base(territory)}/plans/${planId}${weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ''}`, token);

export const recordIndicator = (
  token: string,
  territory: string,
  planId: string,
  body: {
    indicatorRef: string;
    value?: number | null;
    text?: string | null;
    textOutcome?: 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN';
    notApplicable?: boolean;
    commandKey: string;
  },
) => send<{ repeated: boolean }>(`${base(territory)}/plans/${planId}/indicator`, token, { method: 'POST', body: JSON.stringify(body) });

export const activateInterventionPlan = (
  token: string,
  territory: string,
  planId: string,
  body: {
    confirmed: boolean;
    commandKey: string;
    minimumLoadConfirmed?: boolean;
    reviewAt?: string | null;
    purposeRevisionId?: string | null;
    keepDraftPurposeRevision?: boolean;
    healthLimit?: 'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT';
    conversation?: 'VIABLE' | 'UNSAFE';
  },
) => send<{ plan: { id: string }; repeated: boolean }>(`${base(territory)}/plans/${planId}/activate`, token, { method: 'POST', body: JSON.stringify(body) });

export type ResultMode = 'RESULT' | 'EXPLORATION';
export type WorkPattern = 'HABIT' | 'STEPS' | 'DECISION' | 'CONVERSATION' | 'EXPLORE' | 'FREE';
export type ContentMark = 'PHYSICAL_EXERTION' | 'DIET' | 'SUPPLEMENT' | 'MEDICATION' | 'CONFRONTATION' | 'INVESTMENT' | 'DEBT';

export type DesignSchedule =
  | { kind: 'WEEKLY'; occasionsPerWeek: number; minutesPerOccasion: number }
  | { kind: 'ONCE'; week: number; minutesPerOccasion: number }
  | { kind: 'TRIGGER'; trigger: string; minutesPerOccasion: number };

export type DesignAction = {
  key: string;
  title: string;
  doneWhen: string;
  cue: string | null;
  minimum: string | null;
  schedule: DesignSchedule;
  contentTags: ContentMark[];
  source: { kind: 'TEMPLATE'; templateId: string; usesMinimum: boolean } | { kind: 'PATTERN'; pattern: WorkPattern } | { kind: 'MEMBER' };
  basis: number;
};

export type DesignStrategy =
  | { kind: 'CATALOG'; templateId: string; focusText: string | null; stageDefinition: string | null }
  | { kind: 'OWN'; pattern: WorkPattern; title: string; approach: string | null };

export type DesignMissing = { step: 1 | 2 | 3 | 4; code: string; message: string; actionKey?: string };

export type Recommendation =
  | { kind: 'CATALOG'; templateId: string; reasons: string[]; priorUse: string | null }
  | { kind: 'OWN'; pattern: WorkPattern; reasons: string[]; priorUse: null };

export type DesignContext = {
  territory: string;
  version: string;
  goals: { id: string; label: string }[];
  readings: Reading[];
  setAside: number;
  hasAnswers: boolean;
  modifiers: InterventionView['modifiers'];
  direction: {
    mode: string | null;
    statement: string | null;
    desiredChange: string | null;
    values: string[];
    revision: number | null;
    purposeRevisionId: string | null;
  } | null;
  priorPlans: { id: string; title: string; stage: string | null; templateId: string | null; strategyTitle: string | null; learning: string | null; assessment: OutcomeAssessmentStatus | null }[];
  otherActiveMinutes: number;
  marks: ContentMark[];
  patterns: { id: WorkPattern; label: string; description: string }[];
  catalog: Template[];
};

export type DesignView = {
  planId: string;
  territory: string;
  stage: string;
  version: number;
  adopted: boolean;
  minimum: boolean;
  change: { text: string; why: string | null; goal: string | null; contextReadingIds: string[]; purposeRevisionId: string | null; linkKind: string | null };
  directionAtDraft: { purposeRevisionId: string; revision: number; statement: string | null } | null;
  result: { saved: boolean; mode: ResultMode | null; soughtOutcome: string | null; criterion: string | null; evidenceHint: string | null; horizonWeeks: number };
  strategy: DesignStrategy | null;
  template: Template | null;
  actions: DesignAction[];
  obstacles: { obstacle: string; response: string }[];
  resources: string | null;
  protectNote: string | null;
  loadConfirmed: boolean;
  environmentAccepted: boolean;
  load: { byWeek: number[]; maxWeekly: number; occasionsFirstWeek: number; demanding: boolean };
  stale: boolean;
  readiness: { ready: boolean; missing: DesignMissing[] };
  resumeStep: 1 | 2 | 3 | 4 | 5;
  recommendations: { basis: 'PERSONAL' | 'NONE'; note: string | null; items: Recommendation[] };
  safety: { health: boolean; conversation: boolean; restricted: { actionKey: string; reason: string; alternatives: string[] }[] };
  context: DesignContext;
};

export type DesignChangeInput = {
  change: string;
  why: string | null;
  goal: string | null;
  contextReadingIds: string[];
  purposeRevisionId: string | null;
  linkKind: string | null;
};

export type DesignPatch =
  | ({ section: 'change' } & DesignChangeInput)
  | { section: 'result'; mode: ResultMode; soughtOutcome: string; criterion: string; evidenceHint: string | null; horizonWeeks: number }
  | { section: 'strategy'; strategy: DesignStrategy; actionsResolution?: 'KEEP' | 'REPLACE' | 'ADD' }
  | {
    section: 'actions';
    actions: (Omit<DesignAction, 'key' | 'source' | 'basis'> & { key?: string; usesMinimum?: boolean })[];
    obstacles: { obstacle: string; response: string }[];
    resources: string | null;
    protectNote: string | null;
    loadConfirmed: boolean;
    environmentAccepted: boolean;
    acknowledgeObjective?: boolean;
  };

export const fetchDesignContext = (token: string, territory: string) =>
  send<DesignContext>(`${base(territory)}/design-context`, token);

export const createDesign = (token: string, territory: string, body: DesignChangeInput & { commandKey: string }) =>
  send<DesignView>(`${base(territory)}/designs`, token, { method: 'POST', body: JSON.stringify(body) });

export const fetchDesign = (token: string, territory: string, planId: string) =>
  send<DesignView>(`${base(territory)}/plans/${planId}/design`, token);

export const patchDesign = (token: string, territory: string, planId: string, body: DesignPatch) =>
  send<DesignView>(`${base(territory)}/plans/${planId}/design`, token, { method: 'PATCH', body: JSON.stringify(body) });

export const confirmInterventionReview = (
  token: string,
  territory: string,
  planId: string,
  body: {
    choice: 'KEEP' | 'REDUCE' | 'MODIFY' | 'SUBSTITUTE' | 'NO_RECORDS';
    weekStart?: string;
    revision?: { title?: string; doneWhen?: string; occasionsPerWeek?: number | null; minutesPerOccasion?: number | null };
    alternateTemplateId?: string | null;
    note?: string | null;
    commandKey: string;
    meaning?: ReviewMeaning | null;
    actions?: ActionChange[];
    additions?: ActionAddition[];
    healthLimit?: 'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT';
    conversation?: 'VIABLE' | 'UNSAFE';
    indicatorChoice?: 'KEEP' | 'REVIEW';
  },
) => send<InterventionPlanView & { weekReview?: { weekStart: string; pendingCount: number; previewSummary: string | null; needsWeekApply: boolean; followsProposal?: boolean; nextWeekMinutes?: number }; repeated?: boolean }>(
  `${base(territory)}/plans/${planId}/review-decision`,
  token,
  { method: 'POST', body: JSON.stringify(body) },
);

export const fetchPendingInterventionWeek = (token: string, weekStart: string) =>
  send<{
    weekStart: string;
    appliesFrom: string | null;
    laterCloseWeek: string | null;
    pending: {
      planId: string;
      planTitle: string;
      territory: string;
      choice: string;
      previewSummary: string | null;
      actions?: { actionId: string; op: ActionOp; summary: string }[];
      additions?: { summary: string }[];
    }[];
    weekClosed: boolean;
  }>(
    `/api/v1/journey/intervention/week-review/pending?weekStart=${encodeURIComponent(weekStart)}`,
    token,
  );

export const applyInterventionWeekReview = (token: string, body: { weekStart: string; note?: string | null; commandKey: string }) =>
  send<{ weekStart: string; applied: number }>('/api/v1/journey/intervention/week-review/apply', token, { method: 'POST', body: JSON.stringify(body) });

export function newCommandKey(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

export type MenA1WeekPrepView = {
  familyId: string;
  weekStart: string;
  minimum: boolean;
  status: string;
  weekClosed: boolean;
  editable: boolean;
  seeks: string;
  focusText: string | null;
  load: InterventionPlanView['load'];
  protectNote: string | null;
  maxPriorities: number;
  prep: {
    priorities: { id: string; advance: string; recognize: string; nextStep: string }[];
    primaryId: string | null;
    prepConfirmedAt: string | null;
  };
  reviewOutcomes: { priorities: { id: string; outcome: string; note?: string | null }[] } | null;
  indicatorPreview: { value: number | null; complete: boolean; unknownCount: number; reason?: string };
};

export const fetchMenA1WeekPrep = (token: string, territory: string, planId: string, weekStart?: string) =>
  send<MenA1WeekPrepView>(
    `${base(territory)}/plans/${planId}/week-prep${weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ''}`,
    token,
  );

export const saveMenA1WeekPrep = (
  token: string,
  territory: string,
  planId: string,
  body: { weekStart?: string; payload?: unknown; commandKey?: string },
) => send<MenA1WeekPrepView>(`${base(territory)}/plans/${planId}/week-prep`, token, { method: 'PATCH', body: JSON.stringify(body) });

export const confirmMenA1WeekPrep = (
  token: string,
  territory: string,
  planId: string,
  body: { weekStart?: string; commandKey?: string },
) => send<MenA1WeekPrepView>(`${base(territory)}/plans/${planId}/week-prep/confirm`, token, { method: 'POST', body: JSON.stringify(body) });

export const saveMenA1WeekPrepReview = (
  token: string,
  territory: string,
  planId: string,
  body: { weekStart?: string; outcomes?: MenA1WeekPrepView['reviewOutcomes']; commandKey?: string },
) => send<MenA1WeekPrepView>(`${base(territory)}/plans/${planId}/week-prep/review-outcomes`, token, { method: 'PATCH', body: JSON.stringify(body) });

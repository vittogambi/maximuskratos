import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FORMULARIO_COMPLETO_REF } from '@mk/database';
import { PrismaService } from '../prisma/prisma.service';
import { withoutInternalAlerts } from '../admin/public-reading';
import { alignmentReading, type IadAnswer, type IadId, type IadResults } from '../instrumentos/iad';
import { decideAction, type ContentTag } from '../instrumentos/restrictions';
import { futureOccasions, nextPlanOutcome, previewWeek, type WeekDecision, type WeekEffect, type WeekRevision } from './apply-week';
import { JourneyClock, WeekApplyHook, journeyNow } from './journey-clock';
import { ACTION_DOMAINS, executionReading, type ActionDomainName } from './execution';
import { buildHdrpContract, contractText, hdrpGaps, withChosenPurpose, type HdrpArticle, type HdrpFacts, type HdrpGap } from './hdrp-contract';
import { ambitsOf, fieldFromContext, fieldFromSource } from '../instrumentos/ikigai-lists';
import { IKIGAI_LISTAS } from '../instrumentos/ikigai-listas';
import {
  activityFromStored,
  readSynthesis,
  reconcileSynthesis,
  visiblePurpose,
  type Activity,
} from './purpose-synthesis';
import {
  applyOperationalClarification,
  guideTags,
  healthFactFromAnswers,
  isWorkingDirection,
  parseContentTags,
  parseConversation,
  parseHealthLimit,
  PLAN_LINKS,
  activationBlock,
  planActivationInput,
  resolvePlanLink,
  unfinishedHelp,
  type HealthLimitOutcome,
} from './plan-gate';
import {
  buildDirectionSources,
  buildMemberDirectionView,
  mergeDirectionContent,
  readDirectionFields,
  snapshotSources,
  type DirectionMode,
  type MemberDirectionView,
  type SaveMemberDirectionInput,
} from './member-direction';
import {
  buildConfirmableSources,
  buildExplorationSynthesis,
  directionSourcesFromDraft,
  proposeLearning,
  defaultExplorationDraft,
  mergeExplorationDraft,
  readExplorationDraft,
  type DirectionExplorationDraft,
} from './direction-exploration';
import { buildPurposeEvidence, EVIDENCE_MODULES } from './purpose-evidence';
import {
  achievementEvidenceReady,
  canDeclareAchievement,
  canTransition,
  compatStatus,
  fromLegacy,
  type PlanStage,
} from './plan-lifecycle';
import { assertPlanVersion, focusTargets, nextPlanVersion } from './plan-writes';
import type { ActivatePlanDto, FocusPlanDto, TransitionPlanDto } from './dto/plan-stage.dto';
import { answerLedger } from '../instrumentos/answer-ledger';
import { accountTextsFromLedger } from '../instrumentos/ledger-account';
import { discoverSynthesis } from './discover-synthesis';
import { territoryExceptionRows } from '../instrumentos/territory-catalog';
import { buildDashboard, nextPlanOccasion, selectContextualPlan, territoryDetail, type PlanFact } from './dashboard';
import { templateById as interventionTemplate } from './intervention/registry';
import { buildMemory } from './memory-reading';
import { contractFromPlanRow, outcomeContractMeta } from './plan-outcome-contract';
import { returnPanel } from './return-panel';
import { readOwnPlan } from './own-plan';
import { directionSeed } from './purpose-link';
import { weekCounts } from './week-count';
import { flexOccasionCapReached, isOccasionRegistrationDay, resolveSchedule } from './action-schedule';
import { appendScheduleVersion, loadActionSchedules } from './action-schedules.db';
import { actionPatchesFromProposals, planPatchFromProposals } from './plan-proposal-apply';
import { inferPlanTerritory } from './plan-territory-assignment';
import { reviewReading } from './review-reading';
import { homeBoard, type HomePlan } from './home-board';
import { nextStep } from './next-step';
import { isIsoDate, isMonday, weekStartMonday } from './civil-date';
import { actionCountsInWeek, type WindowedAction } from './action-window';
import { reviewAppliesFrom } from './civil-week';
import { alignmentViews, depthView, closeMeasurement, openMeasurement, saveMeasurementAnswer, materializeInitialAlignment } from '../instrumentos/core-reading';
import { draftHelp, normalizeInterest, proposePriority, type PriorityInput } from './priority';
import { createHash } from 'node:crypto';
import { canonicalHash } from './accompaniment/canon';
import { CONTEXT_REVIEW_DAYS } from './accompaniment/vocab';
import { occasionTally } from './execution';
import { guidanceFromOccasions } from './review-guidance';

const ZONE = 'America/Santiago';
/** Form code of the persisted formulario completo reading (written by instrumentos/reading.ts). */
const FORMULARIO_FORM_CODE = 'formulario-completo';

function readLines(text: string | null): Record<string, string> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value ?? '').trim()]),
    );
  } catch {
    return {};
  }
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** Review changes that are not a decision on an existing action. Applied in the same close. */
export type WeekExtras = {
  additions?: {
    planId: string;
    title: string;
    doneWhen: string;
    cue?: string | null;
    minimumVersion?: string | null;
    occasionsPerWeek?: number | null;
    minutesPerOccasion: number;
    onceWeekStart?: string | null;
    contentTags?: string[];
    conversationOutcome?: string | null;
    position: number;
  }[];
  endReasons?: Record<string, string>;
};

function actionVisibleForWeek(
  action: WindowedAction & { pausedAt: Date | null },
  siblings: WindowedAction[],
  weekStart: string,
  weekEnd: string,
): boolean {
  return actionCountsInWeek(action, siblings, weekStart, weekEnd) && !action.pausedAt;
}

function directionOf(purpose: { content: unknown } | null): string | null {
  const content = purpose?.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const value = (content as { directionStatus?: unknown }).directionStatus;
  return typeof value === 'string' ? value : null;
}

type FactRow = {
  freeText: string | null;
  skipped: boolean;
  question: { order: number; sourceRef: string | null; module: { slug: string } };
  selectedOptions: { order: number; value: string; textEs: string }[];
};

function cell(rows: FactRow[], sheet: string, ref: string): FactRow | undefined {
  return rows.find((row) => row.question.sourceRef === `formulario-v1:${sheet}!${ref}`);
}

function answerText(row: FactRow | undefined): string | null {
  if (!row || row.skipped) return null;
  const free = row.freeText?.trim();
  if (free) return free;
  const option = [...row.selectedOptions].sort((left, right) => left.order - right.order)[0];
  return option?.textEs?.trim() || null;
}

function optionValue(row: FactRow): number | null {
  const option = [...row.selectedOptions].sort((left, right) => left.order - right.order)[0];
  const value = option?.value == null ? null : Number(option.value);
  return Number.isFinite(value) ? value : null;
}

const PARTNER_GATE_REF = 'mk:f-rad-002-pareja-puerta';
const PARTNER_NEVER = 'No tengo ni he tenido pareja';

function moduleNumbers(rows: FactRow[], slugs: string[]): Array<number | null> {
  return slugs.flatMap((slug) => rows
    .filter((row) => row.question.module.slug === slug && row.question.sourceRef !== PARTNER_GATE_REF)
    .sort((left, right) => left.question.order - right.question.order)
    .map(optionValue));
}

function activityAnswer(text: string | null): string | null {
  if (!text) return null;
  if (!text.startsWith('{')) return text;
  try {
    const parsed = JSON.parse(text) as { answer?: string };
    return parsed.answer?.trim() || null;
  } catch {
    return text;
  }
}

function optionTexts(row: FactRow | undefined): string[] {
  if (!row) return [];
  return [...row.selectedOptions]
    .sort((left, right) => left.order - right.order)
    .map((option) => option.textEs.trim())
    .filter(Boolean);
}

function labeledStandards(text: string | null): { label: string; text: string }[] {
  if (!text?.trim()) return [];
  const labels: [string, string][] = [
    ['Trascendencia', 'Trascendencia'],
    ['Familia', 'Familia'],
    ['Amistad', 'Amistad'],
    ['Trabajo significativo', 'Trabajo significativo'],
    ['Cualquier otro|Otro', 'Cualquier otro'],
  ];
  const found = labels.flatMap(([pattern, label]) => {
    const match = text.match(new RegExp(`(?:${pattern}):\\s*([^\\n]+)`, 'i'));
    return match?.[1]?.trim() ? [{ label, text: match[1].trim() }] : [];
  });
  return found.length ? found : [{ label: 'Semana', text: text.trim() }];
}

function identityReading(sum: number | null): string | null {
  if (sum == null) return null;
  if (sum < 18) return 'Difusa: opera desde hábitos heredados o reactivos.';
  if (sum < 26) return 'Inestable: existe intención, pero falta coherencia y estándares.';
  if (sum <= 35) return 'En construcción: proceso activo de alineación.';
  return 'Encarnada: hábitos y decisiones reflejan la identidad declarada.';
}

const DIFFICULTY_FAMILIES: { refs: string[]; read: (score: number) => string }[] = [
  {
    refs: ['R94', 'R95', 'R96', 'R98', 'R99', 'R100', 'R102', 'R103', 'R104'],
    read: (score) => score <= 3
      ? 'Ausente: comportamiento libre de bloqueos históricos.'
      : score <= 12
        ? 'Sombra latente: existen conductas semiautomáticas de autosabotaje.'
        : 'Dominante: ciclo crítico y activo de boicot.',
  },
  {
    refs: ['R107', 'R108', 'R109', 'R111', 'R112', 'R113', 'R115', 'R116', 'R117'],
    read: (score) => score <= 4
      ? 'Sin sombra aparente en esta área.'
      : score <= 11
        ? 'Sombra latente: máscara de coraza e hiperindependencia.'
        : 'Sombra dominante: represión emocional por miedo a la vulnerabilidad.',
  },
  {
    refs: ['R120', 'R121', 'R122', 'R124', 'R125', 'R126', 'R128', 'R129', 'R130'],
    read: (score) => score <= 4
      ? 'Sin sombra aparente en esta área.'
      : score <= 11
        ? 'Sombra latente: juicio restrictivo hacia el entorno.'
        : 'Sombra dominante: proyección de sus propios límites en otros.',
  },
  {
    refs: ['R133', 'R134', 'R135', 'R137', 'R138', 'R139', 'R141', 'R142', 'R143'],
    read: (score) => score <= 4
      ? 'Sin sombra aparente en esta área.'
      : score <= 11
        ? 'Sombra latente: parálisis por análisis y postergación.'
        : 'Sombra dominante: evasión de la responsabilidad del cambio.',
  },
];

function difficultyReading(rows: FactRow[]): string | null {
  const lines = DIFFICULTY_FAMILIES.map((family) => {
    const values = family.refs.map((ref) => {
      const row = cell(rows, 'E-PER-000', ref);
      return row ? optionValue(row) : null;
    });
    if (values.some((value) => value == null)) return null;
    const names = ['Patrones repetitivos', 'Emociones rechazadas', 'Proyección', 'Excusas y autoengaño'];
    return `${names[DIFFICULTY_FAMILIES.indexOf(family)]}. ${family.read(values.reduce<number>((sum, value) => sum + (value ?? 0), 0))}`;
  });
  return lines.every(Boolean) ? lines.join('\n') : null;
}

function partnerOf(rows: FactRow[]): HdrpFacts['partner'] {
  const text = answerText(rows.find((row) => row.question.sourceRef === PARTNER_GATE_REF)) ?? '';
  if (text === PARTNER_NEVER) return 'never';
  if (text.startsWith('No tengo pareja ahora')) return 'last';
  if (text.startsWith('Tengo pareja')) return 'now';
  return null;
}

function formularioFacts(rows: FactRow[]): HdrpFacts | null {
  if (!rows.some((row) => row.question.sourceRef?.startsWith('formulario-v1:'))) return null;
  const chosenValues = optionTexts(cell(rows, 'E-PER-000', 'R51'));
  const values = chosenValues.length ? chosenValues : optionTexts(cell(rows, 'E-PER-000', 'R40'));
  const standardText = answerText(cell(rows, 'E-PER-000', 'R62'));
  const standards = labeledStandards(standardText);
  const identityRows = rows
    .filter((row) => row.question.module.slug === 'e-per-identidad')
    .sort((left, right) => left.question.order - right.question.order);
  const identityChoices = identityRows.map(optionValue);
  const identitySum = identityChoices.length === 10 && identityChoices.every((value) => value != null)
    ? identityChoices.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
  const oceanRows = rows
    .filter((row) => row.question.module.slug === 'e-per-personalidad')
    .sort((left, right) => left.question.order - right.question.order);
  const oceanValues = oceanRows.map(optionValue);
  const activities = [...new Set(
    rows
      .filter((row) => row.question.module.slug === 'e-per-ikigai')
      .sort((left, right) => left.question.order - right.question.order)
      .map((row) => activityAnswer(answerText(row)))
      .filter((text): text is string => Boolean(text)),
  )].slice(0, 4);
  return {
    heritage: answerText(cell(rows, 'E-PER-000', 'R12')),
    values,
    standards,
    identity: identityReading(identitySum),
    pattern: difficultyReading(rows),
    vision: answerText(cell(rows, 'E-PER-000', 'R34')) ?? answerText(cell(rows, 'E-PER-000', 'R33')),
    activities,
    seal: answerText(cell(rows, 'E-PER-000', 'R277')),
    ocean: oceanValues.length === 15 && oceanValues.every((value) => value != null) ? oceanValues as number[] : [],
    relation: moduleNumbers(rows, ['f-rad-002-s1', 'f-rad-002-s2', 'f-rad-002-s3', 'f-rad-002-s4']),
    finance: moduleNumbers(rows, ['f-rad-003-s1', 'f-rad-003-s2', 'f-rad-003-s3', 'f-rad-003-s4']),
    partner: partnerOf(rows),
  };
}

function crossPossibilityText(content: unknown): string | null {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const purpose = (content as { synthesis?: { purpose?: { edited?: string | null; generated?: string | null } } }).synthesis?.purpose;
  const text = purpose?.edited?.trim() || purpose?.generated?.trim() || '';
  return text || null;
}

@Injectable()
export class JourneyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: JourneyClock,
    private readonly weekApply: WeekApplyHook,
  ) {}

  async state(userId: string) {
    const [purpose, plans, weeks, form, active] = await Promise.all([
      this.latestPurpose(userId),
      this.listPlans(userId),
      this.weeks(userId),
      this.formularioReading(userId),
      this.prisma.diagnosticSession.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { _count: { select: { responses: true } } },
      }),
    ]);
    const activePlan = plans.find((plan) => plan.status === 'ACTIVE') ?? null;
    const openWeek = this.weekStart();
    const closed = weeks.some((week) => week.weekStart === openWeek);
    const weekRecords = activePlan
      ? await this.prisma.actionRecord.findMany({
          where: {
            actionId: { in: activePlan.actions.map((action) => action.id) },
            day: { gte: openWeek, lte: this.addDays(openWeek, 6) },
          },
        })
      : [];
    const [indexes, depth, head, choiceRows, experiment, review] = await Promise.all([
      alignmentViews(this.prisma, userId),
      depthView(this.prisma, userId),
      this.prisma.accompanimentHead.findUnique({ where: { userId } }),
      this.prisma.memberClarification.findMany({
        where: { userId, scope: { in: ['HELP_PREFERENCE', 'PATH'] } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ikigaiExperiment.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: { revisions: { orderBy: { revision: 'desc' }, take: 1 } },
      }),
      this.prisma.weekReview.findFirst({ where: { userId }, orderBy: { weekStart: 'desc' } }),
    ]);
    const decision = head
      ? await this.prisma.accompanimentDecision.findUnique({ where: { id: head.decisionId } })
      : null;
    const recoveredGoal = decision?.status === 'ACCEPTED' && decision.situation === 'RETURN' && !decision.goalText
      ? await this.prisma.accompanimentDecision.findFirst({
        where: { userId, status: 'ACCEPTED', goalText: { not: null } },
        orderBy: { createdAt: 'desc' },
      })
      : null;
    const actionIds = plans.flatMap((plan) => plan.actions.map((action) => action.id));
    const cancellations = actionIds.length
      ? await this.prisma.occasionCancellation.findMany({ where: { actionId: { in: actionIds } } })
      : [];
    const cancelled = new Set(cancellations.map((row) => `${row.actionId}:${row.day}`));
    const saved = readSynthesis(purpose?.content);
    const synthesisText = visiblePurpose(saved.purpose);
    const declared = alignmentReading(purpose?.content, purpose?.revision ?? null);
    const board = homeBoard({
      formularioCompleted: Boolean(form),
      hasActiveSession: Boolean(active),
      directionStatus: directionOf(purpose),
      preference: choiceRows.find((row) => row.scope === 'HELP_PREFERENCE')?.outcome ?? null,
      path: choiceRows.find((row) => row.scope === 'PATH')?.outcome ?? null,
      headSituation: decision?.status === 'ACCEPTED' ? decision.situation : null,
      goalText: decision?.status === 'ACCEPTED' ? decision.goalText ?? recoveredGoal?.goalText ?? null : null,
      activePlan: homePlanOf(activePlan),
      pausedPlan: homePlanOf(plans.find((plan) => plan.status === 'PAUSED') ?? null),
      actionsPaused: Boolean(activePlan && activePlan.actions.length > 0 && activePlan.actions.every((action) => action.pausedAt)),
      synthesis: {
        text: synthesisText,
        source: saved.purpose.edited?.trim() ? 'EDITED' : synthesisText ? 'GENERATED' : 'NONE',
      },
      experiment: experiment?.revisions[0]
        ? { hypothesis: experiment.revisions[0].hypothesis, status: experiment.status }
        : null,
      occasion: nextOccasion(activePlan, this.civilToday(), cancelled),
      review: review ? {
        weekStart: review.weekStart,
        note: review.note,
        changes: reviewChanges(review.snapshot),
      } : null,
      index: indexes.current,
      history: indexes.history,
      declared,
      depth,
      signals: indexes.signals.map((item) => ({ id: item.id, sourceRef: item.sourceRef, raw: item.raw })),
    });
    return {
      timezone: ZONE,
      weekStart: openWeek,
      weekClosed: closed,
      purposeConfirmed: Boolean(purpose?.confirmedAt),
      activePlanId: activePlan?.id ?? null,
      form: form?.payload ? withoutInternalAlerts(form.payload) : null,
      alignment: declared,
      indexes: { alignment: indexes.current, initial: indexes.initial, depth },
      contextReview: await this.contextReview(userId, activePlan),
      nextAction: nextStep({
        activeResponses: active?._count.responses ?? null,
        hasActiveSession: Boolean(active),
        formularioCompleted: Boolean(form),
        directionWorks: isWorkingDirection(directionOf(purpose)),
        activePlan,
        weekClosed: closed,
        weekRecords: weekRecords.length,
      }),
      board,
    };
  }

  async latestPurpose(userId: string) {
    return this.prisma.purposeRevision.findFirst({
      where: { userId },
      orderBy: { revision: 'desc' },
    });
  }

  /** The only proof that a member completed formulario completo: a completed session with its persisted reading. */
  private formularioReading(userId: string) {
    return this.prisma.diagnosticFormResult.findFirst({
      where: {
        formCode: FORMULARIO_FORM_CODE,
        session: { userId, status: 'COMPLETED', version: { definitionRef: FORMULARIO_COMPLETO_REF } },
      },
      orderBy: { computedAt: 'desc' },
    });
  }

  async saveAlignment(userId: string, answers: Record<IadId, IadAnswer>, results: IadResults) {
    const latest = await this.latestPurpose(userId);
    const previous = latest && typeof latest.content === 'object' && latest.content ? latest.content as Record<string, unknown> : {};
    const iad = {
      methodVersion: 'iad-mk-0.1-borrador',
      answers,
      results,
      savedAt: new Date().toISOString(),
      directionStatus: directionOf(latest),
    };
    const history = Array.isArray(previous.iadHistory) ? previous.iadHistory : [];
    const iadHistory = previous.iad ? [...history, previous.iad] : history;
    // The IAD reading sits outside the signed text (hdrp-contract does not read it), so saving it
    // never reopens the signature. A new measurement keeps the previous one. Plan writes do not.
    if (latest) {
      return this.prisma.purposeRevision.update({
        where: { id: latest.id },
        data: { content: asJson({ ...previous, iad, iadHistory }) },
      });
    }
    return this.prisma.purposeRevision.create({
      data: { userId, revision: 1, content: asJson({ iad }) },
    });
  }

  async savePurpose(userId: string, content: Record<string, string>) {
    const latest = await this.latestPurpose(userId);
    const previous = latest && typeof latest.content === 'object' && latest.content
      ? latest.content as Record<string, unknown>
      : {};
    const merged = { ...previous, ...content };
    if (latest && !latest.confirmedAt) {
      return this.prisma.purposeRevision.update({
        where: { id: latest.id },
        data: { content: asJson(merged) },
      });
    }
    return this.prisma.purposeRevision.create({
      data: {
        userId,
        revision: (latest?.revision ?? 0) + 1,
        content: asJson(merged),
      },
    });
  }

  async contractDraft(userId: string): Promise<{
    name: string | null;
    introTitle: string;
    intro: string;
    lead: string;
    closing: string;
    articles: HdrpArticle[];
    gaps: HdrpGap[];
    ready: boolean;
    confirmed: boolean;
    confirmedAt: string | null;
    revision: number | null;
    text: string | null;
    directionStatus: string | null;
    statement: string | null;
  }> {
    const [purpose, facts] = await Promise.all([
      this.latestPurpose(userId),
      this.hdrpFacts(userId),
    ]);
    const savedName = typeof purpose?.content === 'object' && purpose.content && 'name' in (purpose.content as object)
      ? String((purpose.content as { name?: string }).name ?? '')
      : '';
    const built = buildHdrpContract({ ...facts, name: savedName || null });
    const content = purpose?.content && typeof purpose.content === 'object' ? purpose.content as Record<string, unknown> : {};
    const synthesis = readSynthesis(content);
    const stated = typeof content.statement === 'string' ? content.statement.trim() : '';
    const chosen = stated && !stated.includes('[') ? stated : visiblePurpose(synthesis.purpose);
    const liveArticles = withChosenPurpose(built.articles, chosen);
    const gaps = hdrpGaps(facts, chosen);
    const ratified = content.contractView && typeof content.contractView === 'object'
      ? content.contractView as { introTitle?: string; intro?: string; lead?: string; closing?: string; articles?: HdrpArticle[]; name?: string | null }
      : null;
    const frozen = purpose?.confirmedAt ? String(content.contract ?? '') : '';
    const articles = purpose?.confirmedAt && Array.isArray(ratified?.articles) ? ratified.articles : liveArticles;
    return {
      name: purpose?.confirmedAt && typeof ratified?.name === 'string' ? ratified.name : built.name,
      introTitle: purpose?.confirmedAt && ratified?.introTitle ? ratified.introTitle : built.introTitle,
      intro: purpose?.confirmedAt && ratified?.intro ? ratified.intro : built.intro,
      lead: purpose?.confirmedAt && ratified?.lead ? ratified.lead : built.lead,
      closing: purpose?.confirmedAt && ratified?.closing ? ratified.closing : built.closing,
      articles,
      gaps: purpose?.confirmedAt ? [] : gaps,
      ready: purpose?.confirmedAt ? true : gaps.length === 0,
      confirmed: Boolean(purpose?.confirmedAt),
      confirmedAt: purpose?.confirmedAt ? purpose.confirmedAt.toISOString() : null,
      revision: purpose?.revision ?? null,
      text: frozen || contractText({ ...built, articles: liveArticles }),
      directionStatus: typeof content.directionStatus === 'string' ? content.directionStatus : null,
      statement: typeof content.statement === 'string' ? content.statement : null,
    };
  }

  async confirmPurpose(userId: string) {
    const latest = await this.latestPurpose(userId);
    if (!latest) throw new NotFoundException('No hay una hoja para confirmar.');
    if (latest.confirmedAt) return latest;
    const draft = await this.contractDraft(userId);
    if (!draft.ready) throw new BadRequestException('Faltan partes de la hoja. Complétalas antes de firmar.');
    const previous = typeof latest.content === 'object' && latest.content ? latest.content as Record<string, unknown> : {};
    return this.prisma.purposeRevision.update({
      where: { id: latest.id },
      data: {
        confirmedAt: new Date(),
        content: asJson({
          ...previous,
          contract: draft.text ?? '',
          contractView: {
            name: draft.name,
            introTitle: draft.introTitle,
            intro: draft.intro,
            lead: draft.lead,
            closing: draft.closing,
            articles: draft.articles,
          },
        }),
      },
    });
  }

  /** Sends the person back into one missing piece of the sheet, without opening a new questionnaire. */
  async reopenGap(userId: string, moduleSlug: string) {
    const draft = await this.contractDraft(userId);
    const matching = draft.gaps.filter((gap) => gap.moduleSlug === moduleSlug);
    if (!matching.length || matching.every((gap) => gap.id === 'proposito')) {
      throw new BadRequestException('Esa parte ya está en la hoja.');
    }
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId, version: { definitionRef: FORMULARIO_COMPLETO_REF } },
      orderBy: { lastActivityAt: 'desc' },
    });
    const session = sessions.find((item) => item.status === 'ACTIVE') ?? sessions[0];
    if (!session) throw new NotFoundException('No hay cuestionario.');
    if (session.status !== 'ACTIVE') {
      await this.prisma.diagnosticSession.update({ where: { id: session.id }, data: { status: 'ACTIVE' } });
    }
    const module = await this.prisma.diagnosticModule.findFirst({
      where: { slug: moduleSlug, versionId: session.versionId },
    });
    if (!module) throw new NotFoundException('No está ese módulo.');
    const progress = await this.prisma.userModuleProgress.findMany({
      where: { sessionId: session.id },
      include: { module: { select: { order: true } } },
    });
    const earlierOpen = progress.some((row) => row.module.order < module.order && row.status !== 'COMPLETE');
    if (earlierOpen) throw new BadRequestException('Sigue el cuestionario. Esta parte aparece cuando llegues a ella.');
    await this.prisma.userModuleProgress.upsert({
      where: { sessionId_moduleId: { sessionId: session.id, moduleId: module.id } },
      update: { status: 'IN_PROGRESS', outroSeen: false },
      create: { sessionId: session.id, moduleId: module.id, status: 'IN_PROGRESS' },
    });
    await this.prisma.response.deleteMany({
      where: {
        sessionId: session.id,
        exceptionKind: { in: ['DECLINED', 'UNKNOWN'] },
        question: { moduleId: module.id },
      },
    });
    return { ok: true };
  }

  private async hdrpFacts(userId: string) {
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId },
      include: {
        version: { select: { definitionRef: true } },
        responses: {
          include: {
            question: { include: { module: true } },
            selectedOptions: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
    const session = sessions.find((item) => item.version.definitionRef === 'formulario-completo' && item.status === 'COMPLETED')
      ?? sessions.sort((a, b) => b.responses.length - a.responses.length)[0];
    const byModule = new Map<string, typeof session.responses>();
    for (const response of session?.responses ?? []) {
      const slug = response.question.module.slug;
      const list = byModule.get(slug) ?? [];
      list.push(response);
      byModule.set(slug, list);
    }
    const profile = (byModule.get('e-per-000') ?? []).sort((a, b) => a.question.order - b.question.order);
    const textAt = (order: number) => profile.find((item) => item.question.order === order)?.freeText ?? null;
    const lines = (order: number) => readLines(textAt(order));
    const numbers = (slug: string) =>
      (byModule.get(slug) ?? [])
        .sort((a, b) => a.question.order - b.question.order)
        .filter((item) => item.question.sourceRef !== PARTNER_GATE_REF && (item.question.type === 'SCALE_1_5' || item.question.type === 'SINGLE_CHOICE'))
        .map((item) => {
          const raw = item.selectedOptions[0]?.value;
          const value = raw == null ? null : Number(raw);
          return Number.isFinite(value) ? value : null;
        });
    const nameLines = lines(1);
    const valueLines = lines(4);
    const standardLines = lines(5);
    const lensLines = lines(8);
    const plain = (order: number) => {
      const raw = textAt(order)?.trim();
      if (!raw || raw.startsWith('{')) return null;
      return raw;
    };
    const legacy = {
      heritage: nameLines.herencia || nameLines.significado || null,
      values: [valueLines.v1, valueLines.v2, valueLines.v3].filter(Boolean).length
        ? [valueLines.v1, valueLines.v2, valueLines.v3].filter(Boolean)
        : [plain(4)].filter((item): item is string => Boolean(item)),
      standards: [
        ['Trascendencia', standardLines.trascendencia],
        ['Familia', standardLines.familia],
        ['Amistad', standardLines.amistad],
        ['Trabajo', standardLines.trabajo],
      ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, text]) => ({ label, text }))
        .concat(plain(5) && !standardLines.trascendencia ? [{ label: 'Estándar', text: plain(5) as string }] : []),
      identity: textAt(6),
      pattern: textAt(7),
      vision: textAt(3),
      lenses: lensLines,
      seal: textAt(9),
      ocean: (byModule.get('e-per-000') ?? [])
        .filter((item) => (item.question.contextEs ?? '').startsWith('@ocean:'))
        .sort((a, b) => a.question.order - b.question.order)
        .map((item) => Number(item.selectedOptions[0]?.value))
        .filter((value) => Number.isFinite(value)),
      relation: numbers('f-rad-002'),
      finance: numbers('f-rad-003').slice(0, 12),
    };
    return formularioFacts(session?.responses ?? []) ?? legacy;
  }

  async synthesis(userId: string) {
    const [known, purpose, facts] = await Promise.all([
      this.ikigaiActivities(userId),
      this.latestPurpose(userId),
      this.hdrpFacts(userId),
    ]);
    const saved = readSynthesis(purpose?.content);
    const overlay = new Map(saved.activities.map((activity) => [activity.sourceRef, activity]));
    const activities = known.map((activity) => overlay.get(activity.sourceRef) ?? activity);
    return {
      version: saved.version,
      activities,
      links: saved.links,
      combinations: saved.combinations,
      purpose: saved.purpose,
      catalog: IKIGAI_LISTAS.fields,
      values: facts.values ?? [],
      standards: facts.standards ?? [],
      purposeRevisionId: purpose?.id ?? null,
      revision: purpose?.revision ?? null,
    };
  }

  async saveSynthesis(userId: string, incoming: unknown) {
    const known = await this.ikigaiActivities(userId);
    const latest = await this.latestPurpose(userId);
    const previous = readSynthesis(latest?.content);
    const result = reconcileSynthesis(previous, incoming, known);
    if (!result.ok) throw new BadRequestException(result.message);
    const base = latest && typeof latest.content === 'object' && latest.content && !Array.isArray(latest.content)
      ? latest.content as Record<string, unknown>
      : {};
    const content = { ...base, synthesis: result.state };
    const saved = latest
      ? await this.prisma.purposeRevision.update({ where: { id: latest.id }, data: { content: asJson(content) } })
      : await this.prisma.purposeRevision.create({ data: { userId, revision: 1, content: asJson(content) } });
    return { ...result.state, purposeRevisionId: saved.id, revision: saved.revision };
  }

  private async ikigaiActivities(userId: string): Promise<Activity[]> {
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId, version: { definitionRef: FORMULARIO_COMPLETO_REF } },
      include: {
        responses: {
          where: { question: { module: { slug: 'e-per-ikigai' } } },
          include: { question: { select: { sourceRef: true, contextEs: true, order: true } } },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
    const session = sessions.find((item) => item.status === 'COMPLETED') ?? sessions[0];
    return [...(session?.responses ?? [])]
      .sort((left, right) => left.question.order - right.question.order)
      .flatMap((row) => {
        const captured = fieldFromContext(row.question.contextEs);
        const sourceField = fieldFromSource(row.question.sourceRef, null);
        const field = captured ?? sourceField;
        if (!field || !row.question.sourceRef) return [];
        const activity = activityFromStored({
          sourceRef: row.question.sourceRef,
          field,
          freeText: row.freeText,
          exceptionKind: row.exceptionKind,
        });
        if (!activity) return [];
        const valid = ambitsOf(field).some((ambit) => ambit.label === activity.ambit && ambit.options.includes(activity.option));
        if (activity.ambit && !valid) {
          activity.ambit = '';
          activity.option = '';
        }
        const fieldReview = captured && sourceField && captured !== sourceField
          ? `La captura quedó en ${captured}. La fila de la fuente es ${sourceField}. Confírmala antes de usarla en una propuesta nueva.`
          : null;
        return [fieldReview ? { ...activity, fieldReview } : activity];
      });
  }

  listPlans(userId: string) {
    return this.prisma.personalPlan.findMany({
      where: { userId },
      include: { actions: { where: { active: true }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private planStage(row: { stage: string | null; status: string }): PlanStage {
    return (row.stage as PlanStage | null) ?? fromLegacy(row.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED');
  }

  private guardPlanVersion(plan: { version: number }, expectedVersion?: number) {
    try {
      assertPlanVersion({ expectedVersion, currentVersion: plan.version });
    } catch (err) {
      if (err instanceof Error && err.message === 'STALE_PLAN') {
        const currentVersion = (err as Error & { currentVersion: number }).currentVersion;
        throw new ConflictException({ message: 'Este plan tiene cambios más recientes. Revísalos antes de continuar.', code: 'STALE_PLAN', version: currentVersion });
      }
      throw err;
    }
  }

  private async restrictionsAnswered(userId: string): Promise<boolean> {
    const row = await this.prisma.memberClarification.findFirst({
      where: {
        userId,
        OR: [
          { scope: 'CURRENT_SITUATION' },
          { scope: 'HEALTH', outcome: { in: ['NO_CURRENT_LIMIT', 'CURRENT_LIMIT'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return Boolean(row);
  }

  async createPlan(userId: string, input: {
    title: string;
    outcome: string;
    priorityNote?: string;
    linkKind?: string | null;
    valueRef?: string | null;
    purposeRevisionId?: string | null;
    sourceCombinationId?: string | null;
    territory?: string | null;
  }) {
    const pendingHelp = unfinishedHelp(input.priorityNote, input.valueRef);
    if (pendingHelp) throw new BadRequestException(pendingHelp);
    const purpose = await this.latestPurpose(userId);
    const linkKind = resolvePlanLink(input);
    if (isWorkingDirection(directionOf(purpose)) && !linkKind) {
      throw new BadRequestException('Elige cómo se vincula el plan con tu dirección.');
    }
    let purposeRevisionId = input.purposeRevisionId?.trim() || purpose?.id || null;
    if (purposeRevisionId) {
      const owned = await this.prisma.purposeRevision.findFirst({ where: { id: purposeRevisionId, userId } });
      if (!owned) throw new BadRequestException('Esa revisión de propósito no es de esta cuenta.');
      purposeRevisionId = owned.id;
    }
    return this.prisma.personalPlan.create({
      data: {
        userId,
        title: input.title.trim(),
        outcome: input.outcome.trim(),
        priorityNote: input.priorityNote?.trim() || null,
        linkKind,
        valueRef: input.valueRef?.trim() || null,
        purposeRevisionId,
        sourceCombinationId: input.sourceCombinationId?.trim() || null,
        status: 'DRAFT',
        stage: 'PREPARING',
        territory: input.territory?.trim() || null,
      },
    });
  }

  private async resolvedHealth(userId: string, declared: boolean | undefined): Promise<boolean> {
    const row = await this.prisma.memberClarification.findFirst({
      where: { userId, scope: 'HEALTH' },
      orderBy: { createdAt: 'desc' },
    });
    if (row?.outcome === 'CURRENT_LIMIT') return true;
    if (row?.outcome === 'NO_CURRENT_LIMIT') return false;
    return Boolean(declared);
  }

  async previewPriority(userId: string, input: Omit<PriorityInput, 'raw' | 'interest' | 'healthLimit'> & { interest?: string | null; healthLimit?: boolean; goal?: string | null }) {
    const reading = await this.prisma.coreReading.findFirst({
      where: { userId, methodVersion: 'ia-mk-cuest@0.1' },
      orderBy: { computedAt: 'desc' },
    });
    const signals = reading && typeof reading.output === 'object' && reading.output && 'signals' in (reading.output as object)
      ? (reading.output as { signals: { sourceRef: string; raw: number | null }[] }).signals
      : [];
    const raw: PriorityInput['raw'] = {};
    for (const signal of signals) {
      if (signal.raw != null) raw[signal.sourceRef] = signal.raw;
    }
    const healthLimit = await this.resolvedHealth(userId, input.healthLimit);
    const proposal = proposePriority({
      ...input,
      interest: normalizeInterest(input.interest),
      healthLimit,
      raw,
    });
    const help = draftHelp(proposal, {
      weeklyMinutes: input.weeklyMinutes ?? null,
      occasions: input.capacity,
      goal: input.goal ?? null,
    });
    const digest = createHash('sha256').update(`${proposal.focus}|${proposal.requiresAction}|${proposal.reason}|${healthLimit}`).digest('hex').slice(0, 16);
    return { readingId: reading?.id ?? null, proposal, help, digest, healthLimit };
  }

  async confirmPriority(userId: string, input: Omit<PriorityInput, 'raw' | 'interest' | 'healthLimit'> & { interest?: string | null; healthLimit?: boolean; goal?: string | null; focus?: string; digest?: string; commandKey?: string }) {
    if (input.commandKey) {
      const existing = await this.prisma.priorityDecision.findUnique({ where: { commandKey: input.commandKey } });
      if (existing && existing.userId !== userId) throw new ForbiddenException('Esa decisión no es de esta cuenta.');
      if (existing) return { id: existing.id, proposal: existing.proposal, choice: existing.choice, repeated: true };
    }
    const preview = await this.previewPriority(userId, input);
    if (input.digest && input.digest !== preview.digest) {
      throw new ConflictException({
        message: 'La propuesta cambió mientras la revisabas. No guardamos tu decisión. Revisa la información actualizada e inténtalo nuevamente.',
        code: 'STALE_PREVIEW',
        proposal: preview.proposal,
        help: preview.help,
        digest: preview.digest,
      });
    }
    const allowed = [preview.proposal.focus, ...preview.proposal.alternatives, 'PROPIO'];
    if (input.focus && !allowed.includes(input.focus as typeof preview.proposal.focus)) {
      throw new BadRequestException('Esa alternativa no está en la propuesta.');
    }
    const choice = input.focus ?? preview.proposal.focus;
    const commandKey = input.commandKey ?? `priority:${userId}:${preview.readingId ?? 'none'}:${choice}:${preview.digest}`;
    const again = await this.prisma.priorityDecision.findUnique({ where: { commandKey } });
    if (again) return { id: again.id, proposal: again.proposal, choice: again.choice, repeated: true };
    const saved = await this.prisma.priorityDecision.create({
      data: {
        userId,
        engineVersion: preview.proposal.engineVersion,
        readingId: preview.readingId,
        digest: preview.digest,
        proposal: JSON.parse(JSON.stringify({ ...preview.proposal, help: preview.help })),
        choice: { focus: choice, interest: normalizeInterest(input.interest), capacity: input.capacity },
        commandKey,
      },
    });
    await this.prisma.priorityHead.upsert({
      where: { userId },
      create: { userId, decisionId: saved.id, version: 1 },
      update: { decisionId: saved.id, version: { increment: 1 } },
    });
    return { id: saved.id, proposal: preview.proposal, help: preview.help, choice, repeated: false };
  }

  async recoverReading(userId: string) {
    const session = await this.prisma.diagnosticSession.findFirst({
      where: { userId, status: 'COMPLETED', version: { definitionRef: 'formulario-completo' } },
      orderBy: { completedAt: 'desc' },
    });
    if (!session) throw new NotFoundException('No hay un cuestionario cerrado.');
    await materializeInitialAlignment(this.prisma, session.id);
    return alignmentViews(this.prisma, userId);
  }

  async confirmDepth(userId: string, input: {
    component: string;
    meaning?: string;
    matters?: string;
    change?: string;
    link?: string;
    evidence?: string;
    decision?: 'KEEP' | 'CHANGE' | 'NOT_APPLY';
  }) {
    const purpose = await this.latestPurpose(userId);
    const payload = {
      recognized: input.meaning?.trim() && input.matters?.trim() ? { meaning: input.meaning.trim(), matters: input.matters.trim() } : null,
      integrated: input.change?.trim() && input.link?.trim() ? { change: input.change.trim(), link: input.link.trim() } : null,
      contrasted: input.evidence?.trim() && input.decision ? { evidence: input.evidence.trim(), decision: input.decision } : null,
    };
    await this.prisma.depthConfirmation.create({
      data: { userId, component: input.component, payload, purposeRevisionId: purpose?.id ?? null },
    });
    return depthView(this.prisma, userId);
  }

  openCoreMeasurement(userId: string, kind: 'RECONFIRM' | 'REMEASURE', sessionId: string | null) {
    return openMeasurement(this.prisma, userId, kind, sessionId);
  }

  answerCoreMeasurement(userId: string, measurementId: string, sourceRef: string, value: number | null, exception: string | null) {
    return saveMeasurementAnswer(this.prisma, userId, measurementId, sourceRef, value, exception).catch((err: Error) => {
      throw new BadRequestException(err.message === 'NOT_IN_CORE' ? 'Esa pregunta no está en el núcleo.' : 'La medición no admite otra respuesta.');
    });
  }

  finishCoreMeasurement(userId: string, measurementId: string) {
    return closeMeasurement(this.prisma, userId, measurementId).catch((err: Error) => {
      if (err.message === 'NOT_FOUND') throw new BadRequestException('Esa medición no es de esta cuenta.');
      throw err;
    });
  }

  async activatePlan(userId: string, planId: string, input: ActivatePlanDto) {
    if (input.commandKey) {
      const prior = await this.prisma.planTransition.findFirst({
        where: { userId, planId, metadata: { path: ['commandKey'], equals: input.commandKey } },
      });
      if (prior) {
        const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
        if (!plan) throw new NotFoundException('Plan no encontrado.');
        return { plan, repeated: true };
      }
    }
    const plan = await this.runPlanActivation(userId, planId, input, input.commandKey ?? null);
    return { plan, repeated: false };
  }

  async transitionPlan(userId: string, planId: string, input: TransitionPlanDto) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    const from = this.planStage(plan);
    const to = input.toStage;
    if (!canTransition(from, to)) {
      throw new BadRequestException('No puedes realizar esta acción en el estado actual del plan.');
    }
    const status = compatStatus(to);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const updated = await tx.personalPlan.update({
        where: { id: plan.id },
        data: {
          stage: to,
          status,
          version: nextPlanVersion(plan.version),
          ...(to === 'CLOSED' ? { closedReason: input.reason?.trim() || 'OTHER' } : {}),
        },
      });
      await tx.planTransition.create({
        data: {
          userId,
          planId: plan.id,
          fromStage: from,
          toStage: to,
          reason: input.reason?.trim() || null,
          effectiveFrom: new Date(this.civilToday()),
        },
      });
      const learning = input.learningNote?.trim();
      if (learning && (to === 'CLOSED' || to === 'MAINTENANCE')) {
        await tx.planEvidence.create({
          data: {
            userId,
            planId: plan.id,
            criterionRevision: plan.criterionRevision ?? 1,
            observedOn: new Date(`${this.civilToday()}T12:00:00.000Z`),
            kind: 'NOTE',
            status: 'LEARNING',
            text: learning.slice(0, 1000),
            source: 'DECLARED_BY_MEMBER',
          },
        });
      }
      return updated;
    });
  }

  async setPlanFocus(userId: string, planId: string, input: FocusPlanDto) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    if (input.enable && this.planStage(plan) !== 'ACTIVE' && this.planStage(plan) !== 'MAINTENANCE') {
      throw new BadRequestException('Solo puedes elegir como plan principal uno que esté activo o en mantenimiento.');
    }
    const focused = await this.prisma.personalPlan.findFirst({ where: { userId, isFocus: true } });
    const targets = focusTargets({
      planId,
      currentlyFocusedPlanId: focused?.id ?? null,
      enable: input.enable,
    });
    const today = this.civilToday();
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      for (const clearId of targets.clearPlanIds) {
        await tx.personalPlan.update({
          where: { id: clearId },
          data: { isFocus: false, focusSince: null, version: { increment: 1 } },
        });
        await tx.planTransition.create({
          data: { userId, planId: clearId, fromStage: 'FOCUS_ON', toStage: 'FOCUS_OFF', effectiveFrom: new Date(today) },
        });
      }
      if (targets.setPlanId) {
        const updated = await tx.personalPlan.update({
          where: { id: targets.setPlanId },
          data: { isFocus: true, focusSince: new Date(), version: nextPlanVersion(plan.version) },
        });
        await tx.planTransition.create({
          data: { userId, planId: targets.setPlanId, fromStage: 'FOCUS_OFF', toStage: 'FOCUS_ON', effectiveFrom: new Date(today) },
        });
        return updated;
      }
      return tx.personalPlan.findFirstOrThrow({ where: { id: planId } });
    });
  }

  private async runPlanActivation(
    userId: string,
    planId: string,
    patch: ActivatePlanDto,
    commandKey: string | null,
  ) {
    const plan = await this.prisma.personalPlan.findFirst({
      where: { id: planId, userId },
      include: { actions: { where: { active: true } } },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, patch.expectedVersion);
    const currentStage = this.planStage(plan);
    if (currentStage === 'ACTIVE' || currentStage === 'MAINTENANCE') return plan;
    if (!canTransition(currentStage, 'ACTIVE')) {
      throw new BadRequestException('Este plan no puede activarse desde su etapa actual.');
    }
    const restrictions = await this.restrictionsAnswered(userId);
    const activation = planActivationInput({
      plan: {
        outcome: plan.outcome,
        goalClass: plan.goalClass,
        capacityMinutes: plan.capacityMinutes,
        protectNote: plan.protectNote,
      },
      activeActionCount: plan.actions.length,
      restrictionsAnswered: restrictions,
      patch,
    });
    const missing = activationBlock(activation);
    if (missing.length > 0) {
      throw new UnprocessableEntityException({ message: 'Todavía falta completar información antes de activar tu plan.', code: 'ACTIVATION_INCOMPLETE', missing });
    }
    for (const action of plan.actions) {
      const tags = parseContentTags(action.contentTags);
      if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
      await this.assertContent(userId, tags, { conversation: action.conversationOutcome });
    }
    const capacityMinutes = patch.capacityMinutes ?? undefined;
    const protectNote = patch.protectNote !== undefined ? patch.protectNote : undefined;
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const proposalRows = await tx.planProposal.findMany({ where: { planId: plan.id, userId } });
      const proposalInputs = proposalRows.map((row) => ({
        kind: row.kind,
        decision: row.status as 'ACCEPTED' | 'EDITED' | 'REJECTED',
        payload: asRecord(row.payload),
        editedPayload: row.editedPayload ? asRecord(row.editedPayload) : null,
      }));
      const proposalPatch = planPatchFromProposals(proposalInputs, {
        outcome: plan.outcome,
        criterionRevision: plan.criterionRevision,
      });
      const actionPatchMap = actionPatchesFromProposals(
        proposalInputs,
        plan.actions.map((row) => ({ id: row.id })),
      );
      const updated = await tx.personalPlan.update({
        where: { id: plan.id },
        data: {
          status: compatStatus('ACTIVE'),
          stage: 'ACTIVE',
          activatedAt: journeyNow(this.clock),
          version: nextPlanVersion(plan.version),
          ...(capacityMinutes !== undefined ? { capacityMinutes } : {}),
          ...(protectNote !== undefined ? { protectNote } : {}),
          ...(proposalPatch.title ? { title: proposalPatch.title } : {}),
          ...(proposalPatch.outcome ? { outcome: proposalPatch.outcome } : {}),
          ...(proposalPatch.whyItMatters !== undefined ? { whyItMatters: proposalPatch.whyItMatters } : {}),
          ...(proposalPatch.whyStatus ? { whyStatus: proposalPatch.whyStatus } : {}),
          ...(proposalPatch.criterionText ? { criterionText: proposalPatch.criterionText } : {}),
          ...(proposalPatch.criterionStatus ? { criterionStatus: proposalPatch.criterionStatus } : {}),
          ...(proposalPatch.criterionRevision != null ? { criterionRevision: proposalPatch.criterionRevision } : {}),
        },
      });
      for (const [actionId, patch] of actionPatchMap) {
        await tx.planAction.update({
          where: { id: actionId },
          data: {
            ...(patch.title ? { title: patch.title } : {}),
            ...(patch.doneWhen ? { doneWhen: patch.doneWhen } : {}),
            ...(patch.weekday !== undefined ? { weekday: patch.weekday } : {}),
            ...(patch.occasionsPerWeek !== undefined ? { occasionsPerWeek: patch.occasionsPerWeek } : {}),
            ...(patch.minimumVersion ? { minimumVersion: patch.minimumVersion, preparation: patch.minimumVersion } : {}),
          },
        });
      }
      await tx.planTransition.create({
        data: {
          userId,
          planId: plan.id,
          fromStage: currentStage,
          toStage: 'ACTIVE',
          effectiveFrom: new Date(this.civilToday()),
          metadata: commandKey ? { commandKey } : undefined,
        },
      });
      return updated;
    });
  }

  async patchPlan(
    userId: string,
    planId: string,
    input: {
      title?: string;
      outcome?: string;
      status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      valueRef?: string | null;
      linkKind?: string | null;
      confirmed?: boolean;
      capacityMinutes?: number;
      protectNote?: string | null;
      explicitNoSchedule?: boolean;
      expectedVersion?: number;
    },
  ) {
    if (input.status === 'ACTIVE') {
      const { plan } = await this.activatePlan(userId, planId, input);
      if (input.title?.trim() || input.outcome?.trim() || input.valueRef !== undefined || input.linkKind) {
        return this.patchPlanFields(userId, planId, input, plan.version);
      }
      return plan;
    }
    return this.patchPlanFields(userId, planId, input);
  }

  private async patchPlanFields(
    userId: string,
    planId: string,
    input: {
      title?: string;
      outcome?: string;
      status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      valueRef?: string | null;
      linkKind?: string | null;
      capacityMinutes?: number;
      protectNote?: string | null;
      expectedVersion?: number;
    },
    skipVersion?: number,
  ) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    if (input.linkKind != null && input.linkKind !== '' && !PLAN_LINKS.includes(input.linkKind)) {
      throw new BadRequestException('Vínculo desconocido.');
    }
    const data: Prisma.PersonalPlanUpdateInput = {
      title: input.title?.trim(),
      outcome: input.outcome?.trim(),
      ...(input.valueRef !== undefined ? { valueRef: input.valueRef?.trim() || null } : {}),
      ...(input.linkKind ? { linkKind: input.linkKind } : {}),
      ...(input.capacityMinutes !== undefined ? { capacityMinutes: input.capacityMinutes } : {}),
      ...(input.protectNote !== undefined ? { protectNote: input.protectNote } : {}),
      version: nextPlanVersion(skipVersion ?? plan.version),
    };
    if (input.status === 'DRAFT') {
      data.status = 'DRAFT';
      data.stage = 'PREPARING';
    }
    if (input.status === 'ARCHIVED') {
      data.status = 'ARCHIVED';
      data.stage = 'CLOSED';
    }
    return this.prisma.personalPlan.update({ where: { id: plan.id }, data });
  }

  async addAction(
    userId: string,
    planId: string,
    input: {
      title: string;
      doneWhen: string;
      weekday?: number;
      domain?: ActionDomainName | null;
      guideId?: string;
      contentTags?: unknown;
      healthLimit?: unknown;
      conversation?: unknown;
      occasionsPerWeek?: number;
      minutesPerOccasion?: number;
      templateRef?: string;
      minimumVersion?: string;
    },
  ) {
    const tags = parseContentTags(input.contentTags);
    if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
    const template = input.templateRef ? interventionTemplate(input.templateRef) : null;
    if (input.templateRef && !template) throw new BadRequestException('Plantilla desconocida.');
    if (template?.schedule.kind === 'TRIGGER' && input.occasionsPerWeek !== undefined) {
      throw new BadRequestException('Esta acción depende de un disparador; no lleva frecuencia semanal.');
    }
    if (input.occasionsPerWeek !== undefined && (!Number.isInteger(input.occasionsPerWeek) || input.occasionsPerWeek < 1 || input.occasionsPerWeek > 21)) {
      throw new BadRequestException('Ingresa un número entero entre 1 y 21 veces por semana.');
    }
    if (input.minutesPerOccasion !== undefined && (!Number.isInteger(input.minutesPerOccasion) || input.minutesPerOccasion < 1 || input.minutesPerOccasion > 600)) {
      throw new BadRequestException('Ingresa una duración de 1 a 600 minutos por vez, sin decimales.');
    }
    if (input.occasionsPerWeek !== undefined && input.weekday != null) {
      throw new BadRequestException('Una acción con día fijo no lleva frecuencia flexible.');
    }
    const plan = await this.ownPlan(userId, planId);
    await this.assertGuide(userId, input.guideId);
    const conversationOutcome = await this.assertContent(userId, tags, {
      healthLimit: input.healthLimit,
      conversation: input.conversation,
    });
    return this.insertAction(plan.id, {
      ...input,
      contentTags: tags,
      conversationOutcome,
      ...(template ? { origin: 'SYSTEM_TEMPLATE', familyId: template.id, templateVersion: template.version } : {}),
    });
  }

  private insertAction(
    planId: string,
    input: {
      title: string;
      doneWhen: string;
      weekday?: number;
      domain?: ActionDomainName | null;
      contentTags?: string[];
      conversationOutcome?: string | null;
      occasionsPerWeek?: number;
      minutesPerOccasion?: number;
      origin?: string;
      familyId?: string;
      templateVersion?: string;
      minimumVersion?: string;
    },
  ) {
    const today = this.civilToday();
    return this.prisma.$transaction(async (tx) => {
      const action = await tx.planAction.create({
        data: {
          planId,
          title: input.title.trim(),
          doneWhen: input.doneWhen.trim(),
          weekday: input.weekday ?? null,
          occasionsPerWeek: input.occasionsPerWeek ?? null,
          minutesPerOccasion: input.minutesPerOccasion ?? null,
          ...(input.origin ? { origin: input.origin } : {}),
          ...(input.familyId ? { familyId: input.familyId, templateVersion: input.templateVersion ?? null } : {}),
          ...(input.minimumVersion?.trim() ? { minimumVersion: input.minimumVersion.trim().slice(0, 500) } : {}),
          domain: input.domain ?? null,
          contentTags: input.contentTags ?? [],
          conversationOutcome: input.conversationOutcome ?? null,
          effectiveFrom: today,
        },
      });
      if (input.weekday != null) {
        await tx.actionSchedule.create({
          data: {
            actionId: action.id,
            effectiveFrom: new Date(`${today}T12:00:00.000Z`),
            kind: 'FIXED',
            weekday: input.weekday,
            intervalDays: 7,
            source: 'CREATE',
          },
        });
      }
      return action;
    });
  }

  /** A known guide with tags uses the same rule as a mark the member declared. */
  private async assertGuide(userId: string, guideId: string | undefined) {
    if (!guideId) return;
    const tags = guideTags(guideId);
    if (!tags) throw new BadRequestException('Guía desconocida.');
    await this.assertContent(userId, tags);
  }

  /**
   * Reviews declared marks. An empty list is not a safety certificate.
   * A health or conversation answer is stored beside the original questionnaire text.
   * Returns the conversation outcome to keep on the action, or null when that mark is absent.
   */
  async assertMemberContentTags(userId: string, tags: ContentTag[], extra?: { healthLimit?: unknown; conversation?: unknown }) {
    return this.assertContent(userId, tags, extra);
  }

  private async assertContent(
    userId: string,
    tags: ContentTag[],
    extra?: { healthLimit?: unknown; conversation?: unknown },
  ): Promise<string | null> {
    const healthLimit = this.readClarification(parseHealthLimit, extra?.healthLimit, 'Aclaración de salud desconocida.');
    const conversation = this.readClarification(parseConversation, extra?.conversation, 'Aclaración de conversación desconocida.');
    if (tags.length === 0) return null;
    if (healthLimit && tags.some((tag) => ['PHYSICAL_EXERTION', 'DIET', 'SUPPLEMENT', 'MEDICATION'].includes(tag))) {
      await this.prisma.memberClarification.create({ data: { userId, scope: 'HEALTH', outcome: healthLimit } });
    }
    const stored = healthLimit ?? await this.latestHealthLimit(userId);
    const session = await this.prisma.diagnosticSession.findFirst({
      where: { userId, status: 'COMPLETED', version: { definitionRef: FORMULARIO_COMPLETO_REF } },
      orderBy: { completedAt: 'desc' },
      include: {
        responses: { include: { question: { include: { module: true } }, selectedOptions: true } },
      },
    });
    const health = applyOperationalClarification(
      healthFactFromAnswers((ref) => answerText(cell(session?.responses ?? [], 'F-RAD-001', ref))),
      { healthLimit: stored, conversation },
    );
    const decision = decideAction(tags, health);
    if (!decision.allowed) this.refuseContent(decision);
    return tags.includes('CONFRONTATION') && conversation === 'VIABLE' ? 'VIABLE' : null;
  }

  private readClarification<T>(parse: (value: unknown) => T, value: unknown, message: string): T {
    try {
      return parse(value);
    } catch {
      throw new BadRequestException(message);
    }
  }

  private async latestHealthLimit(userId: string): Promise<HealthLimitOutcome | null> {
    const row = await this.prisma.memberClarification.findFirst({
      where: { userId, scope: 'HEALTH' },
      orderBy: { createdAt: 'desc' },
    });
    if (row?.outcome === 'NO_CURRENT_LIMIT' || row?.outcome === 'CURRENT_LIMIT') return row.outcome;
    return null;
  }

  private refuseContent(decision: { reason: string | null; alternatives: string[]; needsClarification: 'HEALTH' | 'CONVERSATION' | null }): never {
    throw new ForbiddenException({
      message: decision.reason,
      code: decision.needsClarification ? 'CLARIFICATION_REQUIRED' : 'RESTRICTED',
      scope: decision.needsClarification,
      alternatives: decision.alternatives,
      nextHref: '/planes',
    });
  }

  async execution(userId: string) {
    const weekStart = this.weekStart();
    const weekEnd = this.addDays(weekStart, 6);
    const plans = await this.listPlans(userId);
    const actions = plans
      .filter((plan) => plan.status === 'ACTIVE')
      .flatMap((plan) => plan.actions);
    const records = actions.length
      ? await this.prisma.actionRecord.findMany({
          where: { actionId: { in: actions.map((action) => action.id) }, day: { gte: weekStart, lte: weekEnd } },
        })
      : [];
    const reading = executionReading(
      actions.map((action) => ({
        id: action.id,
        domain: action.domain as ActionDomainName | null,
        active: action.active,
      })),
      records,
      weekStart,
      weekEnd,
    );
    return { timezone: ZONE, weekStart, today: this.civilToday(), weekEnd, ...reading };
  }

  async domainView(userId: string, domain: ActionDomainName) {
    const snapshot = await this.execution(userId);
    const plans = await this.listPlans(userId);
    const actions = plans
      .filter((plan) => plan.status === 'ACTIVE')
      .flatMap((plan) => plan.actions)
      .filter((action) => action.domain === domain);
    const records = actions.length
      ? await this.prisma.actionRecord.findMany({
          where: { actionId: { in: actions.map((action) => action.id) }, day: snapshot.today },
        })
      : [];
    const closed = await this.prisma.weekReview.findUnique({
      where: { userId_weekStart: { userId, weekStart: snapshot.weekStart } },
    });
    return {
      domain,
      today: snapshot.today,
      timezone: ZONE,
      weekClosed: Boolean(closed),
      percent: snapshot.domains[domain].percent,
      actions: actions.map((action) => ({
        id: action.id,
        title: action.title,
        doneWhen: action.doneWhen,
        weekday: action.weekday,
        todayStatus: records.find((record) => record.actionId === action.id)?.status ?? null,
      })),
    };
  }

  async addDomainAction(
    userId: string,
    domain: ActionDomainName,
    input: { title: string; doneWhen: string; weekday?: number; contentTags?: unknown; healthLimit?: unknown; conversation?: unknown },
  ) {
    const tags = parseContentTags(input.contentTags);
    if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
    const title = input.title?.trim() ?? '';
    const doneWhen = input.doneWhen?.trim() ?? '';
    if (!title || !doneWhen) throw new BadRequestException('La tarea y el criterio son obligatorios.');
    const plan = await this.prisma.personalPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    if (!plan) {
      throw new ConflictException({
        message: 'Crea un plan vigente antes de agregar tareas en este ámbito.',
        code: 'NO_ACTIVE_PLAN',
        nextHref: '/planes',
      });
    }
    const conversationOutcome = await this.assertContent(userId, tags, {
      healthLimit: input.healthLimit,
      conversation: input.conversation,
    });
    return this.insertAction(plan.id, { title, doneWhen, weekday: input.weekday, domain, contentTags: tags, conversationOutcome });
  }

  async patchAction(
    userId: string,
    actionId: string,
    input: { title?: string; doneWhen?: string; contentTags?: unknown; healthLimit?: unknown; conversation?: unknown },
  ) {
    const action = await this.prisma.planAction.findUnique({ where: { id: actionId }, include: { plan: true } });
    if (!action || action.plan.userId !== userId) throw new NotFoundException('Acción no encontrada.');
    const incoming = input.contentTags === undefined ? parseContentTags(action.contentTags) : parseContentTags(input.contentTags);
    if (!incoming) throw new BadRequestException('Marca de contenido desconocida.');
    const template = Array.isArray(action.templateTags) ? action.templateTags.filter((tag): tag is string => typeof tag === 'string') : [];
    const tags = parseContentTags([...new Set([...template, ...incoming])]);
    if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
    const conversationOutcome = await this.assertContent(userId, tags, {
      healthLimit: input.healthLimit,
      conversation: input.conversation === undefined ? action.conversationOutcome : input.conversation,
    });
    return this.prisma.planAction.update({
      where: { id: action.id },
      data: {
        title: input.title?.trim(),
        doneWhen: input.doneWhen?.trim(),
        contentTags: tags,
        conversationOutcome,
      },
    });
  }

  parseDomain(value: string): ActionDomainName {
    const domain = value.toUpperCase();
    if (!ACTION_DOMAINS.includes(domain as ActionDomainName)) {
      throw new BadRequestException('No encontramos ese ámbito. Vuelve a Inicio y elige uno.');
    }
    return domain as ActionDomainName;
  }

  private civilToday(): string {
    return this.clock.today();
  }

  async calendar(userId: string) {
    const plans = await this.prisma.personalPlan.findMany({
      where: { userId },
      include: { actions: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
      orderBy: { createdAt: 'desc' },
    });
    const actionIds = plans.flatMap((plan) => plan.actions.map((action) => action.id));
    const [records, schedules] = await Promise.all([
      actionIds.length ? this.prisma.actionRecord.findMany({ where: { actionId: { in: actionIds } } }) : Promise.resolve([]),
      loadActionSchedules(this.prisma, actionIds),
    ]);
    const today = this.clock.today();
    const occasions = plans.flatMap((plan) => {
      const stage = plan.stage ?? fromLegacy(plan.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED');
      if (stage === 'PAUSED' || stage === 'CLOSED') {
        return plan.actions.map((action) => ({ actionId: action.id, days: [] as string[], scheduleSource: 'PAUSE' as const }));
      }
      return plan.actions
        .filter((action) => actionVisibleForWeek(action, plan.actions, this.weekStart(), this.addDays(this.weekStart(), 6)))
        .map((action) => {
          const legacy = {
            id: action.id,
            weekday: action.weekday,
            intervalDays: action.intervalDays,
            occasionsPerWeek: action.occasionsPerWeek,
            active: action.active,
          };
          const resolved = resolveSchedule(legacy, schedules, today);
          if (resolved.kind === 'PAUSED' || resolved.kind === 'NONE') {
            return { actionId: action.id, days: [] as string[], scheduleSource: resolved.source };
          }
          if (resolved.kind === 'FIXED' && resolved.weekday != null) {
            return {
              actionId: action.id,
              days: futureOccasions(today, resolved.weekday, resolved.intervalDays ?? 7),
              scheduleSource: resolved.source,
            };
          }
          if (action.weekday != null) {
            return {
              actionId: action.id,
              days: futureOccasions(today, action.weekday, action.intervalDays ?? 7),
              scheduleSource: resolved.source,
            };
          }
          return { actionId: action.id, days: [] as string[], scheduleSource: resolved.source };
        });
    });
    return { timezone: ZONE, weekStart: this.weekStart(), today, plans, records, occasions, schedules };
  }

  async upsertRecord(
    userId: string,
    input: {
      actionId: string;
      day: string;
      status: 'PENDING' | 'DONE' | 'SKIPPED' | 'NOT_APPLICABLE';
      note?: string;
      resultNote?: string;
      resultStatus?: 'OBSERVED' | 'NOT_YET_OBSERVED' | 'NOT_OBSERVED' | 'NO_INFORMATION' | null;
      expectedRevision?: number;
    },
  ) {
    const action = await this.prisma.planAction.findUnique({
      where: { id: input.actionId },
      include: { plan: true },
    });
    if (!action || action.plan.userId !== userId) throw new ForbiddenException('Esa acción no es de esta cuenta.');
    const prior = await this.prisma.actionRecord.findUnique({ where: { actionId_day: { actionId: input.actionId, day: input.day } } });
    if (prior?.status === 'DONE' && input.status === 'NOT_APPLICABLE') {
      throw new ConflictException({ message: 'Esa ocasión ya quedó hecha. No pasa a no aplica.', code: 'OCCASION_DONE' });
    }
    const week = this.weekStart(input.day);
    const closed = await this.prisma.weekReview.findUnique({
      where: { userId_weekStart: { userId, weekStart: week } },
    });
    if (closed) throw new ForbiddenException('Esa semana ya está cerrada.');
    const today = this.civilToday();
    if (input.day > today && input.status !== 'PENDING') {
      throw new ConflictException({ message: 'Esta acción está prevista para más adelante. Todavía no puedes registrarla.', code: 'OCCASION_FUTURE' });
    }
    const starts = action.effectiveFrom?.slice(0, 10);
    const ends = action.effectiveTo?.slice(0, 10);
    if (starts && action.replacesActionId && input.day < starts) {
      throw new ConflictException({ message: 'Esa acción todavía no empieza. El registro de esta semana queda en la acción anterior.', code: 'ACTION_NOT_STARTED' });
    }
    if (ends && input.day > ends) {
      const successor = await this.prisma.planAction.findFirst({
        where: { planId: action.planId, replacesActionId: action.id },
        select: { id: true },
      });
      const message = successor
        ? 'Esta acción terminó después de una revisión. Si quieres registrar una actividad nueva, utiliza la acción que la reemplazó.'
        : 'Esta acción ya no está vigente para ese día.';
      throw new ConflictException({ message, code: 'ACTION_ENDED' });
    }
    if (prior && input.expectedRevision != null && prior.revision !== input.expectedRevision) {
      throw new ConflictException({ message: 'El registro cambió desde que lo abriste. Revisa la información actual antes de guardar.', code: 'STALE_RECORD', revision: prior.revision });
    }
    if (input.status !== 'PENDING') {
      const schedules = await loadActionSchedules(this.prisma, [input.actionId]);
      const inForce = (!starts || input.day >= starts) && (!ends || input.day <= ends);
      const legacy = {
        id: action.id,
        weekday: action.weekday,
        intervalDays: action.intervalDays,
        occasionsPerWeek: action.occasionsPerWeek,
        active: action.active || inForce,
      };
      const weekEnd = this.addDays(week, 6);
      if (!isOccasionRegistrationDay(legacy, schedules, week, weekEnd, input.day)) {
        throw new ConflictException({ message: 'Esta acción no estaba prevista para ese día.', code: 'NOT_AN_OCCASION' });
      }
      const weekRecords = await this.prisma.actionRecord.findMany({
        where: {
          actionId: input.actionId,
          day: { gte: week, lte: weekEnd },
          status: { not: 'PENDING' },
        },
      });
      const treatAsUpdate = Boolean(prior && prior.day === input.day);
      if (flexOccasionCapReached(legacy, schedules, week, weekEnd, input.day, weekRecords.length, treatAsUpdate)) {
        throw new ConflictException({
          message: 'Ya completaste todos los registros previstos para esta semana.',
          code: 'FLEX_WEEK_CAP',
        });
      }
    }
    return this.prisma.actionRecord.upsert({
      where: { actionId_day: { actionId: input.actionId, day: input.day } },
      update: {
        status: input.status,
        revision: { increment: 1 },
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.resultNote !== undefined ? { resultNote: input.resultNote } : {}),
        ...(input.resultStatus !== undefined ? { resultStatus: input.resultStatus } : {}),
      },
      create: {
        actionId: input.actionId,
        day: input.day,
        status: input.status,
        note: input.note ?? null,
        resultNote: input.resultNote ?? null,
        resultStatus: input.resultStatus ?? null,
        revision: 0,
      },
    });
  }

  async previewClose(
    userId: string,
    weekStart: string,
    decisions?: Record<string, WeekDecision>,
    revisions?: Record<string, WeekRevision>,
    outcomes?: Record<string, string>,
    review?: { done: number; applicable: number; result: 'MOVED' | 'STUCK' | 'UNKNOWN'; alignmentLow?: boolean; bodyCareLow?: boolean; directionChanged?: boolean },
  ) {
    const effects = await this.weekEffects(userId, weekStart, decisions, revisions);
    const plans = await this.planOutcomeChanges(userId, outcomes);
    const guidance = await this.occasionGuidance(userId, weekStart, Boolean(review?.directionChanged));
    const focusPlan = await this.prisma.personalPlan.findFirst({ where: { userId, isFocus: true } });
    let horizonReading = null;
    if (focusPlan?.reviewAt) {
      const applicable = review?.applicable ?? 1;
      const done = review?.done ?? 0;
      horizonReading = reviewReading({
        today: this.civilToday(),
        reviewAt: focusPlan.reviewAt.toISOString().slice(0, 10),
        executionRatio: applicable > 0 ? done / applicable : 0,
        evidenceStatus: null,
        hasNewRestriction: false,
        goalStillMatters: true,
        purposeServed: 'UNKNOWN',
        whyStatus: focusPlan.whyStatus as 'PROVISIONAL' | 'CONFIRMED' | 'PROPOSED' | null,
        missingRegistrations: applicable > 0 && done === 0,
      });
    }
    return {
      weekStart,
      effects: effects.map((effect) => ({ actionId: effect.actionId, decision: effect.decision, summary: effect.summary })),
      plans,
      guidance,
      horizonReading,
    };
  }

  async planTerritoryProposal(userId: string, planId: string) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    if (plan.territory) return { proposal: null, reason: 'ALREADY_SET', territory: plan.territory };
    const actions = await this.prisma.planAction.findMany({ where: { planId, active: true } });
    const inferred = inferPlanTerritory(actions);
    return { proposal: inferred.confidence === 'SINGLE' ? inferred.territory : null, ...inferred };
  }

  async confirmPlanTerritory(userId: string, planId: string, input: { territory: string; expectedVersion?: number }) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    return this.prisma.personalPlan.update({
      where: { id: plan.id },
      data: { territory: input.territory, version: nextPlanVersion(plan.version) },
    });
  }

  async proposeMaintenance(userId: string, planId: string) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    const actions = await this.prisma.planAction.findMany({ where: { planId, active: true }, take: 1 });
    const sample = actions[0];
    return {
      minimumAction: sample
        ? { title: sample.title, doneWhen: sample.doneWhen, weekday: sample.weekday, intervalDays: sample.intervalDays ?? 7 }
        : null,
      reviewSignal: 'Revisar si el mínimo sigue teniendo sentido en cuatro semanas.',
    };
  }

  purposeHistory(userId: string) {
    return this.prisma.purposeRevision.findMany({
      where: { userId },
      orderBy: { revision: 'desc' },
    });
  }

  async memberDirection(userId: string): Promise<MemberDirectionView> {
    const [purpose, facts] = await Promise.all([
      this.latestPurpose(userId),
      this.hdrpFacts(userId),
    ]);
    let plansOnOlderRevision = 0;
    if (purpose?.id) {
      plansOnOlderRevision = await this.prisma.personalPlan.count({
        where: {
          userId,
          purposeRevisionId: { not: null, notIn: [purpose.id] },
          stage: { in: ['PREPARING', 'ACTIVE', 'MAINTENANCE', 'PAUSED'] },
        },
      });
    }
    return buildMemberDirectionView({
      purpose: purpose
        ? { id: purpose.id, revision: purpose.revision, content: purpose.content, createdAt: purpose.createdAt }
        : null,
      facts,
      plansOnOlderRevision,
    });
  }

  /** Saved history of the direction, plans linked to each version, and the literal answers Propósito can consult. */
  async directionOverview(userId: string) {
    const [revisions, plans, evidence] = await Promise.all([
      this.prisma.purposeRevision.findMany({
        where: { userId },
        orderBy: { revision: 'desc' },
        select: { id: true, revision: true, content: true, createdAt: true },
      }),
      this.prisma.personalPlan.findMany({
        where: { userId, purposeRevisionId: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, territory: true, stage: true, purposeRevisionId: true, linkKind: true },
      }),
      this.directionEvidence(userId),
    ]);
    const latestId = revisions[0]?.id ?? null;
    const numberOf = new Map(revisions.map((row) => [row.id, row.revision]));
    const statementOf = new Map(revisions.map((row) => [row.id, readDirectionFields(row.content).statement]));
    const history: {
      purposeRevisionId: string;
      revision: number;
      statement: string;
      mode: DirectionMode | null;
      savedAt: string;
      current: boolean;
    }[] = [];
    for (const row of revisions) {
      const fields = readDirectionFields(row.content);
      if (!fields.statement) continue;
      const previous = history[history.length - 1];
      if (previous && previous.statement === fields.statement && previous.mode === fields.mode) continue;
      const content = row.content as Record<string, unknown> | null;
      const savedAt = typeof content?.directionSavedAt === 'string' ? content.directionSavedAt : row.createdAt.toISOString();
      history.push({
        purposeRevisionId: row.id,
        revision: row.revision,
        statement: fields.statement,
        mode: fields.mode,
        savedAt,
        current: row.id === latestId,
      });
    }
    return {
      history: history.slice(0, 8),
      linkedPlans: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        territory: plan.territory,
        stage: plan.stage,
        linkKind: plan.linkKind,
        revision: plan.purposeRevisionId ? numberOf.get(plan.purposeRevisionId) ?? null : null,
        directionStatement: plan.purposeRevisionId ? statementOf.get(plan.purposeRevisionId) ?? null : null,
        current: plan.purposeRevisionId === latestId,
      })),
      evidence,
    };
  }

  /** Visión, Valores and IKIGAI as the person answered them, plus whether the questionnaire lets them get there now. */
  async directionEvidence(userId: string) {
    const slugs = Object.values(EVIDENCE_MODULES);
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: { userId, version: { definitionRef: FORMULARIO_COMPLETO_REF } },
      orderBy: { lastActivityAt: 'desc' },
      include: {
        moduleProgress: { include: { module: { select: { slug: true } } } },
        responses: {
          where: { question: { module: { slug: { in: slugs } } } },
          include: { question: { select: { sourceRef: true, module: { select: { slug: true } } } }, selectedOptions: true },
        },
      },
    });
    const session = sessions.find((row) => row.status === 'COMPLETED') ?? sessions.find((row) => row.status === 'ACTIVE') ?? sessions[0];
    const versionId = session?.versionId
      ?? (await this.prisma.diagnosticVersion.findFirst({ where: { isActive: true }, select: { id: true } }))?.id
      ?? null;
    const questions = versionId
      ? await this.prisma.question.findMany({
        where: { module: { versionId, slug: { in: slugs } } },
        select: { order: true, sourceRef: true, textEs: true, module: { select: { slug: true } } },
      })
      : [];
    const activities = session ? await this.ikigaiActivities(userId) : [];
    return buildPurposeEvidence({
      sessionStatus: session?.status ?? null,
      moduleStatus: Object.fromEntries((session?.moduleProgress ?? []).map((row) => [row.module.slug, row.status])),
      questions: questions.map((row) => ({ moduleSlug: row.module.slug, order: row.order, sourceRef: row.sourceRef, textEs: row.textEs })),
      responses: (session?.responses ?? []).map((row) => ({
        sourceRef: row.question.sourceRef,
        moduleSlug: row.question.module.slug,
        freeText: row.freeText,
        options: row.selectedOptions.map((option) => ({ order: option.order, textEs: option.textEs })),
        exceptionKind: row.exceptionKind,
        skipped: row.skipped,
      })),
      activities,
    });
  }

  async saveMemberDirection(userId: string, input: SaveMemberDirectionInput & { sourceIds?: unknown }) {
    const mode = input.mode;
    if (mode !== 'CLEAR' && mode !== 'EXPLORE' && mode !== 'UNKNOWN') {
      throw new BadRequestException('No pudimos reconocer la opción elegida. Selecciona una y vuelve a intentarlo.');
    }
    const statement = input.statement?.trim() ?? '';
    const desiredChange = input.desiredChange?.trim() ?? '';
    if (mode === 'CLEAR' && !statement) {
      throw new BadRequestException('Escribe tu dirección en una frase.');
    }
    if (mode === 'UNKNOWN' && !statement && !desiredChange) {
      throw new BadRequestException('Escribe qué quieres cuidar o explorar en este ciclo.');
    }
    const commandKey = input.commandKey?.trim() || null;
    if (commandKey) {
      const repeated = await this.prisma.purposeRevision.findFirst({
        where: { userId, content: { path: ['directionCommandKey'], equals: commandKey } },
      });
      if (repeated) {
        return { purposeRevisionId: repeated.id, revision: repeated.revision, repeated: true };
      }
    }
    const latest = await this.latestPurpose(userId);
    const previous = latest && typeof latest.content === 'object' && latest.content && !Array.isArray(latest.content)
      ? latest.content as Record<string, unknown>
      : {};
    const sources = input.sources
      ?? (input.sourceIds ? snapshotSources(buildDirectionSources(await this.hdrpFacts(userId), latest?.content ?? null), input.sourceIds) : []);
    const content = mergeDirectionContent(previous, { mode, statement, desiredChange, commandKey, sources });
    const saved = await this.prisma.purposeRevision.create({
      data: {
        userId,
        revision: (latest?.revision ?? 0) + 1,
        content: asJson(content),
      },
    });
    return { purposeRevisionId: saved.id, revision: saved.revision, repeated: false };
  }

  async getDirectionExploration(userId: string) {
    const [purpose, facts] = await Promise.all([
      this.latestPurpose(userId),
      this.hdrpFacts(userId),
    ]);
    const content = purpose?.content ?? null;
    const draft = readExplorationDraft(content) ?? defaultExplorationDraft();
    const sources = buildConfirmableSources(facts, content);
    const synthesis = buildExplorationSynthesis(draft, sources);
    return { draft, sources, synthesis, learning: proposeLearning(draft) };
  }

  async saveDirectionExplorationDraft(userId: string, patch: Partial<DirectionExplorationDraft>) {
    const latest = await this.latestPurpose(userId);
    const previous = latest && typeof latest.content === 'object' && latest.content && !Array.isArray(latest.content)
      ? latest.content as Record<string, unknown>
      : {};
    const current = readExplorationDraft(previous) ?? defaultExplorationDraft();
    const draft = mergeExplorationDraft(current, patch);
    const merged = { ...previous, directionExplorationDraft: draft };
    if (latest) {
      await this.prisma.purposeRevision.update({
        where: { id: latest.id },
        data: { content: asJson(merged) },
      });
    } else {
      await this.prisma.purposeRevision.create({
        data: { userId, revision: 1, content: asJson(merged) },
      });
    }
    const facts = await this.hdrpFacts(userId);
    const sources = buildConfirmableSources(facts, merged);
    return { draft, sources, synthesis: buildExplorationSynthesis(draft, sources), learning: proposeLearning(draft) };
  }

  async confirmDirectionExploration(
    userId: string,
    input: {
      statement: string;
      desiredChange?: string | null;
      commandKey?: string | null;
      keepExploring?: boolean;
      draft?: Partial<DirectionExplorationDraft>;
    },
  ) {
    const statement = input.statement?.trim() ?? '';
    if (!statement && !input.keepExploring) {
      throw new BadRequestException('Escribe la dirección que quieres explorar.');
    }
    if (input.keepExploring) {
      return this.saveDirectionExplorationDraft(userId, {
        ...(input.draft ?? {}),
        step: 'experience',
        synthesisChoice: 'continue',
      });
    }
    const [latest, facts] = await Promise.all([this.latestPurpose(userId), this.hdrpFacts(userId)]);
    const draft = mergeExplorationDraft(readExplorationDraft(latest?.content ?? null), input.draft ?? {});
    const saved = await this.saveMemberDirection(userId, {
      mode: 'UNKNOWN',
      statement,
      desiredChange: input.desiredChange?.trim() || null,
      commandKey: input.commandKey,
      sources: directionSourcesFromDraft(draft, buildConfirmableSources(facts, latest?.content ?? null)),
    });
    if (saved.repeated) return saved;
    await this.saveDirectionExplorationDraft(userId, {
      ...(input.draft ?? {}),
      step: 'done',
      provisionalDirection: statement,
      directionPublished: true,
      synthesisChoice: draft.recognition === 'represents' ? 'accept' : 'edit',
    });
    return saved;
  }

  async closeWeek(
    userId: string,
    weekStart: string,
    note?: string,
    decisions?: Record<string, WeekDecision>,
    revisions?: Record<string, WeekRevision>,
    outcomes?: Record<string, string>,
    extras?: WeekExtras,
  ) {
    const commandDigest = createHash('sha256').update(canonicalHash({
      weekStart,
      note: note ?? null,
      decisions: decisions ?? {},
      revisions: revisions ?? {},
      outcomes: outcomes ?? {},
      ...(extras?.additions?.length || extras?.endReasons ? { extras } : {}),
    })).digest('hex');
    const existing = await this.prisma.weekReview.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
    if (existing) {
      if (!existing.commandDigest) {
        throw new ConflictException({
          message: 'Ese cierre es anterior a este contrato. Se conserva y no se le inventa una clave.',
          code: 'LEGACY_CLOSE',
          id: existing.id,
        });
      }
      if (existing.commandDigest === commandDigest) return existing;
      throw new ConflictException({ message: 'Esta semana ya fue cerrada. Puedes consultar sus registros, pero no volver a aplicar el mismo cierre.', code: 'STALE_REVIEW', id: existing.id });
    }
    const later = await this.prisma.weekReview.findFirst({ where: { userId, weekStart: { gt: weekStart } } });
    if (later && decisions && Object.keys(decisions).length > 0) {
      throw new ConflictException({
        message: 'Hay un cierre posterior. No se aplican comandos de una revisión vieja. Si quieres cambiar el futuro, confirma una vista previa de ahora.',
        code: 'STALE_REVIEW',
      });
    }
    if (!isMonday(weekStart)) throw new ForbiddenException('La semana tiene que empezar un lunes.');
    if (weekStart > this.weekStart()) throw new ForbiddenException('Esa semana todavía no se revisa.');
    const historical = Boolean(later);
    const calendar = await this.calendar(userId);
    const effects = historical ? [] : await this.weekEffects(userId, weekStart, decisions, revisions);
    const active = calendar.plans.filter((plan) => plan.status === 'ACTIVE');
    const planChanges = historical ? [] : active.flatMap((plan) => {
      const next = nextPlanOutcome(plan.outcome, outcomes?.[plan.id]);
      return next ? [{ id: plan.id, next }] : [];
    });
    await this.assertFutureContent(userId, effects, active.flatMap((plan) => plan.actions));
    const additions = historical ? [] : extras?.additions ?? [];
    for (const addition of additions) {
      if (!active.some((plan) => plan.id === addition.planId)) throw new ForbiddenException('Ese plan no está activo.');
      const tags = parseContentTags(addition.contentTags);
      if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
      if (tags.length) await this.assertContent(userId, tags, { conversation: addition.conversationOutcome ?? undefined });
    }
    const appliesFrom = reviewAppliesFrom(this.civilToday(), weekStart);
    if (!historical) {
      const staleTitle = effects.find((effect) => effect.successor?.onceWeekStart && effect.successor.onceWeekStart < appliesFrom)?.successor?.title
        ?? additions.find((row) => row.onceWeekStart && row.onceWeekStart < appliesFrom)?.title;
      if (staleTitle) {
        throw new ConflictException({
          message: `La semana elegida para «${staleTitle}» ya empezó. Vuelve a guardar la decisión.`,
          code: 'STALE_REVIEW',
        });
      }
    }
    const snapshot = {
      decisions: decisions ?? {},
      revisions: revisions ?? {},
      ...(additions.length ? { additions } : {}),
      ...(extras?.endReasons ? { endReasons: extras.endReasons } : {}),
      appliesFrom,
      applied: !historical,
      effects: effects.map((effect) => ({ actionId: effect.actionId, decision: effect.decision, summary: effect.summary })),
      outcomeChanges: planChanges,
      plans: active.map((plan) => ({
        id: plan.id,
        title: plan.title,
        outcome: plan.outcome,
        actions: plan.actions.filter((action) => actionVisibleForWeek(action, plan.actions, weekStart, this.addDays(weekStart, 6))).map((action) => ({
          id: action.id,
          title: action.title,
          doneWhen: action.doneWhen,
          weekday: action.weekday,
          intervalDays: action.intervalDays,
          records: calendar.records.filter((record) => record.actionId === action.id && this.weekStart(record.day) === weekStart),
        })),
      })),
    };
    try {
      return await this.prisma.$transaction(async (tx) => {
      const again = await tx.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
      if (again) {
        if (again.commandDigest === commandDigest) return again;
        throw new ConflictException({ message: 'Esta semana ya fue cerrada. Puedes consultar sus registros, pero no volver a aplicar el mismo cierre.', code: 'STALE_REVIEW', id: again.id });
      }
      await this.weekApply.beforeActionWrite();
      const scheduleFromWeek = appliesFrom;
      let wrote = false;
      for (const effect of effects) {
        const previous = active.flatMap((plan) => plan.actions).find((item) => item.id === effect.actionId);
        await tx.planAction.update({
          where: { id: effect.actionId },
          data: {
            active: effect.next.active,
            title: effect.next.title,
            doneWhen: effect.next.doneWhen,
            weekday: effect.next.weekday ?? null,
            intervalDays: effect.next.intervalDays ?? 7,
            ...(effect.next.occasionsPerWeek !== undefined ? { occasionsPerWeek: effect.next.occasionsPerWeek } : {}),
            ...(effect.next.minutesPerOccasion !== undefined ? { minutesPerOccasion: effect.next.minutesPerOccasion } : {}),
            ...(effect.next.cue !== undefined ? { cue: effect.next.cue } : {}),
            ...(effect.next.minimumVersion !== undefined ? { minimumVersion: effect.next.minimumVersion } : {}),
            ...(effect.next.paused
              ? (effect.decision === 'PAUSE' ? { pausedAt: new Date() } : {})
              : { pausedAt: null }),
            ...(!effect.next.active && !previous?.effectiveTo
              ? { effectiveTo: this.addDays(appliesFrom, -1), endedReason: extras?.endReasons?.[effect.actionId] ?? null }
              : {}),
          },
        });
        const scheduleFrom = appliesFrom;
        if (
          previous
          && (effect.next.weekday !== previous.weekday || effect.next.intervalDays !== previous.intervalDays || effect.decision === 'PAUSE')
        ) {
          await appendScheduleVersion(tx, {
            actionId: effect.actionId,
            effectiveFrom: scheduleFrom,
            kind: effect.next.paused ? 'PAUSED' : effect.next.weekday == null ? 'NONE' : 'FIXED',
            weekday: effect.next.weekday ?? null,
            intervalDays: effect.next.intervalDays ?? 7,
            occasionsPerWeek: previous.occasionsPerWeek,
            source: 'REVIEW',
            commandKey: `${commandDigest}:${effect.actionId}`,
          });
        }
        if (!wrote) {
          wrote = true;
          await this.weekApply.afterActionWrite();
        }
        if (effect.successor) {
          const previous = active.flatMap((plan) => plan.actions).find((action) => action.id === effect.actionId);
          const once = effect.successor.onceWeekStart ?? null;
          const created = await tx.planAction.create({
            data: {
              planId: previous?.planId ?? active[0].id,
              title: effect.successor.title,
              doneWhen: effect.successor.doneWhen,
              weekday: effect.successor.weekday,
              intervalDays: effect.successor.intervalDays,
              replacesActionId: effect.successor.replacesActionId,
              preparation: effect.successor.preparation ?? previous?.preparation ?? null,
              domain: previous?.domain ?? null,
              contentTags: [...new Set([...(previous?.contentTags ?? []), ...(effect.successor.contentTags ?? [])])],
              templateTags: previous?.templateTags ?? [],
              conversationOutcome: previous?.conversationOutcome ?? null,
              origin: previous?.origin ?? null,
              familyId: previous?.familyId ?? null,
              templateVersion: previous?.templateVersion ?? null,
              position: previous?.position ?? 0,
              cue: effect.successor.cue !== undefined ? effect.successor.cue : previous?.cue ?? null,
              minimumVersion: effect.successor.minimumVersion !== undefined ? effect.successor.minimumVersion : previous?.minimumVersion ?? null,
              occasionsPerWeek: effect.successor.onceWeekStart !== undefined
                ? effect.successor.occasionsPerWeek ?? null
                : effect.successor.occasionsPerWeek ?? previous?.occasionsPerWeek ?? null,
              minutesPerOccasion: effect.successor.minutesPerOccasion ?? previous?.minutesPerOccasion ?? null,
              effectiveFrom: once && once > scheduleFrom ? once : scheduleFrom,
              active: true,
            },
          });
          if (once) await this.createOnceWindow(tx, created.id, once);
        }
      }
      for (const addition of additions) {
        const once = addition.onceWeekStart ?? null;
        const created = await tx.planAction.create({
          data: {
            planId: addition.planId,
            title: addition.title,
            doneWhen: addition.doneWhen,
            cue: addition.cue ?? null,
            minimumVersion: addition.minimumVersion ?? null,
            occasionsPerWeek: once ? null : addition.occasionsPerWeek ?? null,
            minutesPerOccasion: addition.minutesPerOccasion,
            position: addition.position,
            origin: 'MEMBER',
            contentTags: addition.contentTags ?? [],
            conversationOutcome: addition.conversationOutcome ?? null,
            effectiveFrom: once && once > scheduleFromWeek ? once : scheduleFromWeek,
            active: true,
          },
        });
        if (once) await this.createOnceWindow(tx, created.id, once);
      }
      for (const change of planChanges) {
        await tx.personalPlan.update({ where: { id: change.id }, data: { outcome: change.next } });
      }
      return tx.weekReview.create({
        data: { userId, weekStart, timezone: ZONE, note: note ?? null, snapshot: asJson(snapshot), commandDigest, applied: !historical },
      });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const won = await this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
        if (won?.commandDigest === commandDigest) return won;
        if (won) throw new ConflictException({ message: 'Esta semana ya fue cerrada. Puedes consultar sus registros, pero no volver a aplicar el mismo cierre.', code: 'STALE_REVIEW', id: won.id });
      }
      throw err;
    }
  }

  /** One occasion, only inside the civil week that starts on `weekStart`. */
  private async createOnceWindow(tx: Prisma.TransactionClient, actionId: string, weekStart: string) {
    await tx.actionSchedule.create({
      data: {
        actionId,
        effectiveFrom: new Date(`${weekStart}T12:00:00.000Z`),
        effectiveTo: new Date(`${this.addDays(weekStart, 6)}T12:00:00.000Z`),
        kind: 'FLEXIBLE',
        occasionsPerWeek: 1,
        source: 'REVIEW',
      },
    });
  }

  private async weekEffects(
    userId: string,
    weekStart: string,
    decisions?: Record<string, WeekDecision>,
    revisions?: Record<string, WeekRevision>,
  ) {
    if (!isMonday(weekStart)) throw new ForbiddenException('La semana tiene que empezar un lunes.');
    if (weekStart > this.weekStart()) throw new ForbiddenException('Esa semana todavía no se revisa.');
    const calendar = await this.calendar(userId);
    const active = calendar.plans.filter((plan) => plan.status === 'ACTIVE');
    try {
      return previewWeek(
        active.flatMap((plan) => plan.actions.filter((action) => action.active).map((action) => ({
          id: action.id,
          title: action.title,
          doneWhen: action.doneWhen,
          active: true,
          weekday: action.weekday,
          intervalDays: action.intervalDays,
          occasionsPerWeek: action.occasionsPerWeek,
          minutesPerOccasion: action.minutesPerOccasion,
          paused: Boolean(action.pausedAt),
          preparation: action.preparation,
          cue: action.cue,
          minimumVersion: action.minimumVersion,
        }))),
        decisions ?? {},
        revisions ?? {},
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const message = code === 'ADJUST_REQUIRES_CHANGE'
        ? 'El ajuste de una acción no tiene un cambio concreto.'
        : code === 'REDUCE_REQUIRES_CHANGE'
        ? 'Reducir exige un día o una frecuencia distinta.'
        : code === 'SUBSTITUTE_REQUIRES_CHANGE'
          ? 'Sustituir exige la estrategia nueva.'
          : code === 'PAUSE_REQUIRES_CHANGE'
            ? 'Esa acción ya está pausada.'
            : code === 'RESUME_REQUIRES_PAUSE'
              ? 'Reanudar pide una acción que esté en pausa.'
              : 'La revisión no tiene un cambio concreto.';
      throw new ForbiddenException(message);
    }
  }

  private async planOutcomeChanges(userId: string, outcomes?: Record<string, string>) {
    if (!outcomes) return [];
    const plans = await this.prisma.personalPlan.findMany({ where: { userId, status: 'ACTIVE' } });
    return plans.flatMap((plan) => {
      const next = nextPlanOutcome(plan.outcome, outcomes[plan.id]);
      if (!next) return [];
      return [{
        planId: plan.id,
        previous: plan.outcome,
        next,
        summary: `El resultado observable pasa a: ${next}. El de esta semana queda en la revisión.`,
      }];
    });
  }

  /** A limit declared after the preview still governs whatever the review leaves in the future. */
  private async assertFutureContent(
    userId: string,
    effects: WeekEffect[],
    actions: { id: string; contentTags: unknown; conversationOutcome: string | null }[],
  ) {
    for (const effect of effects) {
      const continues = Boolean(effect.successor) || (effect.next.active && !effect.next.paused);
      if (!continues) continue;
      const source = actions.find((action) => action.id === effect.actionId);
      const tags = parseContentTags(source?.contentTags);
      if (!tags || tags.length === 0) continue;
      await this.assertContent(userId, tags, { conversation: source?.conversationOutcome });
    }
  }

  private async contextReview(userId: string, plan: { actions: { weekday: number | null; occasionsPerWeek?: number | null }[] } | null) {
    const last = await this.prisma.actionRecord.findFirst({
      where: { action: { plan: { userId } } },
      orderBy: { day: 'desc' },
    });
    const hadPlanned = Boolean(plan?.actions.some((action) => action.weekday != null || (action.occasionsPerWeek ?? 0) > 0));
    const days = last ? Math.round((Date.parse(`${this.civilToday()}T00:00:00Z`) - Date.parse(`${last.day}T00:00:00Z`)) / 86400000) : null;
    const invited = hadPlanned && days != null && days >= CONTEXT_REVIEW_DAYS;
    return { invited, days, effect: 'NONE' as const };
  }

  private async occasionGuidance(userId: string, weekStart: string, directionChanged: boolean) {
    const weekEnd = this.addDays(weekStart, 6);
    const actions = await this.prisma.planAction.findMany({
      where: { plan: { userId, status: 'ACTIVE' }, active: true },
      include: { records: true, cancellations: true },
    });
    const tally = occasionTally(
      actions.map((action) => ({ id: action.id, weekday: action.weekday, occasionsPerWeek: action.occasionsPerWeek, active: action.active })),
      actions.flatMap((action) => action.records),
      actions.flatMap((action) => action.cancellations),
      weekStart,
      weekEnd,
      (weekday) => futureOccasions(weekStart, weekday, 7).filter((day) => day >= weekStart && day <= weekEnd),
    );
    const results = actions.flatMap((action) => action.records.filter((row) => row.day >= weekStart && row.day <= weekEnd).map((row) => row.resultStatus));
    return guidanceFromOccasions({ ...tally, results, directionChanged });
  }

  weeks(userId: string) {
    return this.prisma.weekReview.findMany({ where: { userId }, orderBy: { weekStart: 'desc' } });
  }

  requestGuidance(userId: string, source: string, note?: string) {
    return this.prisma.guidanceRequest.create({
      data: { userId, source, note: note ?? null, status: 'SENT' },
    });
  }

  private async ownPlan(userId: string, planId: string) {
    const plan = await this.prisma.personalPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.userId !== userId) throw new NotFoundException('Plan no encontrado.');
    return plan;
  }

  addDays(iso: string, days: number): string {
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
  }

  /** Monday of a civil date. The string is a day, not an instant. */
  weekStart(day?: string): string {
    const iso = day ?? this.clock.today();
    if (!isIsoDate(iso)) throw new BadRequestException('Fecha inválida.');
    return weekStartMonday(iso);
  }

  async memberDashboard(userId: string) {
    const version = await this.prisma.diagnosticVersion.findFirst({
      where: { definitionRef: FORMULARIO_COMPLETO_REF },
      orderBy: { createdAt: 'desc' },
    });
    const [ledger, plans, questions] = await Promise.all([
      answerLedger(this.prisma, userId),
      this.prisma.personalPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      version
        ? this.prisma.question.findMany({
            where: { module: { versionId: version.id } },
            select: { sourceRef: true },
          })
        : Promise.resolve([]),
    ]);
    const focusPlan = plans.find((plan) => plan.isFocus) ?? plans.find((plan) => plan.status === 'ACTIVE') ?? null;
    const weekStart = this.weekStart();
    const planIds = plans.map((plan) => plan.id);
    const actions = planIds.length
      ? await this.prisma.planAction.findMany({ where: { planId: { in: planIds } } })
      : [];
    const actionIds = actions.map((action) => action.id);
    const [records, schedules, review] = await Promise.all([
      actionIds.length ? this.prisma.actionRecord.findMany({ where: { actionId: { in: actionIds } } }) : Promise.resolve([]),
      loadActionSchedules(this.prisma, actionIds),
      this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } }),
    ]);
    const today = this.civilToday();
    const reviewed = Boolean(review);
    const planFacts: PlanFact[] = plans.map((plan) => {
      const siblings = actions.filter((action) => action.planId === plan.id);
      const owned = siblings.filter((action) => actionVisibleForWeek(action, siblings, weekStart, this.addDays(weekStart, 6)));
      const ownedIds = new Set(owned.map((action) => action.id));
      const week = weekCounts({
        weekStart,
        today,
        weekReviewed: reviewed,
        legacyWeek: false,
        actions: owned.map((action) => ({
          id: action.id,
          weekday: action.weekday,
          intervalDays: action.intervalDays,
          occasionsPerWeek: action.occasionsPerWeek,
          active: true,
        })),
        schedules,
        records: records.filter((row) => ownedIds.has(row.actionId)).map((row) => ({ actionId: row.actionId, day: row.day, status: row.status })),
        cancellations: [],
      });
      return {
        id: plan.id,
        week,
        nextOccasion: nextPlanOccasion(owned.map((action) => ({ ...action, active: true })), today, new Set()),
      };
    });
    const focusWeekCounts = focusPlan ? planFacts.find((fact) => fact.id === focusPlan.id)?.week ?? null : null;
    const directionView = await this.memberDirection(userId);
    const dashboard = buildDashboard({
      ledger,
      catalogQuestions: questions.filter((q) => q.sourceRef).map((q) => ({ sourceRef: q.sourceRef as string })),
      plans,
      focusWeekCounts,
      focusPlanId: focusPlan?.id ?? null,
      planFacts,
      weekStart,
    });
    return {
      ...dashboard,
      cycle: {
        directionStatement: directionView.statement,
        directionDesiredChange: directionView.desiredChange,
        focusChange: focusPlan?.title ?? null,
        focusOutcome: focusPlan?.outcome ?? null,
        reviewAt: focusPlan?.reviewAt?.toISOString().slice(0, 10) ?? null,
      },
    };
  }

  async planSummary(userId: string, planId: string) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    let directionAtCreation: { statement: string | null; desiredChange: string | null; revision: number | null } | null = null;
    if (plan.purposeRevisionId) {
      const rev = await this.prisma.purposeRevision.findFirst({ where: { id: plan.purposeRevisionId, userId } });
      if (rev) {
        const fields = readDirectionFields(rev.content);
        directionAtCreation = {
          statement: fields.statement,
          desiredChange: fields.desiredChange,
          revision: rev.revision,
        };
      }
    }
    const proposal = await this.prisma.planProposal.findFirst({
      where: { userId, planId, kind: 'INTERVENTION_PLAN' },
      orderBy: { createdAt: 'desc' },
    });
    const payload = proposal?.payload && typeof proposal.payload === 'object' ? proposal.payload as Record<string, unknown> : {};
    const snapshot = payload.templateSnapshot && typeof payload.templateSnapshot === 'object'
      ? payload.templateSnapshot as { title?: string; action?: string; doneWhen?: string }
      : null;
    const actions = await this.prisma.planAction.findMany({
      where: { planId: plan.id, active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    const action = actions[0] ?? null;
    const design = payload.design && typeof payload.design === 'object'
      ? payload.design as { obstacles?: { obstacle: string; response: string }[]; resources?: string | null; actions?: { title: string; doneWhen: string; cue: string | null; minimum: string | null }[] }
      : null;
    const contract = contractFromPlanRow(plan)?.current ?? null;
    const [learning, observed] = await Promise.all([
      this.prisma.planEvidence.findFirst({
        where: { userId, planId: plan.id, kind: 'NOTE', status: 'LEARNING' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.planEvidence.findFirst({
        where: { userId, planId: plan.id, status: 'OBSERVED' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      id: plan.id,
      title: plan.title,
      outcome: plan.outcome,
      whyItMatters: plan.whyItMatters,
      linkKind: plan.linkKind,
      stage: plan.stage,
      territory: plan.territory,
      reviewAt: plan.reviewAt?.toISOString().slice(0, 10) ?? null,
      directionAtCreation,
      strategyTitle: snapshot?.title ?? null,
      actionTitle: action?.title ?? snapshot?.action ?? null,
      doneWhen: action?.doneWhen ?? snapshot?.doneWhen ?? plan.criterionText,
      outcomeCriterion: plan.criterionText,
      outcomeContract: contractFromPlanRow(plan)?.current ?? null,
      outcomeContractMeta: outcomeContractMeta(plan),
      outcomeContractComplete: outcomeContractMeta(plan).complete,
      evidenceHint: contractFromPlanRow(plan)?.current.evidenceHint ?? null,
      learningNote: learning?.text ?? null,
      observedEvidence: observed?.text ?? null,
      resultMode: contract?.mode ?? 'RESULT',
      actions: actions.length
        ? actions.map((row) => ({
          id: row.id,
          title: row.title,
          doneWhen: row.doneWhen,
          cue: row.cue,
          minimum: row.minimumVersion,
          occasionsPerWeek: row.occasionsPerWeek,
          minutesPerOccasion: row.minutesPerOccasion,
        }))
        : (design?.actions ?? []).map((row, index) => ({
          id: `draft-${index}`,
          title: row.title,
          doneWhen: row.doneWhen,
          cue: row.cue,
          minimum: row.minimum,
          occasionsPerWeek: null,
          minutesPerOccasion: null,
        })),
      obstacles: design?.obstacles ?? [],
      resources: design?.resources ?? null,
    };
  }

  async territoryView(userId: string, territory: string) {
    const t = territory.toUpperCase();
    if (!['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA'].includes(t)) {
      throw new BadRequestException('No encontramos ese ámbito. Vuelve a Inicio y elige uno.');
    }
    const version = await this.prisma.diagnosticVersion.findFirst({
      where: { definitionRef: FORMULARIO_COMPLETO_REF },
      orderBy: { createdAt: 'desc' },
    });
    const [ledger, questions, purpose] = await Promise.all([
      answerLedger(this.prisma, userId),
      version
        ? this.prisma.question.findMany({
            where: { module: { versionId: version.id } },
            select: { sourceRef: true, textEs: true },
          })
        : Promise.resolve([]),
      this.prisma.purposeRevision.findFirst({ where: { userId }, orderBy: { revision: 'desc' } }),
    ]);
    const catalog = questions.filter((q) => q.sourceRef).map((q) => ({
      sourceRef: q.sourceRef as string,
      textEs: q.textEs,
    }));
    const detail = territoryDetail(t as 'MENTALIDAD' | 'FINANZAS' | 'RELACIONES' | 'SALUD_FISICA', ledger, catalog);
    const exceptionResponses: Record<string, { exceptionKind: string | null }> = {};
    for (const row of ledger) exceptionResponses[row.sourceRef] = { exceptionKind: row.exceptionKind };
    const exceptions = territoryExceptionRows(
      t as 'MENTALIDAD' | 'FINANZAS' | 'RELACIONES' | 'SALUD_FISICA',
      catalog,
      exceptionResponses,
    );
    const texts = accountTextsFromLedger(ledger);
    const directionRaw = directionOf(purpose);
    const direction =
      directionRaw === 'EXPLORANDO' || directionRaw === 'PROVISIONAL' || directionRaw === 'CONFIRMADO_POR_USUARIO'
        ? directionRaw
        : null;
    const partialCoverage = detail.coverage.state !== 'EXPLORED';
    const synthesis = discoverSynthesis({
      direction,
      visionDay: texts.visionDay,
      visionPhrase: texts.visionPhrase,
      valueDefended: texts.valueDefended,
      weeklyStandard: texts.weeklyStandard,
      postpone: texts.postpone,
      ikigaiActivity: null,
      goalText: null,
      goalKind: null,
      ledger,
      partialCoverage,
    });
    const plans = await this.prisma.personalPlan.findMany({
      where: { userId, territory: t },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });
    return {
      ...detail,
      exceptions,
      synthesis,
      plans: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        stage: plan.stage ?? fromLegacy(plan.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'),
        isFocus: plan.isFocus,
      })),
    };
  }

  async addPlanEvidence(
    userId: string,
    planId: string,
    input: {
      kind: string;
      status: string;
      text?: string | null;
      observedOn?: string;
      actionRecordId?: string | null;
      commandKey?: string;
    },
  ) {
    if (input.commandKey) {
      const prior = await this.prisma.planEvidence.findFirst({
        where: { userId, commandKey: input.commandKey },
      });
      if (prior) return { evidence: prior, repeated: true };
    }
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    const allowedKinds = new Set(['DELIVERABLE', 'DECISION', 'OTHER_PERSON_RESPONSE', 'MEASURE', 'NOTE']);
    if (!allowedKinds.has(input.kind)) throw new BadRequestException('Tipo de evidencia desconocido.');
    if (input.status === 'OBSERVED' && !input.text?.trim()) {
      throw new BadRequestException('La evidencia observada necesita un texto.');
    }
    const revision = plan.criterionRevision ?? 1;
    const observedOn = input.observedOn ?? this.civilToday();
    const evidence = await this.prisma.planEvidence.create({
      data: {
        userId,
        planId: plan.id,
        criterionRevision: revision,
        observedOn: new Date(`${observedOn}T12:00:00.000Z`),
        kind: input.kind,
        status: input.status,
        text: input.text?.trim() || null,
        actionRecordId: input.actionRecordId ?? null,
        commandKey: input.commandKey ?? null,
      },
    });
    return { evidence, repeated: false };
  }

  async declareAchievement(
    userId: string,
    planId: string,
    input: { confirm: boolean; expectedVersion?: number; commandKey?: string; learningNote?: string | null },
  ) {
    if (!input.confirm) throw new BadRequestException('Hay que confirmar el logro.');
    if (input.commandKey) {
      const prior = await this.prisma.planTransition.findFirst({
        where: { userId, planId, metadata: { path: ['commandKey'], equals: input.commandKey } },
      });
      if (prior) {
        const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
        if (!plan) throw new NotFoundException('Plan no encontrado.');
        return { plan, repeated: true };
      }
    }
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    const from = this.planStage(plan);
    if (!canDeclareAchievement({ criterionText: plan.criterionText, criterionStatus: plan.criterionStatus, stage: from })) {
      throw new ConflictException({
        message: 'Para registrar un logro, primero confirma cómo sabrás que lo lograste.',
        code: 'CRITERION_NOT_CONFIRMED',
      });
    }
    const revision = plan.criterionRevision ?? 1;
    const evidence = await this.prisma.planEvidence.findFirst({
      where: { userId, planId: plan.id, criterionRevision: revision, status: 'OBSERVED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!achievementEvidenceReady(evidence)) {
      throw new ConflictException({
        message: 'Antes del logro, anota qué muestra que se cumplió el criterio.',
        code: 'ACHIEVEMENT_EVIDENCE_REQUIRED',
      });
    }
    if (!canTransition(from, 'CLOSED')) {
      throw new BadRequestException('Este plan no puede cerrarse por logro desde su etapa actual.');
    }
    const learning = input.learningNote?.trim().slice(0, 1000) || null;
    return this.prisma.$transaction(async (tx) => {
      if (learning) {
        await tx.planEvidence.create({
          data: {
            userId,
            planId: plan.id,
            criterionRevision: revision,
            observedOn: new Date(),
            kind: 'NOTE',
            status: 'LEARNING',
            text: learning,
            source: 'DECLARED_BY_MEMBER',
          },
        });
      }
      const updated = await tx.personalPlan.update({
        where: { id: plan.id },
        data: {
          achievedAt: new Date(),
          stage: 'CLOSED',
          status: compatStatus('CLOSED'),
          closedReason: 'ACHIEVED',
          isFocus: false,
          focusSince: null,
          version: nextPlanVersion(plan.version),
        },
      });
      await tx.planAction.updateMany({
        where: { planId: plan.id, active: true },
        data: { active: false },
      });
      await tx.planTransition.create({
        data: {
          userId,
          planId: plan.id,
          fromStage: from,
          toStage: 'CLOSED',
          reason: 'ACHIEVED',
          effectiveFrom: new Date(this.civilToday()),
          metadata: input.commandKey ? { commandKey: input.commandKey } : undefined,
        },
      });
      return { plan: updated, repeated: false };
    });
  }

  async memory(userId: string) {
    const [purpose, plans, learningNotes] = await Promise.all([
      this.prisma.purposeRevision.findMany({ where: { userId }, orderBy: { revision: 'desc' }, take: 5 }),
      this.prisma.personalPlan.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.planEvidence.findMany({
        where: { userId, kind: 'NOTE', status: 'LEARNING' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const noteByPlan = new Map<string, string>();
    for (const row of learningNotes) {
      if (!noteByPlan.has(row.planId) && row.text?.trim()) noteByPlan.set(row.planId, row.text.trim());
    }
    const signed = purpose.find((row) => row.confirmedAt) ?? null;
    const draft = purpose.find((row) => !row.confirmedAt) ?? null;
    const readPurpose = (row: typeof signed) => {
      if (!row) return null;
      const content = row.content && typeof row.content === 'object' ? row.content as Record<string, unknown> : {};
      return {
        id: row.id,
        revision: row.revision,
        directionStatus: typeof content.directionStatus === 'string' ? content.directionStatus : null,
        statement: typeof content.statement === 'string' ? content.statement : typeof content.edited === 'string' ? content.edited : null,
        confirmedAt: row.confirmedAt?.toISOString() ?? null,
        contractFrozen: Boolean(row.confirmedAt),
      };
    };
    const purposeById = new Map(purpose.map((row) => [row.id, row]));
    return buildMemory({
      signed: readPurpose(signed),
      draft: draft && draft.id !== signed?.id ? readPurpose(draft) : null,
      directionHistory: purpose.map((row) => {
        const fields = readDirectionFields(row.content);
        return {
          id: row.id,
          revision: row.revision,
          statement: fields.statement,
          desiredChange: fields.desiredChange,
          crossPossibility: fields.statement ? null : crossPossibilityText(row.content),
          createdAt: row.createdAt.toISOString(),
        };
      }),
      plans: plans.map((plan) => {
        const rev = plan.purposeRevisionId ? purposeById.get(plan.purposeRevisionId) : null;
        const dir = rev ? readDirectionFields(rev.content) : null;
        return {
          id: plan.id,
          title: plan.title,
          outcome: plan.outcome,
          whyItMatters: plan.whyItMatters,
          stage: plan.stage,
          closedReason: plan.closedReason,
          achievedAt: plan.achievedAt?.toISOString() ?? null,
          learningNote: noteByPlan.get(plan.id) ?? null,
          directionStatement: dir?.statement ?? null,
        };
      }),
    });
  }

  async returnReading(userId: string) {
    const plans = await this.prisma.personalPlan.findMany({ where: { userId } });
    const chosen = selectContextualPlan(plans);
    const plan = chosen ? plans.find((row) => row.id === chosen.id) ?? null : null;
    const stage = plan ? this.planStage(plan) : null;
    const lastReview = plan
      ? await this.prisma.weekReview.findFirst({ where: { userId }, orderBy: { closedAt: 'desc' } })
      : null;
    const lastRecord = plan
      ? await this.prisma.actionRecord.findFirst({
        where: { action: { planId: plan.id } },
        orderBy: { day: 'desc' },
      })
      : null;
    const today = this.civilToday();
    const daysSince = lastRecord?.day
      ? Math.max(0, Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${lastRecord.day}T12:00:00Z`)) / 86400000))
      : null;
    const reading = returnPanel({
      planTitle: plan?.title ?? null,
      planOutcome: plan?.outcome ?? null,
      protectNote: plan?.protectNote ?? null,
      lastReviewNote: lastReview?.note ?? null,
      daysSinceLastActivity: daysSince,
      pendingOccasionDays: 0,
    });
    return {
      ...reading,
      planId: plan?.id ?? null,
      stage,
      hasPendingOccasions: false,
    };
  }

  async ownPlanPreview(userId: string, planId: string) {
    const plan = await this.ownPlan(userId, planId);
    const actions = await this.prisma.planAction.findMany({ where: { planId: plan.id, active: true } });
    return readOwnPlan({
      actions: actions.map((action) => ({
        id: action.id,
        title: action.title,
        doneWhen: action.doneWhen,
        weekday: action.weekday,
        occasionsPerWeek: action.occasionsPerWeek,
        minutesPerOccasion: action.minutesPerOccasion,
      })),
      reviewAt: plan.reviewAt?.toISOString().slice(0, 10) ?? null,
      capacityMinutes: plan.capacityMinutes,
    });
  }

  async previewPurposeSeed(userId: string) {
    const purpose = await this.latestPurpose(userId);
    const plan = await this.prisma.personalPlan.findFirst({
      where: { userId, whyStatus: 'CONFIRMED' },
      orderBy: { updatedAt: 'desc' },
    });
    const content = purpose?.content && typeof purpose.content === 'object' ? purpose.content as Record<string, unknown> : {};
    const seed = directionSeed({
      directionStatus: typeof content.directionStatus === 'string' ? content.directionStatus : null,
      directionConfirmedAt: purpose?.confirmedAt?.toISOString() ?? null,
      whyStatus: (plan?.whyStatus as 'PROPOSED' | 'CONFIRMED' | 'PROVISIONAL') ?? 'PROVISIONAL',
      whyItMatters: plan?.whyItMatters ?? null,
    });
    return seed;
  }

  async confirmPurposeSeed(userId: string, input: { commandKey?: string; confirm?: boolean }) {
    const preview = await this.previewPurposeSeed(userId);
    if (!preview.offer || !preview.statement) {
      throw new ConflictException({ message: 'No corresponde sembrar dirección ahora.', code: 'SEED_NOT_OFFERED', reason: preview.reason });
    }
    if (!input.confirm) throw new BadRequestException('Falta confirmación.');
    if (input.commandKey) {
      const existing = await this.prisma.purposeRevision.findFirst({
        where: { userId, content: { path: ['seedCommandKey'], equals: input.commandKey } },
      });
      if (existing) return { purposeRevisionId: existing.id, repeated: true };
    }
    const saved = await this.savePurpose(userId, {
      directionStatus: 'EXPLORANDO',
      statement: preview.statement,
      ...(input.commandKey ? { seedCommandKey: input.commandKey } : {}),
    });
    return { purposeRevisionId: saved.id, repeated: false };
  }

  async listPlanProposals(userId: string, planId: string) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    const rows = await this.prisma.planProposal.findMany({
      where: { userId, planId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      payload: row.payload,
      editedPayload: row.editedPayload,
      reasons: row.reasons,
      decidedAt: row.decidedAt?.toISOString() ?? null,
    }));
  }

  async createPlanDraft(userId: string, input: { entry?: 'NO_DIRECTION' | 'GOAL' | 'OWN_PLAN'; territory?: string | null }) {
    return this.prisma.personalPlan.create({
      data: {
        userId,
        title: 'Borrador',
        outcome: '',
        status: 'DRAFT',
        stage: 'PREPARING',
        entry: input.entry ?? 'GOAL',
        territory: input.territory ?? null,
      },
    });
  }

  async patchPlanDraft(
    userId: string,
    planId: string,
    input: {
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
  ) {
    const plan = await this.ownPlan(userId, planId);
    this.guardPlanVersion(plan, input.expectedVersion);
    if (input.capacityMinutes !== undefined && (!Number.isInteger(input.capacityMinutes) || input.capacityMinutes < 0 || input.capacityMinutes > 1680)) {
      throw new BadRequestException('Los minutos semanales tienen que ser un entero entre 0 y 1680.');
    }
    return this.prisma.personalPlan.update({
      where: { id: plan.id },
      data: {
        title: input.title?.trim(),
        outcome: input.outcome?.trim(),
        whyItMatters: input.whyItMatters !== undefined ? input.whyItMatters : undefined,
        whyStatus: input.whyStatus ?? undefined,
        territory: input.territory ?? undefined,
        ...(input.capacityMinutes !== undefined ? { capacityMinutes: input.capacityMinutes } : {}),
        ...(input.protectNote !== undefined ? { protectNote: input.protectNote } : {}),
        ...(input.criterionText !== undefined ? { criterionText: input.criterionText?.trim() || null } : {}),
        ...(input.criterionStatus !== undefined ? { criterionStatus: input.criterionStatus } : {}),
        version: nextPlanVersion(plan.version),
      },
    });
  }

  async decidePlanProposal(
    userId: string,
    planId: string,
    proposalId: string,
    input: {
      decision: 'ACCEPT' | 'EDIT' | 'REJECT';
      editedPayload?: Record<string, unknown>;
      commandKey?: string;
      expectedVersion?: number;
    },
  ) {
    if (input.commandKey) {
      const prior = await this.prisma.planProposal.findUnique({
        where: { userId_commandKey: { userId, commandKey: input.commandKey } },
      });
      if (prior) return { proposal: prior, repeated: true };
    }
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    const proposal = await this.prisma.planProposal.findFirst({ where: { id: proposalId, userId, planId } });
    if (!proposal) throw new NotFoundException('Propuesta no encontrada.');
    if (input.decision === 'EDIT' && (!input.editedPayload || Object.keys(input.editedPayload).length === 0)) {
      throw new BadRequestException('Editar exige el contenido revisado.');
    }
    const status =
      input.decision === 'REJECT' ? 'REJECTED' : input.decision === 'EDIT' ? 'EDITED' : 'ACCEPTED';
    const updated = await this.prisma.planProposal.update({
      where: { id: proposal.id },
      data: {
        status,
        decidedAt: new Date(),
        ...(input.decision === 'EDIT' && input.editedPayload ? { editedPayload: asJson(input.editedPayload) } : {}),
        ...(input.decision === 'ACCEPT' ? { editedPayload: Prisma.JsonNull } : {}),
        ...(input.commandKey ? { commandKey: input.commandKey } : {}),
      },
    });
    await this.prisma.personalPlan.update({
      where: { id: plan.id },
      data: { version: nextPlanVersion(plan.version) },
    });
    return { proposal: updated, repeated: false };
  }
}

function homePlanOf(plan: {
  id: string;
  title: string;
  outcome: string;
  priorityNote: string | null;
  linkKind: string | null;
  status: string;
  actions: { origin: string | null }[];
} | null): HomePlan | null {
  if (!plan) return null;
  return {
    id: plan.id,
    title: plan.title,
    outcome: plan.outcome,
    priorityNote: plan.priorityNote,
    linkKind: plan.linkKind,
    status: plan.status,
    guided: plan.actions.some((action) => action.origin === 'SYSTEM_TEMPLATE'),
  };
}

function nextOccasion(
  plan: { actions: { id: string; active: boolean; pausedAt: Date | null; weekday: number | null; intervalDays: number | null; title: string; doneWhen: string }[] } | null,
  today: string,
  cancelled: Set<string>,
): { day: string; title: string; criterion: string } | null {
  let chosen: { day: string; title: string; criterion: string } | null = null;
  for (const action of plan?.actions ?? []) {
    if (!action.active || action.pausedAt || action.weekday == null) continue;
    const day = futureOccasions(today, action.weekday, action.intervalDays ?? 7).find((item) => !cancelled.has(`${action.id}:${item}`));
    if (!day) continue;
    if (!chosen || day < chosen.day) chosen = { day, title: action.title, criterion: action.doneWhen };
  }
  return chosen;
}

function reviewChanges(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const effects = (snapshot as { effects?: { summary?: unknown }[] }).effects;
  if (!Array.isArray(effects)) return [];
  return effects.flatMap((effect) => (typeof effect?.summary === 'string' && effect.summary.trim() ? [effect.summary.trim()] : []));
}

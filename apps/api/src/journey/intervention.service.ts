import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { answerLedger } from '../instrumentos/answer-ledger';
import { loadActionSchedules } from './action-schedules.db';
import { addIsoDays } from './civil-date';
import { reviewAppliesFrom, weekStartForDay } from './civil-week';
import { JourneyClock, journeyNow } from './journey-clock';
import { JourneyService, type WeekExtras } from './journey.service';
import { activationBlock, planActivationInput, weekFallsInPause } from './plan-lifecycle';
import { previewWeek } from './apply-week';
import { weekCounts } from './week-count';
import { executionStats } from './intervention/execution-coverage';
import { choicesForReview, weekDecisionFromChoice, type MemberReviewChoice } from './intervention/review-decision';
import {
  digestAction,
  pendingForWeek,
  withPendingReview,
  withoutPendingWeek,
  withReviewHistory,
  type PendingPlanReview,
  type ReviewMeaning,
} from './intervention/week-review-pending';
import {
  deriveIndicatorFromReview,
  digestMenA1Evidence,
  MEN_A1_FAMILY,
  maxPriorities,
  normalizePrepPayload,
  validateConfirmPrep,
  type MenA1PrepPayload,
  type MenA1ReviewOutcomes,
} from './intervention/men-a1-prep';
import { parseContentTags, PLAN_LINKS } from './plan-gate';
import { readDirectionFields } from './member-direction';
import {
  buildOutcomeContract,
  contractFromPlanRow,
  digestOutcomeContract,
  outcomeCheckDue,
  parseAssessmentStatus,
  mergeReviewWithOutcome,
  outcomeContractMeta,
  reviewHintFromLayers,
  reviseContract,
  suggestIndicatorLink,
  type OutcomeAssessmentRow,
  type PlanOutcomeContractStore,
} from './plan-outcome-contract';
import {
  activeIndicators,
  buildReadings,
  hasAnswers,
  isOriented,
  progressFrom,
  readSources,
  readingsForGoal,
  reviewProposal,
  validateMeasure,
  type Measure,
  type Pack,
  type Recognition,
  type StoredRecognition,
  type Template,
} from './intervention/engine';
import { packByTerritory } from './intervention/registry';
import {
  DesignInputError,
  HEALTH_MARKS,
  TERRITORY_MARKS,
  WORK_PATTERNS,
  clampToHorizon,
  compatLoad,
  designLoad,
  designReadiness,
  emptyDesign,
  ownStrategySnapshot,
  parseDesign,
  parseDesignActions,
  parseObstacles,
  recommendStrategies,
  resumeStep as designResumeStep,
  seedFromPattern,
  seedFromTemplate,
  type DesignAction,
  type DesignStrategy,
  type PlanDesign,
  type ResultMode,
  type WorkPattern,
} from './intervention/plan-design';
import { decideAction } from '../instrumentos/restrictions';
import { actionCountsInWeek } from './action-window';
import {
  ReviewInputError,
  actionChangesResultMeaning,
  loadForWeek,
  planActionReview,
  type ActionChangeInput,
  type AdditionInput,
  type PendingActionChange,
  type PendingAddition,
  type ReviewActionKind,
} from './intervention/action-review';

const PROPOSAL_KIND = 'INTERVENTION_PLAN';
const MEASURE_STATUS = 'MEASURED';
const DEFAULT_PROTECT = 'Por ahora no hay nada que cuidar.';

type ProposalPayload = {
  /** Null while a design has no strategy yet, or an own strategy before activation. */
  templateId: string | null;
  version: string;
  templateSnapshot: Template | null;
  general: boolean;
  minimum: boolean;
  horizonWeeks: number;
  focusText: string | null;
  stageDefinition: string | null;
  readings: { id: string; outcome: Recognition; signature: string; declared: string[] }[];
  consulted?: { id: string; declared: string[] }[];
  load: { weeklyMinutes: number; occasionsPerWeek: number | null; minutesPerOccasion: number; confirmed: boolean } | null;
  environmentAccepted: boolean;
  originTemplateId?: string | null;
  lastReviewChoice?: MemberReviewChoice | null;
  lastReviewAt?: string | null;
  pendingReviews?: Record<string, PendingPlanReview>;
  reviewHistory?: Record<string, import('./intervention/week-review-pending').ReviewHistoryEntry>;
  design?: PlanDesign;
};

function designBadRequest(err: unknown): never {
  if (err instanceof DesignInputError) throw new BadRequestException(err.message);
  throw err;
}

function wholeNumber(value: unknown, label: string, min: number, max: number, invalidMessage?: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestException(invalidMessage ?? `${label} tiene que ser un entero entre ${min} y ${max}.`);
  }
  return value;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class InterventionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: JourneyClock,
    private readonly journey: JourneyService,
  ) {}

  private pack(territory: string): Pack {
    const pack = packByTerritory(territory);
    if (!pack) throw new NotFoundException('Ese ámbito no tiene un recorrido de planes.');
    return pack;
  }

  private async recognitions(userId: string, scope: string): Promise<StoredRecognition[]> {
    const rows = await this.prisma.memberClarification.findMany({
      where: { userId, scope },
      orderBy: { createdAt: 'asc' },
    });
    return rows
      .filter((row) => row.subjectRef && row.detail && ['REPRESENTS', 'PARTIAL', 'NOT'].includes(row.outcome))
      .map((row) => ({ readingId: row.subjectRef as string, outcome: row.outcome as Recognition, signature: row.detail as string }));
  }

  private async current(userId: string, pack: Pack) {
    const [ledger, stored] = await Promise.all([answerLedger(this.prisma, userId), this.recognitions(userId, pack.scope)]);
    const read = readSources(pack, ledger);
    return { read, readings: buildReadings(pack, read, stored) };
  }

  async view(userId: string, territory: string, goalParam?: string | null) {
    const pack = this.pack(territory);
    const goal = pack.goals.some((row) => row.id === goalParam) ? goalParam! : null;
    const { read, readings } = await this.current(userId, pack);
    const shown = readingsForGoal(readings, goal);
    const notes = await this.prisma.planEvidence.findMany({
      where: { userId, kind: 'NOTE', status: 'LEARNING', plan: { territory: pack.territory } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return {
      territory: pack.territory,
      version: pack.version,
      goal,
      goals: pack.goals,
      prioritized: shown.prioritized,
      readings: shown.readings,
      setAside: readings.filter((row) => row.recognition === 'NOT').map((row) => row.id),
      hasAnswers: hasAnswers(read),
      ineligible: read.ineligible,
      vision: read.vision,
      modifiers: pack.modifiers(read),
      templates: pack.templates,
      memoryNotes: notes.map((row) => row.text).filter((row): row is string => Boolean(row?.trim())),
    };
  }

  async recognize(userId: string, territory: string, input: { readingId?: string; outcome?: string; signature?: string }) {
    const pack = this.pack(territory);
    if (!input.readingId || !input.signature || !['REPRESENTS', 'PARTIAL', 'NOT'].includes(input.outcome ?? '')) {
      throw new BadRequestException('Falta la lectura, la respuesta o la versión de las respuestas.');
    }
    const { readings } = await this.current(userId, pack);
    const reading = readings.find((row) => row.id === input.readingId);
    if (!reading) throw new NotFoundException('Esa lectura no aplica a tus respuestas actuales.');
    if (reading.signature !== input.signature) {
      throw new ConflictException({ message: 'Tus respuestas cambiaron. Vuelve a mirar la lectura.', code: 'STALE_READING' });
    }
    await this.prisma.memberClarification.create({
      data: {
        userId,
        scope: pack.scope,
        outcome: input.outcome as Recognition,
        subjectRef: reading.id,
        detail: reading.signature,
        source: 'CONFIRMATION',
        rulesVersion: pack.version,
      },
    });
    return this.view(userId, territory, null);
  }

  /** What Descubre, Propósito and earlier cycles already say. Every piece is optional. */
  async designContext(userId: string, territory: string, excludePlanId?: string) {
    const pack = this.pack(territory);
    const { read, readings } = await this.current(userId, pack);
    const [direction, plans, others] = await Promise.all([
      this.journey.memberDirection(userId),
      this.prisma.personalPlan.findMany({
        where: {
          userId,
          territory: pack.territory,
          stage: { in: ['ACTIVE', 'MAINTENANCE', 'PAUSED', 'CLOSED'] },
          ...(excludePlanId ? { id: { not: excludePlanId } } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        include: {
          proposals: { where: { kind: PROPOSAL_KIND }, orderBy: { createdAt: 'desc' }, take: 1 },
          evidence: { where: { OR: [{ kind: 'NOTE', status: 'LEARNING' }, { kind: 'OUTCOME' }] }, orderBy: { createdAt: 'desc' }, take: 4 },
        },
      }),
      this.prisma.personalPlan.findMany({
        where: { userId, stage: { in: ['ACTIVE', 'MAINTENANCE'] }, ...(excludePlanId ? { id: { not: excludePlanId } } : {}) },
        select: { capacityMinutes: true },
      }),
    ]);
    const priorPlans = plans.map((row) => {
      const payload = (row.proposals[0]?.payload ?? null) as ProposalPayload | null;
      const learning = row.evidence.find((item) => item.kind === 'NOTE');
      const assessment = row.evidence.find((item) => item.kind === 'OUTCOME');
      return {
        id: row.id,
        title: row.title,
        stage: row.stage,
        templateId: payload?.templateId ?? null,
        strategyTitle: payload?.templateSnapshot?.title ?? null,
        learning: learning?.text ?? null,
        assessment: parseAssessmentStatus(assessment?.status),
      };
    });
    const hasDirection = Boolean(direction.statement?.trim() || direction.desiredChange?.trim());
    return {
      territory: pack.territory,
      version: pack.version,
      goals: pack.goals,
      readings: readings.filter((row) => row.recognition !== 'NOT'),
      setAside: readings.filter((row) => row.recognition === 'NOT').length,
      hasAnswers: hasAnswers(read),
      modifiers: pack.modifiers(read),
      direction: hasDirection ? {
        mode: direction.mode,
        statement: direction.statement,
        desiredChange: direction.desiredChange,
        values: direction.sources.values,
        revision: direction.revision,
        purposeRevisionId: direction.purposeRevisionId,
      } : null,
      priorPlans,
      otherActiveMinutes: others.reduce((sum, row) => sum + (row.capacityMinutes ?? 0), 0),
      marks: TERRITORY_MARKS[pack.territory],
      patterns: WORK_PATTERNS,
      catalog: pack.templates,
    };
  }

  private async contextReadings(userId: string, pack: Pack, ids: string[]) {
    const { readings } = await this.current(userId, pack);
    return ids.map((id) => {
      const reading = readings.find((row) => row.id === id);
      if (!reading || !isOriented(reading)) throw new BadRequestException('Solo se usan lecturas que reconociste.');
      return reading;
    });
  }

  private async assertDirection(userId: string, purposeRevisionId: string | null | undefined, linkKind: string | null | undefined) {
    if (purposeRevisionId) {
      const owned = await this.prisma.purposeRevision.findFirst({ where: { id: purposeRevisionId, userId } });
      if (!owned) throw new BadRequestException('La dirección indicada no existe.');
    }
    if (linkKind && !PLAN_LINKS.includes(linkKind)) throw new BadRequestException('Vínculo con la dirección no válido.');
  }

  async createDesign(userId: string, territory: string, input: {
    change?: string;
    why?: string | null;
    goal?: string | null;
    contextReadingIds?: string[];
    purposeRevisionId?: string | null;
    linkKind?: string | null;
    commandKey?: string;
  }) {
    const pack = this.pack(territory);
    if (input.commandKey) {
      const prior = await this.prisma.planProposal.findUnique({ where: { userId_commandKey: { userId, commandKey: input.commandKey } } });
      if (prior?.planId) return this.designView(userId, territory, prior.planId);
    }
    const change = input.change?.trim() ?? '';
    if (!change) throw new BadRequestException('Escribe qué te gustaría cambiar.');
    if (change.length > 180) throw new BadRequestException('El cambio admite hasta 180 caracteres.');
    const why = input.why?.trim() || null;
    if (why && why.length > 1000) throw new BadRequestException('El motivo admite hasta 1000 caracteres.');
    const goal = pack.goals.some((row) => row.id === input.goal) ? input.goal! : null;
    const ids = [...new Set(input.contextReadingIds ?? [])];
    await this.contextReadings(userId, pack, ids);
    const purposeRevisionId = input.purposeRevisionId?.trim() || null;
    const linkKind = input.linkKind?.trim() || null;
    await this.assertDirection(userId, purposeRevisionId, linkKind);
    const payload: ProposalPayload = {
      templateId: null,
      version: pack.version,
      templateSnapshot: null,
      general: true,
      minimum: false,
      horizonWeeks: 3,
      focusText: null,
      stageDefinition: null,
      readings: [],
      consulted: [],
      load: null,
      environmentAccepted: false,
      design: emptyDesign({ goal, contextReadingIds: ids }),
    };
    const planId = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.personalPlan.create({
        data: {
          userId,
          title: change,
          outcome: change,
          status: 'DRAFT',
          stage: 'PREPARING',
          entry: ids.length ? 'GOAL' : 'NO_DIRECTION',
          territory: pack.territory,
          ...(why ? { whyItMatters: why, whyStatus: 'CONFIRMED' } : {}),
          ...(linkKind ? { linkKind } : {}),
          ...(purposeRevisionId ? { purposeRevisionId } : {}),
        },
      });
      await tx.planProposal.create({
        data: {
          userId,
          planId: plan.id,
          territory: pack.territory,
          kind: PROPOSAL_KIND,
          payload: asJson(payload),
          reasons: asJson([]),
          status: 'ACCEPTED',
          decidedAt: new Date(),
          engineVersion: payload.design!.version,
          rulesVersion: pack.version,
          commandKey: input.commandKey ?? null,
        },
      });
      return plan.id;
    });
    return this.designView(userId, territory, planId);
  }

  /** Reads the design of a plan in this territory. Older drafts are read as a design without rewriting them. */
  private async designTarget(userId: string, pack: Pack, planId: string) {
    const plan = await this.prisma.personalPlan.findFirst({
      where: { id: planId, userId },
      include: { actions: { where: { active: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
    });
    if (!plan || (plan.territory && plan.territory !== pack.territory)) throw new NotFoundException('Plan no encontrado.');
    const proposal = await this.prisma.planProposal.findFirst({
      where: { userId, planId, kind: PROPOSAL_KIND },
      orderBy: { createdAt: 'desc' },
    });
    const payload = (proposal?.payload ?? null) as unknown as ProposalPayload | null;
    const stored = parseDesign(payload?.design);
    if (stored) return { plan, proposal, payload: payload!, design: stored, adopted: false };
    const contract = contractFromPlanRow(plan);
    const legacyTemplate = payload?.templateId && !payload.templateId.startsWith('OWN-')
      ? pack.templates.find((row) => row.id === payload.templateId) ?? payload.templateSnapshot
      : null;
    const design = emptyDesign({ contextReadingIds: (payload?.readings ?? []).map((row) => row.id) });
    design.mode = contract ? contract.current.mode : null;
    design.resultSaved = Boolean(proposal && plan.outcomeContract);
    design.loadConfirmed = Boolean(payload?.load?.confirmed);
    if (legacyTemplate && payload) {
      design.strategy = { kind: 'CATALOG', templateId: legacyTemplate.id, focusText: payload.focusText, stageDefinition: payload.stageDefinition };
      design.actions = seedFromTemplate(legacyTemplate, 1).map((row): DesignAction => (payload.load && row.schedule.kind === 'WEEKLY'
        ? {
          ...row,
          schedule: { kind: 'WEEKLY', occasionsPerWeek: payload.load.occasionsPerWeek ?? row.schedule.occasionsPerWeek, minutesPerOccasion: payload.load.minutesPerOccasion },
          source: { kind: 'TEMPLATE', templateId: legacyTemplate.id, usesMinimum: payload.minimum },
        }
        : row));
    } else if (plan.actions.length) {
      design.strategy = { kind: 'OWN', pattern: 'FREE', title: payload?.templateSnapshot?.title ?? 'Estrategia propia', approach: null };
      design.actions = plan.actions.slice(0, 6).map((row, index): DesignAction => ({
        key: `a${index + 1}`,
        title: row.title,
        doneWhen: row.doneWhen,
        cue: row.cue,
        minimum: row.minimumVersion,
        schedule: { kind: 'WEEKLY', occasionsPerWeek: row.occasionsPerWeek ?? 1, minutesPerOccasion: row.minutesPerOccasion ?? 15 },
        contentTags: parseContentTags(row.contentTags) ?? [],
        source: { kind: 'MEMBER' },
        basis: 1,
      }));
    }
    return {
      plan,
      proposal,
      payload: payload ?? {
        templateId: null,
        version: pack.version,
        templateSnapshot: null,
        general: true,
        minimum: false,
        horizonWeeks: 3,
        focusText: null,
        stageDefinition: null,
        readings: [],
        consulted: [],
        load: null,
        environmentAccepted: false,
      },
      design,
      adopted: true,
    };
  }

  private async saveDesign(
    userId: string,
    pack: Pack,
    target: Awaited<ReturnType<InterventionService['designTarget']>>,
    payload: ProposalPayload,
    plan: Prisma.PersonalPlanUpdateInput,
  ) {
    const strategy = payload.design?.strategy;
    const templateRef = strategy?.kind === 'CATALOG' && payload.templateSnapshot ? `${payload.templateSnapshot.id}@${payload.templateSnapshot.version}` : null;
    await this.prisma.$transaction(async (tx) => {
      if (target.proposal) {
        await tx.planProposal.update({ where: { id: target.proposal.id }, data: { payload: asJson(payload), templateRef } });
      } else {
        await tx.planProposal.create({
          data: {
            userId,
            planId: target.plan.id,
            territory: pack.territory,
            kind: PROPOSAL_KIND,
            payload: asJson(payload),
            reasons: asJson([]),
            status: 'ACCEPTED',
            decidedAt: new Date(),
            engineVersion: payload.design!.version,
            rulesVersion: pack.version,
            templateRef,
          },
        });
      }
      await tx.personalPlan.update({
        where: { id: target.plan.id },
        data: { ...plan, territory: pack.territory, version: { increment: 1 } },
      });
    });
  }

  private financeRestrictions(actions: DesignAction[]) {
    const neutral = { illness: 'NO', injuryHistory: 'NO', injuryLimitsNow: false, medication: 'NO', pain: 'NO', medicalLimit: 'NO', conversationUnsafe: false } as const;
    return actions.flatMap((row) => {
      const tags = row.contentTags.filter((tag) => tag === 'INVESTMENT' || tag === 'DEBT');
      if (!tags.length) return [];
      const decision = decideAction(tags, neutral);
      return decision.allowed ? [] : [{ actionKey: row.key, reason: decision.reason ?? '', alternatives: decision.alternatives }];
    });
  }

  async designView(userId: string, territory: string, planId: string) {
    const pack = this.pack(territory);
    const target = await this.designTarget(userId, pack, planId);
    const { plan, payload, design } = target;
    const contract = design.resultSaved ? contractFromPlanRow(plan)?.current ?? null : null;
    const strategy = design.strategy;
    const template = strategy?.kind === 'CATALOG' ? pack.templates.find((row) => row.id === strategy.templateId) ?? null : null;
    const context = await this.designContext(userId, territory, plan.id);
    const used = context.readings.filter((row) => design.contextReadingIds.includes(row.id) && isOriented(row));
    const missing = designReadiness({
      change: plan.title,
      mode: design.mode,
      soughtOutcome: contract?.soughtOutcome ?? '',
      criterion: contract?.criterion ?? '',
      design,
      template,
      protectNote: plan.protectNote,
      horizonWeeks: payload.horizonWeeks,
    });
    const restricted = this.financeRestrictions(design.actions);
    for (const row of restricted) missing.push({ step: 4, code: 'RESTRICTED', message: row.reason, actionKey: row.actionKey });
    const tags = new Set(design.actions.flatMap((row) => [
      ...row.contentTags,
      ...(row.source.kind === 'TEMPLATE' ? (template?.contentTags ?? []) : []),
    ]));
    const draftDirection = plan.purposeRevisionId
      ? await this.prisma.purposeRevision.findFirst({ where: { id: plan.purposeRevisionId, userId } })
      : null;
    return {
      planId: plan.id,
      territory: pack.territory,
      stage: plan.stage ?? 'PREPARING',
      version: plan.version,
      adopted: target.adopted,
      minimum: payload.minimum,
      directionAtDraft: draftDirection ? {
        purposeRevisionId: draftDirection.id,
        revision: draftDirection.revision,
        statement: readDirectionFields(draftDirection.content).statement,
      } : null,
      change: {
        text: plan.title,
        why: plan.whyItMatters,
        goal: design.goal,
        contextReadingIds: design.contextReadingIds,
        purposeRevisionId: plan.purposeRevisionId,
        linkKind: plan.linkKind,
      },
      result: {
        saved: design.resultSaved,
        mode: design.mode,
        soughtOutcome: contract?.soughtOutcome ?? null,
        criterion: contract?.criterion ?? null,
        evidenceHint: contract?.evidenceHint ?? null,
        horizonWeeks: payload.horizonWeeks,
      },
      strategy: design.strategy,
      template,
      actions: design.actions,
      obstacles: design.obstacles,
      resources: design.resources,
      protectNote: plan.protectNote,
      loadConfirmed: design.loadConfirmed,
      environmentAccepted: payload.environmentAccepted,
      load: designLoad(design.actions, payload.horizonWeeks),
      stale: design.actions.some((row) => row.basis < design.objectiveRevision),
      readiness: { ready: missing.length === 0, missing },
      resumeStep: designResumeStep(missing),
      recommendations: recommendStrategies({
        pack,
        goal: design.goal,
        readings: used,
        mode: design.mode,
        prior: context.priorPlans.filter((row) => row.templateId).map((row) => ({ templateId: row.templateId!, title: row.title })),
      }),
      safety: {
        health: HEALTH_MARKS.some((tag) => tags.has(tag)),
        conversation: tags.has('CONFRONTATION'),
        restricted,
      },
      context,
    };
  }

  async patchDesign(userId: string, territory: string, planId: string, input: Record<string, unknown>) {
    const pack = this.pack(territory);
    const target = await this.designTarget(userId, pack, planId);
    const { plan } = target;
    if ((plan.stage ?? 'PREPARING') !== 'PREPARING') {
      throw new ConflictException({
        message: 'Este plan ya no está en preparación. Los cambios de un plan activo se hacen en la revisión de la semana.',
        code: 'NOT_PREPARING',
      });
    }
    const design: PlanDesign = { ...target.design };
    const payload: ProposalPayload = { ...target.payload, design };
    const planData: Prisma.PersonalPlanUpdateInput = {};
    const section = input.section;
    try {
      if (section === 'change') await this.patchChange(userId, pack, target, design, planData, input);
      else if (section === 'result') this.patchResult(target, design, payload, planData, input);
      else if (section === 'strategy') await this.patchStrategy(userId, pack, design, payload, input);
      else if (section === 'actions') this.patchActions(design, payload, planData, input);
      else throw new BadRequestException('Sección desconocida.');
    } catch (err) {
      designBadRequest(err);
    }
    await this.saveDesign(userId, pack, target, payload, planData);
    return this.designView(userId, territory, planId);
  }

  /** Only actions the member edited can be invalidated by a new objective. Untouched seeds carry no work of theirs. */
  private bumpObjective(design: PlanDesign) {
    if (design.actionsTouched) design.objectiveRevision += 1;
  }

  private async patchChange(
    userId: string,
    pack: Pack,
    target: Awaited<ReturnType<InterventionService['designTarget']>>,
    design: PlanDesign,
    planData: Prisma.PersonalPlanUpdateInput,
    input: Record<string, unknown>,
  ) {
    const change = typeof input.change === 'string' ? input.change.trim() : '';
    if (!change) throw new BadRequestException('Escribe qué te gustaría cambiar.');
    if (change.length > 180) throw new BadRequestException('El cambio admite hasta 180 caracteres.');
    const why = typeof input.why === 'string' ? input.why.trim() || null : null;
    if (why && why.length > 1000) throw new BadRequestException('El motivo admite hasta 1000 caracteres.');
    const ids = Array.isArray(input.contextReadingIds) ? [...new Set(input.contextReadingIds.filter((id): id is string => typeof id === 'string'))] : design.contextReadingIds;
    await this.contextReadings(userId, pack, ids);
    const purposeRevisionId = typeof input.purposeRevisionId === 'string' ? input.purposeRevisionId.trim() || null : null;
    const linkKind = typeof input.linkKind === 'string' ? input.linkKind.trim() || null : null;
    await this.assertDirection(userId, purposeRevisionId, linkKind);
    if (change !== target.plan.title) this.bumpObjective(design);
    design.goal = pack.goals.some((row) => row.id === input.goal) ? input.goal as string : null;
    design.contextReadingIds = ids;
    Object.assign(planData, {
      title: change,
      whyItMatters: why,
      whyStatus: why ? 'CONFIRMED' : null,
      purposeRevisionId,
      linkKind,
      entry: ids.length ? 'GOAL' : 'NO_DIRECTION',
    });
    if (!design.resultSaved) planData.outcome = change;
    const store = design.resultSaved ? contractFromPlanRow(target.plan) : null;
    if (store) {
      planData.outcomeContract = asJson({
        current: buildOutcomeContract({ ...store.current, change, why, purposeRevisionId, linkKind }),
        history: store.history,
      });
    }
  }

  private patchResult(
    target: Awaited<ReturnType<InterventionService['designTarget']>>,
    design: PlanDesign,
    payload: ProposalPayload,
    planData: Prisma.PersonalPlanUpdateInput,
    input: Record<string, unknown>,
  ) {
    const mode: ResultMode = input.mode === 'EXPLORATION' ? 'EXPLORATION' : input.mode === 'RESULT' ? 'RESULT' : (() => {
      throw new BadRequestException('Elige si buscas un resultado o quieres explorar.');
    })();
    const sought = typeof input.soughtOutcome === 'string' ? input.soughtOutcome.trim() : '';
    const criterion = typeof input.criterion === 'string' ? input.criterion.trim() : '';
    const evidenceHint = typeof input.evidenceHint === 'string' ? input.evidenceHint.trim() || null : null;
    if (!sought) throw new BadRequestException(mode === 'RESULT' ? 'Escribe qué resultado buscas en este ciclo.' : 'Escribe qué quieres explorar.');
    if (!criterion) throw new BadRequestException(mode === 'RESULT' ? 'Escribe cómo vas a reconocer que ocurrió.' : 'Escribe qué te gustaría saber al final.');
    if (sought.length > 500 || criterion.length > 500 || (evidenceHint?.length ?? 0) > 500) {
      throw new BadRequestException('Cada respuesta admite hasta 500 caracteres.');
    }
    const horizonWeeks = wholeNumber(input.horizonWeeks, 'El ciclo en semanas', 1, 12);
    const prior = design.resultSaved ? contractFromPlanRow(target.plan)?.current ?? null : null;
    if (prior && (prior.mode !== mode || prior.soughtOutcome !== sought || prior.criterion !== criterion)) this.bumpObjective(design);
    const contract = buildOutcomeContract({
      mode,
      change: target.plan.title,
      why: target.plan.whyItMatters,
      soughtOutcome: sought,
      criterion,
      criterionStatus: mode === 'RESULT' ? 'CONFIRMED' : 'PROVISIONAL',
      evidenceHint,
      purposeRevisionId: target.plan.purposeRevisionId,
      linkKind: target.plan.linkKind,
    });
    design.mode = mode;
    design.resultSaved = true;
    design.actions = clampToHorizon(design.actions, horizonWeeks);
    payload.horizonWeeks = horizonWeeks;
    Object.assign(planData, {
      outcome: sought,
      criterionText: criterion,
      criterionStatus: contract.criterionStatus,
      outcomeContract: asJson({ current: contract, history: [] }),
    });
  }

  private async patchStrategy(
    userId: string,
    pack: Pack,
    design: PlanDesign,
    payload: ProposalPayload,
    input: Record<string, unknown>,
  ) {
    const raw = (input.strategy && typeof input.strategy === 'object' ? input.strategy : {}) as Record<string, unknown>;
    let next: DesignStrategy;
    let seeds: DesignAction[];
    if (raw.kind === 'CATALOG') {
      const template = pack.templates.find((row) => row.id === raw.templateId);
      if (!template) throw new BadRequestException('Esa estrategia no existe en este ámbito.');
      const focusText = typeof raw.focusText === 'string' ? raw.focusText.trim() || null : null;
      const stageDefinition = typeof raw.stageDefinition === 'string' ? raw.stageDefinition.trim() || null : null;
      if ((focusText?.length ?? 0) > 140 || (stageDefinition?.length ?? 0) > 500) throw new BadRequestException('La respuesta es demasiado larga.');
      next = { kind: 'CATALOG', templateId: template.id, focusText, stageDefinition };
      seeds = seedFromTemplate(template, design.objectiveRevision);
      const readings = await this.contextReadings(userId, pack, design.contextReadingIds);
      const used = readings.filter((row) => row.plans.includes(template.id));
      payload.templateId = template.id;
      payload.templateSnapshot = template;
      payload.focusText = focusText;
      payload.stageDefinition = stageDefinition;
      payload.readings = used.map((row) => ({ id: row.id, outcome: row.recognition as Recognition, signature: row.signature, declared: row.declared }));
      payload.consulted = readings.filter((row) => !used.includes(row)).map((row) => ({ id: row.id, declared: row.declared }));
      payload.general = used.length === 0;
    } else if (raw.kind === 'OWN') {
      const pattern = WORK_PATTERNS.find((row) => row.id === raw.pattern)?.id;
      if (!pattern) throw new BadRequestException('Elige cómo quieres trabajarlo.');
      const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 120) : '';
      const approach = typeof raw.approach === 'string' ? raw.approach.trim() || null : null;
      if ((approach?.length ?? 0) > 500) throw new BadRequestException('La descripción admite hasta 500 caracteres.');
      next = { kind: 'OWN', pattern, title: title || WORK_PATTERNS.find((row) => row.id === pattern)!.label, approach };
      seeds = seedFromPattern(pattern as WorkPattern, { horizonWeeks: payload.horizonWeeks, territory: pack.territory, basis: design.objectiveRevision });
      payload.templateId = null;
      payload.templateSnapshot = null;
      payload.focusText = null;
      payload.stageDefinition = null;
      const readings = await this.contextReadings(userId, pack, design.contextReadingIds);
      payload.readings = [];
      payload.consulted = readings.map((row) => ({ id: row.id, declared: row.declared }));
      payload.general = true;
    } else {
      throw new BadRequestException('Elige una estrategia o diseña la tuya.');
    }
    const current = design.strategy;
    const sameIdentity = current?.kind === next.kind
      && (current.kind === 'CATALOG' ? current.templateId === (next as { templateId: string }).templateId : current.pattern === (next as { pattern: string }).pattern);
    design.strategy = next;
    if (sameIdentity && design.actions.length) return;
    const resolution = input.actionsResolution;
    if (!design.actions.length || !design.actionsTouched || resolution === 'REPLACE') {
      design.actions = seeds;
      design.actionsTouched = false;
    } else if (resolution === 'ADD') {
      const added = raw.kind === 'CATALOG'
        ? seedFromTemplate(pack.templates.find((row) => row.id === raw.templateId)!, design.objectiveRevision, design.actions)
        : seedFromPattern(next.kind === 'OWN' ? next.pattern : 'FREE', { horizonWeeks: payload.horizonWeeks, territory: pack.territory, basis: design.objectiveRevision, existing: design.actions });
      if (design.actions.length + added.length > 6) throw new BadRequestException('Sumar estas acciones supera las seis que admite un plan. Elige conservar o reemplazar.');
      design.actions = [...design.actions, ...added];
    } else if (resolution !== 'KEEP') {
      throw new ConflictException({
        message: `Ya ajustaste las acciones de este plan. Elige si las conservas, las reemplazas por las de la nueva estrategia o sumas ambas.`,
        code: 'ACTIONS_EDITED',
        count: design.actions.length,
      });
    }
    design.loadConfirmed = false;
  }

  private patchActions(design: PlanDesign, payload: ProposalPayload, planData: Prisma.PersonalPlanUpdateInput, input: Record<string, unknown>) {
    const actions = parseDesignActions(input.actions, {
      horizonWeeks: payload.horizonWeeks,
      basis: design.objectiveRevision,
      prior: design.actions,
      acknowledge: input.acknowledgeObjective === true,
    });
    const content = (rows: DesignAction[]) => JSON.stringify(rows.map(({ basis: _basis, ...row }) => row));
    if (content(actions) !== content(design.actions)) design.actionsTouched = true;
    design.actions = actions;
    design.obstacles = parseObstacles(input.obstacles);
    const resources = typeof input.resources === 'string' ? input.resources.trim() || null : null;
    if ((resources?.length ?? 0) > 500) throw new BadRequestException('Los recursos admiten hasta 500 caracteres.');
    design.resources = resources;
    design.loadConfirmed = input.loadConfirmed === true;
    const protect = typeof input.protectNote === 'string' ? input.protectNote.trim() || null : null;
    if ((protect?.length ?? 0) > 500) throw new BadRequestException('Lo que necesitas cuidar admite hasta 500 caracteres.');
    planData.protectNote = protect;
    payload.environmentAccepted = input.environmentAccepted === true;
    const templateId = design.strategy?.kind === 'CATALOG' ? design.strategy.templateId : null;
    payload.minimum = actions.some((row) => row.source.kind === 'TEMPLATE' && row.source.templateId === templateId && row.source.usesMinimum);
    payload.load = actions.length ? { ...compatLoad(actions, payload.horizonWeeks), confirmed: design.loadConfirmed } : null;
    planData.capacityMinutes = actions.length ? designLoad(actions, payload.horizonWeeks).maxWeekly : null;
  }

  async createPlan(userId: string, territory: string, input: {
    templateId?: string;
    readingIds?: string[];
    focusText?: string | null;
    stageDefinition?: string | null;
    commandKey?: string;
    change?: string | null;
    why?: string | null;
    observableResult?: string | null;
    linkKind?: string | null;
    purposeRevisionId?: string | null;
    criterion?: string | null;
    criterionStatus?: 'PROVISIONAL' | 'CONFIRMED' | null;
    evidenceHint?: string | null;
    checkAt?: string | null;
    linkedIndicatorRef?: string | null;
    consultedReadingIds?: string[];
  }) {
    const pack = this.pack(territory);
    const template = pack.templates.find((row) => row.id === input.templateId);
    if (!template) throw new BadRequestException('Ese punto de partida no existe.');
    if (input.commandKey) {
      const prior = await this.prisma.planProposal.findUnique({ where: { userId_commandKey: { userId, commandKey: input.commandKey } } });
      if (prior?.planId) {
        const plan = await this.prisma.personalPlan.findFirst({ where: { id: prior.planId, userId } });
        if (plan) return { plan, repeated: true };
      }
    }
    const focusText = input.focusText?.trim() || null;
    const stageDefinition = input.stageDefinition?.trim() || null;
    if (template.focusPrompt && !focusText) throw new BadRequestException(`${template.focusPrompt} Escríbelo en una línea.`);
    if (template.stagePrompt && !stageDefinition) throw new BadRequestException(template.stagePrompt);
    const { readings } = await this.current(userId, pack);
    const used = (input.readingIds ?? []).map((id) => {
      const reading = readings.find((row) => row.id === id);
      if (!reading || !isOriented(reading)) throw new BadRequestException('Solo se usan lecturas que reconociste.');
      if (!reading.plans.includes(template.id)) throw new BadRequestException('Esa lectura no orienta este plan.');
      return { id: reading.id, outcome: reading.recognition as Recognition, signature: reading.signature, declared: reading.declared };
    });
    const consulted = (input.consultedReadingIds ?? [])
      .filter((id) => !used.some((row) => row.id === id))
      .map((id) => {
        const reading = readings.find((row) => row.id === id);
        if (!reading || reading.declared.length === 0) return null;
        return { id: reading.id, declared: reading.declared };
      })
      .filter((row): row is { id: string; declared: string[] } => row != null);
    const payload: ProposalPayload = {
      templateId: template.id,
      version: template.version,
      templateSnapshot: template,
      general: used.length === 0,
      minimum: false,
      horizonWeeks: template.horizonWeeks,
      focusText,
      stageDefinition,
      readings: used,
      consulted,
      load: null,
      environmentAccepted: false,
    };
    const changeText = input.change?.trim() || null;
    const whyText = input.why?.trim() || null;
    const observable = input.observableResult?.trim() || null;
    let purposeRevisionId = input.purposeRevisionId?.trim() || null;
    if (purposeRevisionId) {
      const owned = await this.prisma.purposeRevision.findFirst({ where: { id: purposeRevisionId, userId } });
      if (!owned) throw new BadRequestException('La dirección indicada no existe.');
    }
    let linkKind = input.linkKind?.trim() || null;
    if (linkKind && !PLAN_LINKS.includes(linkKind)) throw new BadRequestException('Vínculo con la dirección no válido.');
    const legacyTitle = focusText ? `${template.title}: ${focusText}` : template.title;
    const title = (changeText || legacyTitle).slice(0, 180);
    const outcome = observable ?? template.seeks;
    const criterionInput = input.criterion?.trim() || stageDefinition || '';
    const criterionStatus = input.criterionStatus === 'PROVISIONAL' || (!input.criterion && stageDefinition)
      ? 'PROVISIONAL'
      : criterionInput
        ? 'CONFIRMED'
        : null;
    const resultIndicator = activeIndicators(template, false).find((row) => row.role === 'RESULT') ?? null;
    const linkedRef = input.linkedIndicatorRef?.trim()
      || suggestIndicatorLink(criterionInput || outcome, resultIndicator)
      || null;
    const outcomeStore: PlanOutcomeContractStore = {
      current: buildOutcomeContract({
        change: title,
        why: whyText,
        soughtOutcome: outcome,
        criterion: criterionInput || `Reconozco el resultado cuando: ${outcome}`,
        criterionStatus: criterionStatus === 'PROVISIONAL' ? 'PROVISIONAL' : 'CONFIRMED',
        checkAt: input.checkAt?.trim() || null,
        evidenceHint: input.evidenceHint?.trim() || null,
        linkedIndicatorRef: linkedRef,
        purposeRevisionId,
        linkKind,
      }),
      history: [],
    };
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.personalPlan.create({
        data: {
          userId,
          title,
          outcome,
          status: 'DRAFT',
          stage: 'PREPARING',
          entry: used.length ? 'GOAL' : 'NO_DIRECTION',
          territory: pack.territory,
          criterionText: criterionInput || outcomeStore.current.criterion,
          criterionStatus: criterionStatus ?? 'PROVISIONAL',
          outcomeContract: asJson(outcomeStore),
          ...(whyText ? { whyItMatters: whyText, whyStatus: 'CONFIRMED' } : {}),
          ...(linkKind ? { linkKind } : {}),
          ...(purposeRevisionId ? { purposeRevisionId } : {}),
        },
      });
      await tx.planProposal.create({
        data: {
          userId,
          planId: plan.id,
          territory: pack.territory,
          kind: PROPOSAL_KIND,
          payload: asJson(payload),
          reasons: asJson(used.map((row) => ({ readingId: row.id, declared: row.declared }))),
          status: 'ACCEPTED',
          decidedAt: new Date(),
          engineVersion: pack.version,
          rulesVersion: pack.version,
          templateRef: `${template.id}@${template.version}`,
          commandKey: input.commandKey ?? null,
        },
      });
      return { plan, repeated: false };
    });
  }

  private async proposalFor(userId: string, pack: Pack, planId: string) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId, territory: pack.territory } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    const proposal = await this.prisma.planProposal.findFirst({
      where: { userId, planId, kind: PROPOSAL_KIND, territory: pack.territory },
      orderBy: { createdAt: 'desc' },
    });
    if (!proposal) throw new NotFoundException('Este plan no viene de una plantilla de este ámbito.');
    const payload = proposal.payload as unknown as ProposalPayload;
    const template = payload.templateSnapshot ?? pack.templates.find((row) => row.id === payload.templateId) ?? null;
    if (!template) throw new NotFoundException('La plantilla de este plan ya no existe.');
    return { plan, proposal, payload, template };
  }

  private async assertReviewCommandKey(userId: string, commandKey: string | undefined, digest: string) {
    if (!commandKey) return;
    const prior = await this.prisma.planProposal.findFirst({ where: { userId, commandKey } });
    if (!prior) return;
    const reasons = prior.reasons as unknown;
    const stored = reasons && typeof reasons === 'object' && !Array.isArray(reasons) && 'digest' in reasons
      ? String((reasons as { digest: string }).digest)
      : JSON.stringify(prior.reasons);
    if (stored !== digest) {
      throw new ConflictException({ message: 'Esa clave ya se usó con otra decisión.', code: 'STALE_REVIEW' });
    }
  }

  async adjustPlan(userId: string, territory: string, planId: string, input: {
    minimum?: boolean;
    horizonWeeks?: number;
    weeklyMinutes?: number;
    occasionsPerWeek?: number | null;
    minutesPerOccasion?: number;
    protectNote?: string | null;
    environmentAccepted?: boolean;
  }) {
    const pack = this.pack(territory);
    const { plan, proposal, payload, template } = await this.proposalFor(userId, pack, planId);
    if (plan.stage && plan.stage !== 'PREPARING') throw new ConflictException('El plan ya no está en preparación.');
    const horizonWeeks = input.horizonWeeks === undefined ? payload.horizonWeeks : wholeNumber(input.horizonWeeks, 'El horizonte en semanas', 1, 12);
    const weeklyMinutes = wholeNumber(input.weeklyMinutes, 'Los minutos semanales', 0, 1680);
    const minutesPerOccasion = wholeNumber(input.minutesPerOccasion, 'Los minutos por ocasión', 1, 600, 'Ingresa una duración de 1 a 600 minutos por vez, sin decimales.');
    const occasionsPerWeek = template.schedule.kind === 'TRIGGER' ? null : wholeNumber(input.occasionsPerWeek, 'La frecuencia', 1, 21, 'Ingresa un número entero entre 1 y 21 veces por semana.');
    if (occasionsPerWeek != null && occasionsPerWeek * minutesPerOccasion > weeklyMinutes) {
      throw new BadRequestException('Las ocasiones por su duración superan los minutos semanales. Ajusta uno de los tres.');
    }
    const next: ProposalPayload = {
      ...payload,
      minimum: Boolean(input.minimum),
      horizonWeeks,
      load: { weeklyMinutes, occasionsPerWeek, minutesPerOccasion, confirmed: true },
      environmentAccepted: Boolean(input.environmentAccepted),
    };
    await this.prisma.planProposal.update({ where: { id: proposal.id }, data: { payload: asJson(next) } });
    await this.prisma.personalPlan.update({
      where: { id: plan.id },
      data: {
        capacityMinutes: weeklyMinutes,
        protectNote: input.protectNote?.trim() || null,
        version: { increment: 1 },
      },
    });
    return this.planView(userId, territory, planId);
  }

  async upsertOwnContract(userId: string, territory: string, planId: string, input: {
    seeks: string;
    action: string;
    doneWhen: string;
    indicatorQuestion: string;
    horizonWeeks?: number;
  }) {
    const pack = this.pack(territory);
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId, territory: pack.territory } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    const stage = plan.stage ?? 'PREPARING';
    if (stage !== 'PREPARING') {
      throw new ConflictException('El contrato propio se confirma mientras el plan está en preparación.');
    }
    const horizonWeeks = wholeNumber(input.horizonWeeks ?? 3, 'El horizonte en semanas', 1, 12);
    const snapshot: Template = {
      id: `OWN-${plan.id.slice(0, 8)}`,
      version: pack.version,
      group: 'OWN',
      goal: 'propio',
      title: plan.title,
      seeks: input.seeks.trim(),
      action: input.action.trim(),
      schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 15 },
      minimum: { text: input.action.trim(), occasionsPerWeek: 1, minutesPerOccasion: 5 },
      doneWhen: input.doneWhen.trim(),
      indicators: [{
        ref: `ind-own-${plan.id.slice(0, 8)}@0.1`,
        role: 'RESULT',
        question: input.indicatorQuestion.trim(),
        kind: 'TEXT',
        better: 'NONE',
      }],
      horizonWeeks,
      notes: [],
    };
    const payload: ProposalPayload = {
      templateId: snapshot.id,
      version: snapshot.version,
      templateSnapshot: snapshot,
      general: false,
      minimum: false,
      horizonWeeks,
      focusText: null,
      stageDefinition: null,
      readings: [],
      load: null,
      environmentAccepted: false,
    };
    const existing = await this.prisma.planProposal.findFirst({
      where: { userId, planId, kind: PROPOSAL_KIND, territory: pack.territory },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      const prior = existing.payload as unknown as ProposalPayload;
      const originTemplateId = !prior.templateId || prior.templateId.startsWith('OWN-')
        ? prior.originTemplateId ?? null
        : prior.templateId;
      await this.prisma.planProposal.update({
        where: { id: existing.id },
        data: {
          payload: asJson({
            ...prior,
            templateId: snapshot.id,
            templateSnapshot: snapshot,
            horizonWeeks,
            general: false,
            originTemplateId,
          }),
          templateRef: `${snapshot.id}@${snapshot.version}`,
        },
      });
    } else {
      await this.prisma.planProposal.create({
        data: {
          userId,
          planId,
          territory: pack.territory,
          kind: PROPOSAL_KIND,
          payload: asJson(payload),
          reasons: asJson([]),
          status: 'ACCEPTED',
          decidedAt: new Date(),
          engineVersion: pack.version,
          rulesVersion: pack.version,
          templateRef: `${snapshot.id}@${snapshot.version}`,
        },
      });
    }
    return this.planView(userId, territory, planId);
  }

  async activatePlan(userId: string, territory: string, planId: string, input: {
    confirmed?: boolean;
    commandKey?: string;
    minimumLoadConfirmed?: boolean;
    reviewAt?: string | null;
    purposeRevisionId?: string | null;
    keepDraftPurposeRevision?: boolean;
    healthLimit?: string | null;
    conversation?: string | null;
  }) {
    const pack = this.pack(territory);
    const designed = await this.designTarget(userId, pack, planId).catch(() => null);
    if (designed && !designed.adopted) return this.activateDesign(userId, pack, designed, input);
    const { plan, proposal, payload, template: storedTemplate } = await this.proposalFor(userId, pack, planId);
    const template = storedTemplate!;
    if (input.commandKey) {
      const prior = await this.prisma.planTransition.findFirst({
        where: { userId, planId, metadata: { path: ['commandKey'], equals: input.commandKey } },
      });
      if (prior) {
        const active = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
        if (active) return { plan: active, repeated: true };
      }
    }
    if (!payload.load?.confirmed) throw new BadRequestException('Primero confirma la carga en tu semana.');
    if (!input.confirmed) throw new BadRequestException('Confirma que quieres activar este plan.');
    const protect = plan.protectNote?.trim() ?? '';
    const needsMinimumConfirm = payload.minimum && protect && protect !== DEFAULT_PROTECT;
    if (needsMinimumConfirm && !input.minimumLoadConfirmed) {
      throw new UnprocessableEntityException({
        message: 'Con la versión mínima y algo que cuidar, confirma aparte que la carga no lo contradice.',
        code: 'MINIMUM_PROTECT_CONFIRM',
      });
    }
    const restrictions = await this.prisma.memberClarification.findFirst({
      where: {
        userId,
        OR: [
          { scope: 'CURRENT_SITUATION' },
          { scope: 'HEALTH', outcome: { in: ['NO_CURRENT_LIMIT', 'CURRENT_LIMIT'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    const restrictionsAnswered = Boolean(restrictions) || protect.length > 0;
    const actions = await this.prisma.planAction.findMany({ where: { planId: plan.id, active: true } });
    const activation = planActivationInput({
      plan: {
        outcome: plan.outcome,
        capacityMinutes: plan.capacityMinutes,
        protectNote: plan.protectNote,
      },
      activeActionCount: actions.length || 1,
      restrictionsAnswered,
      patch: { confirmed: true, capacityMinutes: payload.load!.weeklyMinutes, protectNote: plan.protectNote },
    });
    const missing = activationBlock(activation);
    if (missing.length) {
      throw new UnprocessableEntityException({ message: 'Todavía falta completar información antes de activar tu plan.', code: 'ACTIVATION_INCOMPLETE', missing });
    }
    const templateTags = parseContentTags((template as { contentTags?: unknown }).contentTags);
    if (templateTags?.length) {
      await this.journey.assertMemberContentTags(userId, templateTags, { healthLimit: input.healthLimit });
    }
    const today = this.clock.today();
    const reviewDay = input.reviewAt?.trim() || addIsoDays(today, payload.horizonWeeks * 7);
    const trigger = template.schedule.kind === 'TRIGGER';
    let purposeRevisionId = plan.purposeRevisionId;
    if (input.purposeRevisionId?.trim()) {
      const owned = await this.prisma.purposeRevision.findFirst({ where: { id: input.purposeRevisionId.trim(), userId } });
      if (!owned) throw new BadRequestException('La dirección indicada no existe.');
      purposeRevisionId = owned.id;
    } else if (input.keepDraftPurposeRevision === false) {
      purposeRevisionId = null;
    }
    const store = contractFromPlanRow(plan) ?? {
      current: buildOutcomeContract({
        change: plan.title,
        why: plan.whyItMatters,
        soughtOutcome: plan.outcome,
        criterion: plan.criterionText ?? plan.outcome,
        purposeRevisionId,
        linkKind: plan.linkKind,
      }),
      history: [],
    };
    const activatedContract = buildOutcomeContract({
      ...store.current,
      checkAt: reviewDay,
      purposeRevisionId,
      linkKind: plan.linkKind,
      effectiveFrom: today,
    });
    const outcomeStore: PlanOutcomeContractStore = { current: activatedContract, history: store.history };
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      let actionCount = actions.length;
      if (actionCount === 0) {
        await tx.planAction.create({
          data: {
            planId: plan.id,
            title: template.action.slice(0, 180),
            doneWhen: template.doneWhen,
            occasionsPerWeek: trigger ? null : payload.load!.occasionsPerWeek,
            minutesPerOccasion: payload.load!.minutesPerOccasion,
            origin: 'SYSTEM_TEMPLATE',
            familyId: template.id.startsWith('OWN-') ? null : template.id,
            templateVersion: template.version,
            minimumVersion: template.minimum.text,
            effectiveFrom: today,
            contentTags: templateTags ?? [],
          },
        });
        actionCount = 1;
      }
      const updated = await tx.personalPlan.update({
        where: { id: plan.id },
        data: {
          status: 'ACTIVE',
          stage: 'ACTIVE',
          activatedAt: journeyNow(this.clock),
          capacityMinutes: payload.load!.weeklyMinutes,
          reviewAt: new Date(`${reviewDay}T12:00:00.000Z`),
          outcomeContract: asJson(outcomeStore),
          criterionText: activatedContract.criterion,
          criterionStatus: activatedContract.criterionStatus,
          ...(purposeRevisionId !== plan.purposeRevisionId ? { purposeRevisionId } : {}),
          version: { increment: 1 },
        },
      });
      await tx.planTransition.create({
        data: {
          userId,
          planId: plan.id,
          fromStage: plan.stage ?? 'PREPARING',
          toStage: 'ACTIVE',
          effectiveFrom: new Date(`${today}T12:00:00.000Z`),
          metadata: input.commandKey ? { commandKey: input.commandKey } : undefined,
        },
      });
      await tx.planProposal.update({
        where: { id: proposal.id },
        data: { payload: asJson({ ...payload, templateSnapshot: template }) },
      });
      return { plan: updated, repeated: false };
    });
  }

  private async activateDesign(
    userId: string,
    pack: Pack,
    target: Awaited<ReturnType<InterventionService['designTarget']>>,
    input: {
      confirmed?: boolean;
      commandKey?: string;
      minimumLoadConfirmed?: boolean;
      purposeRevisionId?: string | null;
      keepDraftPurposeRevision?: boolean;
      healthLimit?: string | null;
      conversation?: string | null;
    },
  ) {
    const { plan, proposal, payload, design } = target;
    if (input.commandKey) {
      const prior = await this.prisma.planTransition.findFirst({
        where: { userId, planId: plan.id, metadata: { path: ['commandKey'], equals: input.commandKey } },
      });
      if (prior) {
        const active = await this.prisma.personalPlan.findFirst({ where: { id: plan.id, userId } });
        if (active) return { plan: active, repeated: true };
      }
    }
    if ((plan.stage ?? 'PREPARING') !== 'PREPARING') throw new ConflictException('Este plan ya no está en preparación.');
    if (!input.confirmed) throw new BadRequestException('Confirma que quieres activar este plan.');
    const view = await this.designView(userId, pack.territory, plan.id);
    if (!view.readiness.ready) {
      throw new UnprocessableEntityException({
        message: 'Todavía falta completar información antes de activar tu plan.',
        code: 'ACTIVATION_INCOMPLETE',
        missing: view.readiness.missing.map((row) => row.code),
        details: view.readiness.missing,
      });
    }
    const protect = plan.protectNote?.trim() ?? '';
    if (payload.minimum && protect && protect !== DEFAULT_PROTECT && !input.minimumLoadConfirmed) {
      throw new UnprocessableEntityException({
        message: 'Con la versión mínima y algo que cuidar, confirma aparte que la carga no lo contradice.',
        code: 'MINIMUM_PROTECT_CONFIRM',
      });
    }
    const contract = contractFromPlanRow(plan)!.current;
    const strategy = design.strategy!;
    const template: Template = strategy.kind === 'CATALOG'
      ? pack.templates.find((row) => row.id === strategy.templateId)!
      : ownStrategySnapshot({
        planId: plan.id,
        packVersion: pack.version,
        soughtOutcome: contract.soughtOutcome,
        strategy,
        actions: design.actions,
        horizonWeeks: payload.horizonWeeks,
      });
    const templateTags = parseContentTags(template.contentTags) ?? [];
    const tagsFor = (row: DesignAction) => [...new Set([...row.contentTags, ...(row.source.kind === 'TEMPLATE' ? templateTags : [])])];
    const allTags = [...new Set(design.actions.flatMap(tagsFor))];
    const conversation = input.conversation === 'VIABLE' || input.conversation === 'UNSAFE' ? input.conversation : undefined;
    if (allTags.length) {
      await this.journey.assertMemberContentTags(userId, allTags, { healthLimit: input.healthLimit ?? undefined, conversation });
    }
    const { readings } = await this.current(userId, pack);
    const context = design.contextReadingIds
      .map((id) => readings.find((row) => row.id === id))
      .filter((row): row is (typeof readings)[number] => Boolean(row && isOriented(row)));
    const used = strategy.kind === 'CATALOG' ? context.filter((row) => row.plans.includes(template.id)) : [];
    let purposeRevisionId = plan.purposeRevisionId;
    if (input.purposeRevisionId?.trim()) {
      const owned = await this.prisma.purposeRevision.findFirst({ where: { id: input.purposeRevisionId.trim(), userId } });
      if (!owned) throw new BadRequestException('La dirección indicada no existe.');
      purposeRevisionId = owned.id;
    } else if (input.keepDraftPurposeRevision === false) {
      purposeRevisionId = null;
    }
    const today = this.clock.today();
    const activationWeek = weekStartForDay(today);
    const reviewDay = addIsoDays(today, payload.horizonWeeks * 7);
    const activated = buildOutcomeContract({ ...contract, checkAt: reviewDay, purposeRevisionId, linkKind: plan.linkKind, effectiveFrom: today });
    const load = compatLoad(design.actions, payload.horizonWeeks);
    const nextPayload: ProposalPayload = {
      ...payload,
      templateId: template.id,
      templateSnapshot: template,
      general: used.length === 0,
      readings: used.map((row) => ({ id: row.id, outcome: row.recognition as Recognition, signature: row.signature, declared: row.declared })),
      consulted: context.filter((row) => !used.includes(row)).map((row) => ({ id: row.id, declared: row.declared })),
      load,
      design,
    };
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      for (const row of plan.actions) {
        const records = await tx.actionRecord.count({ where: { actionId: row.id } });
        if (records === 0) await tx.planAction.delete({ where: { id: row.id } });
      }
      for (const [index, row] of design.actions.entries()) {
        const fromTemplate = row.source.kind === 'TEMPLATE';
        const tags = tagsFor(row);
        const created = await tx.planAction.create({
          data: {
            planId: plan.id,
            title: row.title.slice(0, 180),
            doneWhen: row.doneWhen.slice(0, 500),
            cue: row.cue,
            position: index,
            occasionsPerWeek: row.schedule.kind === 'WEEKLY' ? row.schedule.occasionsPerWeek : null,
            minutesPerOccasion: row.schedule.minutesPerOccasion,
            origin: fromTemplate ? 'SYSTEM_TEMPLATE' : 'MEMBER',
            familyId: fromTemplate ? template.id : null,
            templateVersion: fromTemplate ? template.version : null,
            templateTags: fromTemplate ? templateTags : [],
            minimumVersion: row.minimum,
            effectiveFrom: today,
            contentTags: tags,
            conversationOutcome: tags.includes('CONFRONTATION') && conversation === 'VIABLE' ? 'VIABLE' : null,
          },
        });
        if (row.schedule.kind === 'ONCE') {
          const monday = addIsoDays(activationWeek, (row.schedule.week - 1) * 7);
          await tx.actionSchedule.create({
            data: {
              actionId: created.id,
              effectiveFrom: new Date(`${row.schedule.week === 1 ? today : monday}T12:00:00.000Z`),
              effectiveTo: new Date(`${addIsoDays(monday, 6)}T12:00:00.000Z`),
              kind: 'FLEXIBLE',
              occasionsPerWeek: 1,
              source: 'CREATE',
            },
          });
        }
      }
      const updated = await tx.personalPlan.update({
        where: { id: plan.id },
        data: {
          status: 'ACTIVE',
          stage: 'ACTIVE',
          activatedAt: journeyNow(this.clock),
          capacityMinutes: load.weeklyMinutes,
          reviewAt: new Date(`${reviewDay}T12:00:00.000Z`),
          outcomeContract: asJson({ current: activated, history: contractFromPlanRow(plan)?.history ?? [] }),
          criterionText: activated.criterion,
          criterionStatus: activated.criterionStatus,
          entry: used.length ? 'GOAL' : 'NO_DIRECTION',
          ...(purposeRevisionId !== plan.purposeRevisionId ? { purposeRevisionId } : {}),
          version: { increment: 1 },
        },
      });
      await tx.planTransition.create({
        data: {
          userId,
          planId: plan.id,
          fromStage: plan.stage ?? 'PREPARING',
          toStage: 'ACTIVE',
          effectiveFrom: new Date(`${today}T12:00:00.000Z`),
          metadata: input.commandKey ? { commandKey: input.commandKey } : undefined,
        },
      });
      await tx.planProposal.update({
        where: { id: proposal!.id },
        data: { payload: asJson(nextPayload), templateRef: `${template.id}@${template.version}` },
      });
      return { plan: updated, repeated: false };
    });
  }

  async confirmReview(userId: string, territory: string, planId: string, input: {
    choice: MemberReviewChoice;
    weekStart?: string;
    revision?: { title?: string; doneWhen?: string; occasionsPerWeek?: number | null; minutesPerOccasion?: number | null };
    alternateTemplateId?: string | null;
    note?: string | null;
    meaning?: ReviewMeaning | null;
    commandKey?: string;
    actions?: ActionChangeInput[];
    additions?: AdditionInput[];
    healthLimit?: string | null;
    conversation?: string | null;
    indicatorChoice?: 'KEEP' | 'REVIEW' | null;
  }) {
    if (input.actions !== undefined || input.additions !== undefined) return this.confirmActionReview(userId, territory, planId, input);
    const pack = this.pack(territory);
    const { plan, proposal, payload, template } = await this.proposalFor(userId, pack, planId);
    if ((plan.stage ?? '') !== 'ACTIVE' && plan.stage !== 'MAINTENANCE') {
      throw new ConflictException('La decisión de revisión aplica con el plan activo.');
    }
    const view = await this.planView(userId, territory, planId);
    const code = view.review.code;
    const allowed = view.review.choices?.length ? view.review.choices : choicesForReview(code);
    if (!allowed.includes(input.choice)) throw new BadRequestException('Esa decisión no corresponde a la propuesta actual.');
    const weekStart = input.weekStart ?? weekStartForDay(this.clock.today());
    const closed = await this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
    if (closed) throw new ConflictException({ message: 'Esa semana ya se cerró. Confirma una vista previa de ahora.', code: 'STALE_REVIEW' });
    const alternate = input.alternateTemplateId
      ? pack.templates.find((row) => row.id === input.alternateTemplateId) ?? null
      : null;
    const { decision, revision } = weekDecisionFromChoice(input.choice, {
      code,
      load: payload.load,
      template,
      revision: input.revision,
      alternateAction: alternate ? { title: alternate.action.slice(0, 180), doneWhen: alternate.doneWhen } : null,
    });
    const actions = await this.prisma.planAction.findMany({
      where: { planId: plan.id, active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    if (!actions.length) throw new BadRequestException('Este plan no tiene acciones activas.');
    const primary = actions[0]!;
    const digest = JSON.stringify({ weekStart, choice: input.choice, decision, revision, actionId: primary.id });
    await this.assertReviewCommandKey(userId, input.commandKey, digest);
    if (input.commandKey) {
      const replay = await this.prisma.planProposal.findFirst({ where: { userId, commandKey: input.commandKey } });
      if (replay) return { ...(await this.planView(userId, territory, planId)), repeated: true };
    }
    let previewSummary: string | null = null;
    try {
      const [effect] = previewWeek(
        [{
          id: primary.id,
          title: primary.title,
          doneWhen: primary.doneWhen,
          active: true,
          weekday: primary.weekday,
          intervalDays: primary.intervalDays ?? 7,
          occasionsPerWeek: primary.occasionsPerWeek,
          minutesPerOccasion: primary.minutesPerOccasion,
        }],
        { [primary.id]: decision },
        { [primary.id]: revision },
      );
      previewSummary = effect?.summary ?? null;
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'La revisión no tiene un cambio concreto.');
    }
    const pendingRow: PendingPlanReview = {
      planId: plan.id,
      territory: pack.territory,
      actionId: primary.id,
      actionDigest: digestAction({
        id: primary.id,
        title: primary.title,
        doneWhen: primary.doneWhen,
        occasionsPerWeek: primary.occasionsPerWeek,
        minutesPerOccasion: primary.minutesPerOccasion,
        active: primary.active,
      }),
      choice: input.choice,
      decision,
      revision,
      note: input.note?.trim() || null,
      commandKey: input.commandKey ?? '',
      reviewCode: code,
      savedAt: this.clock.today(),
      previewSummary,
      evidenceDigest: await this.evidenceDigestForPlan(userId, plan.id, weekStart, payload, template),
      meaning: input.meaning ?? null,
    };
    const nextPayload: ProposalPayload = withPendingReview(
      {
        ...payload,
        lastReviewChoice: input.choice,
        lastReviewAt: this.clock.today(),
        ...(decision === 'SUBSTITUTE' && alternate
          ? { templateId: alternate.id, templateSnapshot: { ...alternate }, load: payload.load }
          : {}),
      },
      weekStart,
      pendingRow,
    );
    await this.prisma.planProposal.update({
      where: { id: proposal.id },
      data: {
        payload: asJson(nextPayload),
        reasons: asJson({ digest, reviewCode: code, choice: input.choice }),
        status: 'EDITED',
        commandKey: input.commandKey ?? null,
      },
    });
    const week = await this.pendingWeekReviews(userId, weekStart);
    return {
      ...(await this.planView(userId, territory, planId)),
      repeated: false,
      weekReview: { weekStart, pendingCount: week.pending.length, previewSummary, needsWeekApply: true },
    };
  }

  /**
   * Review that decides action by action. Unmentioned actions are kept. Nothing applies until the week is applied,
   * and then only from the following Monday. The derived choice is recorded next to the proposal, not forced by it.
   */
  private async confirmActionReview(userId: string, territory: string, planId: string, input: {
    choice?: MemberReviewChoice;
    weekStart?: string;
    note?: string | null;
    meaning?: ReviewMeaning | null;
    commandKey?: string;
    actions?: ActionChangeInput[];
    additions?: AdditionInput[];
    healthLimit?: string | null;
    conversation?: string | null;
    indicatorChoice?: 'KEEP' | 'REVIEW' | null;
  }) {
    const pack = this.pack(territory);
    const { plan, proposal, payload, template } = await this.proposalFor(userId, pack, planId);
    if ((plan.stage ?? '') !== 'ACTIVE' && plan.stage !== 'MAINTENANCE') {
      throw new ConflictException('La decisión de revisión aplica con el plan activo.');
    }
    if (!Array.isArray(input.actions ?? []) || !Array.isArray(input.additions ?? [])) {
      throw new BadRequestException('Las decisiones de las acciones tienen que ser una lista.');
    }
    const weekStart = input.weekStart ?? weekStartForDay(this.clock.today());
    const closed = await this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
    if (closed) throw new ConflictException({ message: 'Esa semana ya se cerró. Confirma una vista previa de ahora.', code: 'STALE_REVIEW' });
    const view = await this.planView(userId, territory, planId, weekStart);
    const allowed = view.review.choices?.length ? view.review.choices : choicesForReview(view.review.code);
    const reviewed = await this.reviewActions(userId, plan.id, weekStart);
    const mentioned = new Set((input.actions ?? []).map((row) => row.actionId));
    const changesInput: ActionChangeInput[] = [
      ...(input.actions ?? []),
      ...reviewed.current.filter((row) => !mentioned.has(row.id)).map((row) => ({ actionId: row.id, op: 'KEEP' })),
    ];
    let result: ReturnType<typeof planActionReview>;
    try {
      result = planActionReview({
        actions: reviewed.current,
        changes: changesInput,
        additions: input.additions ?? [],
        reviewedWeek: weekStart,
        earliestWeek: reviewAppliesFrom(this.clock.today(), weekStart),
        noRecordsNote: input.choice === 'NO_RECORDS',
      });
    } catch (err) {
      if (err instanceof ReviewInputError) throw new BadRequestException(err.message);
      throw err;
    }
    const conversation = input.conversation === 'VIABLE' || input.conversation === 'UNSAFE' ? input.conversation : undefined;
    const newTags = [...new Set([...result.additions.flatMap((row) => row.contentTags), ...result.changes.flatMap((row) => row.revision.contentTags ?? [])])];
    if (newTags.length) {
      const parsed = parseContentTags(newTags);
      if (!parsed) throw new BadRequestException('Marca de contenido desconocida.');
      await this.journey.assertMemberContentTags(userId, parsed, { healthLimit: input.healthLimit ?? undefined, conversation });
    }
    const live = await this.prisma.planAction.findMany({ where: { planId: plan.id, active: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    try {
      previewWeek(live.map((row) => ({
        id: row.id,
        title: row.title,
        doneWhen: row.doneWhen,
        active: true,
        weekday: row.weekday,
        intervalDays: row.intervalDays ?? 7,
        occasionsPerWeek: row.occasionsPerWeek,
        minutesPerOccasion: row.minutesPerOccasion,
        paused: Boolean(row.pausedAt),
        preparation: row.preparation,
        cue: row.cue,
        minimumVersion: row.minimumVersion,
      })), result.decisions, result.revisions);
    } catch (err) {
      throw new BadRequestException(err instanceof Error && err.message === 'ADJUST_REQUIRES_CHANGE'
        ? 'Uno de los ajustes no cambia nada. Revísalo o elige mantener esa acción.'
        : 'La revisión no tiene un cambio concreto.');
    }
    const templateActionIds = new Set(live.filter((row) => row.origin === 'SYSTEM_TEMPLATE').map((row) => row.id));
    const resultQuestion = template.group === 'OWN' || template.id.startsWith('OWN-')
      ? null
      : activeIndicators(template, payload.minimum).find((row) => row.role === 'RESULT')?.question ?? null;
    const asksIndicator = Boolean(resultQuestion && actionChangesResultMeaning(result.changes, templateActionIds));
    const indicatorChoice = asksIndicator && (input.indicatorChoice === 'KEEP' || input.indicatorChoice === 'REVIEW')
      ? input.indicatorChoice
      : null;
    if (asksIndicator && !indicatorChoice) {
      throw new UnprocessableEntityException({
        message: `Cambiaste lo que vas a hacer y la pregunta semanal sigue siendo: «${resultQuestion}». Esa pregunta no cambia sola. Indica si la mantienes o si quieres revisarla después.`,
        code: 'INDICATOR_COHERENCE',
        question: resultQuestion,
      });
    }
    const digestOf = (id: string) => {
      const row = live.find((item) => item.id === id)!;
      return digestAction({ id: row.id, title: row.title, doneWhen: row.doneWhen, occasionsPerWeek: row.occasionsPerWeek, minutesPerOccasion: row.minutesPerOccasion, active: row.active });
    };
    const changes = result.changes.map((row) => ({ ...row, actionDigest: digestOf(row.actionId) }));
    const additions = result.additions.map((row) => ({ ...row, conversationOutcome: row.contentTags.includes('CONFRONTATION') && conversation === 'VIABLE' ? 'VIABLE' : null }));
    const digest = JSON.stringify({
      weekStart,
      choice: result.choice,
      indicatorChoice,
      changes: changes.map((row) => [row.actionId, row.op, row.decision, row.revision, row.reason]),
      additions: additions.map((row) => [row.title, row.doneWhen, row.cue, row.occasionsPerWeek, row.minutesPerOccasion, row.onceWeekStart, row.contentTags]),
    });
    await this.assertReviewCommandKey(userId, input.commandKey, digest);
    if (input.commandKey) {
      const replay = await this.prisma.planProposal.findFirst({ where: { userId, commandKey: input.commandKey } });
      if (replay) return { ...(await this.planView(userId, territory, planId, weekStart)), repeated: true };
    }
    const moved = changes.filter((row) => row.op !== 'KEEP');
    const primary = moved[0] ?? changes[0];
    const summaries = [...moved.map((row) => row.summary), ...additions.map((row) => row.summary)];
    const previewSummary = [
      summaries.length ? summaries.join(' ') : 'Todas las acciones se mantienen.',
      indicatorChoice === 'REVIEW' ? 'Dejaste pendiente revisar si la pregunta semanal sigue sirviendo. La pregunta no se modifica.' : '',
    ].filter(Boolean).join(' ');
    const primaryId = primary?.actionId ?? live[0]?.id;
    if (!primaryId) throw new BadRequestException('Este plan no tiene acciones activas.');
    const pendingRow: PendingPlanReview = {
      planId: plan.id,
      territory: pack.territory,
      actionId: primaryId,
      actionDigest: digestOf(primaryId),
      choice: result.choice,
      decision: primary?.decision ?? 'KEEP',
      revision: primary?.revision ?? {},
      note: input.note?.trim() || null,
      commandKey: input.commandKey ?? '',
      reviewCode: view.review.code,
      savedAt: this.clock.today(),
      previewSummary,
      evidenceDigest: await this.evidenceDigestForPlan(userId, plan.id, weekStart, payload, template),
      meaning: input.meaning ?? null,
      actions: changes,
      additions,
      followsProposal: allowed.includes(result.choice),
      ...(indicatorChoice ? { indicatorChoice } : {}),
    };
    await this.prisma.planProposal.update({
      where: { id: proposal.id },
      data: {
        payload: asJson(withPendingReview({ ...payload, lastReviewChoice: result.choice, lastReviewAt: this.clock.today() }, weekStart, pendingRow)),
        reasons: asJson({ digest, reviewCode: view.review.code, choice: result.choice }),
        status: 'EDITED',
        commandKey: input.commandKey ?? null,
      },
    });
    const week = await this.pendingWeekReviews(userId, weekStart);
    return {
      ...(await this.planView(userId, territory, planId, weekStart)),
      repeated: false,
      weekReview: { weekStart, pendingCount: week.pending.length, previewSummary, needsWeekApply: true, followsProposal: pendingRow.followsProposal, nextWeekMinutes: result.nextWeekMinutes },
    };
  }

  private indicatorsFor(template: Template, payload: ProposalPayload) {
    return activeIndicators(template, payload.minimum);
  }

  async recordIndicator(userId: string, territory: string, planId: string, input: {
    indicatorRef?: string;
    value?: number | null;
    text?: string | null;
    textOutcome?: 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN';
    notApplicable?: boolean;
    commandKey?: string;
  }) {
    if (input.commandKey) {
      const prior = await this.prisma.planEvidence.findFirst({ where: { userId, commandKey: input.commandKey } });
      if (prior) return { measure: prior, repeated: true };
    }
    const pack = this.pack(territory);
    const { plan, payload, template } = await this.proposalFor(userId, pack, planId);
    const stage = plan.stage ?? (plan.status === 'ACTIVE' ? 'ACTIVE' : 'PREPARING');
    if (stage !== 'ACTIVE' && stage !== 'MAINTENANCE') throw new ConflictException('El indicador se registra con el plan activo.');
    const indicator = this.indicatorsFor(template, payload).find((row) => row.ref === input.indicatorRef);
    if (!indicator) throw new BadRequestException('Ese indicador no pertenece a este plan.');
    const today = this.clock.today();
    const week = weekStartForDay(today);
    let measure: Measure;
    if (payload.templateId === MEN_A1_FAMILY && indicator.role === 'RESULT') {
      const prepRow = await this.prisma.planWeekPreparation.findUnique({
        where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart: week } },
      });
      if (prepRow?.familyId === MEN_A1_FAMILY && prepRow.status === 'FROZEN') {
        throw new ConflictException('Esta semana ya se cerró. El resultado queda en la revisión guardada.');
      }
      if (prepRow?.familyId === MEN_A1_FAMILY && prepRow.status === 'CONFIRMED') {
        throw new BadRequestException('El resultado de MEN-A1 se registra al revisar tus prioridades, no con un número aparte.');
      }
      try {
        measure = validateMeasure(indicator, input);
      } catch (err) {
        throw new BadRequestException(err instanceof Error ? err.message : 'Respuesta inválida.');
      }
    } else {
      try {
        measure = validateMeasure(indicator, input);
      } catch (err) {
        throw new BadRequestException(err instanceof Error ? err.message : 'Respuesta inválida.');
      }
    }
    const row = await this.prisma.planEvidence.create({
      data: {
        userId,
        planId: plan.id,
        criterionRevision: plan.criterionRevision ?? 1,
        observedOn: new Date(`${today}T12:00:00.000Z`),
        kind: 'MEASURE',
        status: MEASURE_STATUS,
        text: measure.notApplicable ? 'NO_APLICA' : measure.text,
        value: measure.value,
        indicatorRef: indicator.ref,
        periodStart: weekStartForDay(today),
        source: 'DECLARED_BY_MEMBER',
        commandKey: input.commandKey ?? null,
      },
    });
    return { measure: row, repeated: false };
  }

  async planView(userId: string, territory: string, planId: string, reviewWeek?: string) {
    const pack = this.pack(territory);
    const { plan, payload, template } = await this.proposalFor(userId, pack, planId);
    const reviewed = await this.reviewActions(userId, plan.id, reviewWeek && /^\d{4}-\d{2}-\d{2}$/.test(reviewWeek) ? weekStartForDay(reviewWeek) : weekStartForDay(this.clock.today()));
    const indicators = this.indicatorsFor(template, payload);
    const rows = await this.prisma.planEvidence.findMany({
      where: { userId, planId: plan.id, kind: 'MEASURE', status: MEASURE_STATUS, indicatorRef: { in: indicators.map((row) => row.ref) } },
      orderBy: { createdAt: 'asc' },
    });
    const today = this.clock.today();
    const thisWeek = weekStartForDay(today);
    const menA1Prep = payload.templateId === MEN_A1_FAMILY
      ? await this.prisma.planWeekPreparation.findUnique({
        where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart: thisWeek } },
      })
      : null;
    const series = indicators.map((indicator) => {
      const byWeek = new Map<string, Measure & { periodStart: string }>();
      for (const row of rows.filter((item) => item.indicatorRef === indicator.ref)) {
        byWeek.set(row.periodStart ?? '', {
          periodStart: row.periodStart ?? '',
          value: row.value,
          text: row.text === 'NO_APLICA' ? null : row.text,
          notApplicable: row.text === 'NO_APLICA',
        });
      }
      if (indicator.role === 'RESULT' && menA1Prep && menA1Prep.status !== 'DRAFT' && menA1Prep.familyId === MEN_A1_FAMILY) {
        const prepPayload = normalizePrepPayload(menA1Prep.payload, menA1Prep.minimum);
        const review = menA1Prep.reviewOutcomes as MenA1ReviewOutcomes | null;
        const derived = deriveIndicatorFromReview(menA1Prep.minimum, prepPayload, review);
        byWeek.delete(thisWeek);
        if (derived.complete && derived.value != null) {
          byWeek.set(thisWeek, {
            periodStart: thisWeek,
            value: derived.value,
            text: null,
            notApplicable: false,
          });
        }
      }
      const history = [...byWeek.values()].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
      const answeredThisWeek = indicator.role === 'RESULT' && menA1Prep && menA1Prep.status !== 'DRAFT'
        ? history.some((row) => row.periodStart === thisWeek)
        : byWeek.has(thisWeek);
      return {
        indicator,
        baseline: history[0] ?? null,
        latest: history[history.length - 1] ?? null,
        answeredThisWeek,
        history,
        progress: progressFrom(indicator, history),
      };
    });
    const result = series.find((row) => row.indicator.role === 'RESULT');
    const counts = await this.executionCounts(userId, plan.id, plan.activatedAt);
    const stats = executionStats(counts, template.schedule.kind === 'TRIGGER');
    const reviewAt = plan.reviewAt
      ? plan.reviewAt.toISOString().slice(0, 10)
      : addIsoDays(today, payload.horizonWeeks * 7);
    const weekStart = weekStartForDay(today);
    const pending = pendingForWeek(payload, weekStart);
    const review = reviewProposal({
      execution: stats.levelForReview,
      progress: result?.progress ?? 'UNKNOWN',
      coverage: stats.coverage,
      ratioOfResolved: stats.ratioOfResolved,
      unresolved: stats.noInformation,
    });
    const alternateTemplate = this.alternateTemplate(pack, payload, template);
    const outcomeStore = contractFromPlanRow(plan);
    const weekAssessment = await this.latestOutcomeAssessment(userId, plan.id, weekStart);
    const checkDue = outcomeStore ? outcomeCheckDue(outcomeStore.current, today) : 'UNKNOWN';
    const linkedRef = outcomeStore?.current.linkedIndicatorRef ?? null;
    const toolSameAsOutcome = Boolean(
      linkedRef && result && linkedRef === result.indicator.ref,
    );
    const outcomeHint = reviewHintFromLayers({
      executionLevel: stats.levelForReview,
      coverage: stats.coverage,
      assessment: weekAssessment?.status ?? null,
      checkDue,
    });
    const contractMeta = outcomeContractMeta(plan);
    const mergedReview = mergeReviewWithOutcome(review, {
      assessment: weekAssessment?.status ?? null,
      executionLevel: stats.levelForReview,
    });
    const draftDirection = plan.purposeRevisionId
      ? await this.prisma.purposeRevision.findFirst({ where: { id: plan.purposeRevisionId, userId } })
      : null;
    const currentDirection = await this.prisma.purposeRevision.findFirst({ where: { userId }, orderBy: { revision: 'desc' } });
    const draftFields = draftDirection ? readDirectionFields(draftDirection.content) : null;
    const currentFields = currentDirection ? readDirectionFields(currentDirection.content) : null;
    const stageNow = plan.stage ?? 'PREPARING';
    const directionChoiceRequired = Boolean(
      stageNow === 'PREPARING'
      && plan.purposeRevisionId
      && currentDirection
      && plan.purposeRevisionId !== currentDirection.id,
    );
    return {
      territory: pack.territory,
      version: pack.version,
      planId: plan.id,
      stage: plan.stage,
      protectNote: plan.protectNote,
      template,
      general: payload.general,
      minimum: payload.minimum,
      horizonWeeks: payload.horizonWeeks,
      focusText: payload.focusText,
      stageDefinition: payload.stageDefinition,
      readings: payload.readings,
      consulted: payload.consulted ?? [],
      load: payload.load,
      environmentAccepted: payload.environmentAccepted,
      reviewAt,
      horizonReached: reviewAt ? today >= reviewAt : false,
      indicators: series,
      execution: {
        ...counts,
        level: stats.level,
        levelForReview: stats.levelForReview,
        coverage: stats.coverage,
        ratioOfResolved: stats.ratioOfResolved,
        scheduled: stats.scheduled,
        resolved: stats.resolved,
      },
      changeTitle: plan.title,
      observableOutcome: plan.outcome,
      whyItMatters: plan.whyItMatters,
      linkKind: plan.linkKind,
      outcomeContract: outcomeStore?.current ?? null,
      outcomeContractMeta: contractMeta,
      outcomeContractComplete: contractMeta.complete,
      outcomeAssessment: weekAssessment,
      outcomeCheckDue: checkDue,
      outcomeReviewHint: typeof outcomeHint === 'string' ? outcomeHint : null,
      toolIndicatorLinked: toolSameAsOutcome,
      directionAtDraft: draftDirection && draftFields ? {
        purposeRevisionId: draftDirection.id,
        revision: draftDirection.revision,
        statement: draftFields.statement,
        desiredChange: draftFields.desiredChange,
      } : null,
      directionCurrent: currentDirection && currentFields ? {
        purposeRevisionId: currentDirection.id,
        revision: currentDirection.revision,
        statement: currentFields.statement,
        desiredChange: currentFields.desiredChange,
      } : null,
      directionChoiceRequired,
      review: {
        code: mergedReview.code,
        text: mergedReview.text,
        outcomeText: mergedReview.outcomeText,
        choices: mergedReview.choices,
        lastChoice: pending?.choice ?? payload.lastReviewChoice ?? null,
        pendingThisWeek: pending,
        alternateTemplate: alternateTemplate ? { id: alternateTemplate.id, action: alternateTemplate.action, doneWhen: alternateTemplate.doneWhen } : null,
      },
      actions: reviewed.current,
      endedActions: reviewed.ended,
      marks: TERRITORY_MARKS[pack.territory],
      reviewWeek: {
        weekStart: reviewed.weekStart,
        nextWeek: reviewed.nextWeek,
        appliesFrom: reviewAppliesFrom(today, reviewed.weekStart),
        nextWeekMinutes: reviewed.nextWeekMinutes,
        weekMinutes: reviewed.weekMinutes,
      },
      menA1: menA1Prep && menA1Prep.familyId === MEN_A1_FAMILY ? {
        status: menA1Prep.status,
        weekStart: thisWeek,
        indicatorPreview: deriveIndicatorFromReview(
          menA1Prep.minimum,
          normalizePrepPayload(menA1Prep.payload, menA1Prep.minimum),
          menA1Prep.reviewOutcomes as MenA1ReviewOutcomes | null,
        ),
      } : null,
    };
  }

  async pendingWeekReviews(userId: string, weekStart: string) {
    const week = weekStart || weekStartForDay(this.clock.today());
    const rows = await this.prisma.planProposal.findMany({
      where: { userId, kind: PROPOSAL_KIND, status: { in: ['ACCEPTED', 'EDITED'] } },
      orderBy: { createdAt: 'desc' },
    });
    const seen = new Set<string>();
    const pending: PendingPlanReview[] = [];
    for (const row of rows) {
      if (!row.planId || seen.has(row.planId)) continue;
      seen.add(row.planId);
      const plan = await this.prisma.personalPlan.findFirst({ where: { id: row.planId, userId } });
      if (plan?.stage === 'CLOSED') continue;
      const payload = row.payload as unknown as ProposalPayload;
      const item = pendingForWeek(payload, week);
      if (item) pending.push(item);
    }
    const closed = await this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart: week } } });
    const later = await this.prisma.weekReview.findFirst({
      where: { userId, weekStart: { gt: week } },
      orderBy: { weekStart: 'asc' },
      select: { weekStart: true },
    });
    const planIds = pending.map((row) => row.planId);
    const titles = planIds.length
      ? await this.prisma.personalPlan.findMany({ where: { userId, id: { in: planIds } }, select: { id: true, title: true } })
      : [];
    const titleById = new Map(titles.map((row) => [row.id, row.title]));
    return {
      weekStart: week,
      pending: pending.map((row) => ({
        ...row,
        planTitle: titleById.get(row.planId) ?? 'Plan',
      })),
      weekClosed: Boolean(closed),
      appliesFrom: later ? null : reviewAppliesFrom(this.clock.today(), week),
      laterCloseWeek: later?.weekStart ?? null,
    };
  }

  async applyInterventionWeekReview(userId: string, weekStart: string, input: { commandKey?: string; note?: string | null }) {
    const note = input.note?.trim() || null;
    if (input.commandKey) {
      const prior = await this.prisma.weekReview.findFirst({
        where: { userId, snapshot: { path: ['applyCommandKey'], equals: input.commandKey } },
      });
      if (prior) {
        const snapshot = prior.snapshot as { applyNote?: string | null; appliedCount?: number };
        const same = prior.weekStart === weekStart && (snapshot.applyNote ?? null) === note;
        if (!same) {
          throw new ConflictException({
            message: 'Esa clave ya se usó con otro cierre.',
            code: 'STALE_REVIEW',
          });
        }
        return { weekStart, applied: snapshot.appliedCount ?? 0, repeated: true };
      }
    }
    const { pending, weekClosed } = await this.pendingWeekReviews(userId, weekStart);
    if (weekClosed) {
      throw new ConflictException({
        message: 'Esta semana ya fue cerrada. Puedes consultar sus registros, pero no volver a aplicar el mismo cierre.',
        code: 'WEEK_ALREADY_CLOSED',
      });
    }
    if (!pending.length) throw new BadRequestException('No hay decisiones de planes listas para esta semana.');
    for (const row of pending) {
      const plan = await this.prisma.personalPlan.findFirst({ where: { id: row.planId, userId } });
      if (!plan || (plan.stage !== 'ACTIVE' && plan.stage !== 'MAINTENANCE')) {
        throw new ConflictException({
          message: 'Un plan cambió desde que guardaste la decisión. Revísala antes de cerrar la semana.',
          code: 'STALE_REVIEW',
          planId: row.planId,
        });
      }
      const rowActions = row.actions ?? [{ actionId: row.actionId, actionDigest: row.actionDigest, decision: row.decision, revision: row.revision }];
      const liveRows = await this.prisma.planAction.findMany({ where: { planId: row.planId, active: true } });
      for (const item of rowActions) {
        const action = liveRows.find((live) => live.id === item.actionId);
        if (!action) {
          throw new ConflictException({
            message: 'La acción de un plan cambió desde que guardaste la decisión.',
            code: 'STALE_REVIEW',
            planId: row.planId,
          });
        }
        const liveDigest = digestAction({
          id: action.id,
          title: action.title,
          doneWhen: action.doneWhen,
          occasionsPerWeek: action.occasionsPerWeek,
          minutesPerOccasion: action.minutesPerOccasion,
          active: action.active,
        });
        if (item.actionDigest && item.actionDigest !== liveDigest) {
          throw new ConflictException({
            message: 'La programación cambió después de preparar el cierre. Confirma de nuevo la decisión.',
            code: 'STALE_REVIEW',
            planId: row.planId,
          });
        }
      }
      const proposal = await this.prisma.planProposal.findFirst({
        where: { userId, planId: row.planId, kind: PROPOSAL_KIND },
        orderBy: { createdAt: 'desc' },
      });
      const proposalPayload = proposal?.payload as ProposalPayload | undefined;
      const pack = packByTerritory(row.territory);
      if (proposalPayload && pack) {
        const template = proposalPayload.templateSnapshot ?? pack.templates.find((item) => item.id === proposalPayload.templateId) ?? null;
        if (template) {
          const liveEvidence = await this.evidenceDigestForPlan(userId, row.planId, weekStart, proposalPayload, template);
          if (row.evidenceDigest && liveEvidence && row.evidenceDigest !== liveEvidence) {
            throw new ConflictException({
              message: 'Cambiaron las prioridades o su revisión. Guarda de nuevo la decisión de este plan.',
              code: 'STALE_REVIEW',
              planId: row.planId,
            });
          }
        }
      }
      try {
        previewWeek(
          liveRows.filter((live) => rowActions.some((item) => item.actionId === live.id)).map((action) => ({
            id: action.id,
            title: action.title,
            doneWhen: action.doneWhen,
            active: true,
            weekday: action.weekday,
            intervalDays: action.intervalDays ?? 7,
            occasionsPerWeek: action.occasionsPerWeek,
            minutesPerOccasion: action.minutesPerOccasion,
            paused: Boolean(action.pausedAt),
            preparation: action.preparation,
            cue: action.cue,
            minimumVersion: action.minimumVersion,
          })),
          Object.fromEntries(rowActions.map((item) => [item.actionId, item.decision])),
          Object.fromEntries(rowActions.map((item) => [item.actionId, item.revision])),
        );
      } catch {
        throw new ConflictException({
          message: 'Una decisión ya no encaja con el plan actual.',
          code: 'STALE_REVIEW',
          planId: row.planId,
        });
      }
      const added = (row.actions ?? []).flatMap((item) => item.revision.contentTags ?? []);
      if (added.length) {
        const parsed = parseContentTags(added);
        if (!parsed) throw new BadRequestException('Marca de contenido desconocida.');
        await this.journey.assertMemberContentTags(userId, parsed);
      }
    }
    const decisions: Record<string, PendingPlanReview['decision']> = {};
    const revisions: Record<string, PendingPlanReview['revision']> = {};
    const endReasons: Record<string, string> = {};
    const additions: NonNullable<WeekExtras['additions']> = [];
    for (const row of pending) {
      const rowActions = row.actions ?? [{ actionId: row.actionId, decision: row.decision, revision: row.revision, reason: null }];
      for (const item of rowActions) {
        if (item.decision === 'KEEP') continue;
        decisions[item.actionId] = item.decision;
        revisions[item.actionId] = item.revision;
        if (item.reason) endReasons[item.actionId] = item.reason;
      }
      for (const item of row.additions ?? []) {
        additions.push({
          planId: row.planId,
          title: item.title,
          doneWhen: item.doneWhen,
          cue: item.cue,
          minimumVersion: item.minimumVersion,
          occasionsPerWeek: item.occasionsPerWeek,
          minutesPerOccasion: item.minutesPerOccasion,
          onceWeekStart: item.onceWeekStart,
          contentTags: item.contentTags,
          conversationOutcome: item.conversationOutcome ?? null,
          position: item.position,
        });
      }
    }
    const extras: WeekExtras = {
      ...(additions.length ? { additions } : {}),
      ...(Object.keys(endReasons).length ? { endReasons } : {}),
    };
    const closed = await this.journey.closeWeek(userId, weekStart, note ?? undefined, decisions, revisions, undefined, extras);
    const snapshot = closed.snapshot && typeof closed.snapshot === 'object' ? closed.snapshot as Record<string, unknown> : {};
    await this.prisma.weekReview.update({
      where: { id: closed.id },
      data: {
        snapshot: asJson({
          ...snapshot,
          ...(input.commandKey ? { applyCommandKey: input.commandKey, applyNote: note } : {}),
          appliedCount: pending.length,
        }),
      },
    });
    await this.freezeWeekPreparations(userId, weekStart);
    for (const row of pending) {
      const proposal = await this.prisma.planProposal.findFirst({
        where: { userId, planId: row.planId, kind: PROPOSAL_KIND },
        orderBy: { createdAt: 'desc' },
      });
      if (!proposal) continue;
      const payload = proposal.payload as unknown as ProposalPayload;
      const appliesFrom = reviewAppliesFrom(this.clock.today(), weekStart);
      const after = await this.reviewActions(userId, row.planId, appliesFrom);
      const nextPayload = withReviewHistory({
        ...payload,
        ...withoutPendingWeek(payload, weekStart),
        ...(payload.load ? { load: { ...payload.load, weeklyMinutes: after.weekMinutes } } : {}),
      }, weekStart, {
        choice: row.choice,
        meaning: row.meaning ?? null,
        note: row.note,
        appliedAt: new Date().toISOString(),
        reviewCode: row.reviewCode,
        ...(row.actions ? { actions: row.actions.map((item) => ({ actionId: item.actionId, op: item.op, summary: item.summary, reason: item.reason })) } : {}),
        ...(row.additions?.length ? { additions: row.additions.map((item) => item.summary) } : {}),
        ...(row.indicatorChoice ? { indicatorChoice: row.indicatorChoice } : {}),
      });
      await this.prisma.planProposal.update({ where: { id: proposal.id }, data: { payload: asJson(nextPayload) } });
      await this.prisma.personalPlan.update({ where: { id: row.planId }, data: { capacityMinutes: after.weekMinutes } });
    }
    return { weekStart, applied: pending.length, repeated: false };
  }

  private alternateTemplate(pack: Pack, payload: ProposalPayload, template: Template): Template | null {
    const readingId = payload.readings[0]?.id;
    if (!readingId) return null;
    const def = pack.readings.find((row) => row.id === readingId);
    const altId = def?.plans.find((id) => id !== template.id);
    if (!altId) return null;
    return pack.templates.find((row) => row.id === altId) ?? null;
  }

  /** Everything the plan's actions need to be counted week by week, including actions that already ended. */
  private async actionLedger(userId: string, planId: string) {
    const actions = await this.prisma.planAction.findMany({ where: { planId }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    const ids = actions.map((row) => row.id);
    const [records, schedules, reviews, transitions] = await Promise.all([
      ids.length ? this.prisma.actionRecord.findMany({ where: { actionId: { in: ids } } }) : Promise.resolve([]),
      loadActionSchedules(this.prisma, ids),
      this.prisma.weekReview.findMany({ where: { userId }, select: { weekStart: true } }),
      this.prisma.planTransition.findMany({
        where: { planId },
        select: { toStage: true, effectiveFrom: true },
        orderBy: { effectiveFrom: 'asc' },
      }),
    ]);
    return { actions, records, schedules, reviewed: new Set(reviews.map((row) => row.weekStart)), transitions };
  }

  /** Counts of one civil week for the actions that belonged to the plan that week. Ended actions keep their weeks. */
  private weekCountsFor(ledger: Awaited<ReturnType<InterventionService['actionLedger']>>, week: string, only?: string) {
    const weekEnd = addIsoDays(week, 6);
    const counted = ledger.actions.filter((row) => (!only || row.id === only) && actionCountsInWeek(row, ledger.actions, week, weekEnd));
    const ids = new Set(counted.map((row) => row.id));
    return weekCounts({
      today: this.clock.today(),
      weekStart: week,
      weekReviewed: ledger.reviewed.has(week),
      actions: counted.map((row) => ({ id: row.id, weekday: row.weekday, intervalDays: row.intervalDays, occasionsPerWeek: row.occasionsPerWeek, active: true })),
      schedules: ledger.schedules,
      records: ledger.records.filter((row) => ids.has(row.actionId)).map((row) => ({ actionId: row.actionId, day: row.day, status: row.status })),
      cancellations: [],
    });
  }

  private activationDay(ledger: Awaited<ReturnType<InterventionService['actionLedger']>>, activatedAt: Date | null): string | null {
    const active = ledger.transitions.find((row) => row.toStage === 'ACTIVE' && row.effectiveFrom);
    if (active?.effectiveFrom) return active.effectiveFrom.toISOString().slice(0, 10);
    return activatedAt ? activatedAt.toISOString().slice(0, 10) : null;
  }

  private async executionCounts(userId: string, planId: string, activatedAt: Date | null) {
    const totals = { done: 0, notDone: 0, noInformation: 0 };
    const ledger = await this.actionLedger(userId, planId);
    const from = this.activationDay(ledger, activatedAt);
    if (!from || !ledger.actions.length) return totals;
    let week = weekStartForDay(from);
    const current = weekStartForDay(this.clock.today());
    for (let guard = 0; week <= current && guard < 12; guard += 1) {
      if (!weekFallsInPause(week, ledger.transitions)) {
        const counts = this.weekCountsFor(ledger, week);
        totals.done += counts.done;
        totals.notDone += counts.notDone;
        totals.noInformation += counts.noInformation;
      }
      week = addIsoDays(week, 7);
    }
    return totals;
  }

  /**
   * The plan's actions as the review needs them: what each one asked for the reviewed week, what was recorded,
   * and whether a one-time task is waiting for a decision. Ended actions are listed apart, with their reason.
   */
  private async reviewActions(userId: string, planId: string, weekStart: string) {
    const ledger = await this.actionLedger(userId, planId);
    const today = this.clock.today();
    const windowOf = (id: string) => ledger.schedules.find((row) => row.actionId === id && row.kind === 'FLEXIBLE' && row.effectiveTo);
    const rows = ledger.actions.map((row) => {
      const window = windowOf(row.id);
      const kind: ReviewActionKind = window && row.occasionsPerWeek == null
        ? 'ONCE'
        : row.weekday != null ? 'FIXED' : row.occasionsPerWeek == null ? 'TRIGGER' : 'WEEKLY';
      const onceWeekStart = kind === 'ONCE' ? weekStartForDay(window!.effectiveFrom) : null;
      const week = this.weekCountsFor(ledger, weekStart, row.id);
      let once: { status: 'DONE' | 'NOT_DONE' | 'NO_INFORMATION' | 'PENDING' | 'UPCOMING'; weekStart: string } | null = null;
      if (kind === 'ONCE' && onceWeekStart) {
        const windowEnd = addIsoDays(onceWeekStart, 6);
        const recorded = ledger.records.filter((item) => item.actionId === row.id && item.day >= onceWeekStart && item.day <= windowEnd);
        const status = recorded.some((item) => item.status === 'DONE')
          ? 'DONE'
          : onceWeekStart > today
            ? 'UPCOMING'
            : windowEnd >= today && !ledger.reviewed.has(onceWeekStart)
              ? 'PENDING'
              : recorded.some((item) => item.status === 'SKIPPED') ? 'NOT_DONE' : 'NO_INFORMATION';
        once = { status, weekStart: onceWeekStart };
      }
      const successor = ledger.actions.find((item) => item.replacesActionId === row.id);
      return {
        id: row.id,
        title: row.title,
        doneWhen: row.doneWhen,
        cue: row.cue,
        minimumVersion: row.minimumVersion,
        occasionsPerWeek: row.occasionsPerWeek,
        minutesPerOccasion: row.minutesPerOccasion,
        position: row.position,
        kind,
        onceWeekStart,
        active: row.active,
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo,
        endedReason: row.endedReason,
        replacesActionId: row.replacesActionId,
        replacedBy: successor ? { id: successor.id, title: successor.title } : null,
        contentTags: row.contentTags,
        fromTemplate: row.origin === 'SYSTEM_TEMPLATE',
        week: { done: week.done, notDone: week.notDone, noInformation: week.noInformation, dueUnmarked: week.dueUnmarked, upcoming: week.upcoming, excepted: week.excepted },
        once,
        needsDecision: row.active && (once?.status === 'NOT_DONE' || once?.status === 'NO_INFORMATION'),
      };
    });
    const rawOf = (id: string) => ledger.actions.find((item) => item.id === id)!;
    const countsOn = (id: string, start: string) => actionCountsInWeek(rawOf(id), ledger.actions, start, addIsoDays(start, 6));
    const visible = rows.filter((row) => countsOn(row.id, weekStart) || row.needsDecision);
    const current = visible.filter((row) => row.active);
    const nextWeek = addIsoDays(weekStart, 7);
    const nextCurrent = rows.filter((row) => row.active && countsOn(row.id, nextWeek));
    return {
      weekStart,
      nextWeek,
      current,
      ended: visible.filter((row) => !row.active),
      weekMinutes: loadForWeek(current, weekStart),
      nextWeekMinutes: loadForWeek(nextCurrent, nextWeek),
    };
  }

  private assertMenA1Plan(template: Template, payload: ProposalPayload) {
    if (payload.templateId !== MEN_A1_FAMILY && template.id !== MEN_A1_FAMILY) {
      throw new BadRequestException('Esta ayuda solo aplica al plan MEN-A1.');
    }
  }

  private async prepContext(userId: string, pack: Pack, planId: string, weekStart: string) {
    const { plan, payload, template } = await this.proposalFor(userId, pack, planId);
    this.assertMenA1Plan(template, payload);
    if (plan.stage === 'PAUSED' || plan.stage === 'CLOSED') {
      throw new ConflictException('Este plan no admite edición de preparación ahora.');
    }
    const closed = await this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } });
    const row = await this.prisma.planWeekPreparation.findUnique({
      where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart } },
    });
    return { plan, payload, template, weekClosed: Boolean(closed), row };
  }

  async weekPrepView(userId: string, territory: string, planId: string, weekStart?: string) {
    const pack = this.pack(territory);
    const week = weekStart?.trim() || weekStartForDay(this.clock.today());
    const { plan, payload, template, weekClosed, row } = await this.prepContext(userId, pack, planId, week);
    const prep = normalizePrepPayload(row?.payload ?? { priorities: [] }, payload.minimum);
    const review = (row?.reviewOutcomes ?? null) as MenA1ReviewOutcomes | null;
    const derived = deriveIndicatorFromReview(payload.minimum, prep, review);
    return {
      familyId: MEN_A1_FAMILY,
      weekStart: week,
      minimum: payload.minimum,
      status: row?.status ?? 'EMPTY',
      weekClosed,
      editable: !weekClosed && row?.status !== 'FROZEN',
      seeks: template.seeks,
      focusText: payload.focusText,
      load: payload.load,
      protectNote: plan.protectNote,
      maxPriorities: maxPriorities(payload.minimum),
      prep,
      reviewOutcomes: review,
      indicatorPreview: derived,
    };
  }

  async saveWeekPrep(userId: string, territory: string, planId: string, input: {
    weekStart?: string;
    payload?: unknown;
    commandKey?: string;
  }) {
    const pack = this.pack(territory);
    const week = input.weekStart?.trim() || weekStartForDay(this.clock.today());
    const { plan, payload, weekClosed, row } = await this.prepContext(userId, pack, planId, week);
    if (weekClosed || row?.status === 'FROZEN') {
      throw new ConflictException('Esta semana ya no se edita.');
    }
    if (input.commandKey && row?.commandKey === input.commandKey && row) {
      return this.weekPrepView(userId, territory, planId, week);
    }
    const prep = normalizePrepPayload(input.payload, payload.minimum);
    const data = {
      userId,
      planId: plan.id,
      weekStart: week,
      familyId: MEN_A1_FAMILY,
      minimum: payload.minimum,
      status: 'DRAFT',
      payload: asJson({ ...prep, prepConfirmedAt: null }),
      commandKey: input.commandKey ?? null,
    };
    await this.prisma.planWeekPreparation.upsert({
      where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart: week } },
      create: data,
      update: { minimum: payload.minimum, status: 'DRAFT', payload: data.payload, commandKey: data.commandKey },
    });
    return this.weekPrepView(userId, territory, planId, week);
  }

  async confirmWeekPrep(userId: string, territory: string, planId: string, input: { weekStart?: string; commandKey?: string }) {
    const pack = this.pack(territory);
    const week = input.weekStart?.trim() || weekStartForDay(this.clock.today());
    const { plan, payload, weekClosed, row } = await this.prepContext(userId, pack, planId, week);
    if (weekClosed || row?.status === 'FROZEN') throw new ConflictException('Esta semana ya no se edita.');
    const prep = normalizePrepPayload(row?.payload ?? { priorities: [] }, payload.minimum);
    const err = validateConfirmPrep(prep, payload.minimum);
    if (err) throw new BadRequestException(err);
    if (input.commandKey && row?.commandKey === input.commandKey && row?.status === 'CONFIRMED') {
      return this.weekPrepView(userId, territory, planId, week);
    }
    const confirmed: MenA1PrepPayload = { ...prep, prepConfirmedAt: this.clock.today() };
    await this.prisma.planWeekPreparation.upsert({
      where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart: week } },
      create: {
        userId,
        planId: plan.id,
        weekStart: week,
        familyId: MEN_A1_FAMILY,
        minimum: payload.minimum,
        status: 'CONFIRMED',
        payload: asJson(confirmed),
        commandKey: input.commandKey ?? null,
      },
      update: {
        minimum: payload.minimum,
        status: 'CONFIRMED',
        payload: asJson(confirmed),
        commandKey: input.commandKey ?? null,
      },
    });
    return this.weekPrepView(userId, territory, planId, week);
  }

  async saveWeekPrepReviewOutcomes(userId: string, territory: string, planId: string, input: {
    weekStart?: string;
    outcomes?: MenA1ReviewOutcomes;
    commandKey?: string;
  }) {
    const pack = this.pack(territory);
    const week = input.weekStart?.trim() || weekStartForDay(this.clock.today());
    const { plan, payload, template, weekClosed, row } = await this.prepContext(userId, pack, planId, week);
    if (!row || (row.status !== 'CONFIRMED' && row.status !== 'FROZEN')) {
      throw new BadRequestException('Primero confirma la preparación de prioridades.');
    }
    if (weekClosed && row.status !== 'FROZEN') {
      throw new ConflictException('Cierra la semana para conservar lo acordado.');
    }
    if (row.status === 'FROZEN') {
      return this.weekPrepView(userId, territory, planId, week);
    }
    const prep = normalizePrepPayload(row.payload, payload.minimum);
    const outcomes = input.outcomes ?? { priorities: [] };
    const activeIds = prep.priorities.filter((p) => p.advance.trim()).map((p) => p.id);
    for (const id of activeIds) {
      const item = outcomes.priorities.find((p) => p.id === id);
      if (!item || !['ACHIEVED', 'NOT_ACHIEVED', 'UNKNOWN'].includes(item.outcome)) {
        throw new BadRequestException('Responde cada prioridad acordada.');
      }
    }
    await this.prisma.planWeekPreparation.update({
      where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart: week } },
      data: { reviewOutcomes: asJson(outcomes), commandKey: input.commandKey ?? row.commandKey },
    });
    await this.syncMenA1IndicatorFromPrep(userId, plan, payload, template, week);
    await this.clearPendingReviewIfEvidenceChanged(userId, plan.id, week, pack.territory);
    return this.weekPrepView(userId, territory, planId, week);
  }

  private async latestOutcomeAssessment(userId: string, planId: string, weekStart?: string): Promise<OutcomeAssessmentRow | null> {
    const rows = await this.prisma.planEvidence.findMany({
      where: { userId, planId, kind: 'OUTCOME' },
      orderBy: { createdAt: 'desc' },
      take: weekStart ? 20 : 1,
    });
    const row = weekStart ? rows.find((item) => item.periodStart === weekStart) ?? rows[0] : rows[0];
    if (!row) return null;
    const status = parseAssessmentStatus(row.status);
    if (!status) return null;
    return {
      status,
      text: row.text,
      contractRevision: row.criterionRevision,
      observedOn: row.observedOn.toISOString().slice(0, 10),
      periodStart: row.periodStart,
    };
  }

  private async evidenceDigestForPlan(userId: string, planId: string, weekStart: string, payload: ProposalPayload, template: Template) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    const store = plan ? contractFromPlanRow(plan) : null;
    const assessment = await this.latestOutcomeAssessment(userId, planId, weekStart);
    const outcomePart = digestOutcomeContract(store, assessment);
    let menPart = '';
    if (payload.templateId === MEN_A1_FAMILY || template.id === MEN_A1_FAMILY) {
      const prepRow = await this.prisma.planWeekPreparation.findUnique({
        where: { userId_planId_weekStart: { userId, planId, weekStart } },
      });
      if (prepRow && prepRow.status !== 'DRAFT') {
        const indicator = activeIndicators(template, prepRow.minimum).find((row) => row.role === 'RESULT');
        if (indicator) {
          const prep = normalizePrepPayload(prepRow.payload, prepRow.minimum);
          const review = prepRow.reviewOutcomes as MenA1ReviewOutcomes | null;
          menPart = digestMenA1Evidence({ minimum: prepRow.minimum, prep, review, indicatorRef: indicator.ref });
        }
      }
    }
    if (!outcomePart && !menPart) return '';
    return JSON.stringify({ outcome: outcomePart ? JSON.parse(outcomePart) : null, menA1: menPart ? JSON.parse(menPart) : null });
  }

  async patchOutcomeContract(userId: string, territory: string, planId: string, input: {
    soughtOutcome?: string;
    criterion?: string;
    criterionStatus?: 'PROVISIONAL' | 'CONFIRMED';
    evidenceHint?: string | null;
    checkAt?: string | null;
    linkedIndicatorRef?: string | null;
    confirmed?: boolean;
    commandKey?: string;
  }) {
    const pack = this.pack(territory);
    const { plan, proposal, payload, template } = await this.proposalFor(userId, pack, planId);
    const stage = plan.stage ?? 'PREPARING';
    const store = contractFromPlanRow(plan) ?? {
      current: buildOutcomeContract({
        change: plan.title,
        soughtOutcome: plan.outcome,
        criterion: plan.criterionText ?? plan.outcome,
      }),
      history: [],
    };
    const patch: Partial<import('./plan-outcome-contract').PlanOutcomeContract> = {};
    if (input.soughtOutcome !== undefined) patch.soughtOutcome = input.soughtOutcome.trim();
    if (input.criterion !== undefined) patch.criterion = input.criterion.trim();
    if (input.criterionStatus !== undefined) patch.criterionStatus = input.criterionStatus;
    if (input.evidenceHint !== undefined) patch.evidenceHint = input.evidenceHint?.trim() || null;
    if (input.checkAt !== undefined) patch.checkAt = input.checkAt?.trim()?.slice(0, 10) || null;
    if (input.linkedIndicatorRef !== undefined) patch.linkedIndicatorRef = input.linkedIndicatorRef?.trim() || null;
    const changingActive = stage === 'ACTIVE' || stage === 'MAINTENANCE';
    const criterionChanged = patch.criterion && patch.criterion !== store.current.criterion;
    const outcomeChanged = patch.soughtOutcome && patch.soughtOutcome !== store.current.soughtOutcome;
    if (changingActive && (criterionChanged || outcomeChanged) && !input.confirmed) {
      throw new UnprocessableEntityException({
        message: 'Cambiar el resultado o criterio de un plan activo requiere confirmación.',
        code: 'OUTCOME_CONTRACT_CONFIRM',
      });
    }
    if (input.commandKey) {
      const prior = await this.prisma.planTransition.findFirst({
        where: { userId, planId, metadata: { path: ['commandKey'], equals: input.commandKey } },
      });
      if (prior) return { plan, repeated: true };
    }
    const today = this.clock.today();
    const nextStore = changingActive && (criterionChanged || outcomeChanged)
      ? reviseContract(store, patch, today)
      : {
        current: buildOutcomeContract({ ...store.current, ...patch, revision: store.current.revision }),
        history: store.history,
      };
    const updated = await this.prisma.personalPlan.update({
      where: { id: plan.id },
      data: {
        outcome: nextStore.current.soughtOutcome,
        criterionText: nextStore.current.criterion,
        criterionStatus: nextStore.current.criterionStatus,
        reviewAt: nextStore.current.checkAt ? new Date(`${nextStore.current.checkAt}T12:00:00.000Z`) : plan.reviewAt,
        outcomeContract: asJson(nextStore),
      },
    });
    if (changingActive && (criterionChanged || outcomeChanged)) {
      await this.prisma.planTransition.create({
        data: {
          userId,
          planId: plan.id,
          fromStage: stage,
          toStage: stage,
          reason: 'OUTCOME_CONTRACT_REVISED',
          effectiveFrom: new Date(`${today}T12:00:00.000Z`),
          metadata: input.commandKey ? { commandKey: input.commandKey } : { revision: nextStore.current.revision },
        },
      });
      const weekStart = weekStartForDay(today);
      await this.clearPendingReviewIfEvidenceChanged(userId, plan.id, weekStart, pack.territory);
    }
    void proposal;
    void payload;
    void template;
    return { plan: updated, repeated: false };
  }

  async recordOutcomeAssessment(userId: string, territory: string, planId: string, input: {
    status?: string;
    text?: string | null;
    weekStart?: string;
    commandKey?: string;
  }) {
    if (input.commandKey) {
      const prior = await this.prisma.planEvidence.findFirst({ where: { userId, commandKey: input.commandKey } });
      if (prior) return { evidence: prior, repeated: true };
    }
    const pack = this.pack(territory);
    const { plan } = await this.proposalFor(userId, pack, planId);
    const stage = plan.stage ?? 'PREPARING';
    if (stage !== 'ACTIVE' && stage !== 'MAINTENANCE') {
      throw new ConflictException('El resultado propio se revisa con el plan activo.');
    }
    const status = parseAssessmentStatus(input.status);
    if (!status) throw new BadRequestException('Indica si el resultado está conseguido, todavía no, o no hay información suficiente.');
    const store = contractFromPlanRow(plan);
    const exploring = store?.current.mode === 'EXPLORATION';
    if (exploring && status === 'ACHIEVED') {
      throw new BadRequestException('Un plan de exploración registra lo que aprendiste, no un resultado conseguido.');
    }
    if (!exploring && status === 'LEARNED') {
      throw new BadRequestException('Este plan busca un resultado. Indica si se consiguió, todavía no, o no hay información suficiente.');
    }
    if (status === 'ACHIEVED' && !input.text?.trim()) {
      throw new BadRequestException('Describe la evidencia que te permite reconocer el resultado.');
    }
    if (status === 'LEARNED' && !input.text?.trim()) {
      throw new BadRequestException('Escribe qué aprendiste.');
    }
    const revision = store?.current.revision ?? plan.criterionRevision ?? 1;
    const today = this.clock.today();
    const week = input.weekStart?.trim() || weekStartForDay(today);
    const evidence = await this.prisma.planEvidence.create({
      data: {
        userId,
        planId: plan.id,
        criterionRevision: revision,
        observedOn: new Date(`${today}T12:00:00.000Z`),
        kind: 'OUTCOME',
        status,
        text: input.text?.trim() || null,
        periodStart: week,
        commandKey: input.commandKey ?? null,
        source: 'DECLARED_BY_MEMBER',
      },
    });
    await this.clearPendingReviewIfEvidenceChanged(userId, plan.id, week, pack.territory);
    return { evidence, repeated: false };
  }

  private async syncMenA1IndicatorFromPrep(
    userId: string,
    plan: { id: string; criterionRevision: number | null },
    payload: ProposalPayload,
    template: Template,
    weekStart: string,
  ) {
    if (payload.templateId !== MEN_A1_FAMILY && template.id !== MEN_A1_FAMILY) return;
    const prepRow = await this.prisma.planWeekPreparation.findUnique({
      where: { userId_planId_weekStart: { userId, planId: plan.id, weekStart } },
    });
    if (!prepRow || prepRow.status === 'DRAFT' || prepRow.status === 'FROZEN') return;
    const indicator = activeIndicators(template, prepRow.minimum).find((row) => row.role === 'RESULT');
    if (!indicator) return;
    const prep = normalizePrepPayload(prepRow.payload, prepRow.minimum);
    const review = prepRow.reviewOutcomes as MenA1ReviewOutcomes | null;
    const derived = deriveIndicatorFromReview(prepRow.minimum, prep, review);
    await this.prisma.planEvidence.deleteMany({
      where: { userId, planId: plan.id, kind: 'MEASURE', indicatorRef: indicator.ref, periodStart: weekStart },
    });
    if (!derived.complete || derived.value == null) return;
    const measure = validateMeasure(indicator, { value: derived.value });
    const today = this.clock.today();
    await this.prisma.planEvidence.create({
      data: {
        userId,
        planId: plan.id,
        criterionRevision: plan.criterionRevision ?? 1,
        observedOn: new Date(`${today}T12:00:00.000Z`),
        kind: 'MEASURE',
        status: MEASURE_STATUS,
        text: measure.text,
        value: measure.value,
        indicatorRef: indicator.ref,
        periodStart: weekStart,
        source: 'DERIVED_FROM_PRIORITIES',
      },
    });
  }

  private async clearPendingReviewIfEvidenceChanged(userId: string, planId: string, weekStart: string, territory: string) {
    const pack = packByTerritory(territory);
    if (!pack) return;
    const proposal = await this.prisma.planProposal.findFirst({
      where: { userId, planId, kind: PROPOSAL_KIND, territory: pack.territory },
      orderBy: { createdAt: 'desc' },
    });
    if (!proposal) return;
    const payload = proposal.payload as unknown as ProposalPayload;
    const pending = pendingForWeek(payload, weekStart);
    if (!pending?.evidenceDigest) return;
    const template = payload.templateSnapshot ?? pack.templates.find((row) => row.id === payload.templateId);
    if (!template) return;
    const live = await this.evidenceDigestForPlan(userId, planId, weekStart, payload, template);
    if (live && pending.evidenceDigest !== live) {
      await this.prisma.planProposal.update({
        where: { id: proposal.id },
        data: { payload: asJson(withoutPendingWeek(payload, weekStart)) },
      });
    }
  }

  private async freezeWeekPreparations(userId: string, weekStart: string) {
    await this.prisma.planWeekPreparation.updateMany({
      where: { userId, weekStart, status: { in: ['DRAFT', 'CONFIRMED'] } },
      data: { status: 'FROZEN', frozenAt: new Date() },
    });
  }
}

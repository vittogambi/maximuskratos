import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FORMULARIO_COMPLETO_REF } from '@mk/database';
import { PrismaService } from '../prisma/prisma.service';
import { withoutInternalAlerts } from '../admin/public-reading';
import { alignmentReading, type IadAnswer, type IadId, type IadResults } from '../instrumentos/iad';
import { decideAction, type ContentTag } from '../instrumentos/restrictions';
import { futureOccasions, nextPlanOutcome, previewWeek, type WeekDecision, type WeekEffect, type WeekRevision } from './apply-week';
import { JourneyClock, WeekApplyHook } from './journey-clock';
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
import { canTransition, compatStatus, fromLegacy, type PlanStage } from './plan-lifecycle';
import { assertPlanVersion, focusTargets, nextPlanVersion } from './plan-writes';
import type { ActivatePlanDto, FocusPlanDto, TransitionPlanDto } from './dto/plan-stage.dto';
import { answerLedger } from '../instrumentos/answer-ledger';
import { buildDashboard, territoryDetail } from './dashboard';
import { buildMemory } from './memory-reading';
import { returnPanel } from './return-panel';
import { readOwnPlan } from './own-plan';
import { directionSeed } from './purpose-link';
import { weekCounts } from './week-count';
import { homeBoard, type HomePlan } from './home-board';
import { nextStep } from './next-step';
import { isIsoDate, isMonday, weekStartMonday } from './civil-date';
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
        throw new ConflictException({ message: 'El plan cambió en otra pestaña.', code: 'STALE_PLAN', version: currentVersion });
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
        message: 'La propuesta cambió desde la vista previa. No se guardó la decisión.',
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
      throw new BadRequestException('Esa transición no está permitida.');
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
      return updated;
    });
  }

  async setPlanFocus(userId: string, planId: string, input: FocusPlanDto) {
    const plan = await this.prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan no encontrado.');
    this.guardPlanVersion(plan, input.expectedVersion);
    if (input.enable && this.planStage(plan) !== 'ACTIVE' && this.planStage(plan) !== 'MAINTENANCE') {
      throw new BadRequestException('Solo un plan activo o en mantenimiento puede ser foco.');
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
      throw new UnprocessableEntityException({ message: 'Faltan datos para activar el plan.', code: 'ACTIVATION_INCOMPLETE', missing });
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
      const updated = await tx.personalPlan.update({
        where: { id: plan.id },
        data: {
          status: compatStatus('ACTIVE'),
          stage: 'ACTIVE',
          activatedAt: new Date(),
          version: nextPlanVersion(plan.version),
          ...(capacityMinutes !== undefined ? { capacityMinutes } : {}),
          ...(protectNote !== undefined ? { protectNote } : {}),
        },
      });
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
    },
  ) {
    const tags = parseContentTags(input.contentTags);
    if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
    const plan = await this.ownPlan(userId, planId);
    await this.assertGuide(userId, input.guideId);
    const conversationOutcome = await this.assertContent(userId, tags, {
      healthLimit: input.healthLimit,
      conversation: input.conversation,
    });
    return this.insertAction(plan.id, { ...input, contentTags: tags, conversationOutcome });
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
      throw new BadRequestException('Ámbito desconocido.');
    }
    return domain as ActionDomainName;
  }

  private civilToday(): string {
    return this.clock.today();
  }

  async calendar(userId: string) {
    const plans = await this.prisma.personalPlan.findMany({
      where: { userId },
      include: { actions: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    const actionIds = plans.flatMap((plan) => plan.actions.map((action) => action.id));
    const records = actionIds.length
      ? await this.prisma.actionRecord.findMany({ where: { actionId: { in: actionIds } } })
      : [];
    const today = this.clock.today();
    const occasions = plans.flatMap((plan) => plan.actions.filter((action) => action.active && !action.pausedAt && action.weekday != null).map((action) => ({
      actionId: action.id,
      days: futureOccasions(today, action.weekday as number, action.intervalDays ?? 7),
    })));
    return { timezone: ZONE, weekStart: this.weekStart(), today, plans, records, occasions };
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
      throw new ConflictException({ message: 'Esa ocasión aún no llega.', code: 'OCCASION_FUTURE' });
    }
    if (prior && input.expectedRevision != null && prior.revision !== input.expectedRevision) {
      throw new ConflictException({ message: 'El registro cambió en otra pestaña.', code: 'STALE_RECORD', revision: prior.revision });
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
    return {
      weekStart,
      effects: effects.map((effect) => ({ actionId: effect.actionId, decision: effect.decision, summary: effect.summary })),
      plans,
      guidance,
    };
  }

  purposeHistory(userId: string) {
    return this.prisma.purposeRevision.findMany({
      where: { userId },
      orderBy: { revision: 'desc' },
    });
  }

  async closeWeek(
    userId: string,
    weekStart: string,
    note?: string,
    decisions?: Record<string, WeekDecision>,
    revisions?: Record<string, WeekRevision>,
    outcomes?: Record<string, string>,
  ) {
    const commandDigest = createHash('sha256').update(canonicalHash({
      weekStart,
      note: note ?? null,
      decisions: decisions ?? {},
      revisions: revisions ?? {},
      outcomes: outcomes ?? {},
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
      throw new ConflictException({ message: 'Esa semana ya se cerró con otro comando.', code: 'STALE_REVIEW', id: existing.id });
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
    const snapshot = {
      decisions: decisions ?? {},
      revisions: revisions ?? {},
      applied: !historical,
      effects: effects.map((effect) => ({ actionId: effect.actionId, decision: effect.decision, summary: effect.summary })),
      outcomeChanges: planChanges,
      plans: active.map((plan) => ({
        id: plan.id,
        title: plan.title,
        outcome: plan.outcome,
        actions: plan.actions.filter((action) => action.active && !action.pausedAt).map((action) => ({
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
        throw new ConflictException({ message: 'Esa semana ya se cerró con otro comando.', code: 'STALE_REVIEW', id: again.id });
      }
      await this.weekApply.beforeActionWrite();
      let wrote = false;
      for (const effect of effects) {
        await tx.planAction.update({
          where: { id: effect.actionId },
          data: {
            active: effect.next.active,
            title: effect.next.title,
            doneWhen: effect.next.doneWhen,
            weekday: effect.next.weekday ?? null,
            intervalDays: effect.next.intervalDays ?? 7,
            ...(effect.next.paused
              ? (effect.decision === 'PAUSE' ? { pausedAt: new Date() } : {})
              : { pausedAt: null }),
          },
        });
        if (!wrote) {
          wrote = true;
          await this.weekApply.afterActionWrite();
        }
        if (effect.successor) {
          const previous = active.flatMap((plan) => plan.actions).find((action) => action.id === effect.actionId);
          await tx.planAction.create({
            data: {
              planId: previous?.planId ?? active[0].id,
              title: effect.successor.title,
              doneWhen: effect.successor.doneWhen,
              weekday: effect.successor.weekday,
              intervalDays: effect.successor.intervalDays,
              replacesActionId: effect.successor.replacesActionId,
              preparation: effect.successor.preparation ?? previous?.preparation ?? null,
              domain: previous?.domain ?? null,
              contentTags: previous?.contentTags ?? [],
              active: true,
            },
          });
        }
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
        if (won) throw new ConflictException({ message: 'Esa semana ya se cerró con otro comando.', code: 'STALE_REVIEW', id: won.id });
      }
      throw err;
    }
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
          paused: Boolean(action.pausedAt),
          preparation: action.preparation,
        }))),
        decisions ?? {},
        revisions ?? {},
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const message = code === 'REDUCE_REQUIRES_CHANGE'
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
    let focusWeekCounts = null;
    if (focusPlan) {
      const weekStart = this.weekStart();
      const actions = await this.prisma.planAction.findMany({ where: { planId: focusPlan.id, active: true } });
      const records = await this.prisma.actionRecord.findMany({ where: { actionId: { in: actions.map((a) => a.id) } } });
      const reviewed = Boolean(await this.prisma.weekReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } }));
      focusWeekCounts = weekCounts({
        weekStart,
        today: this.civilToday(),
        weekReviewed: reviewed,
        legacyWeek: false,
        actions: actions.map((a) => ({ id: a.id, weekday: a.weekday, intervalDays: a.intervalDays, occasionsPerWeek: a.occasionsPerWeek, active: a.active })),
        schedules: [],
        records: records.map((r) => ({ actionId: r.actionId, day: r.day, status: r.status })),
        cancellations: [],
      });
    }
    return buildDashboard({
      ledger,
      catalogQuestions: questions.filter((q) => q.sourceRef).map((q) => ({ sourceRef: q.sourceRef as string })),
      plans,
      focusWeekCounts,
      focusPlanId: focusPlan?.id ?? null,
    });
  }

  async territoryView(userId: string, territory: string) {
    const t = territory.toUpperCase();
    if (!['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA'].includes(t)) {
      throw new BadRequestException('Ámbito desconocido.');
    }
    const [ledger, questions] = await Promise.all([
      answerLedger(this.prisma, userId),
      this.prisma.question.findMany({
        select: { sourceRef: true },
        take: 800,
      }),
    ]);
    return territoryDetail(t as 'MENTALIDAD' | 'FINANZAS' | 'RELACIONES' | 'SALUD_FISICA', ledger, questions.filter((q) => q.sourceRef).map((q) => ({ sourceRef: q.sourceRef as string })));
  }

  async memory(userId: string) {
    const [purpose, plans] = await Promise.all([
      this.prisma.purposeRevision.findMany({ where: { userId }, orderBy: { revision: 'desc' }, take: 5 }),
      this.prisma.personalPlan.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    ]);
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
    return buildMemory({
      signed: readPurpose(signed),
      draft: draft && draft.id !== signed?.id ? readPurpose(draft) : null,
      plans: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        outcome: plan.outcome,
        whyItMatters: plan.whyItMatters,
        stage: plan.stage,
        closedReason: plan.closedReason,
        achievedAt: plan.achievedAt?.toISOString() ?? null,
      })),
    });
  }

  async returnReading(userId: string) {
    const plan = await this.prisma.personalPlan.findFirst({
      where: { userId, OR: [{ isFocus: true }, { status: 'ACTIVE' }] },
      orderBy: [{ isFocus: 'desc' }, { updatedAt: 'desc' }],
    });
    const lastReview = await this.prisma.weekReview.findFirst({ where: { userId }, orderBy: { closedAt: 'desc' } });
    const lastRecord = await this.prisma.actionRecord.findFirst({
      where: { action: { plan: { userId } } },
      orderBy: { day: 'desc' },
    });
    const today = this.civilToday();
    const daysSince = lastRecord?.day
      ? Math.max(0, Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${lastRecord.day}T12:00:00Z`)) / 86400000))
      : null;
    return returnPanel({
      planTitle: plan?.title ?? null,
      planOutcome: plan?.outcome ?? null,
      protectNote: plan?.protectNote ?? null,
      lastReviewNote: lastReview?.note ?? null,
      daysSinceLastActivity: daysSince,
      pendingOccasionDays: daysSince != null && daysSince >= 21 ? 0 : 0,
    });
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
      expectedVersion?: number;
    },
  ) {
    const plan = await this.ownPlan(userId, planId);
    this.guardPlanVersion(plan, input.expectedVersion);
    return this.prisma.personalPlan.update({
      where: { id: plan.id },
      data: {
        title: input.title?.trim(),
        outcome: input.outcome?.trim(),
        whyItMatters: input.whyItMatters !== undefined ? input.whyItMatters : undefined,
        whyStatus: input.whyStatus ?? undefined,
        territory: input.territory ?? undefined,
        version: nextPlanVersion(plan.version),
      },
    });
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

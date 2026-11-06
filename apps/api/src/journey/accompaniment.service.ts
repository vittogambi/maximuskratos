import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { FORMULARIO_COMPLETO_REF } from '@mk/database';
import { PrismaService } from '../prisma/prisma.service';
import { TERRITORIES, type Territory } from '../instrumentos/glossary';
import { decideAction, type ContentTag } from '../instrumentos/restrictions';
import { answerLedger } from '../instrumentos/answer-ledger';
import { accountTextsFromLedger, healthFactFromLedger } from '../instrumentos/ledger-account';
import { parseContentTags, parseConversation, parseHealthLimit, unfinishedHelp, type HealthLimitOutcome } from './plan-gate';
import { JourneyClock } from './journey-clock';
import { canonicalHash } from './accompaniment/canon';
import { devolutionOf, type AccountSources } from './accompaniment/devolution';
import { familyById } from './accompaniment/families';
import { draftAccompanimentHelp, type HelpDraftV2 } from './accompaniment/help';
import { assessObservation, depthContrast, type ExperimentAspect, type ExperimentDecision, type ObservationStatus, type RecipientState } from './accompaniment/experiments';
import { limitsForAction, proposeAccompaniment, type AccompanimentInput, type AccompanimentProposal } from './accompaniment/rules';
import type { RejectedInterpretation } from './accompaniment/personalization';
import { BARRIERS, declarationToGoal, isGoalKind, RULES_VERSION, type BarrierChoice, type BarrierKind, type GoalKind, type Situation } from './accompaniment/vocab';

export type AccompanimentBody = {
  goalText?: string | null;
  goalKind?: string | null;
  interest?: string | null;
  territory?: string | null;
  situation?: string | null;
  occasions?: number | null;
  weeklyMinutes?: number | null;
  minutesPerOccasion?: number | null;
  reviewMinutes?: number | null;
  barrier?: { kind?: string; choice?: string; detail?: string | null } | null;
  requestedTags?: unknown;
  declaredProtection?: boolean;
  sustainChosen?: boolean;
  loadTolerable?: boolean | null;
  indication?: { activity?: string; subjectRef?: string; scope?: string; restrictions?: string; allows?: string[] } | null;
  urgency?: boolean;
  country?: string | null;
  weekday?: number | null;
  flexible?: boolean;
  limits?: { subjectRef?: string | null; outcome?: string }[];
  conversation?: string | null;
  actionSubject?: string | null;
  planChoice?: 'KEEP' | 'MODIFY' | 'REPLACE' | null;
  expectedPlanUpdatedAt?: string | null;
  adoptFamilyId?: string | null;
  edits?: Record<string, string> | null;
  commandKey?: string | null;
  planId?: string | null;
  actionId?: string | null;
  path?: 'EXPLORAR' | 'PREPARAR' | 'SEGUIR' | null;
  helpPreference?: 'GUIADA' | 'PUNTUAL' | 'PROPIO' | null;
  requestedFamilyId?: string | null;
  helpRequested?: boolean;
  standardChoice?: 'FULL' | 'PARTIAL' | null;
  digest?: string | null;
  headVersion?: number | null;
  choice?: 'ACCEPT' | 'REJECT';
  rejectReason?: string | null;
  combinationId?: string | null;
  purposeRevisionId?: string | null;
};

type Built = {
  input: AccompanimentInput;
  proposal: AccompanimentProposal;
  help: HelpDraftV2;
  digest: string;
  canonical: string;
  readingId: string | null;
  purposeRevisionId: string | null;
  plan: { id: string; updatedAt: Date; title: string; outcome: string } | null;
  headVersion: number;
  maintenanceMinutes: number;
  favorableDistinctOccasions: number;
  devolution: ReturnType<typeof devolutionOf>;
  formularioCompleted: boolean;
  directionStatus: string | null;
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function readWholeNumber(value: number | null | undefined, label: string, max: number): number | null {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
    throw new BadRequestException(`${label} tiene que ser un entero entre 0 y ${max}.`);
  }
  return value;
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

@Injectable()
export class AccompanimentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: JourneyClock,
  ) {}

  async devolution(userId: string) {
    const purpose = await this.prisma.purposeRevision.findFirst({ where: { userId }, orderBy: { revision: 'desc' } });
    const texts = await this.accountSources(userId);
    const direction = directionOf(purpose);
    const reading = devolutionOf({
      direction: direction === 'EXPLORANDO' || direction === 'PROVISIONAL' || direction === 'CONFIRMADO_POR_USUARIO' ? direction : null,
      ...texts,
      ikigaiActivity: ikigaiText(purpose?.content).hypothesis,
      goalText: null,
      goalKind: null,
    });
    return { ...reading, saved: await this.savedChoices(userId) };
  }

  async preview(userId: string, body: AccompanimentBody) {
    const built = await this.build(userId, body);
    return this.view(built, false);
  }

  async confirm(userId: string, body: AccompanimentBody) {
    const canonical = this.canonicalOf(body);
    if (body.commandKey) {
      const existing = await this.prisma.accompanimentDecision.findUnique({ where: ownDecision(userId, body.commandKey) });
      if (existing && existing.canonicalHash !== canonical) {
        throw new ConflictException({ message: 'La misma clave trae otro contenido. No se reutilizó la decisión.', code: 'IDEMPOTENT_CONFLICT' });
      }
      if (existing) return { id: existing.id, repeated: true, effect: existing.effect, proposal: existing.context, help: existing.help, status: existing.status };
    }
    if (body.path && !['EXPLORAR', 'PREPARAR', 'SEGUIR'].includes(body.path)) throw new BadRequestException('Camino desconocido.');
    if (body.helpPreference && !['GUIADA', 'PUNTUAL', 'PROPIO'].includes(body.helpPreference)) throw new BadRequestException('Preferencia desconocida.');
    await this.assertOwned(userId, body);
    const built = await this.build(userId, body);
    if (body.headVersion != null && body.headVersion !== built.headVersion) {
      throw new ConflictException({ message: 'El plan principal cambió. Vuelve a mirar la propuesta.', code: 'STALE_HEAD', headVersion: built.headVersion, digest: built.digest });
    }
    if (body.digest && body.digest !== built.digest) {
      throw new ConflictException({
        message: 'La propuesta cambió mientras la revisabas. No guardamos tu decisión. Revisa la información actualizada e inténtalo nuevamente.',
        code: 'STALE_PREVIEW',
        proposal: built.proposal,
        help: built.help,
        digest: built.digest,
      });
    }
    const choice = body.choice ?? 'ACCEPT';
    if (choice === 'REJECT') return this.store(userId, body, built, 'REJECTED', null);
    return this.store(userId, body, built, 'ACCEPTED', body.adoptFamilyId ?? null);
  }

  async cancelOccasion(userId: string, input: { actionId: string; day: string; reason: string }) {
    const action = await this.prisma.planAction.findUnique({ where: { id: input.actionId }, include: { plan: true, records: true } });
    if (!action || action.plan.userId !== userId) throw new ForbiddenException('Esa acción no es de esta cuenta.');
    const done = action.records.find((row) => row.day === input.day && row.status === 'DONE');
    if (done) throw new ConflictException({ message: 'Esa ocasión ya quedó hecha. Cancelarla no borra la evidencia.', code: 'OCCASION_DONE' });
    const reason = input.reason?.trim();
    if (!reason) throw new BadRequestException('La cancelación necesita un motivo.');
    try {
      return await this.prisma.occasionCancellation.create({
        data: {
          actionId: action.id,
          day: input.day,
          reason,
          source: 'MEMBER_DECISION',
          rulesVersion: RULES_VERSION,
          effectiveFrom: this.clock.today(),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await this.prisma.occasionCancellation.findUnique({ where: { actionId_day: { actionId: action.id, day: input.day } } });
        if (existing && existing.reason === reason) return existing;
        throw new ConflictException({ message: 'Esa ocasión ya tiene otra cancelación.', code: 'IDEMPOTENT_CONFLICT' });
      }
      throw err;
    }
  }

  async addObservation(userId: string, experimentId: string, input: { aspect: string; status: string; recipient?: string | null; observed?: string | null; actionRecordId?: string | null }) {
    const experiment = await this.ownedExperiment(userId, experimentId);
    const revision = experiment.revisions[0];
    if (!revision) throw new BadRequestException('El experimento no tiene revisión.');
    const judged = assessObservation({
      aspect: input.aspect as ExperimentAspect,
      status: input.status as ObservationStatus,
      recipient: (input.recipient ?? null) as RecipientState | null,
      observed: input.observed,
    });
    if (!judged.allowed) throw new BadRequestException(judged.reason ?? 'Esa observación no se puede guardar así.');
    return this.prisma.experimentObservation.create({
      data: {
        experimentId: experiment.id,
        revisionId: revision.id,
        aspect: input.aspect,
        status: judged.status,
        recipient: judged.recipient,
        observed: input.observed?.trim() || null,
        source: 'DECLARED_BY_MEMBER',
        actionRecordId: input.actionRecordId ?? null,
      },
    });
  }

  async changeHypothesis(userId: string, experimentId: string, input: { hypothesis: string; sample?: string | null; opportunity?: string | null; missing?: string | null }) {
    const experiment = await this.ownedExperiment(userId, experimentId);
    const current = experiment.revisions[0];
    const hypothesis = input.hypothesis?.trim();
    if (!hypothesis) throw new BadRequestException('La hipótesis nueva necesita texto.');
    const created = await this.prisma.ikigaiExperimentRevision.create({
      data: {
        experimentId: experiment.id,
        revision: (current?.revision ?? 0) + 1,
        hypothesis,
        sample: input.sample?.trim() || current?.sample || null,
        opportunity: input.opportunity?.trim() || current?.opportunity || null,
        missing: input.missing?.trim() || null,
        purposeRevisionId: current?.purposeRevisionId ?? null,
      },
    });
    const prior = await this.prisma.experimentObservation.count({ where: { revisionId: current?.id ?? 'none' } });
    return { revision: created, priorObservations: prior };
  }

  async reviewExperiment(userId: string, experimentId: string, input: { decision: string; evidence?: string | null; meaning?: string | null; matters?: string | null; change?: string | null; link?: string | null }) {
    const experiment = await this.ownedExperiment(userId, experimentId);
    const revision = experiment.revisions[0];
    if (!revision) throw new BadRequestException('El experimento no tiene revisión.');
    const decision = input.decision as ExperimentDecision;
    if (!['KEEP', 'MODIFY', 'DISCARD', 'INCONCLUSIVE'].includes(decision)) throw new BadRequestException('Decisión desconocida.');
    const attempted = [input.meaning, input.matters, input.change, input.link, input.evidence].some((value) => value?.trim());
    const depth = depthContrast({ ...input, decision: decision === 'INCONCLUSIVE' ? null : decision === 'DISCARD' ? 'NOT_APPLY' : decision === 'MODIFY' ? 'CHANGE' : 'KEEP' });
    if (attempted && !depth) {
      throw new BadRequestException('El contraste necesita significado, importancia, cambio, vínculo y evidencia, sin corchetes ni la plantilla intacta. No se guardó.');
    }
    const review = await this.prisma.experimentReview.create({
      data: { experimentId: experiment.id, revisionId: revision.id, decision, evidence: input.evidence?.trim() || null },
    });
    if (decision === 'DISCARD' || decision === 'KEEP') {
      await this.prisma.ikigaiExperiment.update({ where: { id: experiment.id }, data: { status: decision === 'DISCARD' ? 'CLOSED' : 'ACTIVE' } });
    }
    let depthWritten = false;
    if (depth) {
      await this.prisma.depthConfirmation.create({
        data: { userId, component: 'ikigai', payload: asJson(depth), purposeRevisionId: revision.purposeRevisionId },
      });
      depthWritten = true;
    }
    return { review, depthWritten, alignmentUntouched: true };
  }

  private async ownedExperiment(userId: string, experimentId: string) {
    const experiment = await this.prisma.ikigaiExperiment.findUnique({
      where: { id: experimentId },
      include: { revisions: { orderBy: { revision: 'desc' } } },
    });
    if (!experiment || experiment.userId !== userId) throw new NotFoundException('Ese experimento no es de esta cuenta.');
    return experiment;
  }

  private view(built: Built, persisted: boolean) {
    return {
      proposal: built.proposal,
      help: built.help,
      digest: built.digest,
      headVersion: built.headVersion,
      devolution: built.devolution,
      plan: built.plan ? { id: built.plan.id, updatedAt: built.plan.updatedAt.toISOString(), choices: ['KEEP', 'MODIFY', 'REPLACE'] } : null,
      declarationsPersisted: persisted,
      favorableDistinctOccasions: built.favorableDistinctOccasions,
    };
  }

  private canonicalOf(body: AccompanimentBody): string {
    return canonicalHash({
      goalText: body.goalText ?? null,
      goalKind: body.goalKind ?? null,
      interest: body.interest ?? null,
      territory: body.territory ?? null,
      situation: body.situation ?? null,
      occasions: body.occasions ?? null,
      weeklyMinutes: body.weeklyMinutes ?? null,
      minutesPerOccasion: body.minutesPerOccasion ?? null,
      reviewMinutes: body.reviewMinutes ?? null,
      barrier: body.barrier ?? null,
      requestedTags: body.requestedTags ?? null,
      declaredProtection: Boolean(body.declaredProtection),
      sustainChosen: Boolean(body.sustainChosen),
      loadTolerable: body.loadTolerable ?? null,
      indication: body.indication ?? null,
      urgency: Boolean(body.urgency),
      country: body.country ?? null,
      weekday: body.weekday ?? null,
      flexible: Boolean(body.flexible),
      limits: body.limits ?? null,
      conversation: body.conversation ?? null,
      actionSubject: body.actionSubject ?? null,
      planChoice: body.planChoice ?? null,
      adoptFamilyId: body.adoptFamilyId ?? null,
      edits: body.edits ?? null,
      choice: body.choice ?? 'ACCEPT',
      rejectReason: body.rejectReason ?? null,
      combinationId: body.combinationId ?? null,
      planId: body.planId ?? null,
      actionId: body.actionId ?? null,
      path: body.path ?? null,
      helpPreference: body.helpPreference ?? null,
      requestedFamilyId: body.requestedFamilyId ?? null,
    });
  }

  /** Plan vigente para preview y MODIFY: ACTIVE, o el borrador más reciente en preparación. */
  private async primaryPlan(userId: string) {
    const active = await this.prisma.personalPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (active) return active;
    return this.prisma.personalPlan.findFirst({
      where: { userId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async build(userId: string, body: AccompanimentBody): Promise<Built> {
    const territory = body.territory == null || body.territory === '' ? null : body.territory;
    if (territory && !TERRITORIES.includes(territory as Territory)) throw new BadRequestException('Ámbito desconocido.');
    const occasions = readWholeNumber(body.occasions, 'La frecuencia', 21);
    const weeklyMinutes = readWholeNumber(body.weeklyMinutes, 'Los minutos semanales', 1680);
    body = { ...body, occasions, weeklyMinutes };
    if (body.goalKind && !isGoalKind(body.goalKind)) throw new BadRequestException('Tipo de meta desconocido.');
    const situation = (body.situation ?? null) as Situation | null;
    if (situation && !['NONE', 'PAUSE', 'RETURN', 'RECONFIRM'].includes(situation)) throw new BadRequestException('Situación desconocida.');
    const barrier = body.barrier?.kind
      ? {
          kind: body.barrier.kind as BarrierKind,
          choice: body.barrier.choice as BarrierChoice,
          detail: body.barrier.detail ?? null,
        }
      : null;
    if (barrier && (!BARRIERS.includes(barrier.kind) || !['RECOGNIZE', 'REJECT', 'OTHER', 'UNKNOWN'].includes(barrier.choice))) {
      throw new BadRequestException('Barrera desconocida.');
    }
    const tags = parseContentTags(body.requestedTags);
    if (!tags) throw new BadRequestException('Marca de contenido desconocida.');
    const [purpose, reading, clarifications, plan, head, records, actions] = await Promise.all([
      this.prisma.purposeRevision.findFirst({ where: { userId }, orderBy: { revision: 'desc' } }),
      this.prisma.coreReading.findFirst({ where: { userId, methodVersion: 'ia-mk-cuest@0.1' }, orderBy: { computedAt: 'desc' } }),
      this.prisma.memberClarification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.primaryPlan(userId),
      this.prisma.accompanimentHead.findUnique({ where: { userId } }),
      this.prisma.actionRecord.findMany({ where: { action: { plan: { userId } } }, orderBy: { day: 'desc' }, take: 50 }),
      this.prisma.planAction.findMany({ where: { plan: { userId, status: 'ACTIVE' }, active: true } }),
    ]);
    if (body.purposeRevisionId && body.purposeRevisionId !== purpose?.id) throw new BadRequestException('Esa revisión de propósito no está vigente.');
    if (body.combinationId) {
      const ids = combinationIds(purpose?.content);
      if (!ids.includes(body.combinationId)) throw new BadRequestException('Esa combinación no es de esta cuenta.');
    }
    const signals = reading && typeof reading.output === 'object' && reading.output && 'signals' in (reading.output as object)
      ? (reading.output as { signals: { sourceRef: string; raw: number | null; quality?: string }[] }).signals
      : [];
    const raw: Record<string, number | null> = {};
    for (const signal of signals) raw[signal.sourceRef] = signal.raw;
    const ineligibleCapture = signals.some((signal) => signal.quality && signal.quality !== 'ETIQUETADA');
    const storedLimits = clarifications
      .filter((row) => row.scope === 'HEALTH' && (row.outcome === 'CURRENT_LIMIT' || row.outcome === 'NO_CURRENT_LIMIT'))
      .filter((row, index, list) => list.findIndex((item) => item.subjectRef === row.subjectRef && item.outcome === row.outcome) === index)
      .map((row) => ({ subjectRef: row.subjectRef, outcome: row.outcome as HealthLimitOutcome }));
    const pendingLimits = (body.limits ?? []).map((row) => {
      const outcome = readLimit(row.outcome);
      if (!outcome) throw new BadRequestException('Aclaración de límite desconocida.');
      return { subjectRef: row.subjectRef ?? null, outcome };
    });
    const ledger = await answerLedger(this.prisma, userId);
    const health = healthFactFromLedger(ledger);
    const texts = accountTextsFromLedger(ledger);
    const lastDay = records[0]?.day ?? null;
    const today = this.clock.today();
    const favorableDays = new Set(records.filter((row) => row.resultStatus === 'OBSERVED').map((row) => row.day));
    const maintenanceMinutes = actions.reduce((sum, action) => sum + (action.minutesPerOccasion ?? 0) * (action.occasionsPerWeek ?? (action.weekday == null ? 0 : 1)), 0);
    const storedProtection = clarifications.some((row) => row.scope === 'CURRENT_SITUATION' && row.outcome === 'PROTECT_ESSENTIAL');
    const savedGoal = await this.previousGoal(userId);
    const recovered = recoveredGoal(body, savedGoal);
    const goalText = body.goalText?.trim() ? body.goalText : recovered?.text ?? body.goalText ?? null;
    const ikigai = ikigaiText(purpose?.content);
    const knownFields = {
      ...(body.edits ?? {}),
      ...(!body.edits?.hipotesis && ikigai.hypothesis ? { hipotesis: ikigai.hypothesis } : {}),
      ...(!body.edits?.muestra && ikigai.sample ? { muestra: ikigai.sample } : {}),
    };
    const input: AccompanimentInput = {
      goalText,
      goalKind: isGoalKind(body.goalKind) ? body.goalKind : null,
      interest: body.interest ?? null,
      territory: territory as Territory | null,
      situation,
      occasions: body.occasions ?? null,
      weeklyMinutes: body.weeklyMinutes ?? null,
      minutesPerOccasion: body.minutesPerOccasion ?? null,
      maintenanceMinutes,
      reviewMinutes: body.reviewMinutes === undefined ? null : body.reviewMinutes,
      barrier,
      rawSignals: raw,
      limits: [...storedLimits, ...pendingLimits],
      health,
      conversation: readConversation(body.conversation),
      actionSubject: body.actionSubject ?? null,
      requestedTags: tags,
      declaredProtection: Boolean(body.declaredProtection) || storedProtection,
      favorableDistinctOccasions: favorableDays.size,
      sustainChosen: Boolean(body.sustainChosen),
      loadTolerable: body.loadTolerable ?? null,
      ineligibleCapture,
      daysSinceLastRecord: lastDay ? daysBetween(lastDay, today) : null,
      hadPlannedOccasions: actions.some((action) => action.weekday != null || (action.occasionsPerWeek ?? 0) > 0),
      indication: body.indication?.activity
        ? {
            activity: body.indication.activity,
            subjectRef: body.indication.subjectRef ?? '',
            scope: body.indication.scope ?? '',
            restrictions: body.indication.restrictions ?? '',
            allows: (body.indication.allows ?? []) as ContentTag[],
          }
        : null,
      urgency: Boolean(body.urgency),
      country: body.country ?? null,
      valueRef: textField(purpose?.content, 'value'),
      helpPreference: body.helpPreference ?? null,
      requestedFamilyId: body.requestedFamilyId ?? null,
      helpRequested: Boolean(body.helpRequested),
      standardChoice: body.standardChoice ?? null,
      weeklyStandard: texts.weeklyStandard,
      postpone: texts.postpone,
      recoveredGoal: recovered,
      goalSource: recovered && !body.goalText?.trim() ? 'RECOVERED' : 'REQUEST',
      general: reading && typeof reading.output === 'object' && reading.output && 'general' in (reading.output as object)
        ? ((reading.output as { general: number | null }).general)
        : null,
      weekday: body.weekday ?? null,
      flexible: Boolean(body.flexible),
    };
    const rejected: RejectedInterpretation[] = clarifications
      .filter((row) => row.scope === 'INTERPRETATION' && row.outcome === 'REJECT')
      .map((row) => ({
        sourceRef: row.subjectRef ?? '',
        responseRevision: Number.parseInt(row.detail ?? '0', 10) || 0,
      }))
      .filter((row) => row.sourceRef);
    const ledgerEntries = await answerLedger(this.prisma, userId);
    const revisionAt = (sourceRef: string) => ledgerEntries.find((entry) => entry.sourceRef === sourceRef)?.revision ?? 0;
    let proposal = proposeAccompaniment(input);
    if (rejected.length) {
      const blocked = new Set(
        rejected.filter((row) => revisionAt(row.sourceRef) === row.responseRevision).map((row) => row.sourceRef),
      );
      proposal = {
        ...proposal,
        reasons: proposal.reasons.filter((reason) => !reason.refs.some((ref) => blocked.has(ref))),
      };
    }
    let help = draftAccompanimentHelp(proposal, { ...input, knownFields });
    if (body.adoptFamilyId && proposal.alternative?.familyId === body.adoptFamilyId) {
      const alt = familyById(body.adoptFamilyId);
      if (!alt) throw new BadRequestException('Esa alternativa no está en la propuesta.');
      proposal = { ...proposal, familyId: alt.id, templateVersion: alt.templateVersion, mode: alt.mode, territory: alt.territory, pillar: alt.pillar, incompatible: null, requiresAction: alt.id !== 'X-PAUSE', actionCount: alt.id === 'X-PAUSE' ? 0 : 1, alternative: null };
      help = draftAccompanimentHelp(proposal, { ...input, knownFields });
      help = { ...help, adopted: true, action: alt.action };
    }
    const digest = createHash('sha256').update(canonicalHash({
      rules: proposal.rulesVersion,
      family: proposal.familyId,
      mode: proposal.mode,
      status: proposal.modeStatus,
      situation: proposal.situation,
      incompatible: proposal.incompatible?.reason ?? null,
      goal: input.goalText,
      kind: input.goalKind,
      capacity: [input.occasions, input.weeklyMinutes, input.reviewMinutes],
      barrier,
      limits: input.limits,
      indication: input.indication,
      clarifications: clarifications.map((row) => ({ id: row.id, scope: row.scope, outcome: row.outcome, subjectRef: row.subjectRef })),
      plan: plan ? { id: plan.id, updatedAt: plan.updatedAt.toISOString() } : null,
      purposeRevisionId: purpose?.id ?? null,
      readingId: reading?.id ?? null,
      tags,
    })).digest('hex').slice(0, 24);
    return {
      input,
      proposal,
      help,
      digest,
      canonical: this.canonicalOf(body),
      readingId: reading?.id ?? null,
      purposeRevisionId: purpose?.id ?? null,
      plan: plan ? { id: plan.id, updatedAt: plan.updatedAt, title: plan.title, outcome: plan.outcome } : null,
      headVersion: head?.version ?? 0,
      maintenanceMinutes,
      favorableDistinctOccasions: favorableDays.size,
      devolution: devolutionOf({
        direction: directionOf(purpose) === 'EXPLORANDO' || directionOf(purpose) === 'PROVISIONAL' || directionOf(purpose) === 'CONFIRMADO_POR_USUARIO' ? directionOf(purpose) as AccountSources['direction'] : null,
        ...texts,
        ikigaiActivity: ikigaiText(purpose?.content).hypothesis,
        goalText: goalText ?? null,
        goalKind: isGoalKind(body.goalKind) ? body.goalKind : null,
      }),
      formularioCompleted: Boolean(await this.prisma.diagnosticFormResult.findFirst({
        where: { formCode: 'formulario-completo', session: { userId, status: 'COMPLETED', version: { definitionRef: FORMULARIO_COMPLETO_REF } } },
      })),
      directionStatus: directionOf(purpose),
    };
  }

  private async savedChoices(userId: string) {
    const rows = await this.prisma.memberClarification.findMany({
      where: { userId, scope: { in: ['HELP_PREFERENCE', 'PATH'] } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      preference: rows.find((row) => row.scope === 'HELP_PREFERENCE')?.outcome ?? null,
      path: rows.find((row) => row.scope === 'PATH')?.outcome ?? null,
    };
  }

  private async previousGoal(userId: string) {
    const row = await this.prisma.accompanimentDecision.findFirst({
      where: { userId, status: 'ACCEPTED', goalKind: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!row?.goalKind || !isGoalKind(row.goalKind)) return null;
    const territory = row.territory && TERRITORIES.includes(row.territory as Territory) ? row.territory as Territory : null;
    return { text: row.goalText ?? '', kind: row.goalKind, territory };
  }

  private async assertOwned(userId: string, body: AccompanimentBody) {
    if (body.planId) {
      const plan = await this.prisma.personalPlan.findUnique({ where: { id: body.planId } });
      if (!plan || plan.userId !== userId) throw new ForbiddenException('Ese plan no es de esta cuenta.');
    }
    if (body.actionId) {
      const action = await this.prisma.planAction.findUnique({ where: { id: body.actionId }, include: { plan: true } });
      if (!action || action.plan.userId !== userId) throw new ForbiddenException('Esa acción no es de esta cuenta.');
    }
  }

  private async accountSources(userId: string): Promise<Pick<AccountSources, 'visionDay' | 'visionPhrase' | 'valueDefended' | 'weeklyStandard' | 'postpone'>> {
    const ledger = await answerLedger(this.prisma, userId);
    return accountTextsFromLedger(ledger);
  }

  private async store(userId: string, body: AccompanimentBody, built: Built, status: 'ACCEPTED' | 'REJECTED', adoptFamilyId: string | null) {
    const pending = unfinishedHelp(Object.values(body.edits ?? {}).join(' '), null);
    if (pending) throw new BadRequestException(pending);
    if (status === 'ACCEPTED' && built.proposal.incompatible && !adoptFamilyId) {
      throw new ConflictException({ message: built.proposal.incompatible.reason, code: 'INCOMPATIBLE', alternative: built.proposal.alternative, digest: built.digest });
    }
    if (built.plan && status === 'ACCEPTED' && built.proposal.situation !== 'PAUSE' && built.proposal.requiresAction && !body.planChoice) {
      throw new ConflictException({ message: 'Ya hay un plan principal. Elige mantenerlo, modificarlo o sustituirlo.', code: 'PLAN_CHOICE_REQUIRED', choices: ['KEEP', 'MODIFY', 'REPLACE'], plan: { id: built.plan.id, updatedAt: built.plan.updatedAt.toISOString() } });
    }
    if (built.plan && body.planChoice && body.planChoice !== 'KEEP' && body.expectedPlanUpdatedAt && body.expectedPlanUpdatedAt !== built.plan.updatedAt.toISOString()) {
      throw new ConflictException({ message: 'Este plan tiene cambios más recientes. Revísalos antes de continuar.', code: 'STALE_PLAN', updatedAt: built.plan.updatedAt.toISOString() });
    }
    const family = familyById(built.proposal.familyId);
    const tags = family?.tags ?? [];
    const resolvedHealth = limitsForAction(
      built.input.health ?? { illness: 'UNKNOWN', injuryHistory: 'UNKNOWN', injuryLimitsNow: null, medication: 'UNKNOWN', pain: 'UNKNOWN', medicalLimit: 'UNKNOWN', conversationUnsafe: null },
      built.input.limits ?? [],
      built.input.actionSubject ?? built.proposal.territory,
      built.input.conversation ?? null,
    );
    const decision = decideAction(tags, resolvedHealth);
    if (status === 'ACCEPTED' && built.proposal.requiresAction && !decision.allowed) {
      throw new ConflictException({ message: decision.reason, code: 'INCOMPATIBLE', alternatives: decision.alternatives });
    }
    const commandKey = body.commandKey ?? `accompaniment:${userId}:${built.digest}:${status}:${body.planChoice ?? 'CREATE'}`;
    const again = await this.prisma.accompanimentDecision.findUnique({ where: ownDecision(userId, commandKey) });
    if (again) {
      if (again.canonicalHash !== built.canonical) throw new ConflictException({ message: 'La misma clave trae otro contenido.', code: 'IDEMPOTENT_CONFLICT' });
      return { id: again.id, repeated: true, effect: again.effect, proposal: again.context, help: again.help, status: again.status };
    }
    const today = this.clock.today();
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
        const won = await tx.accompanimentDecision.findUnique({ where: ownDecision(userId, commandKey) });
        if (won) {
          if (won.canonicalHash !== built.canonical) throw new ConflictException({ message: 'La misma clave trae otro contenido.', code: 'IDEMPOTENT_CONFLICT' });
          return { id: won.id, repeated: true, effect: won.effect, proposal: won.context, help: won.help, status: won.status };
        }
        let planId = built.plan?.id ?? null;
        let actionId: string | null = null;
        let experimentId: string | null = null;
        if (status === 'ACCEPTED' && built.proposal.situation === 'PAUSE' && built.plan) {
          await tx.personalPlan.update({ where: { id: built.plan.id }, data: { status: 'PAUSED' } });
        }
        if (status === 'ACCEPTED' && built.proposal.requiresAction && body.planChoice !== 'KEEP' && family && built.help.action) {
          const linkKind = built.proposal.mode === 'CONTENCION' ? 'PROTECTIVE' : built.proposal.mode === 'EXPANSION' ? 'EXPLORATORY' : built.proposal.mode === 'CONSOLIDACION' ? 'DIRECT' : 'ENABLING';
          if (built.plan && body.planChoice === 'REPLACE') {
            await tx.personalPlan.update({ where: { id: built.plan.id }, data: { status: 'PAUSED' } });
            planId = null;
          }
          if (!planId) {
            const created = await tx.personalPlan.create({
              data: {
                userId,
                title: built.help.action.slice(0, 180),
                outcome: built.help.cycleResult.text.slice(0, 500),
                priorityNote: built.proposal.reasons.map((row) => row.text).join(' ').slice(0, 1000),
                linkKind,
                purposeRevisionId: built.purposeRevisionId,
                sourceCombinationId: body.combinationId ?? null,
                status: 'DRAFT',
                stage: 'PREPARING',
                territory: built.proposal.territory,
                entry: 'GOAL',
              },
            });
            planId = created.id;
            await tx.planProposal.create({
              data: {
                userId,
                planId,
                territory: built.proposal.territory,
                kind: 'ACTION',
                payload: {
                  familyId: family.id,
                  title: built.help.action,
                  doneWhen: built.help.doneWhen,
                },
                reasons: built.proposal.reasons,
                status: 'ACCEPTED',
                rulesVersion: built.proposal.rulesVersion,
                engineVersion: built.proposal.engineVersion,
                commandKey: `${commandKey}:proposal:action`,
                decidedAt: new Date(),
              },
            });
          }
          const scheduled = Boolean(body.flexible) || typeof body.weekday === 'number';
          const action = await tx.planAction.create({
            data: {
              planId,
              title: built.help.action.slice(0, 180),
              doneWhen: built.help.doneWhen ?? 'Quedó hecho el paso.',
              domain: built.proposal.pillar === 'ESPIRITU' ? 'ESPIRITU' : built.proposal.pillar === 'CUERPO' ? 'CUERPO' : built.proposal.pillar === 'MENTE' ? 'MENTE' : null,
              territory: built.proposal.territory,
              weekday: scheduled && typeof body.weekday === 'number' ? body.weekday : null,
              preparation: built.help.minimumVersion,
              effectiveFrom: today,
              contentTags: tags,
              origin: 'SYSTEM_TEMPLATE',
              familyId: family.id,
              templateVersion: family.templateVersion,
              templateTags: tags,
              minutesPerOccasion: built.proposal.load.minutesPerOccasion,
              occasionsPerWeek: body.flexible ? body.occasions ?? null : null,
              minimumVersion: built.help.minimumVersion,
              alternative: built.help.alternative?.text ?? null,
            },
          });
          actionId = action.id;
          if (family.id === 'X-IKIGAI') {
            const experiment = await tx.ikigaiExperiment.create({
              data: { userId, planId, combinationId: body.combinationId ?? null, status: 'ACTIVE' },
            });
            await tx.ikigaiExperimentRevision.create({
              data: {
                experimentId: experiment.id,
                revision: 1,
                hypothesis: body.edits?.hipotesis?.trim() || body.goalText?.trim() || 'Pendiente de escribir la hipótesis.',
                sample: body.edits?.muestra?.trim() || null,
                opportunity: null,
                missing: built.proposal.missing.map((row) => row.question).join(' ') || null,
                purposeRevisionId: built.purposeRevisionId,
              },
            });
            experimentId = experiment.id;
          }
        }
        for (const limit of body.limits ?? []) {
          const outcome = parseHealthLimit(limit.outcome);
          if (!outcome) continue;
          await tx.memberClarification.create({
            data: { userId, scope: 'HEALTH', outcome, subjectRef: limit.subjectRef ?? null, detail: null, source: 'CONFIRMATION', rulesVersion: RULES_VERSION },
          });
        }
        if (body.barrier?.choice) {
          await tx.memberClarification.create({
            data: { userId, scope: 'BARRIER', outcome: `${body.barrier.choice}:${body.barrier.kind}`, subjectRef: body.actionSubject ?? null, detail: body.barrier.detail ?? null, source: 'CONFIRMATION', rulesVersion: RULES_VERSION },
          });
        }
        if (body.declaredProtection) {
          await tx.memberClarification.create({
            data: { userId, scope: 'CURRENT_SITUATION', outcome: 'PROTECT_ESSENTIAL', subjectRef: body.actionSubject ?? null, source: 'CONFIRMATION', rulesVersion: RULES_VERSION },
          });
        }
        if (status === 'ACCEPTED' && body.helpPreference) {
          await tx.memberClarification.create({
            data: { userId, scope: 'HELP_PREFERENCE', outcome: body.helpPreference, source: 'CONFIRMATION', rulesVersion: RULES_VERSION },
          });
        }
        if (status === 'ACCEPTED' && body.path) {
          await tx.memberClarification.create({
            data: { userId, scope: 'PATH', outcome: body.path, source: 'CONFIRMATION', rulesVersion: RULES_VERSION },
          });
        }
        const effect = { planId, actionId, experimentId, effectiveFrom: today };
        const saved = await tx.accompanimentDecision.create({
          data: {
            userId,
            engineVersion: built.proposal.engineVersion,
            rulesVersion: built.proposal.rulesVersion,
            catalogVersion: built.proposal.catalogVersion,
            familyId: built.proposal.familyId,
            templateVersion: built.proposal.templateVersion,
            territory: built.proposal.territory,
            pillar: built.proposal.pillar,
            mode: built.proposal.mode,
            modeStatus: built.proposal.modeStatus,
            situation: built.proposal.situation,
            goalText: body.goalText ?? null,
            goalKind: body.goalKind ?? null,
            planId,
            purposeRevisionId: built.purposeRevisionId,
            readingId: built.readingId,
            context: asJson(built.proposal),
            reasons: asJson(built.proposal.reasons),
            help: asJson(built.help),
            digest: built.digest,
            canonicalHash: built.canonical,
            status,
            rejectReason: body.rejectReason ?? null,
            alternativeOf: adoptFamilyId,
            effect: asJson(effect),
            commandKey,
          },
        });
        if (status === 'ACCEPTED' && body.planChoice !== 'KEEP') {
          await tx.accompanimentHead.upsert({
            where: { userId },
            create: { userId, decisionId: saved.id, version: 1 },
            update: { decisionId: saved.id, version: { increment: 1 } },
          });
        }
        return { id: saved.id, repeated: false, effect, proposal: built.proposal, help: built.help, status };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const won = await this.prisma.accompanimentDecision.findUnique({ where: ownDecision(userId, commandKey) });
        if (won && won.canonicalHash === built.canonical) {
          return { id: won.id, repeated: true, effect: won.effect, proposal: won.context, help: won.help, status: won.status };
        }
      }
      throw err;
    }
  }
}

function ownDecision(userId: string, commandKey: string) {
  return { userId_commandKey: { userId, commandKey } };
}

function textField(content: unknown, key: string): string | null {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const value = (content as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function recoveredGoal(
  body: AccompanimentBody,
  saved: { text: string; kind: GoalKind; territory: Territory | null } | null,
) {
  const wantsReturn = body.situation === 'RETURN' || declarationToGoal(body.interest).situation === 'RETURN';
  if (!wantsReturn || body.goalKind || !saved?.kind) return null;
  return saved;
}

function ikigaiText(content: unknown): { hypothesis: string | null; sample: string | null } {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return { hypothesis: null, sample: null };
  const rows = (content as { synthesis?: { combinations?: { experiment?: unknown; learningQuestion?: unknown }[] } }).synthesis?.combinations;
  if (!Array.isArray(rows)) return { hypothesis: null, sample: null };
  const row = rows.find((item) => typeof item?.experiment === 'string' && item.experiment.trim());
  return {
    hypothesis: typeof row?.experiment === 'string' ? row.experiment.trim() : null,
    sample: typeof row?.learningQuestion === 'string' ? row.learningQuestion.trim() : null,
  };
}

function directionOf(purpose: { content: unknown } | null): string | null {
  const content = purpose?.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const value = (content as { directionStatus?: unknown }).directionStatus;
  return typeof value === 'string' ? value : null;
}

function readLimit(value: unknown): HealthLimitOutcome | null {
  try {
    return parseHealthLimit(value);
  } catch {
    throw new BadRequestException('Aclaración de límite desconocida.');
  }
}

function readConversation(value: unknown) {
  try {
    return parseConversation(value);
  } catch {
    throw new BadRequestException('Aclaración de conversación desconocida.');
  }
}

function combinationIds(content: unknown): string[] {
  if (!content || typeof content !== 'object') return [];
  const synthesis = (content as { synthesis?: { combinations?: { id?: unknown }[] } }).synthesis;
  if (!synthesis || !Array.isArray(synthesis.combinations)) return [];
  return synthesis.combinations.map((row) => row?.id).filter((id): id is string => typeof id === 'string');
}

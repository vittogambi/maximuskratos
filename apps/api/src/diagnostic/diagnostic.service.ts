import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { withoutInternalAlerts } from '../admin/public-reading';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticCatalogService } from './diagnostic-catalog.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { moduleReading, persistExcelScore, sleepReading, type SectionLine } from './excel-score';
import { childDisposition, isSettled, revisionDecision, validateSubmission } from './answer-rules';
import { ambitsOf } from '../instrumentos/ikigai-lists';
import { ResponseWriteHook } from './response-write-hook';
import {
  isRequiredActivity,
  isRequiredBasal,
  parseQuestionContext,
  readQuestionContext,
  SEX_SOURCE,
  type QuestionCapture,
} from './question-capture';
import type {
  DiagnosticProgressDto,
  DiagnosticResponsePayload,
  DimensionScores,
  NextStep,
  QuestionDto,
  SessionStateDto,
} from './types/diagnostic.types';
import {
  areaGroupPrefix,
  areaSectionsFor,
  buildAuditClose,
  previousModuleSlug,
  questionNavMeta,
  modulesInArea,
  resolveNavigationQuestion,
  savedAnswerFromResponse,
  visibleModuleQuestions,
  visibleQuestionTrail,
} from './player-navigation';
import {
  moduleFullySettled,
  moduleMatchesTerritory,
  parseTerritoryParam,
  questionsInScope,
  readFocusTerritory,
  selectPlayable,
  territoryQuestionsSettled,
  withFocusTerritory,
  withoutFocusTerritory,
} from './diagnostic-territory';
import type { Territory } from '../instrumentos/glossary';

const DIMENSIONS = [
  'mentality',
  'identity',
  'habits',
  'environment',
  'finances',
  'relationships',
  'purpose',
  'shadow',
  'ikigai',
  'footprint',
];

// Maps pair of highest-scoring dimensions to archetype slug
const ARCHETYPE_MATRIX: { dims: string[]; slug: string }[] = [
  { dims: ['mentality', 'habits'], slug: 'guerrero' },
  { dims: ['habits', 'mentality'], slug: 'guerrero' },
  { dims: ['finances', 'environment'], slug: 'mago' },
  { dims: ['environment', 'finances'], slug: 'mago' },
  { dims: ['identity', 'relationships'], slug: 'rey' },
  { dims: ['relationships', 'identity'], slug: 'rey' },
  { dims: ['purpose', 'relationships'], slug: 'amante' },
  { dims: ['relationships', 'purpose'], slug: 'amante' },
  { dims: ['purpose', 'ikigai'], slug: 'amante' },
  { dims: ['ikigai', 'purpose'], slug: 'amante' },
];

function presentCapture(capture: QuestionCapture | null): QuestionCapture | null {
  if (capture?.kind !== 'activity') return capture;
  return { ...capture, ambits: ambitsOf(capture.field) };
}

@Injectable()
export class DiagnosticService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: DiagnosticCatalogService,
    private readonly responseWrite: ResponseWriteHook,
  ) {}

  /** The one open session. Completed and abandoned sessions stay readable by id. */
  private findActiveSession(userId: string) {
    return this.prisma.diagnosticSession.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
    });
  }

  async restart(userId: string) {
    const active = await this.findActiveSession(userId);
    if (active) {
      await this.prisma.diagnosticSession.update({
        where: { id: active.id },
        data: { status: active.completedAt ? 'COMPLETED' : 'ABANDONED' },
      });
    }
    return this.startOrResume(userId, { confirmNew: true });
  }

  async startOrResume(userId: string, options: { general?: boolean; confirmNew?: boolean } = {}) {
    try {
      await this.catalog.ensureReady();
    } catch {
      throw new ServiceUnavailableException(
        'El cuestionario no está disponible temporalmente. Intenta de nuevo en unos segundos.',
      );
    }

    const version = await this.prisma.diagnosticVersion.findFirst({
      where: { isActive: true },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          where: { isConditional: false },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('No active diagnostic version found');
    }

    let session = await this.findActiveSession(userId);

    if (!session && !options.confirmNew) {
      const closed = await this.prisma.diagnosticSession.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { startedAt: 'desc' },
      });
      if (closed) return this.buildState(closed.id, userId);
    }

    if (!session) {
      let isNewSession = false;
      try {
        session = await this.prisma.diagnosticSession.create({
          data: {
            userId,
            versionId: version.id,
            status: 'ACTIVE',
            metadata: {},
          },
        });
        isNewSession = true;
      } catch (err: unknown) {
        // P2002 = unique constraint — a concurrent request already created the session
        if ((err as { code?: string })?.code === 'P2002') {
          session = await this.findActiveSession(userId);
          if (!session) throw err;
        } else {
          throw err;
        }
      }

      if (isNewSession) {
        // Unlock first module; lock the rest
        const [first, ...rest] = version.modules;
        if (first) {
          await this.prisma.userModuleProgress.create({
            data: { sessionId: session.id, moduleId: first.id, status: 'AVAILABLE' },
          });
        }
        for (const mod of rest) {
          await this.prisma.userModuleProgress.create({
            data: { sessionId: session.id, moduleId: mod.id, status: 'LOCKED' },
          });
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: { onboardingStep: 'DIAGNOSTICO_BIENVENIDA' },
        });

        await this.prisma.diagnosticEvent.create({
          data: {
            sessionId: session.id,
            type: 'session_started',
            payload: { versionId: version.id },
          },
        });

        // A/B experiment exposure logging — deterministic assignment via userId hash
        const experiments = this.assignExperiments(userId);
        await this.prisma.diagnosticEvent.create({
          data: {
            sessionId: session.id,
            type: 'experiment_exposure',
            payload: { experiments },
          },
        });
      }
    }

    if (options.general && readFocusTerritory(session.metadata)) {
      session = await this.prisma.diagnosticSession.update({
        where: { id: session.id },
        data: { metadata: JSON.parse(JSON.stringify(withoutFocusTerritory(session.metadata))) },
      });
    }

    return this.buildState(session.id, userId);
  }

  async startOrResumeForTerritory(userId: string, territoryParam: string) {
    let territory: Territory;
    try {
      territory = parseTerritoryParam(territoryParam);
    } catch {
      throw new BadRequestException('Ámbito desconocido.');
    }
    await this.startOrResume(userId);
    const session = await this.findActiveSession(userId);
    if (!session) throw new NotFoundException('No diagnostic session found');
    const version = await this.prisma.diagnosticVersion.findUnique({
      where: { id: session.versionId },
      include: { modules: { include: { questions: { select: { sourceRef: true } } } } },
    });
    if (!version) throw new NotFoundException('No active diagnostic version found');
    const moduleIds = version.modules
      .filter((mod) => moduleMatchesTerritory(mod.questions, territory))
      .map((mod) => mod.id);
    if (moduleIds.length > 0) {
      await this.prisma.userModuleProgress.updateMany({
        where: { sessionId: session.id, moduleId: { in: moduleIds }, status: 'LOCKED' },
        data: { status: 'AVAILABLE' },
      });
    }
    await this.prisma.diagnosticSession.update({
      where: { id: session.id },
      data: { metadata: JSON.parse(JSON.stringify(withFocusTerritory(session.metadata, territory))) },
    });
    return this.buildState(session.id, userId, undefined, { territory: territoryParam });
  }

  async getQuestionBySourceRef(userId: string, sourceRef: string) {
    if (!sourceRef?.trim()) throw new BadRequestException('Falta sourceRef.');
    const session = await this.findActiveSession(userId);
    if (!session) throw new NotFoundException('No diagnostic session found');
    const question = await this.prisma.question.findFirst({
      where: { sourceRef: sourceRef.trim(), module: { versionId: session.versionId } },
      include: { options: { orderBy: { order: 'asc' } }, module: true },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada.');
    const existing = await this.prisma.response.findFirst({
      where: { sessionId: session.id, questionId: question.id },
    });
    return {
      sourceRef: question.sourceRef,
      reason: 'Pregunta puntual del ámbito.',
      question: this.toQuestionDto(question),
      saved: existing ? savedAnswerFromResponse(existing) : null,
    };
  }

  async getState(
    userId: string,
    nav?: { atQuestionId?: string; afterQuestionId?: string; introModule?: string; territory?: string },
  ): Promise<{ sessionState: SessionStateDto; nextStep: NextStep }> {
    const session = await this.findActiveSession(userId);
    if (!session) {
      throw new NotFoundException('No diagnostic session found');
    }
    return this.buildState(session.id, userId, undefined, nav);
  }

  async getProfile(userId: string) {
    const current = await this.prisma.masterProfile.findFirst({
      where: { userId, isCurrent: true },
      include: { session: { include: { moduleProgress: true } } },
    });
    if (current?.session) {
      const allDone =
        current.session.moduleProgress.length > 0 &&
        current.session.moduleProgress.every((m) => m.status === 'COMPLETE' && m.outroSeen);
      if (allDone) return this.toProfileDto(current);
    }

    const session = await this.prisma.diagnosticSession.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { profile: true, moduleProgress: true },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) return current ? this.toProfileDto(current) : null;

    // Only expose a profile once every module has been completed and its outro seen.
    // This prevents showing partial/corrupt profiles created before the diagnostic is done.
    const allDone =
      session.moduleProgress.length > 0 &&
      session.moduleProgress.every((m) => m.status === 'COMPLETE' && m.outroSeen);
    if (!allDone) return null;

    if (!session.profile) {
      // Backfill profile for users who completed before generation was wired
      await this.buildState(session.id, userId);
      const refreshed = await this.prisma.masterProfile.findFirst({
        where: { userId, isCurrent: true },
      });
      return refreshed ? this.toProfileDto(refreshed) : null;
    }

    return this.toProfileDto(session.profile);
  }

  async getProgress(userId: string): Promise<DiagnosticProgressDto | null> {
    const active = await this.findActiveSession(userId);
    const session = await this.prisma.diagnosticSession.findFirst({
      where: { id: active?.id ?? undefined, userId },
      orderBy: { startedAt: 'desc' },
      include: {
        moduleProgress: {
          include: {
            module: {
              include: { questions: { select: { id: true } } },
            },
          },
          orderBy: { module: { order: 'asc' } },
        },
        responses: { select: { questionId: true } },
        snapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!session) return null;

    const answeredIds = new Set(session.responses.map((r) => r.questionId));
    const latestSnapshot = session.snapshots[0];
    const completionPct = latestSnapshot?.completionPct ?? 0;
    const selfKnowledgePct = this.calcSelfKnowledgePct(completionPct / 100);

    const modules = session.moduleProgress.map((p) => {
      const totalQuestions = p.module.questions.length;
      const answeredQuestions = p.module.questions.filter((q) =>
        answeredIds.has(q.id),
      ).length;
      return {
        slug: p.module.slug,
        titleEs: p.module.titleEs,
        iconKey: p.module.iconKey,
        status: p.status,
        estimatedMinutes: p.module.estimatedMinutes,
        answeredQuestions,
        totalQuestions,
      };
    });

    return { completionPct, selfKnowledgePct, modules };
  }

  async submitResponse(
    userId: string,
    dto: SubmitResponseDto,
  ): Promise<DiagnosticResponsePayload> {
    const session = await this.findActiveSession(userId);
    if (!session) throw new NotFoundException('No diagnostic session found');

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: { options: true, module: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    const optionIds = dto.exceptionKind ? [] : dto.selectedOptionIds ?? [];
    const freeText = dto.exceptionKind ? null : dto.freeText?.trim() || null;
    if (optionIds.length) {
      const validIds = new Set(question.options.map((option) => option.id));
      for (const id of optionIds) {
        if (!validIds.has(id)) throw new BadRequestException(`Invalid option id: ${id}`);
      }
    }
    const parsed = readQuestionContext(question.sourceRef, question.contextEs);
    let priorValues: string[] | null = null;
    if (parsed.subsetRef) {
      const parent = await this.prisma.question.findFirst({
        where: { sourceRef: parsed.subsetRef, module: { versionId: session.versionId } },
        include: { options: true },
      });
      const prior = await this.prisma.response.findFirst({
        where: { sessionId: session.id, questionId: parent?.id ?? '' },
        include: { selectedOptions: true },
      });
      const chosenIds = new Set(prior?.selectedOptionIds ?? []);
      const fromIds = parent?.options.filter((option) => chosenIds.has(option.id)).map((option) => option.value) ?? [];
      priorValues = fromIds.length > 0 ? fromIds : (prior?.selectedOptions.map((option) => option.value) ?? []);
    }
    const selectedValues = question.options.filter((option) => optionIds.includes(option.id)).map((option) => option.value);
    const number = parsed.capture?.kind === 'number' || parsed.capture?.kind === 'hours'
      ? { min: parsed.capture.min, max: parsed.capture.max }
      : null;
    const birthdate = parsed.capture?.kind === 'birthdate'
      ? { minAge: parsed.capture.minAge, maxAge: parsed.capture.maxAge }
      : null;
    const check = validateSubmission({
      exceptionKind: dto.exceptionKind ?? null,
      allowed: question.allowedExceptions,
      optionIds,
      freeText,
      maxSelections: question.maxSelections,
      selectedValues,
      priorValues,
      number,
      birthdate,
      forbidException: isRequiredBasal(question.sourceRef) || isRequiredActivity(question.sourceRef),
      mustChoose: question.sourceRef === SEX_SOURCE,
      ikigaiLenses: parsed.capture?.kind === 'ikigai' ? parsed.capture.others : null,
      activity: parsed.capture?.kind === 'activity' ? { ambits: ambitsOf(parsed.capture.field) } : null,
    });
    if (!check.ok) throw new BadRequestException(check.message);
    if (!dto.exceptionKind && question.sourceRef === 'formulario-v1:E-PER-000!R40' && (optionIds.length < 4 || optionIds.length > 10)) {
      throw new BadRequestException('Elige entre 4 y 10 valores.');
    }
    if (!dto.exceptionKind && question.sourceRef === 'formulario-v1:E-PER-000!R51') {
      const available = priorValues && priorValues.length > 0 ? priorValues.length : question.options.length;
      const needed = Math.min(3, available);
      if (optionIds.length !== needed) throw new BadRequestException('Elige 3 de los valores que ya marcaste.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.response.findUnique({
          where: { sessionId_questionId: { sessionId: session.id, questionId: dto.questionId } },
        });
        const decision = revisionDecision(dto.expectedRevision, existing?.revision ?? null);
        if (decision === 'conflict') {
          throw new ConflictException('Esta respuesta cambió en otra sesión. Recarga el cuestionario antes de guardar.');
        }
        await this.responseWrite.beforeUpsert();
        if (existing) {
          await tx.responseRevision.create({
            data: {
              responseId: existing.id,
              revision: existing.revision,
              freeText: existing.freeText,
              selectedOptionIds: existing.selectedOptionIds,
              exceptionKind: existing.exceptionKind,
              exceptionOrigin: existing.exceptionOrigin,
            },
          });
        }
        await tx.response.upsert({
          where: { sessionId_questionId: { sessionId: session.id, questionId: dto.questionId } },
          update: {
            selectedOptionIds: optionIds,
            freeText,
            rankingOrder: dto.rankingOrder ?? [],
            answeredAt: new Date(),
            latencyMs: dto.latencyMs,
            editCount: { increment: 1 },
            skipped: false,
            exceptionKind: dto.exceptionKind ?? null,
            exceptionOrigin: dto.exceptionKind ? 'USER' : null,
            revision: { increment: 1 },
            selectedOptions: { set: optionIds.map((id) => ({ id })) },
          },
          create: {
            sessionId: session.id,
            questionId: dto.questionId,
            selectedOptionIds: optionIds,
            freeText,
            rankingOrder: dto.rankingOrder ?? [],
            latencyMs: dto.latencyMs,
            editCount: 0,
            skipped: false,
            exceptionKind: dto.exceptionKind ?? null,
            exceptionOrigin: dto.exceptionKind ? 'USER' : null,
            revision: 1,
            selectedOptions: { connect: optionIds.map((id) => ({ id })) },
          },
        });
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Esta respuesta cambió en otra sesión. Recarga el cuestionario antes de guardar.');
      }
      throw error;
    }

    await this.prisma.diagnosticEvent.create({
      data: {
        sessionId: session.id,
        type: 'question_answered',
        payload: {
          questionId: dto.questionId,
          moduleId: question.moduleId,
          latencyMs: dto.latencyMs,
        },
      },
    });

    // Update onboarding step on first answer
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.onboardingStep === 'DIAGNOSTICO_BIENVENIDA') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: 'FASE1_EN_CURSO' },
      });
    }

    // Ensure module is marked IN_PROGRESS
    await this.prisma.userModuleProgress.updateMany({
      where: { sessionId: session.id, moduleId: question.moduleId, status: 'AVAILABLE' },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    // Recalculate scores and persist snapshot
    const completionPct = await this.recalculateScores(session.id);

    // Update session activity timestamp
    await this.prisma.diagnosticSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return this.buildState(session.id, userId, completionPct);
  }

  async markWelcomeSeen(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.onboardingStep === 'DIAGNOSTICO_BIENVENIDA') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: 'FASE1_EN_CURSO' },
      });
    }
    return { success: true };
  }

  async markOutroSeen(userId: string, moduleSlug: string) {
    const session = await this.findActiveSession(userId);
    if (!session) throw new NotFoundException('No diagnostic session found');

    const module = await this.prisma.diagnosticModule.findFirst({
      where: { slug: moduleSlug, versionId: session.versionId },
    });
    if (!module) throw new NotFoundException('Module not found');

    const progress = await this.prisma.userModuleProgress.findUnique({
      where: { sessionId_moduleId: { sessionId: session.id, moduleId: module.id } },
    });
    if (!progress) throw new NotFoundException('Module progress not found');

    if (!progress.outroSeen) {
      const focusTerritory = readFocusTerritory(session.metadata);
      const nextModule = focusTerritory
        ? null
        : await this.prisma.diagnosticModule.findFirst({
            where: { versionId: session.versionId, order: module.order + 1 },
          });

      // One transaction: a concurrent GET /state must never see this outro seen
      // while the next module is still LOCKED (it would finalise the diagnostic).
      await this.prisma.$transaction(async (tx) => {
        const marked = await tx.userModuleProgress.updateMany({
          where: { id: progress.id, outroSeen: false },
          data: { outroSeen: true },
        });
        if (marked.count === 0) return;

        if (focusTerritory) {
          const version = await tx.diagnosticVersion.findUnique({
            where: { id: session.versionId },
            include: { modules: { orderBy: { order: 'asc' }, include: { questions: { select: { sourceRef: true } } } } },
          });
          const ordered = version?.modules.filter((item) => moduleMatchesTerritory(item.questions, focusTerritory)) ?? [];
          const index = ordered.findIndex((item) => item.id === module.id);
          const unlock = index >= 0 ? ordered[index + 1] : null;
          if (unlock) {
            await tx.userModuleProgress.updateMany({
              where: { sessionId: session.id, moduleId: unlock.id, status: 'LOCKED' },
              data: { status: 'AVAILABLE' },
            });
          }
        } else if (nextModule) {
          await tx.userModuleProgress.updateMany({
            where: { sessionId: session.id, moduleId: nextModule.id, status: 'LOCKED' },
            data: { status: 'AVAILABLE' },
          });
        }

        await tx.diagnosticEvent.create({
          data: {
            sessionId: session.id,
            type: 'module_completed',
            payload: { moduleSlug, moduleId: module.id, moduleOrder: module.order },
          },
        });

        // Fire diagnostic_activated on first module completion (activation event)
        if (module.order === 1) {
          await tx.diagnosticEvent.create({
            data: {
              sessionId: session.id,
              type: 'diagnostic_activated',
              payload: { moduleSlug, triggeredBy: 'first_module_outro' },
            },
          });
        }
      });
    }

    await persistExcelScore(this.prisma, session.id);
    return { success: true };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async buildState(
    sessionId: string,
    userId: string,
    completionPct?: number,
    nav?: { atQuestionId?: string; afterQuestionId?: string; introModule?: string; territory?: string },
  ): Promise<{ sessionState: SessionStateDto; nextStep: NextStep }> {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { id: sessionId },
      include: {
        version: {
          include: {
            modules: { orderBy: { order: 'asc' } },
          },
        },
        moduleProgress: {
          include: {
            module: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: { options: { orderBy: { order: 'asc' } } },
                },
              },
            },
          },
          orderBy: { module: { order: 'asc' } },
        },
        responses: true,
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    let focusTerritory: Territory | null = readFocusTerritory(session.metadata);
    if (!focusTerritory && nav?.territory) {
      try {
        focusTerritory = parseTerritoryParam(nav.territory);
      } catch {
        focusTerritory = null;
      }
    }
    const scopedProgress = focusTerritory
      ? session.moduleProgress.filter((entry) => moduleMatchesTerritory(entry.module.questions, focusTerritory!))
      : session.moduleProgress;

    const activeForFollow =
      session.moduleProgress.find(
        (p) => p.status === 'AVAILABLE' || p.status === 'IN_PROGRESS',
      ) ??
      session.moduleProgress.find((p) => p.status === 'COMPLETE' && !p.outroSeen);
    if (activeForFollow) {
      session.responses = await this.reconcileFollowups(
        session.id,
        activeForFollow.module.questions,
        session.responses,
      );
    }

    const settledIds = new Set(
      session.responses.filter((response) => isSettled(response)).map((response) => response.questionId),
    );
    const responseByQuestion = new Map(session.responses.map((response) => [response.questionId, response]));
    const trail = visibleQuestionTrail(session.moduleProgress, responseByQuestion);
    const navModes = [nav?.atQuestionId, nav?.afterQuestionId, nav?.introModule].filter(Boolean).length;
    if (navModes > 1) {
      throw new BadRequestException('Usa solo uno de at, after o introModule.');
    }
    if (nav?.introModule) {
      return this.buildIntroModuleState(
        session,
        completionPct,
        settledIds,
        trail,
        responseByQuestion,
        nav.introModule,
      );
    }
    if (nav?.atQuestionId || nav?.afterQuestionId) {
      return this.buildNavigationState(
        session,
        completionPct,
        settledIds,
        trail,
        responseByQuestion,
        nav,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true },
    });
    let showWelcomeScreen = user?.onboardingStep === 'DIAGNOSTICO_BIENVENIDA';
    if (showWelcomeScreen && focusTerritory) {
      await this.markWelcomeSeen(userId);
      showWelcomeScreen = false;
    }
    const totalModules = session.moduleProgress.length;

    // Find current active module.
    // Prefer AVAILABLE/IN_PROGRESS; fall back to COMPLETE modules whose outro
    // hasn't been seen yet (the module was just finished but the next module is
    // still LOCKED — we should show the outro, not claim the diagnostic is done).
    const activeProgress = selectPlayable(scopedProgress, settledIds, focusTerritory);

    if (!activeProgress) {
      if (focusTerritory) {
        const scopeDone = territoryQuestionsSettled(scopedProgress, settledIds, focusTerritory);
        if (scopeDone) {
          // The territory pass is over; the next plain start resumes the full questionnaire.
          await this.prisma.diagnosticSession.update({
            where: { id: session.id },
            data: { metadata: JSON.parse(JSON.stringify(withoutFocusTerritory(session.metadata))) },
          });
          return {
            sessionState: {
              phase: session.currentPhase,
              completionPct: 0,
              currentModuleSlug: null,
              currentModuleTitle: null,
              currentModuleIntro: null,
              currentModuleIcon: null,
              moduleProgress: 1,
              selfKnowledgePct: 0,
              isModuleStart: false,
              currentQuestionIndex: null,
              moduleQuestionCount: null,
              showWelcomeScreen: false,
              currentModuleOrder: null,
              totalModules: scopedProgress.length,
              currentModuleEstimatedMinutes: null,
            },
            nextStep: { type: 'territory_complete', data: { territory: focusTerritory } },
          };
        }
        throw new ConflictException(
          'El ámbito se está actualizando. Intenta de nuevo en unos segundos.',
        );
      }
      const allModulesClosed =
        session.moduleProgress.length > 0 &&
        session.moduleProgress.every((p) => p.status === 'COMPLETE' && p.outroSeen);
      if (!allModulesClosed) {
        // A later module is still LOCKED: another write is mid-flight. Never finalise on a partial state.
        throw new ConflictException(
          'El diagnóstico se está actualizando. Intenta de nuevo en unos segundos.',
        );
      }

      // All modules done — diagnostic complete
      const lastSnapshot = await this.prisma.scoreSnapshot.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });
      const finalCompletionPct = completionPct ?? lastSnapshot?.completionPct ?? 100;
      const selfKnowledgePct = this.calcSelfKnowledgePct(finalCompletionPct / 100);

      // Complete the diagnostic (idempotent)
      const archetype = await this.completeDiagnostic(sessionId, userId, lastSnapshot?.scores as DimensionScores | null);

      return {
        sessionState: {
          phase: session.currentPhase,
          completionPct: 100,
          currentModuleSlug: null,
          currentModuleTitle: null,
          currentModuleIntro: null,
          currentModuleIcon: null,
          moduleProgress: 1,
          selfKnowledgePct,
          isModuleStart: false,
          currentQuestionIndex: null,
          moduleQuestionCount: null,
          showWelcomeScreen: false,
          currentModuleOrder: null,
          totalModules,
          currentModuleEstimatedMinutes: null,
        },
        nextStep: {
          type: 'diagnostic_complete',
          data: { archetypePrimary: archetype, selfKnowledgePct },
        },
      };
    }

    const currentModule = activeProgress.module;
    const moduleQuestions = questionsInScope(currentModule.questions, focusTerritory);
    const totalQuestions = moduleQuestions.length;
    const answeredInModule = moduleQuestions.filter((question) => settledIds.has(question.id)).length;

    // Outro and COMPLETE belong to the whole module. A territory slice must not close the sibling questions.
    if (moduleFullySettled(currentModule.questions, settledIds) && !activeProgress.outroSeen) {
      if (activeProgress.status !== 'COMPLETE') {
        await this.prisma.userModuleProgress.update({
          where: { id: activeProgress.id },
          data: { status: 'COMPLETE', completedAt: new Date() },
        });
      }

      const lastSnapshot = await this.prisma.scoreSnapshot.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });
      const pct = completionPct ?? lastSnapshot?.completionPct ?? 0;

      return {
        sessionState: this.withPlayerChrome(
          {
            phase: session.currentPhase,
            completionPct: Math.round(pct * 100) / 100,
            currentModuleSlug: currentModule.slug,
            currentModuleTitle: currentModule.titleEs,
            currentModuleIntro: currentModule.introEs,
            currentModuleIcon: currentModule.iconKey,
            moduleProgress: 1,
            selfKnowledgePct: this.calcSelfKnowledgePct(pct / 100),
            isModuleStart: false,
            currentQuestionIndex: null,
            moduleQuestionCount: null,
            showWelcomeScreen,
            currentModuleOrder: currentModule.order,
            totalModules,
            currentModuleEstimatedMinutes: currentModule.estimatedMinutes,
          },
          session,
          currentModule.slug,
          responseByQuestion,
          trail,
          false,
        ),
        nextStep: {
          type: 'module_outro',
          data: {
            moduleSlug: currentModule.slug,
            titleEs: currentModule.titleEs,
            outroText: this.outroSentence(currentModule.slug, activeProgress.outroText ?? currentModule.outroTemplateEs),
            readings: this.moduleReadings(currentModule, session.responses),
            ...(currentModule.slug === 'e-aud-s6'
              ? { auditClose: buildAuditClose(session.moduleProgress, session.responses) }
              : {}),
          },
        },
      };
    }

    // Find next unanswered question
    let nextQuestion = moduleQuestions.find((question) => !settledIds.has(question.id));
    if (!nextQuestion && focusTerritory) {
      return {
        sessionState: this.withPlayerChrome(
          {
            phase: session.currentPhase,
            completionPct: 0,
            currentModuleSlug: currentModule.slug,
            currentModuleTitle: currentModule.titleEs,
            currentModuleIntro: currentModule.introEs,
            currentModuleIcon: currentModule.iconKey,
            moduleProgress: 1,
            selfKnowledgePct: 0,
            isModuleStart: false,
            currentQuestionIndex: null,
            moduleQuestionCount: null,
            showWelcomeScreen: false,
            currentModuleOrder: currentModule.order,
            totalModules: scopedProgress.length,
            currentModuleEstimatedMinutes: currentModule.estimatedMinutes,
          },
          session,
          currentModule.slug,
          responseByQuestion,
          trail,
          false,
        ),
        nextStep: {
          type: 'territory_pause',
          data: { territory: focusTerritory, moduleSlug: currentModule.slug },
        },
      };
    }
    if (!nextQuestion) {
      throw new BadRequestException('Unexpected state: no next question found');
    }

    const lastSnapshot = await this.prisma.scoreSnapshot.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
    const pct = completionPct ?? lastSnapshot?.completionPct ?? 0;

    const moduleProgressRatio =
      totalQuestions > 0 ? answeredInModule / totalQuestions : 0;

    const isModuleStart = answeredInModule === 0;

    const skippedIds = new Set(
      session.responses.filter((response) => response.skipped).map((response) => response.questionId),
    );
    const visibleQuestions = currentModule.questions.filter((question) => !skippedIds.has(question.id));
    const answeredVisible = visibleQuestions.filter((question) => settledIds.has(question.id)).length;
    const currentQuestionIndex = answeredVisible + 1;
    const visibleCount = visibleQuestions.length;

    const question = this.toQuestionDto(
      {
        ...(nextQuestion as typeof nextQuestion & { scaleType: string | null; reasonPromptEs: string | null; reasonThreshold: number | null; allowedExceptions: string[]; options: { id: string; order: number; textEs: string; value: string }[] }),
        options: this.subsetOptions(nextQuestion, currentModule.questions, session.responses),
      },
      session.responses.find((response) => response.questionId === nextQuestion.id)?.revision ?? 0,
    );
    if (currentModule.slug === 'e-per-dificultades' || currentModule.slug === 'e-per-personalidad') {
      question.savedChoices = this.shadowSavedChoices(currentModule.questions, session.responses);
    }
    if (currentModule.slug === 'e-per-ikigai') {
      const notes = this.activityNotes(currentModule.questions, session.responses);
      question.activityNotes = notes;
      question.filledActivities = notes.map((note) => note.sourceRef);
    }

    const navMeta = questionNavMeta(trail, nextQuestion.id);
    question.previousQuestionId = navMeta.previousQuestionId;
    question.isFirstInModule = navMeta.isFirstInModule;

    return {
      sessionState: this.withPlayerChrome(
        {
          phase: session.currentPhase,
          completionPct: Math.round(pct * 100) / 100,
          currentModuleSlug: currentModule.slug,
          currentModuleTitle: currentModule.titleEs,
          currentModuleIntro: currentModule.introEs,
          currentModuleIcon: currentModule.iconKey,
          moduleProgress: moduleProgressRatio,
          selfKnowledgePct: this.calcSelfKnowledgePct(pct / 100),
          isModuleStart,
          currentQuestionIndex,
          moduleQuestionCount: visibleCount,
          showWelcomeScreen,
          currentModuleOrder: focusTerritory
            ? Math.max(1, scopedProgress.findIndex((entry) => entry.module.slug === currentModule.slug) + 1)
            : currentModule.order,
          totalModules: focusTerritory ? scopedProgress.length : totalModules,
          currentModuleEstimatedMinutes: currentModule.estimatedMinutes,
        },
        session,
        currentModule.slug,
        responseByQuestion,
        trail,
        isModuleStart,
      ),
      nextStep: {
        type: 'question',
        data: question,
      },
    };
  }

  private withPlayerChrome(
    sessionState: SessionStateDto,
    session: {
      moduleProgress: {
        module: { slug: string; order: number; titleEs: string; questions: { id: string; order: number; sourceRef: string | null }[] };
      }[];
    },
    currentModuleSlug: string | null,
    responseByQuestion: Map<string, { questionId: string; skipped: boolean; exceptionOrigin: string | null; selectedOptionIds: string[]; freeText: string | null; exceptionKind: string | null; rankingOrder: string[]; revision: number }>,
    trail: ReturnType<typeof visibleQuestionTrail>,
    isModuleStart: boolean,
  ): SessionStateDto {
    if (!currentModuleSlug) return sessionState;
    const prefix = areaGroupPrefix(currentModuleSlug);
    const areaMods = modulesInArea(session.moduleProgress, prefix);
    const areaSections = areaSectionsFor(areaMods, responseByQuestion, currentModuleSlug);
    const backIntroModuleSlug = isModuleStart
      ? previousModuleSlug(session.moduleProgress, currentModuleSlug)
      : null;
    return { ...sessionState, areaSections, backIntroModuleSlug };
  }

  private async buildIntroModuleState(
    session: {
      id: string;
      currentPhase: string;
      moduleProgress: {
        status: string;
        module: {
          slug: string;
          order: number;
          titleEs: string;
          introEs: string | null;
          iconKey: string | null;
          estimatedMinutes: number;
          questions: {
            id: string;
            order: number;
            sourceRef: string | null;
            type: string;
            textEs: string;
            contextEs: string | null;
            maxSelections: number | null;
            scaleType: string | null;
            reasonPromptEs: string | null;
            reasonThreshold: number | null;
            allowedExceptions: string[];
            options: { id: string; order: number; textEs: string; value: string }[];
          }[];
        };
      }[];
      responses: {
        questionId: string;
        skipped: boolean;
        exceptionOrigin: string | null;
        selectedOptionIds: string[];
        freeText: string | null;
        exceptionKind: string | null;
        rankingOrder: string[];
        revision: number;
      }[];
    },
    completionPct: number | undefined,
    settledIds: Set<string>,
    trail: ReturnType<typeof visibleQuestionTrail>,
    responseByQuestion: Map<string, { questionId: string; skipped: boolean; exceptionOrigin: string | null; selectedOptionIds: string[]; freeText: string | null; exceptionKind: string | null; rankingOrder: string[]; revision: number }>,
    moduleSlug: string,
  ): Promise<{ sessionState: SessionStateDto; nextStep: NextStep }> {
    const progressEntry = session.moduleProgress.find((entry) => entry.module.slug === moduleSlug);
    if (!progressEntry) {
      throw new NotFoundException('Módulo no encontrado.');
    }
    if (progressEntry.status === 'LOCKED') {
      throw new BadRequestException('Ese módulo aún no está disponible.');
    }
    const currentModule = progressEntry.module;
    const visible = visibleModuleQuestions(currentModule.questions, responseByQuestion);
    const anchor = visible[0];
    if (!anchor) {
      throw new BadRequestException('Este módulo no tiene preguntas visibles.');
    }
    const targetQuestion = currentModule.questions.find((question) => question.id === anchor.id);
    if (!targetQuestion) {
      throw new NotFoundException('Pregunta no encontrada.');
    }

    const totalModules = session.moduleProgress.length;
    const lastSnapshot = await this.prisma.scoreSnapshot.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    const pct = completionPct ?? lastSnapshot?.completionPct ?? 0;

    const answeredInModule = currentModule.questions.filter((question) => settledIds.has(question.id)).length;
    const moduleProgressRatio =
      currentModule.questions.length > 0 ? answeredInModule / currentModule.questions.length : 0;

    const response = responseByQuestion.get(targetQuestion.id);
    const question = this.toQuestionDto(
      {
        ...(targetQuestion as typeof targetQuestion & { scaleType: string | null; reasonPromptEs: string | null; reasonThreshold: number | null; allowedExceptions: string[]; options: { id: string; order: number; textEs: string; value: string }[] }),
        options: this.subsetOptions(targetQuestion, currentModule.questions, session.responses),
      },
      response?.revision ?? 0,
    );
    question.savedAnswer = savedAnswerFromResponse(response);
    const navMeta = questionNavMeta(trail, targetQuestion.id);
    question.previousQuestionId = navMeta.previousQuestionId;
    question.isFirstInModule = navMeta.isFirstInModule;

    if (currentModule.slug === 'e-per-dificultades' || currentModule.slug === 'e-per-personalidad') {
      question.savedChoices = this.shadowSavedChoices(currentModule.questions, session.responses);
    }
    if (currentModule.slug === 'e-per-ikigai') {
      const notes = this.activityNotes(currentModule.questions, session.responses);
      question.activityNotes = notes;
      question.filledActivities = notes.map((note) => note.sourceRef);
    }

    return {
      sessionState: this.withPlayerChrome(
        {
          phase: session.currentPhase,
          completionPct: Math.round(pct * 100) / 100,
          currentModuleSlug: currentModule.slug,
          currentModuleTitle: currentModule.titleEs,
          currentModuleIntro: currentModule.introEs,
          currentModuleIcon: currentModule.iconKey,
          moduleProgress: moduleProgressRatio,
          selfKnowledgePct: this.calcSelfKnowledgePct(pct / 100),
          isModuleStart: true,
          currentQuestionIndex: 1,
          moduleQuestionCount: visible.length,
          showWelcomeScreen: false,
          currentModuleOrder: currentModule.order,
          totalModules,
          currentModuleEstimatedMinutes: currentModule.estimatedMinutes,
        },
        session,
        currentModule.slug,
        responseByQuestion,
        trail,
        true,
      ),
      nextStep: { type: 'question', data: question },
    };
  }

  private async buildNavigationState(
    session: {
      id: string;
      currentPhase: string;
      moduleProgress: {
        module: {
          slug: string;
          order: number;
          titleEs: string;
          introEs: string | null;
          iconKey: string | null;
          estimatedMinutes: number;
          questions: {
            id: string;
            order: number;
            sourceRef: string | null;
            type: string;
            textEs: string;
            contextEs: string | null;
            maxSelections: number | null;
            scaleType: string | null;
            reasonPromptEs: string | null;
            reasonThreshold: number | null;
            allowedExceptions: string[];
            options: { id: string; order: number; textEs: string; value: string }[];
          }[];
        };
      }[];
      responses: {
        questionId: string;
        skipped: boolean;
        exceptionOrigin: string | null;
        selectedOptionIds: string[];
        freeText: string | null;
        exceptionKind: string | null;
        rankingOrder: string[];
        revision: number;
      }[];
    },
    completionPct: number | undefined,
    settledIds: Set<string>,
    trail: ReturnType<typeof visibleQuestionTrail>,
    responseByQuestion: Map<string, { questionId: string; skipped: boolean; exceptionOrigin: string | null; selectedOptionIds: string[]; freeText: string | null; exceptionKind: string | null; rankingOrder: string[]; revision: number }>,
    nav: { atQuestionId?: string; afterQuestionId?: string },
  ): Promise<{ sessionState: SessionStateDto; nextStep: NextStep }> {
    const target = resolveNavigationQuestion(trail, nav);
    if (!target) {
      throw new NotFoundException('Pregunta no encontrada en este recorrido.');
    }
    if (nav.atQuestionId && !settledIds.has(target.id)) {
      throw new BadRequestException('Esa pregunta aún no tiene respuesta guardada.');
    }
    const progressEntry = session.moduleProgress.find((entry) =>
      entry.module.questions.some((question) => question.id === target.id),
    );
    if (!progressEntry) {
      throw new NotFoundException('Módulo no encontrado para esa pregunta.');
    }
    const currentModule = progressEntry.module;
    const targetQuestion = currentModule.questions.find((question) => question.id === target.id);
    if (!targetQuestion) {
      throw new NotFoundException('Pregunta no encontrada.');
    }

    const totalModules = session.moduleProgress.length;
    const lastSnapshot = await this.prisma.scoreSnapshot.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    const pct = completionPct ?? lastSnapshot?.completionPct ?? 0;

    const skippedIds = new Set(
      session.responses.filter((response) => response.skipped).map((response) => response.questionId),
    );
    const visibleQuestions = currentModule.questions.filter((question) => !skippedIds.has(question.id));
    const visibleIndex = visibleQuestions.findIndex((question) => question.id === target.id);
    const answeredInModule = currentModule.questions.filter((question) => settledIds.has(question.id)).length;
    const moduleProgressRatio =
      currentModule.questions.length > 0 ? answeredInModule / currentModule.questions.length : 0;

    const response = responseByQuestion.get(target.id);
    const question = this.toQuestionDto(
      {
        ...(targetQuestion as typeof targetQuestion & { scaleType: string | null; reasonPromptEs: string | null; reasonThreshold: number | null; allowedExceptions: string[]; options: { id: string; order: number; textEs: string; value: string }[] }),
        options: this.subsetOptions(targetQuestion, currentModule.questions, session.responses),
      },
      response?.revision ?? 0,
    );
    question.savedAnswer = savedAnswerFromResponse(response);
    const navMeta = questionNavMeta(trail, target.id);
    question.previousQuestionId = navMeta.previousQuestionId;
    question.isFirstInModule = navMeta.isFirstInModule;
    const enteringFreshModule = Boolean(nav.afterQuestionId && navMeta.isFirstInModule && !question.savedAnswer);

    if (currentModule.slug === 'e-per-dificultades' || currentModule.slug === 'e-per-personalidad') {
      question.savedChoices = this.shadowSavedChoices(currentModule.questions, session.responses);
    }
    if (currentModule.slug === 'e-per-ikigai') {
      const notes = this.activityNotes(currentModule.questions, session.responses);
      question.activityNotes = notes;
      question.filledActivities = notes.map((note) => note.sourceRef);
    }

    return {
      sessionState: this.withPlayerChrome(
        {
          phase: session.currentPhase,
          completionPct: Math.round(pct * 100) / 100,
          currentModuleSlug: currentModule.slug,
          currentModuleTitle: currentModule.titleEs,
          currentModuleIntro: currentModule.introEs,
          currentModuleIcon: currentModule.iconKey,
          moduleProgress: moduleProgressRatio,
          selfKnowledgePct: this.calcSelfKnowledgePct(pct / 100),
          isModuleStart: enteringFreshModule,
          currentQuestionIndex: visibleIndex >= 0 ? visibleIndex + 1 : null,
          moduleQuestionCount: visibleQuestions.length,
          showWelcomeScreen: false,
          currentModuleOrder: currentModule.order,
          totalModules,
          currentModuleEstimatedMinutes: currentModule.estimatedMinutes,
        },
        session,
        currentModule.slug,
        responseByQuestion,
        trail,
        enteringFreshModule,
      ),
      nextStep: { type: 'question', data: question },
    };
  }

  private activityNotes(
    questions: { id: string; sourceRef: string | null; contextEs: string | null }[],
    responses: { questionId: string; skipped: boolean; freeText: string | null }[],
  ): { sourceRef: string; text: string }[] {
    const byQuestion = new Map(responses.map((response) => [response.questionId, response]));
    const notes: { sourceRef: string; text: string }[] = [];
    for (const question of questions) {
      if (!question.sourceRef || !question.contextEs?.startsWith('@actividad:')) continue;
      const response = byQuestion.get(question.id);
      if (!response || response.skipped || !response.freeText) continue;
      try {
        const parsed = JSON.parse(response.freeText) as { ambit?: string; option?: string; answer?: string };
        const text = parsed.answer?.trim() ?? '';
        if (parsed.ambit && parsed.option && text) notes.push({ sourceRef: question.sourceRef, text });
      } catch {
        continue;
      }
    }
    return notes;
  }

  private shadowSavedChoices(
    questions: { id: string; sourceRef: string | null; options: { id: string; value: string }[] }[],
    responses: { questionId: string; selectedOptionIds: string[]; skipped: boolean }[],
  ): Record<string, string> {
    const byQuestion = new Map(responses.map((response) => [response.questionId, response]));
    const choices: Record<string, string> = {};
    for (const question of questions) {
      if (!question.sourceRef) continue;
      const response = byQuestion.get(question.id);
      if (!response || response.skipped || response.selectedOptionIds.length === 0) continue;
      const option = question.options.find((item) => response.selectedOptionIds.includes(item.id));
      if (!option) continue;
      choices[question.sourceRef] = option.value;
    }
    return choices;
  }

  /**
   * Finalises the diagnostic: derives archetype, creates MasterProfile,
   * advances onboardingStep, and fires diagnostic_completed event.
   * Idempotent — safe to call on repeated GET /state after completion.
   */
  private async completeDiagnostic(
    sessionId: string,
    userId: string,
    scores: DimensionScores | null,
  ): Promise<string> {
    // Check if already finalised
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { id: sessionId },
      include: { profile: true },
    });

    if (session?.profile) {
      return session.profile.archetypePrimary;
    }

    const lastSnapshot = await this.prisma.scoreSnapshot.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    const dimensionScores: DimensionScores =
      (scores as DimensionScores | null) ??
      (lastSnapshot?.scores as DimensionScores | null) ??
      Object.fromEntries(DIMENSIONS.map((d) => [d, 50]));
    const indices =
      (lastSnapshot?.indices as Record<string, number> | null) ?? {};
    const version = await this.prisma.diagnosticVersion.findUnique({ where: { id: session?.versionId } });
    const isFormularioCompleto = version?.definitionRef === 'formulario-completo';
    const archetype = isFormularioCompleto ? 'sin-clasificar' : this.deriveArchetype(dimensionScores);
    const secondaryArchetype = this.deriveSecondaryArchetype(dimensionScores, archetype);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.masterProfile.create({
          data: {
            userId,
            sessionId,
            archetypePrimary: archetype,
            archetypeSecondary: secondaryArchetype,
            strengths: [],
            weaknesses: [],
            risks: [],
            potentials: [],
            bottlenecks: [],
            priorities: [],
            scores: dimensionScores,
            indices,
            segmentTags: [],
            recommendationSeeds: [],
          },
        });
        await tx.masterProfile.updateMany({ where: { userId, isCurrent: true }, data: { isCurrent: false } });
        await tx.masterProfile.updateMany({ where: { sessionId }, data: { isCurrent: true } });
        await tx.diagnosticSession.update({
          where: { id: sessionId },
          data: { completedAt: new Date(), status: 'COMPLETED' },
        });
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user && user.onboardingStep !== 'PROFILE_COMPLETE' && user.onboardingStep !== 'BLUEPRINT_READY') {
          await tx.user.update({ where: { id: userId }, data: { onboardingStep: 'PROFILE_COMPLETE' } });
        }
        await tx.diagnosticEvent.create({
          data: { sessionId, type: 'diagnostic_completed', payload: { archetypePrimary: archetype, userId } },
        });
        await persistExcelScore(tx, sessionId);
        if (isFormularioCompleto) {
          const { persistFormularioReading } = await import('../instrumentos/reading');
          const { materializeInitialAlignment } = await import('../instrumentos/core-reading');
          await persistFormularioReading(tx, sessionId);
          await materializeInitialAlignment(tx, sessionId);
        }
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2002') {
        const existing = await this.prisma.masterProfile.findUnique({ where: { sessionId } });
        if (existing) return existing.archetypePrimary;
      }
      throw err;
    }
    return archetype;
  }

  private deriveArchetype(scores: DimensionScores): string {
    const sorted = DIMENSIONS
      .map((d) => ({ dim: d, score: scores[d] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    const top1 = sorted[0]?.dim ?? 'mentality';
    const top2 = sorted[1]?.dim ?? 'habits';

    for (const entry of ARCHETYPE_MATRIX) {
      if (entry.dims[0] === top1 && entry.dims[1] === top2) {
        return entry.slug;
      }
    }

    // Fallback: map top dimension
    const fallback: Record<string, string> = {
      mentality: 'guerrero',
      habits: 'guerrero',
      finances: 'mago',
      environment: 'mago',
      identity: 'rey',
      relationships: 'amante',
      purpose: 'amante',
      ikigai: 'amante',
      shadow: 'rey',
      footprint: 'amante',
    };
    return fallback[top1] ?? 'guerrero';
  }

  private deriveSecondaryArchetype(scores: DimensionScores, primary: string): string {
    const sorted = DIMENSIONS
      .map((d) => ({ dim: d, score: scores[d] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    const top1 = sorted[0]?.dim ?? 'mentality';
    const top2 = sorted[1]?.dim ?? 'habits';
    const top3 = sorted[2]?.dim ?? 'identity';

    // Try with 2nd and 3rd dim
    for (const entry of ARCHETYPE_MATRIX) {
      if (entry.dims[0] === top2 && entry.dims[1] === top3) {
        if (entry.slug !== primary) return entry.slug;
      }
    }
    for (const entry of ARCHETYPE_MATRIX) {
      if (entry.dims[0] === top1 && entry.dims[1] === top3) {
        if (entry.slug !== primary) return entry.slug;
      }
    }

    const fallback: Record<string, string> = {
      guerrero: 'mago',
      mago: 'rey',
      rey: 'guerrero',
      amante: 'rey',
    };
    return fallback[primary] ?? 'mago';
  }

  private async recalculateScores(sessionId: string): Promise<number> {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { id: sessionId },
      include: {
        responses: {
          include: { selectedOptions: true },
        },
        version: {
          include: {
            modules: {
              include: {
                questions: { include: { options: true } },
              },
            },
          },
        },
      },
    });

    if (!session) return 0;

    // Accumulate raw deltas
    const raw: DimensionScores = Object.fromEntries(DIMENSIONS.map((d) => [d, 0]));
    const maxPossible: DimensionScores = Object.fromEntries(DIMENSIONS.map((d) => [d, 0]));

    for (const mod of session.version.modules) {
      for (const question of mod.questions) {
        const questionMax: DimensionScores = {};

        if (question.type === 'SINGLE_CHOICE' || question.type === 'SCALE_1_5') {
          for (const option of question.options) {
            const deltas = option.scoreDeltas as Record<string, number>;
            for (const [dim, val] of Object.entries(deltas)) {
              if (DIMENSIONS.includes(dim) && val > (questionMax[dim] ?? 0)) {
                questionMax[dim] = val;
              }
            }
          }
        } else if (question.type === 'MULTI_CHOICE') {
          const slots = question.maxSelections ?? question.options.length;
          for (const dim of DIMENSIONS) {
            const topVals = question.options
              .map((o) => ((o.scoreDeltas as Record<string, number>)[dim] ?? 0))
              .filter((v) => v > 0)
              .sort((a, b) => b - a)
              .slice(0, slots);
            if (topVals.length > 0) questionMax[dim] = topVals.reduce((s, v) => s + v, 0);
          }
        }

        for (const [dim, maxVal] of Object.entries(questionMax)) {
          maxPossible[dim] = (maxPossible[dim] ?? 0) + maxVal;
        }
      }
    }

    for (const response of session.responses) {
      for (const option of response.selectedOptions) {
        const deltas = option.scoreDeltas as Record<string, number>;
        for (const [dim, val] of Object.entries(deltas)) {
          if (DIMENSIONS.includes(dim)) {
            raw[dim] = (raw[dim] ?? 0) + val;
          }
        }
      }
    }

    // Normalize to 0–100
    const scores: DimensionScores = {};
    for (const dim of DIMENSIONS) {
      const max = maxPossible[dim] ?? 0;
      scores[dim] = max > 0 ? Math.min(100, Math.max(0, Math.round((raw[dim]! / max) * 100))) : 0;
    }

    // Calculate total questions vs answered
    const totalQuestions = session.version.modules.reduce(
      (acc, m) => acc + m.questions.length,
      0,
    );
    const answeredQuestions = session.responses.length;
    const completionPct = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Helper: only average dimensions that were actually measured (maxPossible > 0).
    // This prevents unmeasured future-phase dimensions (footprint, etc.) and the
    // shadow dimension (which is negative, tracked separately) from distorting results.
    const avg = (...dims: string[]): number => {
      const measured = dims.filter((d) => (maxPossible[d] ?? 0) > 0);
      if (measured.length === 0) return 0;
      return Math.round(measured.reduce((s, d) => s + (scores[d] ?? 0), 0) / measured.length);
    };

    // Composite indices
    const measuredContent = DIMENSIONS.filter((d) => d !== 'shadow' && (maxPossible[d] ?? 0) > 0);
    const indices = {
      mk_global: measuredContent.length > 0
        ? Math.round(measuredContent.reduce((s, d) => s + (scores[d] ?? 0), 0) / measuredContent.length)
        : 0,
      clarity:   avg('purpose', 'identity', 'ikigai'),
      execution: avg('habits', 'mentality', 'footprint'),
      stability: avg('finances', 'environment', 'relationships'),
    };

    const confidence = Object.fromEntries(
      DIMENSIONS.map((d) => [d, Math.min(1, completionPct / 100)]),
    );

    await this.prisma.scoreSnapshot.create({
      data: {
        sessionId,
        triggeredBy: 'question_answered',
        scores,
        subscores: {},
        indices,
        confidence,
        completionPct,
      },
    });

    return completionPct;
  }

  private toProfileDto(profile: {
    archetypePrimary: string;
    archetypeSecondary: string | null;
    scores: unknown;
    indices: unknown;
    strengths: unknown;
    weaknesses: unknown;
    risks: unknown;
    potentials: unknown;
    bottlenecks: unknown;
    priorities: unknown;
    segmentTags: string[];
    generatedAt: Date;
  }) {
    return {
      archetypePrimary: profile.archetypePrimary,
      archetypeSecondary: profile.archetypeSecondary,
      scores: profile.scores as Record<string, number>,
      indices: withoutInternalAlerts(profile.indices) as Record<string, number>,
      strengths: profile.strengths as string[],
      weaknesses: profile.weaknesses as string[],
      risks: profile.risks as string[],
      potentials: profile.potentials as string[],
      bottlenecks: profile.bottlenecks as string[],
      priorities: profile.priorities as string[],
      segmentTags: profile.segmentTags,
      generatedAt: profile.generatedAt.toISOString(),
    };
  }

  private subsetOptions<T extends { id: string; value: string }>(
    question: { contextEs: string | null; options: T[] },
    moduleQuestions: { id: string; sourceRef: string | null; options: { id: string; value: string }[] }[],
    responses: { questionId: string; selectedOptionIds: string[] }[],
  ): T[] {
    const subsetRef = parseQuestionContext(question.contextEs).subsetRef;
    if (!subsetRef) return question.options;
    const parent = moduleQuestions.find((item) => item.sourceRef === subsetRef);
    if (!parent) return question.options;
    const prior = responses.find((item) => item.questionId === parent.id);
    const chosen = new Set(prior?.selectedOptionIds ?? []);
    const values = new Set(parent.options.filter((option) => chosen.has(option.id)).map((option) => option.value));
    if (values.size === 0) return [];
    return question.options.filter((option) => values.has(option.value));
  }

  private toQuestionDto(
    question: { id: string; type: string; textEs: string; sourceRef?: string | null; contextEs: string | null; maxSelections: number | null; scaleType: string | null; reasonPromptEs: string | null; reasonThreshold: number | null; allowedExceptions?: string[]; options: { id: string; order: number; textEs: string; value: string }[] },
    answerRevision = 0,
  ): import('./types/diagnostic.types').QuestionDto {
    const parsed = readQuestionContext(question.sourceRef, question.contextEs);
    return {
      id: question.id,
      type: question.type,
      textEs: question.textEs,
      sourceRef: question.sourceRef ?? null,
      contextEs: parsed.contextEs,
      maxSelections: question.maxSelections,
      scaleType: question.scaleType,
      reasonPromptEs: question.reasonPromptEs,
      reasonThreshold: question.reasonThreshold,
      capture: presentCapture(parsed.capture),
      heading: parsed.heading,
      allowedExceptions: isRequiredBasal(question.sourceRef) || isRequiredActivity(question.sourceRef)
        ? []
        : (question.allowedExceptions ?? []).filter((kind) => kind !== 'PENDING'),
      answerRevision,
      options: question.options
        .sort((a, b) => a.order - b.order)
        .map((o) => ({ id: o.id, order: o.order, textEs: o.textEs, value: o.value })),
    };
  }

  private outroSentence(slug: string, template: string): string {
    if (slug === 'e-aud-s6') return 'Estas respuestas se leen aparte de la auditoría principal.';
    if (slug === 'f-rad-001') return 'Quedó tu autorreporte.';
    if (slug === 'e-per-000') return 'Quedó lo que escribiste.';
    return template || 'Así queda esta sección.';
  }

  private moduleReadings(
    module: {
      slug: string;
      questions: { id: string; contextEs: string | null; options: { id: string; value: string }[] }[];
    },
    responses: { questionId: string; selectedOptionIds: string[]; skipped: boolean; freeText: string | null }[],
  ): SectionLine[] {
    const values = module.questions.map((question) => {
      const response = responses.find((item) => item.questionId === question.id);
      if (!response || response.skipped) return null;
      const option = question.options.find((item) => response.selectedOptionIds.includes(item.id));
      if (!option) return null;
      const numeric = Number(option.value);
      return Number.isFinite(numeric) ? numeric : null;
    });
    const lines = moduleReading(module.slug, values);
    const sleep = module.questions.find((question) => parseQuestionContext(question.contextEs).capture?.kind === 'hours');
    if (!sleep) return lines;
    const response = responses.find((item) => item.questionId === sleep.id);
    const hours = response?.freeText != null && response.freeText !== '' ? Number(response.freeText) : null;
    const line = sleepReading(Number.isFinite(hours) ? hours : null);
    return line ? [...lines, line] : lines;
  }

  private async reconcileFollowups<T extends {
    id: string;
    questionId: string;
    selectedOptionIds: string[];
    skipped: boolean;
    freeText: string | null;
    exceptionKind: string | null;
    exceptionOrigin: string | null;
    revision: number;
  }>(
    sessionId: string,
    questions: { id: string; order: number; contextEs: string | null; options: { id: string; value: string }[] }[],
    responses: T[],
  ): Promise<T[]> {
    const pending = [...responses];
    for (const question of questions) {
      const rule = parseQuestionContext(question.contextEs).follows;
      if (!rule) continue;
      const prior = questions.find((item) => item.order === rule.order);
      if (!prior) continue;
      const priorResponse = pending.find((item) => item.questionId === prior.id) ?? null;
      const selectedValues = prior.options
        .filter((option) => priorResponse?.selectedOptionIds.includes(option.id))
        .map((option) => option.value);
      const disposition = childDisposition(
        priorResponse
          ? {
              settled: isSettled(priorResponse),
              exceptionKind: priorResponse.exceptionKind,
              value: selectedValues[0] ?? null,
              values: selectedValues,
            }
          : null,
        rule,
      );
      const existing = pending.find((item) => item.questionId === question.id);
      if (disposition === 'ask') {
        if (existing?.exceptionOrigin === 'CONDITION') {
          await this.archiveResponse(existing);
          await this.prisma.response.update({
            where: { id: existing.id },
            data: {
              skipped: false,
              exceptionKind: null,
              exceptionOrigin: null,
              freeText: null,
              selectedOptionIds: [],
              selectedOptions: { set: [] },
              revision: { increment: 1 },
            },
          });
          existing.skipped = false;
          existing.exceptionKind = null;
          existing.exceptionOrigin = null;
          existing.freeText = null;
          existing.selectedOptionIds = [];
          existing.revision += 1;
        }
        continue;
      }
      const kind = disposition === 'pending' ? 'PENDING' : 'NOT_APPLICABLE';
      if (existing?.exceptionKind === kind && existing.exceptionOrigin === 'CONDITION' && existing.skipped) continue;
      if (existing) await this.archiveResponse(existing);
      const saved = await this.prisma.response.upsert({
        where: { sessionId_questionId: { sessionId, questionId: question.id } },
        update: {
          skipped: true,
          exceptionKind: kind,
          exceptionOrigin: 'CONDITION',
          freeText: null,
          selectedOptionIds: [],
          selectedOptions: { set: [] },
          revision: { increment: 1 },
        },
        create: {
          sessionId,
          questionId: question.id,
          skipped: true,
          exceptionKind: kind,
          exceptionOrigin: 'CONDITION',
          selectedOptionIds: [],
          freeText: null,
          revision: 1,
        },
      });
      if (existing) {
        existing.skipped = true;
        existing.exceptionKind = kind;
        existing.exceptionOrigin = 'CONDITION';
        existing.freeText = null;
        existing.selectedOptionIds = [];
        existing.revision = saved.revision;
      } else {
        pending.push({ ...saved, selectedOptionIds: saved.selectedOptionIds } as unknown as T);
      }
    }
    return pending;
  }

  private archiveResponse(response: {
    id: string;
    revision: number;
    freeText: string | null;
    selectedOptionIds: string[];
    exceptionKind: string | null;
    exceptionOrigin: string | null;
  }) {
    return this.prisma.responseRevision.create({
      data: {
        responseId: response.id,
        revision: response.revision,
        freeText: response.freeText,
        selectedOptionIds: response.selectedOptionIds,
        exceptionKind: response.exceptionKind,
        exceptionOrigin: response.exceptionOrigin,
      },
    });
  }

  private calcSelfKnowledgePct(completionRatio: number): number {
    return Math.round(Math.min(1, Math.max(0, completionRatio)) * 100);
  }

  /**
   * Deterministic experiment assignment: userId char code sum mod 2 → 0=control, 1=treatment.
   * Tracks the active A/B tests defined in the activation strategy.
   */
  private assignExperiments(userId: string): Record<string, string> {
    const bucket = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 2;
    return {
      // A/B: post-signup → diagnostico (treatment=always, control=panel — this test is now complete in favour of treatment)
      'ab_signup_destination': 'treatment_diagnostico',
      // A/B: endowed progress (rail starts >0)
      'ab_endowed_progress': bucket === 0 ? 'control_0pct' : 'treatment_10pct',
      // A/B: early payoff (preview after module 1) — to be implemented in frontend
      'ab_early_payoff': bucket === 0 ? 'control_end_only' : 'treatment_module1',
      // A/B: reengagement emails on/off — tracked by reengagement service
      'ab_reengagement_emails': 'treatment_on',
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import type {
  DiagnosticProgressDto,
  DiagnosticResponsePayload,
  DimensionScores,
  NextStep,
  QuestionDto,
  SessionStateDto,
} from './types/diagnostic.types';

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
  { dims: ['finances', 'environment'], slug: 'constructor' },
  { dims: ['environment', 'finances'], slug: 'constructor' },
  { dims: ['identity', 'relationships'], slug: 'rey' },
  { dims: ['relationships', 'identity'], slug: 'rey' },
  { dims: ['purpose', 'relationships'], slug: 'mentor' },
  { dims: ['relationships', 'purpose'], slug: 'mentor' },
  { dims: ['purpose', 'ikigai'], slug: 'visionario' },
  { dims: ['ikigai', 'purpose'], slug: 'visionario' },
];

@Injectable()
export class DiagnosticService {
  constructor(private readonly prisma: PrismaService) {}

  async startOrResume(userId: string) {
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

    let session = await this.prisma.diagnosticSession.findUnique({
      where: { userId },
    });

    if (!session) {
      let isNewSession = false;
      try {
        session = await this.prisma.diagnosticSession.create({
          data: {
            userId,
            versionId: version.id,
            metadata: {},
          },
        });
        isNewSession = true;
      } catch (err: unknown) {
        // P2002 = unique constraint — a concurrent request already created the session
        if ((err as { code?: string })?.code === 'P2002') {
          session = await this.prisma.diagnosticSession.findUnique({ where: { userId } });
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

    return this.buildState(session.id, userId);
  }

  async getState(userId: string): Promise<{ sessionState: SessionStateDto; nextStep: NextStep }> {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { userId },
    });
    if (!session) {
      throw new NotFoundException('No diagnostic session found');
    }
    return this.buildState(session.id, userId);
  }

  async getProfile(userId: string) {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { userId },
      include: { profile: true, moduleProgress: true },
    });
    if (!session) return null;

    // Only expose a profile once every module has been completed and its outro seen.
    // This prevents showing partial/corrupt profiles created before the diagnostic is done.
    const allDone =
      session.moduleProgress.length > 0 &&
      session.moduleProgress.every((m) => m.status === 'COMPLETE' && m.outroSeen);
    if (!allDone) return null;

    if (!session.profile) {
      // Backfill profile for users who completed before generation was wired
      await this.buildState(session.id, userId);
      const refreshed = await this.prisma.masterProfile.findUnique({ where: { userId } });
      return refreshed ? this.toProfileDto(refreshed) : null;
    }

    return this.toProfileDto(session.profile);
  }

  async getProgress(userId: string): Promise<DiagnosticProgressDto | null> {
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { userId },
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
    const session = await this.prisma.diagnosticSession.findUnique({
      where: { userId },
    });
    if (!session) throw new NotFoundException('No diagnostic session found');

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: { options: true, module: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    // Validate option IDs if applicable
    if (dto.selectedOptionIds?.length) {
      const validIds = new Set(question.options.map((o) => o.id));
      for (const id of dto.selectedOptionIds) {
        if (!validIds.has(id)) {
          throw new BadRequestException(`Invalid option id: ${id}`);
        }
      }
    }

    // Upsert response (allow editing within open module)
    await this.prisma.response.upsert({
      where: { sessionId_questionId: { sessionId: session.id, questionId: dto.questionId } },
      update: {
        selectedOptionIds: dto.selectedOptionIds ?? [],
        freeText: dto.freeText,
        rankingOrder: dto.rankingOrder ?? [],
        answeredAt: new Date(),
        latencyMs: dto.latencyMs,
        editCount: { increment: 1 },
      },
      create: {
        sessionId: session.id,
        questionId: dto.questionId,
        selectedOptionIds: dto.selectedOptionIds ?? [],
        freeText: dto.freeText,
        rankingOrder: dto.rankingOrder ?? [],
        latencyMs: dto.latencyMs,
        editCount: 0,
      },
    });

    // Wire many-to-many for selected options
    if (dto.selectedOptionIds?.length) {
      const response = await this.prisma.response.findUnique({
        where: { sessionId_questionId: { sessionId: session.id, questionId: dto.questionId } },
      });
      if (response) {
        await this.prisma.response.update({
          where: { id: response.id },
          data: {
            selectedOptions: {
              set: dto.selectedOptionIds.map((id) => ({ id })),
            },
          },
        });
      }
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
    const session = await this.prisma.diagnosticSession.findUnique({ where: { userId } });
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
      await this.prisma.userModuleProgress.update({
        where: { id: progress.id },
        data: { outroSeen: true },
      });

      // Fire module_completed event
      await this.prisma.diagnosticEvent.create({
        data: {
          sessionId: session.id,
          type: 'module_completed',
          payload: { moduleSlug, moduleId: module.id, moduleOrder: module.order },
        },
      });

      // Fire diagnostic_activated on first module completion (activation event)
      if (module.order === 1) {
        await this.prisma.diagnosticEvent.create({
          data: {
            sessionId: session.id,
            type: 'diagnostic_activated',
            payload: { moduleSlug, triggeredBy: 'first_module_outro' },
          },
        });
      }

      // Unlock next module
      const nextModule = await this.prisma.diagnosticModule.findFirst({
        where: { versionId: session.versionId, order: module.order + 1 },
      });
      if (nextModule) {
        await this.prisma.userModuleProgress.updateMany({
          where: { sessionId: session.id, moduleId: nextModule.id },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return { success: true };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async buildState(
    sessionId: string,
    userId: string,
    completionPct?: number,
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

    const answeredIds = new Set(session.responses.map((r) => r.questionId));
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true },
    });
    const showWelcomeScreen = user?.onboardingStep === 'DIAGNOSTICO_BIENVENIDA';
    const totalModules = session.moduleProgress.length;

    // Find current active module.
    // Prefer AVAILABLE/IN_PROGRESS; fall back to COMPLETE modules whose outro
    // hasn't been seen yet (the module was just finished but the next module is
    // still LOCKED — we should show the outro, not claim the diagnostic is done).
    const activeProgress =
      session.moduleProgress.find(
        (p) => p.status === 'AVAILABLE' || p.status === 'IN_PROGRESS',
      ) ??
      session.moduleProgress.find(
        (p) => p.status === 'COMPLETE' && !p.outroSeen,
      );

    if (!activeProgress) {
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
    const totalQuestions = currentModule.questions.length;
    const answeredInModule = currentModule.questions.filter((q) =>
      answeredIds.has(q.id),
    ).length;

    // Check if module needs outro
    if (answeredInModule === totalQuestions && totalQuestions > 0 && !activeProgress.outroSeen) {
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
        sessionState: {
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
        nextStep: {
          type: 'module_outro',
          data: {
            moduleSlug: currentModule.slug,
            titleEs: currentModule.titleEs,
            outroText: activeProgress.outroText ?? currentModule.outroTemplateEs,
          },
        },
      };
    }

    // Find next unanswered question
    const nextQuestion = currentModule.questions.find((q) => !answeredIds.has(q.id));

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

    // 1-indexed position of the current question in the module
    const currentQuestionIndex = answeredInModule + 1;

    return {
      sessionState: {
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
        moduleQuestionCount: totalQuestions,
        showWelcomeScreen,
        currentModuleOrder: currentModule.order,
        totalModules,
        currentModuleEstimatedMinutes: currentModule.estimatedMinutes,
      },
      nextStep: {
        type: 'question',
        data: this.toQuestionDto(nextQuestion as typeof nextQuestion & { scaleType: string | null; reasonPromptEs: string | null; reasonThreshold: number | null; options: { id: string; order: number; textEs: string; value: string }[] }),
      },
    };
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
    const archetype = this.deriveArchetype(dimensionScores);
    const secondaryArchetype = this.deriveSecondaryArchetype(dimensionScores, archetype);

    // Create MasterProfile
    await this.prisma.masterProfile.create({
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

    // Mark session as completed
    await this.prisma.diagnosticSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date() },
    });

    // Advance onboardingStep
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.onboardingStep !== 'PROFILE_COMPLETE' && user.onboardingStep !== 'BLUEPRINT_READY') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: 'PROFILE_COMPLETE' },
      });
    }

    // Fire diagnostic_completed event
    await this.prisma.diagnosticEvent.create({
      data: {
        sessionId,
        type: 'diagnostic_completed',
        payload: { archetypePrimary: archetype, userId },
      },
    });

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
      finances: 'constructor',
      environment: 'constructor',
      identity: 'rey',
      relationships: 'mentor',
      purpose: 'visionario',
      ikigai: 'visionario',
      shadow: 'rey',
      footprint: 'visionario',
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
      guerrero: 'constructor',
      constructor: 'rey',
      rey: 'guerrero',
      mentor: 'rey',
      visionario: 'mentor',
    };
    return fallback[primary] ?? 'constructor';
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
      indices: profile.indices as Record<string, number>,
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

  private toQuestionDto(
    question: { id: string; type: string; textEs: string; contextEs: string | null; maxSelections: number | null; scaleType: string | null; reasonPromptEs: string | null; reasonThreshold: number | null; options: { id: string; order: number; textEs: string; value: string }[] },
  ): import('./types/diagnostic.types').QuestionDto {
    return {
      id: question.id,
      type: question.type,
      textEs: question.textEs,
      contextEs: question.contextEs,
      maxSelections: question.maxSelections,
      scaleType: question.scaleType,
      reasonPromptEs: question.reasonPromptEs,
      reasonThreshold: question.reasonThreshold,
      options: question.options
        .sort((a, b) => a.order - b.order)
        .map((o) => ({ id: o.id, order: o.order, textEs: o.textEs, value: o.value })),
    };
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

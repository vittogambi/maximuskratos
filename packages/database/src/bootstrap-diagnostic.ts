import type { DiagnosticPhase, PrismaClient, QuestionType } from '@prisma/client';
import questionnaireData from '../prisma/data/fase1.questionnaire.json';

type QuestionnaireOption = {
  order: number;
  textEs: string;
  value: string;
  scoreDeltas: Record<string, number>;
  flags: string[];
  tags: string[];
};

type QuestionnaireQuestion = {
  order: number;
  type: string;
  scaleType?: string;
  textEs: string;
  contextEs?: string;
  maxSelections?: number;
  reasonThreshold?: number;
  reasonPromptEs?: string;
  options: QuestionnaireOption[];
};

type QuestionnaireModule = {
  slug: string;
  phase: string;
  dimensionKey: string;
  order: number;
  titleEs: string;
  introEs: string;
  outroTemplateEs: string;
  iconKey: string;
  estimatedMinutes: number;
  isConditional: boolean;
  questions: QuestionnaireQuestion[];
};

type Questionnaire = {
  version: string;
  modules: QuestionnaireModule[];
};

const QUESTIONNAIRE = questionnaireData as Questionnaire;

/** Dedupes concurrent bootstraps (deploy + many users hitting /start at once). */
let inflight: Promise<void> | null = null;

async function syncQuestionnaireFromJson(
  prisma: PrismaClient,
  versionId: string,
  questionnaire: Questionnaire,
): Promise<void> {
  for (const mod of questionnaire.modules) {
    const dbModule = await prisma.diagnosticModule.findFirst({
      where: { versionId, slug: mod.slug },
      include: { questions: { include: { options: { orderBy: { order: 'asc' } } } } },
    });
    if (!dbModule) continue;

    if (
      dbModule.titleEs !== mod.titleEs ||
      dbModule.introEs !== mod.introEs ||
      dbModule.outroTemplateEs !== mod.outroTemplateEs
    ) {
      await prisma.diagnosticModule.update({
        where: { id: dbModule.id },
        data: {
          titleEs: mod.titleEs,
          introEs: mod.introEs,
          outroTemplateEs: mod.outroTemplateEs,
        },
      });
    }

    for (const jq of mod.questions) {
      const dbQ =
        dbModule.questions.find((q) => q.textEs === jq.textEs) ??
        dbModule.questions.find((q) => q.order === jq.order && q.type === jq.type);
      if (!dbQ) continue;

      await prisma.question.update({
        where: { id: dbQ.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          textEs: jq.textEs,
          contextEs: jq.contextEs ?? null,
          scaleType: jq.scaleType ?? null,
          reasonPromptEs: jq.reasonPromptEs ?? null,
          reasonThreshold: jq.reasonThreshold ?? null,
          maxSelections: jq.maxSelections ?? null,
        } as any,
      });

      for (const jo of jq.options) {
        const dbOpt = dbQ.options.find((o) => o.order === jo.order);
        if (!dbOpt || dbOpt.textEs === jo.textEs) continue;
        await prisma.answerOption.update({
          where: { id: dbOpt.id },
          data: { textEs: jo.textEs },
        });
      }
    }
  }
}

async function createVersionFromQuestionnaire(prisma: PrismaClient): Promise<void> {
  const version = await prisma.diagnosticVersion.create({
    data: { version: '1.0', isActive: true, publishedAt: new Date() },
  });

  for (const mod of QUESTIONNAIRE.modules) {
    const dbModule = await prisma.diagnosticModule.create({
      data: {
        versionId: version.id,
        phase: mod.phase as DiagnosticPhase,
        dimensionKey: mod.dimensionKey,
        slug: mod.slug,
        order: mod.order,
        titleEs: mod.titleEs,
        introEs: mod.introEs,
        outroTemplateEs: mod.outroTemplateEs,
        iconKey: mod.iconKey,
        estimatedMinutes: mod.estimatedMinutes,
        isConditional: mod.isConditional,
      },
    });

    for (const q of mod.questions) {
      const dbQuestion = await prisma.question.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          moduleId: dbModule.id,
          order: q.order,
          type: q.type as QuestionType,
          textEs: q.textEs,
          contextEs: q.contextEs ?? null,
          maxSelections: q.maxSelections ?? null,
          scaleType: q.scaleType ?? null,
          reasonPromptEs: q.reasonPromptEs ?? null,
          reasonThreshold: q.reasonThreshold ?? null,
        } as any,
      });

      await prisma.answerOption.createMany({
        data: q.options.map((opt) => ({
          questionId: dbQuestion.id,
          order: opt.order,
          textEs: opt.textEs,
          value: opt.value,
          scoreDeltas: opt.scoreDeltas,
          flags: opt.flags,
          tags: opt.tags,
        })),
      });
    }
  }
}

async function ensureDiagnosticCatalogOnce(prisma: PrismaClient): Promise<void> {
  const active = await prisma.diagnosticVersion.findFirst({
    where: { isActive: true },
    include: { _count: { select: { modules: true } } },
  });
  if (active && active._count.modules > 0) return;

  const existing = await prisma.diagnosticVersion.findUnique({ where: { version: '1.0' } });
  if (existing) {
    const moduleCount = await prisma.diagnosticModule.count({
      where: { versionId: existing.id },
    });
    if (moduleCount > 0) {
      if (!existing.isActive) {
        await prisma.diagnosticVersion.update({
          where: { id: existing.id },
          data: { isActive: true, publishedAt: existing.publishedAt ?? new Date() },
        });
      }
      return;
    }

    const sessionCount = await prisma.diagnosticSession.count({
      where: { versionId: existing.id },
    });
    if (sessionCount > 0) {
      await syncQuestionnaireFromJson(prisma, existing.id, QUESTIONNAIRE);
      if (!existing.isActive) {
        await prisma.diagnosticVersion.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      return;
    }

    await prisma.rule.deleteMany({ where: { versionId: existing.id } });
    await prisma.diagnosticVersion.delete({ where: { id: existing.id } });
  }

  await createVersionFromQuestionnaire(prisma);
}

/**
 * Application catalog bootstrap — NOT user seed data.
 *
 * The questionnaire (modules, questions, options) is shared infrastructure,
 * like a product catalog. It must exist before any user can start a session.
 * Called on API boot and lazily before /diagnostic/start.
 */
export async function ensureDiagnosticCatalog(prisma: PrismaClient): Promise<void> {
  if (!inflight) {
    inflight = ensureDiagnosticCatalogOnce(prisma).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** @deprecated use ensureDiagnosticCatalog */
export const ensureDiagnosticV1 = ensureDiagnosticCatalog;
